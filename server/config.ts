import 'dotenv/config'
import path from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'

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

const adminEmailFallback = isProduction ? undefined : 'admin@example.com'
const adminPasswordFallback = isProduction ? undefined : 'change-me'
const sessionSecretFallback = isProduction ? undefined : 'dev-session-secret'

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: readValue('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:55432/buy'),
  adminEmail: readValue('ADMIN_EMAIL', adminEmailFallback),
  adminPassword: readValue('ADMIN_PASSWORD', adminPasswordFallback),
  sessionSecret: readValue('SESSION_SECRET', sessionSecretFallback),
  uploadsDir: path.resolve(process.cwd(), 'uploads'),
  clientDistDir: path.resolve(process.cwd(), 'dist'),
  usingDefaultAdmin: !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
}
