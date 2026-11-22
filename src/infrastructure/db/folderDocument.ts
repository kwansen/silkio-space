import Database from "@tauri-apps/plugin-sql";
import type { Doc, DocEntry } from "@/types/doc";

// 归档-文档关联（folder_document）数据库元函数集合
export const useFolderDocumentDb = () => {
  // 元函数：将文档加入归档（幂等，重复加入自动忽略）
  // sort_order 追加到该容器统一排序空间末尾（子文件夹与文档共用一个序列，取两表联合最大值 +1）
  const add = async (
    db: Database,
    folderId: string,
    documentId: string,
  ): Promise<void> => {
    const rows = await db.select<{ max: number | null }[]>(
      `SELECT MAX(sort_order) AS max FROM (
         SELECT sort_order FROM folders WHERE parent_id = $1
         UNION ALL
         SELECT sort_order FROM folder_document WHERE folder_id = $1
       )`,
      [folderId],
    );
    await db.execute(
      `INSERT OR IGNORE INTO folder_document (folder_id, document_id, sort_order)
       VALUES ($1, $2, $3)`,
      [folderId, documentId, (rows[0]?.max ?? -1) + 1],
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

  // 元函数：批量将文档加入多个归档（幂等，重复加入自动忽略；逐个归档追加到其统一排序空间末尾）
  const addMany = async (
    db: Database,
    folderIds: string[],
    documentId: string,
  ): Promise<void> => {
    for (const folderId of folderIds) {
      await add(db, folderId, documentId);
    }
  };

  // 元函数：批量将文档移出多个归档（单条 DELETE 按 IN 批量删除关联行）
  const removeMany = async (
    db: Database,
    folderIds: string[],
    documentId: string,
  ): Promise<void> => {
    if (folderIds.length === 0) return;
    const placeholders = folderIds.map((_, i) => `$${i + 2}`).join(", ");
    await db.execute(
      `DELETE FROM folder_document WHERE document_id = $1 AND folder_id IN (${placeholders})`,
      [documentId, ...folderIds],
    );
  };

  // 元函数：删除文档的全部归档关联（文档被永久删除时调用，表无外键级联）
  const removeByDoc = async (
    db: Database,
    documentId: string,
  ): Promise<void> => {
    await db.execute("DELETE FROM folder_document WHERE document_id = $1", [
      documentId,
    ]);
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

  // 元函数：查询归档下全部文档（按加入顺序 sort_order 升序；排除软删除文档）
  const getDocsByFolder = async (
    db: Database,
    folderId: string,
  ): Promise<Doc[]> => {
    return db.select<Doc[]>(
      `SELECT d.* FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id AND d.deleted_at IS NULL
       WHERE fd.folder_id = $1
       ORDER BY fd.sort_order ASC`,
      [folderId],
    );
  };

  // 元函数：查询归档下全部文档条目（目录用，不含 content/plain_text，按加入顺序 sort_order 升序；排除软删除文档）
  const getDocEntriesByFolder = async (
    db: Database,
    folderId: string,
  ): Promise<DocEntry[]> => {
    return db.select<DocEntry[]>(
      `SELECT d.id, d.title, d.doc_type, d.word_count, d.viewed_at, d.created_at, d.updated_at
       FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id AND d.deleted_at IS NULL
       WHERE fd.folder_id = $1
       ORDER BY fd.sort_order ASC`,
      [folderId],
    );
  };

  // 元函数：按传入文档 id 顺序批量重写该归档内 sort_order（0,1,2...），用于手动拖拽排序持久化
  const reorder = async (
    db: Database,
    folderId: string,
    documentIds: string[],
  ): Promise<void> => {
    for (let i = 0; i < documentIds.length; i++) {
      await db.execute(
        "UPDATE folder_document SET sort_order = $1 WHERE folder_id = $2 AND document_id = $3",
        [i, folderId, documentIds[i]],
      );
    }
  };

  return {
    add,
    remove,
    addMany,
    removeMany,
    removeByDoc,
    getFolderIdsByDoc,
    getDocsByFolder,
    getDocEntriesByFolder,
    reorder,
  };
};
