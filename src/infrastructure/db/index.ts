// DONE
import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

//#region checked：初始化数据库
// 开发版与正式版的数据根目录不同（identifier 隔离），无需再用文件名区分环境
export async function initDb() {
  db = await Database.load("sqlite:keyflow.db");
}
//#endregion

//#region checked：获取数据库实例
export function getDb(): Database {
  if (!db) throw new Error("DB 未初始化");
  return db;
}
//#endregion

export type { Database };
