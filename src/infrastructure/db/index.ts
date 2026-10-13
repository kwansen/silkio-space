// DONE
import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

//#region checked：获取数据库名称
function getDbName(): string {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === "development";
  return isDev ? "KeyFlowDev.db" : "KeyFlow.db";
}
//#endregion

//#region 初始化数据库
export async function initDb() {
  const name = getDbName();
  db = await Database.load(`sqlite:${name}`);
}
//#endregion

//#region checked：获取数据库实例
export function getDb(): Database {
  if (!db) throw new Error("DB 未初始化");
  return db;
}
//#endregion

export type { Database };
