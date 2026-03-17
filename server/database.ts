import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'

import { config } from './config.js'

export const pool = new Pool({
  connectionString: config.databaseUrl,
})

export async function initializeDatabase() {
  const sqlPath = path.resolve(process.cwd(), 'postgres', 'init.sql')
  const sql = await readFile(sqlPath, 'utf8')
  await pool.query(sql)
}
