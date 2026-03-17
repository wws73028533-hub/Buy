import cookieParser from 'cookie-parser'
import express from 'express'
import multer from 'multer'
import path from 'node:path'

import { config } from './config.js'
import { initializeDatabase, pool } from './database.js'
import { clearSessionCookie, getSessionFromRequest, setSessionCookie } from './session.js'
import { assertUploadKind, ensureUploadDirectory, saveUploadedFile } from './storage.js'

type Product = {
  id: string
  slug: string
  title: string
  coverImageUrl: string | null
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

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const productColumns = `
  id,
  slug,
  title,
  cover_image_url as "coverImageUrl",
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

function readObject(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest(`${field}格式不正确`)
  }

  return value as Record<string, unknown>
}

function normalizeProductInput(body: unknown) {
  const input = body as Record<string, unknown>

  return {
    slug: readString(input.slug, 'slug'),
    title: readString(input.title, '商品标题'),
    coverImageUrl: readOptionalString(input.coverImageUrl),
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

app.post('/api/admin/products', requireAdmin, async (request, response, next) => {
  try {
    const input = normalizeProductInput(request.body)
    const result = await pool.query<Product>(
      `insert into products (slug, title, cover_image_url, content_json, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)
       returning ${productColumns}`,
      [
        input.slug,
        input.title,
        input.coverImageUrl,
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
           content_json = $5,
           sort_order = $6,
           is_published = $7
       where id = $1
       returning ${productColumns}`,
      [
        request.params.id,
        input.slug,
        input.title,
        input.coverImageUrl,
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
    response.status(400).json({ message: '数据已存在，请检查是否有重复的 slug 或标题。' })
    return
  }

  const status = error.status ?? 500
  response.status(status).json({ message: error.message || '服务器内部错误' })
})

async function bootstrap() {
  await ensureUploadDirectory()
  await initializeDatabase()

  app.listen(config.port, () => {
    console.log(`Server running at http://127.0.0.1:${config.port}`)
  })
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
