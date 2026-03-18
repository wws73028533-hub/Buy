import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isProduction = process.env.NODE_ENV === 'production'
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)
const appRootDir = path.resolve(currentDirectory, '..')

function readValue(name: string, fallback?: string) {
  const value = process.env[name]?.trim()

  if (value) {
    return value
  }

  if (fallback !== undefined) {
    return fallback
  }

  throw new Error(`缺少环境变量：${name}`)
}

function readPort() {
  const rawValue = process.env.PORT?.trim()

  if (!rawValue) {
    return 3001
  }

  const port = Number(rawValue)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('环境变量 PORT 必须是 1 到 65535 之间的整数')
  }

  return port
}

function resolveAppPath(value: string | undefined, fallbackSegments: string[]) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return path.resolve(appRootDir, ...fallbackSegments)
  }

  return path.isAbsolute(trimmedValue) ? trimmedValue : path.resolve(appRootDir, trimmedValue)
}

function readTrustProxy() {
  const value = process.env.TRUST_PROXY?.trim()

  if (!value) {
    return false
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  const hops = Number(value)

  if (Number.isInteger(hops) && hops >= 0) {
    return hops
  }

  return value
}

const adminEmailFallback = isProduction ? undefined : 'admin@example.com'
const adminPasswordFallback = isProduction ? undefined : 'change-me'
const sessionSecretFallback = isProduction ? undefined : 'dev-session-secret'

export const config = {
  appRootDir,
  isProduction,
  port: readPort(),
  host: readValue('HOST', isProduction ? '0.0.0.0' : '127.0.0.1'),
  databaseUrl: readValue('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:55432/buy'),
  adminEmail: readValue('ADMIN_EMAIL', adminEmailFallback),
  adminPassword: readValue('ADMIN_PASSWORD', adminPasswordFallback),
  sessionSecret: readValue('SESSION_SECRET', sessionSecretFallback),
  trustProxy: readTrustProxy(),
  uploadsDir: resolveAppPath(process.env.UPLOADS_DIR, ['uploads']),
  clientDistDir: resolveAppPath(process.env.CLIENT_DIST_DIR, ['dist']),
  initSqlPath: resolveAppPath(process.env.INIT_SQL_PATH, ['postgres', 'init.sql']),
  usingDefaultAdmin: !process.env.ADMIN_EMAIL?.trim() || !process.env.ADMIN_PASSWORD?.trim(),
}
