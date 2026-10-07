import Database from "@tauri-apps/plugin-sql";
import type { Doc } from "@/infrastructure/db/document.ts";

// 归档-文档关联（folder_document）数据库元函数集合
export const useFolderDocumentDb = () => {
  // 元函数：将文档加入归档（幂等，重复加入自动忽略），sort_order 追加到该归档末尾
  const add = async (
    db: Database,
    folderId: string,
    documentId: string,
  ): Promise<void> => {
    const rows = await db.select<{ max: number | null }[]>(
      "SELECT MAX(sort_order) AS max FROM folder_document WHERE folder_id = $1",
      [folderId],
    );
    await db.execute(
      `INSERT OR IGNORE INTO folder_document (id, folder_id, document_id, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), folderId, documentId, (rows[0]?.max ?? -1) + 1],
    );
  };

  // 元函数：将文档移出归档
  const remove = async (
    db: Database,
    folderId: string,
    documentId: string,
  ): Promise<void> => {
    await db.execute(
      "DELETE FROM folder_document WHERE folder_id = $1 AND document_id = $2",
      [folderId, documentId],
    );
  };

  // 元函数：查询文档已加入的归档 id 集合
  const getFolderIdsByDoc = async (
    db: Database,
    documentId: string,
  ): Promise<string[]> => {
    const rows = await db.select<{ folder_id: string }[]>(
      "SELECT folder_id FROM folder_document WHERE document_id = $1",
      [documentId],
    );
    return rows.map((r) => r.folder_id);
  };

  // 元函数：查询归档下第一个文档（按加入顺序 sort_order 升序，无文档返回 null）
  const getFirstDoc = async (
    db: Database,
    folderId: string,
  ): Promise<Doc | null> => {
    const rows = await db.select<Doc[]>(
      `SELECT d.* FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id
       WHERE fd.folder_id = $1
       ORDER BY fd.sort_order ASC
       LIMIT 1`,
      [folderId],
    );
    return rows.length > 0 ? rows[0] : null;
  };

  return { add, remove, getFolderIdsByDoc, getFirstDoc };
};
