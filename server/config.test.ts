// @vitest-environment node

import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

const managedEnvKeys = [
  'NODE_ENV',
  'PORT',
  'HOST',
  'DATABASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'TRUST_PROXY',
  'UPLOADS_DIR',
  'CLIENT_DIST_DIR',
  'INIT_SQL_PATH',
] as const

const originalEnv = Object.fromEntries(managedEnvKeys.map((key) => [key, process.env[key]]))

function restoreEnv() {
  for (const key of managedEnvKeys) {
    const value = originalEnv[key]

    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }
}

async function loadConfig(overrides: Partial<Record<(typeof managedEnvKeys)[number], string | undefined>>) {
  restoreEnv()

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  vi.resetModules()
  const module = await import('./config.ts')
  return module.config
}

afterEach(() => {
  restoreEnv()
  vi.resetModules()
})

describe('server config', () => {
  it('在开发环境使用仓库根目录默认路径', async () => {
    const config = await loadConfig({
      NODE_ENV: 'development',
      PORT: undefined,
      HOST: undefined,
      DATABASE_URL: undefined,
      ADMIN_EMAIL: undefined,
      ADMIN_PASSWORD: undefined,
      SESSION_SECRET: undefined,
      TRUST_PROXY: undefined,
      UPLOADS_DIR: undefined,
      CLIENT_DIST_DIR: undefined,
      INIT_SQL_PATH: undefined,
    })

    expect(config.host).toBe('127.0.0.1')
    expect(config.databaseUrl).toBe('postgresql://postgres:postgres@127.0.0.1:55432/buy')
    expect(config.uploadsDir).toBe(path.resolve(process.cwd(), 'uploads'))
    expect(config.clientDistDir).toBe(path.resolve(process.cwd(), 'dist'))
    expect(config.initSqlPath).toBe(path.resolve(process.cwd(), 'postgres', 'init.sql'))
    expect(config.usingDefaultAdmin).toBe(true)
  })

  it('在生产环境读取显式配置并解析相对路径', async () => {
    const config = await loadConfig({
      NODE_ENV: 'production',
      PORT: '3100',
      HOST: undefined,
      DATABASE_URL: 'postgresql://buy:secret@db.example.com:5432/buy',
      ADMIN_EMAIL: 'admin@buy.example.com',
      ADMIN_PASSWORD: 'strong-password',
      SESSION_SECRET: 'production-session-secret',
      TRUST_PROXY: '1',
      UPLOADS_DIR: 'var/uploads',
      CLIENT_DIST_DIR: 'build/web',
      INIT_SQL_PATH: 'postgres/init.sql',
    })

    expect(config.port).toBe(3100)
    expect(config.host).toBe('0.0.0.0')
    expect(config.trustProxy).toBe(1)
    expect(config.uploadsDir).toBe(path.resolve(process.cwd(), 'var/uploads'))
    expect(config.clientDistDir).toBe(path.resolve(process.cwd(), 'build/web'))
    expect(config.initSqlPath).toBe(path.resolve(process.cwd(), 'postgres', 'init.sql'))
    expect(config.usingDefaultAdmin).toBe(false)
  })
})
