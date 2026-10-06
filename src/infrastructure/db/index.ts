// DONE
import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

//#region checked：获取数据库名称
function getDbName(): string {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development'
  return isDev ? 'KeyFlowDev.db' : 'KeyFlow.db'
}
//#endregion

//#region checked：获取数据库实例
export async function getDb(): Promise<Database> {
  if (db) return db
  const name = getDbName()
  db = await Database.load(`sqlite:${name}`)
  return db
}
//#endregion

export type { Database }
