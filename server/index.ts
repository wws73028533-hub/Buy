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

type RedeemItemRecord = {
  id: string
  productId: string
  productTitle: string
  code: string
  contentJson: Record<string, unknown>
  redeemedAt: string | null
  createdAt: string
  updatedAt: string
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

const redeemItemColumns = `
  item.id,
  item.product_id as "productId",
  product.title as "productTitle",
  item.code,
  item.content_json as "contentJson",
  item.redeemed_at as "redeemedAt",
  item.created_at as "createdAt",
  item.updated_at as "updatedAt"
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

function normalizeRedeemItemInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    productId: readString(input.productId, '商品ID'),
    contentJson: readObject(input.contentJson, '兑换内容'),
  }
}

function normalizeRedeemItemBulkInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    productId: readString(input.productId, '商品ID'),
    count: readIntegerInRange(input.count, '生成数量', 1, 200),
  }
}

function createDefaultRedeemContent() {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '请填写这个兑换码专属的账号、密码、登录方式、步骤和注意事项。每个兑换码都应该维护自己的独立内容。',
          },
        ],
      },
    ],
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

async function listRedeemItemsByIds(ids: string[]) {
  if (ids.length === 0) {
    return []
  }

  const result = await pool.query<RedeemItemRecord>(
    `select ${redeemItemColumns}
     from redeem_items as item
     join products as product on product.id = item.product_id
     where item.id = any($1::uuid[])
     order by item.redeemed_at asc nulls first, item.updated_at desc, item.created_at desc`,
    [ids],
  )

  return result.rows
}

async function listRedeemData() {
  const result = await pool.query<RedeemItemRecord>(
    `select ${redeemItemColumns}
     from redeem_items as item
     join products as product on product.id = item.product_id
     order by item.redeemed_at asc nulls first, item.updated_at desc, item.created_at desc`,
  )

  return {
    items: result.rows,
  }
}

async function getRedeemItemById(id: string) {
  const result = await pool.query<RedeemItemRecord>(
    `select ${redeemItemColumns}
     from redeem_items as item
     join products as product on product.id = item.product_id
     where item.id = $1
     limit 1`,
    [id],
  )

  return result.rows[0] ?? null
}

async function createRedeemItems(productId: string, count: number) {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const productResult = await client.query<{ id: string }>('select id from products where id = $1 limit 1', [productId])

    if (!productResult.rows[0]) {
      throw badRequest('商品不存在')
    }

    const itemIds: string[] = []
    const generated = new Set<string>()
    const maxAttempts = count * 40
    let attempts = 0

    while (itemIds.length < count) {
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
        const result = await client.query<{ id: string }>(
          `insert into redeem_items (product_id, code, normalized_code, content_json)
           values ($1, $2, $3, $4)
           returning id`,
          [productId, code, normalizedCode, createDefaultRedeemContent()],
        )

        itemIds.push(result.rows[0].id)
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
    return await listRedeemItemsByIds(itemIds)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

async function saveRedeemItem(id: string, input: ReturnType<typeof normalizeRedeemItemInput>) {
  const productResult = await pool.query<{ id: string }>('select id from products where id = $1 limit 1', [input.productId])

  if (!productResult.rows[0]) {
    throw badRequest('商品不存在')
  }

  const result = await pool.query<{ id: string }>(
    `update redeem_items
     set product_id = $2,
         content_json = $3
     where id = $1
       and redeemed_at is null
     returning id`,
    [id, input.productId, input.contentJson],
  )

  if (!result.rows[0]) {
    const existingResult = await pool.query<{ id: string; redeemedAt: string | null }>(
      `select id, redeemed_at as "redeemedAt"
       from redeem_items
       where id = $1
       limit 1`,
      [id],
    )

    const existing = existingResult.rows[0]

    if (!existing) {
      throw badRequest('兑换码不存在')
    }

    if (existing.redeemedAt) {
      throw badRequest('已兑换的兑换码不能再修改')
    }

    throw badRequest('兑换码保存失败')
  }

  const item = await getRedeemItemById(id)

  if (!item) {
    throw badRequest('兑换码不存在')
  }

  return item
}

async function redeemCodeByValue(normalizedCode: string) {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const result = await client.query<Redemption>(
      `update redeem_items as item
       set redeemed_at = now()
       from products as product
       where item.normalized_code = $1
         and item.redeemed_at is null
         and item.product_id = product.id
       returning product.title as title,
                 item.content_json as "contentJson",
                 item.redeemed_at as "redeemedAt"`,
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
    const linkedRedeemItemResult = await pool.query<{ id: string }>(
      'select id from redeem_items where product_id = $1 limit 1',
      [request.params.id],
    )

    if (linkedRedeemItemResult.rows[0]) {
      throw badRequest('该商品已关联兑换码，请先删除或调整相关兑换码')
    }

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

app.post('/api/admin/redeem-items/bulk', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeRedeemItemBulkInput(request.body)
    const items = await createRedeemItems(input.productId, input.count)

    response.json({ items })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/redeem-items/:id', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeRedeemItemInput(request.body)
    const itemId = readString(request.params.id, '兑换码ID')
    const item = await saveRedeemItem(itemId, input)

    response.json({ item })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/redeem-items/:id', requireAdmin, async (request, response, next) => {
  try {
    const result = await pool.query<{ id: string }>(
      'delete from redeem_items where id = $1 and redeemed_at is null returning id',
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
