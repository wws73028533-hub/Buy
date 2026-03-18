import { readFile } from 'node:fs/promises'

import { Pool } from 'pg'

import { config } from './config.js'

export const pool = new Pool({
  connectionString: config.databaseUrl,
})

export async function initializeDatabase() {
  const sql = await readFile(config.initSqlPath, 'utf8')
  await pool.query(sql)
}
