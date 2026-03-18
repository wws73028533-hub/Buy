import cookieParser from 'cookie-parser'
import express from 'express'
import multer from 'multer'
import { randomInt } from 'node:crypto'
import path from 'node:path'

import { config } from './config.js'
import { initializeDatabase, pool } from './database.js'
import { seedDefaultShowcaseContent } from './demoSeed.js'
import { clearSessionCookie, getSessionFromRequest, setSessionCookie } from './session.js'
import { assertUploadKind, ensureUploadDirectory, saveUploadedFile } from './storage.js'

type Product = {
  id: string
  slug: string
  title: string
  coverImageUrl: string | null
  purchaseLinkUrl: string | null
  purchaseCode: string | null
  contentJson: Record<string, unknown>
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type TutorialItem = {
  id: string
  title: string
  type: 'link' | 'file'
  url: string | null
  fileUrl: string | null
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type ContactItem = {
  id: string
  label: string
  value: string
  linkUrl: string | null
  qrImageUrl: string | null
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type RedeemBatchRecord = {
  id: string
  title: string
  contentJson: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

type RedeemCode = {
  id: string
  batchId: string
  code: string
  redeemedAt: string | null
  createdAt: string
  updatedAt: string
}

type RedeemBatch = RedeemBatchRecord & {
  codes: RedeemCode[]
}

type Redemption = {
  title: string
  contentJson: Record<string, unknown>
  redeemedAt: string
}

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const REDEEM_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const REDEEM_RATE_LIMIT_MAX_REQUESTS = 20
const REDEEM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const REDEEM_CODE_GROUP_LENGTH = 4
const REDEEM_CODE_GROUP_COUNT = 3
const redeemRateLimitStore = new Map<string, { count: number; resetAt: number }>()

const productColumns = `
  id,
  slug,
  title,
  cover_image_url as "coverImageUrl",
  purchase_link_url as "purchaseLinkUrl",
  purchase_code as "purchaseCode",
  content_json as "contentJson",
  sort_order as "sortOrder",
  is_published as "isPublished",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

const tutorialColumns = `
  id,
  title,
  type,
  url,
  file_url as "fileUrl",
  sort_order as "sortOrder",
  is_published as "isPublished",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

const contactColumns = `
  id,
  label,
  value,
  link_url as "linkUrl",
  qr_image_url as "qrImageUrl",
  sort_order as "sortOrder",
  is_published as "isPublished",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

const redeemBatchColumns = `
  id,
  title,
  content_json as "contentJson",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

const redeemCodeColumns = `
  id,
  batch_id as "batchId",
  code,
  redeemed_at as "redeemedAt",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number }
  error.status = 400
  return error
}

function unauthorized(message = '请先登录后台') {
  const error = new Error(message) as Error & { status?: number }
  error.status = 401
  return error
}

function tooManyRequests(message = '请求过于频繁，请稍后再试') {
  const error = new Error(message) as Error & { status?: number }
  error.status = 429
  return error
}

function readString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`${field}不能为空`)
  }

  return value.trim()
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readOptionalHttpUrl(value: unknown, field: string) {
  const url = readOptionalString(value)

  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol')
    }

    return parsed.toString()
  } catch {
    throw badRequest(`${field}必须是有效的 http 或 https 链接`)
  }
}

function readBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') {
    throw badRequest(`${field}必须是布尔值`)
  }

  return value
}

function readNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw badRequest(`${field}必须是数字`)
  }

  return value
}

function readIntegerInRange(value: unknown, field: string, min: number, max: number) {
  const number = readNumber(value, field)

  if (!Number.isInteger(number) || number < min || number > max) {
    throw badRequest(`${field}必须是 ${min} 到 ${max} 之间的整数`)
  }

  return number
}

function readObject(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest(`${field}格式不正确`)
  }

  return value as Record<string, unknown>
}

function normalizeRedeemCodeValue(value: string) {
  return value.replace(/[\s-]+/g, '').toUpperCase()
}

function readRedeemCodeInput(body: unknown) {
  const input = body as Record<string, unknown>
  const rawCode = readString(input.code, '兑换码')
  const normalizedCode = normalizeRedeemCodeValue(rawCode)

  if (!normalizedCode) {
    throw badRequest('请输入兑换码')
  }

  return normalizedCode
}

function normalizeProductInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    slug: readString(input.slug, 'slug'),
    title: readString(input.title, '商品标题'),
    coverImageUrl: readOptionalString(input.coverImageUrl),
    purchaseLinkUrl: readOptionalHttpUrl(input.purchaseLinkUrl, '外部购买链接'),
    purchaseCode: readOptionalString(input.purchaseCode),
    contentJson: readObject(input.contentJson, '商品详情'),
    sortOrder: readNumber(input.sortOrder, '排序值'),
    isPublished: readBoolean(input.isPublished, '发布状态'),
  }
}

function normalizeTutorialInput(body: unknown) {
  const input = body as Record<string, unknown>
  const type = readString(input.type, '教程类型') as 'link' | 'file'

  if (type !== 'link' && type !== 'file') {
    throw badRequest('教程类型必须是 link 或 file')
  }

  const url = type === 'link' ? readString(input.url, '教程链接') : null
  const fileUrl = type === 'file' ? readString(input.fileUrl, '教程文件') : null

  return {
    title: readString(input.title, '教程标题'),
    type,
    url,
    fileUrl,
    sortOrder: readNumber(input.sortOrder, '排序值'),
    isPublished: readBoolean(input.isPublished, '发布状态'),
  }
}

function normalizeContactInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    label: readString(input.label, '联系方式标题'),
    value: readString(input.value, '联系方式内容'),
    linkUrl: readOptionalString(input.linkUrl),
    qrImageUrl: readOptionalString(input.qrImageUrl),
    sortOrder: readNumber(input.sortOrder, '排序值'),
    isPublished: readBoolean(input.isPublished, '发布状态'),
  }
}

function normalizeRedeemBatchInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    title: readString(input.title, '兑换内容标题'),
    contentJson: readObject(input.contentJson, '兑换内容'),
  }
}

function normalizeRedeemCodeGenerationInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    count: readIntegerInRange(input.count, '生成数量', 1, 200),
  }
}

function generateRedeemCode() {
  const groups = Array.from({ length: REDEEM_CODE_GROUP_COUNT }, () =>
    Array.from({ length: REDEEM_CODE_GROUP_LENGTH }, () => {
      const index = randomInt(REDEEM_CODE_ALPHABET.length)
      return REDEEM_CODE_ALPHABET[index]
    }).join(''),
  )

  return groups.join('-')
}

function cleanupRedeemRateLimitStore(now: number) {
  if (redeemRateLimitStore.size < 500) {
    return
  }

  for (const [key, value] of redeemRateLimitStore.entries()) {
    if (value.resetAt <= now) {
      redeemRateLimitStore.delete(key)
    }
  }
}

function enforceRedeemRateLimit(request: express.Request) {
  const key = request.ip || request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = redeemRateLimitStore.get(key)

  cleanupRedeemRateLimitStore(now)

  if (!current || current.resetAt <= now) {
    redeemRateLimitStore.set(key, {
      count: 1,
      resetAt: now + REDEEM_RATE_LIMIT_WINDOW_MS,
    })
    return
  }

  if (current.count >= REDEEM_RATE_LIMIT_MAX_REQUESTS) {
    throw tooManyRequests('兑换请求过于频繁，请稍后再试')
  }

  redeemRateLimitStore.set(key, {
    count: current.count + 1,
    resetAt: current.resetAt,
  })
}

function mergeRedeemData(batches: RedeemBatchRecord[], codes: RedeemCode[]): RedeemBatch[] {
  const codesByBatchId = new Map<string, RedeemCode[]>()

  for (const code of codes) {
    const existing = codesByBatchId.get(code.batchId) ?? []
    codesByBatchId.set(code.batchId, [...existing, code])
  }

  return batches.map((batch) => ({
    ...batch,
    codes: codesByBatchId.get(batch.id) ?? [],
  }))
}

async function listHomepageData() {
  const [productsResult, tutorialsResult, contactsResult] = await Promise.all([
    pool.query<Product>(
      `select ${productColumns} from products where is_published = true order by sort_order asc, created_at desc`,
    ),
    pool.query<TutorialItem>(
      `select ${tutorialColumns} from tutorial_items where is_published = true order by sort_order asc, created_at desc`,
    ),
    pool.query<ContactItem>(
      `select ${contactColumns} from contact_items where is_published = true order by sort_order asc, created_at desc`,
    ),
  ])

  return {
    products: productsResult.rows,
    tutorials: tutorialsResult.rows,
    contacts: contactsResult.rows,
    source: 'postgres' as const,
  }
}

async function listAdminData() {
  const [productsResult, tutorialsResult, contactsResult] = await Promise.all([
    pool.query<Product>(`select ${productColumns} from products order by sort_order asc, created_at desc`),
    pool.query<TutorialItem>(`select ${tutorialColumns} from tutorial_items order by sort_order asc, created_at desc`),
    pool.query<ContactItem>(`select ${contactColumns} from contact_items order by sort_order asc, created_at desc`),
  ])

  return {
    products: productsResult.rows,
    tutorials: tutorialsResult.rows,
    contacts: contactsResult.rows,
  }
}

async function listRedeemData() {
  const [batchesResult, codesResult] = await Promise.all([
    pool.query<RedeemBatchRecord>(`select ${redeemBatchColumns} from redeem_batches order by updated_at desc, created_at desc`),
    pool.query<RedeemCode>(
      `select ${redeemCodeColumns} from redeem_codes order by redeemed_at asc nulls first, created_at desc`,
    ),
  ])

  return {
    batches: mergeRedeemData(batchesResult.rows, codesResult.rows),
  }
}

async function getRedeemBatchById(id: string): Promise<RedeemBatch | null> {
  const batchResult = await pool.query<RedeemBatchRecord>(
    `select ${redeemBatchColumns} from redeem_batches where id = $1 limit 1`,
    [id],
  )

  const batch = batchResult.rows[0]

  if (!batch) {
    return null
  }

  const codesResult = await pool.query<RedeemCode>(
    `select ${redeemCodeColumns} from redeem_codes where batch_id = $1 order by redeemed_at asc nulls first, created_at desc`,
    [id],
  )

  return {
    ...batch,
    codes: codesResult.rows,
  }
}

async function createRedeemCodes(batchId: string, count: number) {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const batchResult = await client.query<{ id: string }>('select id from redeem_batches where id = $1 limit 1', [batchId])

    if (!batchResult.rows[0]) {
      throw badRequest('兑换模板不存在')
    }

    const codes: RedeemCode[] = []
    const generated = new Set<string>()
    const maxAttempts = count * 40
    let attempts = 0

    while (codes.length < count) {
      if (attempts >= maxAttempts) {
        throw badRequest('兑换码生成失败，请稍后重试')
      }

      attempts += 1
      const code = generateRedeemCode()
      const normalizedCode = normalizeRedeemCodeValue(code)

      if (generated.has(normalizedCode)) {
        continue
      }

      try {
        const result = await client.query<RedeemCode>(
          `insert into redeem_codes (batch_id, code, normalized_code)
           values ($1, $2, $3)
           returning ${redeemCodeColumns}`,
          [batchId, code, normalizedCode],
        )

        codes.push(result.rows[0])
        generated.add(normalizedCode)
      } catch (error) {
        const pgError = error as Error & { code?: string }

        if (pgError.code === '23505') {
          continue
        }

        throw error
      }
    }

    await client.query('commit')
    return codes
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

async function redeemCodeByValue(normalizedCode: string) {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const result = await client.query<Redemption>(
      `update redeem_codes as code
       set redeemed_at = now()
       from redeem_batches as batch
       where code.normalized_code = $1
         and code.redeemed_at is null
         and code.batch_id = batch.id
       returning batch.title as title,
                 batch.content_json as "contentJson",
                 code.redeemed_at as "redeemedAt"`,
      [normalizedCode],
    )

    if (!result.rows[0]) {
      throw badRequest('兑换码无效或已使用')
    }

    await client.query('commit')
    return result.rows[0]
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

function requireAdmin(request: express.Request, _response: express.Response, next: express.NextFunction) {
  const session = getSessionFromRequest(request)

  if (!session) {
    next(unauthorized())
    return
  }

  request.session = session
  next()
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      user: {
        email: string
      }
    }
  }
}

app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(config.uploadsDir))

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/public/homepage', async (_request, response, next) => {
  try {
    response.json(await listHomepageData())
  } catch (error) {
    next(error)
  }
})

app.get('/api/public/products/:slug', async (request, response, next) => {
  try {
    const result = await pool.query<Product>(
      `select ${productColumns} from products where slug = $1 and is_published = true limit 1`,
      [request.params.slug],
    )

    response.json({ product: result.rows[0] ?? null })
  } catch (error) {
    next(error)
  }
})

app.post('/api/public/redeem', async (request, response, next) => {
  try {
    enforceRedeemRateLimit(request)
    const normalizedCode = readRedeemCodeInput(request.body)
    const redemption = await redeemCodeByValue(normalizedCode)

    response.json({ redemption })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/session', (request, response) => {
  response.json({
    session: getSessionFromRequest(request),
    usingDefaultAdmin: config.usingDefaultAdmin,
  })
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = readString(request.body?.email, '邮箱')
    const password = readString(request.body?.password, '密码')

    if (email !== config.adminEmail || password !== config.adminPassword) {
      throw unauthorized('邮箱或密码错误')
    }

    setSessionCookie(response, email)
    response.json({
      session: {
        user: {
          email,
        },
      },
      usingDefaultAdmin: config.usingDefaultAdmin,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', (_request, response) => {
  clearSessionCookie(response)
  response.json({ ok: true })
})

app.get('/api/admin/content', requireAdmin, async (_request, response, next) => {
  try {
    response.json(await listAdminData())
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/redeem', requireAdmin, async (_request, response, next) => {
  try {
    response.json(await listRedeemData())
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/products', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeProductInput(request.body)
    const result = await pool.query<Product>(
      `insert into products (slug, title, cover_image_url, purchase_link_url, purchase_code, content_json, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning ${productColumns}`,
      [
        input.slug,
        input.title,
        input.coverImageUrl,
        input.purchaseLinkUrl,
        input.purchaseCode,
        input.contentJson,
        input.sortOrder,
        input.isPublished,
      ],
    )

    response.json({ product: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/products/:id', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeProductInput(request.body)
    const result = await pool.query<Product>(
      `update products
       set slug = $2,
           title = $3,
           cover_image_url = $4,
           purchase_link_url = $5,
           purchase_code = $6,
           content_json = $7,
           sort_order = $8,
           is_published = $9
       where id = $1
       returning ${productColumns}`,
      [
        request.params.id,
        input.slug,
        input.title,
        input.coverImageUrl,
        input.purchaseLinkUrl,
        input.purchaseCode,
        input.contentJson,
        input.sortOrder,
        input.isPublished,
      ],
    )

    if (!result.rows[0]) {
      throw badRequest('商品不存在')
    }

    response.json({ product: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/products/:id', requireAdmin, async (request, response, next) => {
  try {
    await pool.query('delete from products where id = $1', [request.params.id])
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/tutorials', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeTutorialInput(request.body)
    const result = await pool.query<TutorialItem>(
      `insert into tutorial_items (title, type, url, file_url, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)
       returning ${tutorialColumns}`,
      [input.title, input.type, input.url, input.fileUrl, input.sortOrder, input.isPublished],
    )

    response.json({ tutorial: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/tutorials/:id', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeTutorialInput(request.body)
    const result = await pool.query<TutorialItem>(
      `update tutorial_items
       set title = $2,
           type = $3,
           url = $4,
           file_url = $5,
           sort_order = $6,
           is_published = $7
       where id = $1
       returning ${tutorialColumns}`,
      [request.params.id, input.title, input.type, input.url, input.fileUrl, input.sortOrder, input.isPublished],
    )

    if (!result.rows[0]) {
      throw badRequest('教程不存在')
    }

    response.json({ tutorial: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/tutorials/:id', requireAdmin, async (request, response, next) => {
  try {
    await pool.query('delete from tutorial_items where id = $1', [request.params.id])
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/contacts', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeContactInput(request.body)
    const result = await pool.query<ContactItem>(
      `insert into contact_items (label, value, link_url, qr_image_url, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)
       returning ${contactColumns}`,
      [input.label, input.value, input.linkUrl, input.qrImageUrl, input.sortOrder, input.isPublished],
    )

    response.json({ contact: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/contacts/:id', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeContactInput(request.body)
    const result = await pool.query<ContactItem>(
      `update contact_items
       set label = $2,
           value = $3,
           link_url = $4,
           qr_image_url = $5,
           sort_order = $6,
           is_published = $7
       where id = $1
       returning ${contactColumns}`,
      [request.params.id, input.label, input.value, input.linkUrl, input.qrImageUrl, input.sortOrder, input.isPublished],
    )

    if (!result.rows[0]) {
      throw badRequest('联系方式不存在')
    }

    response.json({ contact: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/contacts/:id', requireAdmin, async (request, response, next) => {
  try {
    await pool.query('delete from contact_items where id = $1', [request.params.id])
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/redeem-batches', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeRedeemBatchInput(request.body)
    const result = await pool.query<RedeemBatchRecord>(
      `insert into redeem_batches (title, content_json)
       values ($1, $2)
       returning ${redeemBatchColumns}`,
      [input.title, input.contentJson],
    )

    const batch = await getRedeemBatchById(result.rows[0].id)

    response.json({ batch })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/redeem-batches/:id', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeRedeemBatchInput(request.body)
    const result = await pool.query<RedeemBatchRecord>(
      `update redeem_batches
       set title = $2,
           content_json = $3
       where id = $1
       returning ${redeemBatchColumns}`,
      [request.params.id, input.title, input.contentJson],
    )

    if (!result.rows[0]) {
      throw badRequest('兑换模板不存在')
    }

    const batch = await getRedeemBatchById(result.rows[0].id)

    response.json({ batch })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/redeem-batches/:id/codes', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeRedeemCodeGenerationInput(request.body)
    const batchId = readString(request.params.id, '兑换模板ID')
    const codes = await createRedeemCodes(batchId, input.count)

    response.json({ codes })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/redeem-codes/:id', requireAdmin, async (request, response, next) => {
  try {
    const result = await pool.query<{ id: string }>(
      'delete from redeem_codes where id = $1 and redeemed_at is null returning id',
      [request.params.id],
    )

    if (!result.rows[0]) {
      throw badRequest('兑换码不存在，或已被使用后不可删除')
    }

    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/uploads', requireAdmin, upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) {
      throw badRequest('请选择要上传的文件')
    }

    const kind = assertUploadKind(String(request.query.kind ?? ''))
    const folder = typeof request.query.folder === 'string' ? request.query.folder : undefined
    const url = await saveUploadedFile({ kind, folder, file: request.file })

    response.json({ url })
  } catch (error) {
    next(error)
  }
})

const indexHtmlPath = path.join(config.clientDistDir, 'index.html')
app.use(express.static(config.clientDistDir))
app.get(/^(?!\/api|\/uploads).*/, (_request, response) => {
  response.sendFile(indexHtmlPath)
})

app.use((error: Error & { status?: number; code?: string }, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  void next
  if (error.code === 'LIMIT_FILE_SIZE') {
    response.status(400).json({ message: '上传文件过大，单文件限制 20MB。' })
    return
  }

  if (error.code === '23505') {
    response.status(400).json({ message: '数据已存在，请检查是否有重复的 slug、标题或兑换码。' })
    return
  }

  const status = error.status ?? 500
  response.status(status).json({ message: error.message || '服务器内部错误' })
})

async function bootstrap() {
  await ensureUploadDirectory()
  await initializeDatabase()
  await seedDefaultShowcaseContent(pool)

  app.listen(config.port, () => {
    console.log(`Server running at http://127.0.0.1:${config.port}`)
  })
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
