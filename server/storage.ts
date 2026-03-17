import crypto from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { config } from './config.js'

type UploadKind = 'product-image' | 'tutorial-file' | 'contact-qrcode'

const kindDirectoryMap: Record<UploadKind, string> = {
  'product-image': 'products',
  'tutorial-file': 'tutorials',
  'contact-qrcode': 'contacts',
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()
}

function sanitizeFileName(value: string) {
  const extension = path.extname(value).toLowerCase()
  const baseName = path.basename(value, extension)
  const safeBaseName = sanitizeSegment(baseName) || 'file'
  return `${safeBaseName}-${Date.now()}-${crypto.randomUUID()}${extension}`
}

export async function ensureUploadDirectory() {
  await mkdir(config.uploadsDir, { recursive: true })
}

export async function saveUploadedFile({
  kind,
  folder,
  file,
}: {
  kind: UploadKind
  folder?: string
  file: Express.Multer.File
}) {
  const baseDirectory = kindDirectoryMap[kind]
  const safeFolder = folder ? sanitizeSegment(folder) : ''
  const relativeDirectory = safeFolder ? path.join(baseDirectory, safeFolder) : baseDirectory
  const absoluteDirectory = path.join(config.uploadsDir, relativeDirectory)

  await mkdir(absoluteDirectory, { recursive: true })

  const fileName = sanitizeFileName(file.originalname)
  const absolutePath = path.join(absoluteDirectory, fileName)
  const publicPath = `/${path.join('uploads', relativeDirectory, fileName).replace(/\\/g, '/')}`

  await writeFile(absolutePath, file.buffer)

  return publicPath
}

export function assertUploadKind(value: string): UploadKind {
  if (value === 'product-image' || value === 'tutorial-file' || value === 'contact-qrcode') {
    return value
  }

  throw new Error('不支持的上传类型')
}
