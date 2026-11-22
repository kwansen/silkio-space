import Database from "@tauri-apps/plugin-sql";
import type { Doc, DocType, SortField } from "@/types/doc";

// 供其他模块从 db 层转引类型
export type { Doc, SortField };

// 文档创建参数
export interface CreateDocParams {
  id?: string;
  title?: string;
  content?: string;
  plain_text?: string;
  doc_type?: DocType;
}

// 文档更新参数
export interface UpdateDocParams {
  title?: string;
  content?: string;
  plain_text?: string;
  word_count?: number;
  doc_type?: DocType;
  viewed_at?: number;
}

// 文档对象

// 排序分页查询结果：当前页文档列表与文档总数
export interface SortedPage {
  list: Doc[];
  total: number;
}

export const useDocDb = () => {
  // 元函数：生成新文档 id
  const genId = () => crypto.randomUUID();

  // 元函数：组装插入参数（与 9 列一一对应：id, title, content, plain_text, doc_type, word_count, viewed_at, created_at, updated_at；deleted_at 不插入，默认 NULL）
  const buildParams = (params: CreateDocParams, id: string) => {
    const now = Date.now();
    return [
      id,
      params.title ?? null,
      params.content ?? null,
      params.plain_text ?? null,
      params.doc_type ?? "document",
      0,
      now,
      now,
      now,
    ];
  };

  // 元函数：执行文档插入语句
  const insert = (db: Database, params: CreateDocParams, id: string) =>
    db.execute(
      `INSERT INTO documents (id, title, content, plain_text, doc_type, word_count, viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      buildParams(params, id),
    );

  // 元函数：创建文档并返回新 id
  const create = async (
    db: Database,
    params: CreateDocParams = {},
  ): Promise<string> => {
    const id = params.id ?? genId();
    await insert(db, params, id);
    return id;
  };

  // 元函数：批量创建文档并返回新 id 列表
  const createMany = async (
    db: Database,
    list: CreateDocParams[] = [],
  ): Promise<string[]> => {
    const ids = list.map((p) => p.id ?? genId());
    await Promise.all(list.map((p, i) => insert(db, p, ids[i])));
    return ids;
  };

  // 元函数：软删除单个文档（仅标记 deleted_at，本体与归档关联均保留，供恢复/回收站/未来同步）
  const remove = async (db: Database, id: string): Promise<void> => {
    await db.execute("UPDATE documents SET deleted_at = $1 WHERE id = $2", [
      Date.now(),
      id,
    ]);
  };

  // 元函数：批量软删除文档（同上）
  const removeMany = async (
    db: Database,
    ids: string[] = [],
  ): Promise<void> => {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
      `UPDATE documents SET deleted_at = $${ids.length + 1} WHERE id IN (${placeholders})`,
      [...ids, Date.now()],
    );
  };

  // 元函数：恢复单个软删除文档（清除 deleted_at 标记）
  const restore = async (db: Database, id: string): Promise<void> => {
    await db.execute(
      "UPDATE documents SET deleted_at = NULL WHERE id = $1",
      [id],
    );
  };

  // 元函数：物理删除单个文档（folder_document 关联由 v1 trigger 随本删除级联清理）
  const purge = async (db: Database, id: string): Promise<void> => {
    await db.execute("DELETE FROM documents WHERE id = $1", [id]);
  };

  // 元函数：批量物理删除文档（同上，关联由 trigger 级联清理，供回收站 GC/清空）
  const purgeMany = async (
    db: Database,
    ids: string[] = [],
  ): Promise<void> => {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
      `DELETE FROM documents WHERE id IN (${placeholders})`,
      ids,
    );
  };

  // 元函数：组装更新 SET 子句与参数
  const buildUpdateSet = (params: UpdateDocParams) => {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (params.title !== undefined) {
      fields.push(`title = $${values.length + 1}`);
      values.push(params.title);
    }
    if (params.content !== undefined) {
      fields.push(`content = $${values.length + 1}`);
      values.push(params.content);
    }
    if (params.plain_text !== undefined) {
      fields.push(`plain_text = $${values.length + 1}`);
      values.push(params.plain_text);
    }
    if (params.word_count !== undefined) {
      fields.push(`word_count = $${values.length + 1}`);
      values.push(params.word_count);
    }
    if (params.doc_type !== undefined) {
      fields.push(`doc_type = $${values.length + 1}`);
      values.push(params.doc_type);
    }
    if (params.viewed_at !== undefined) {
      fields.push(`viewed_at = $${values.length + 1}`);
      values.push(params.viewed_at);
    }
    return { setClause: fields.join(", "), values };
  };

  // 元函数：更新单个文档（仅更新 viewed_at 浏览时间时不刷新 updated_at）
  const update = async (
    db: Database,
    id: string,
    params: UpdateDocParams,
  ): Promise<void> => {
    const { setClause, values } = buildUpdateSet(params);
    if (setClause === "") return;
    // 存在 viewed_at 以外的字段才视为内容变更，刷新 updated_at
    const touchUpdatedAt = Object.keys(params).some((k) => k !== "viewed_at");
    const setSql = touchUpdatedAt
      ? `${setClause}, updated_at = $${values.length + 1}`
      : setClause;
    if (touchUpdatedAt) values.push(Date.now());
    values.push(id);
    await db.execute(
      `UPDATE documents SET ${setSql} WHERE id = $${values.length} AND deleted_at IS NULL`,
      values,
    );
  };

  // 元函数：批量更新文档（跳过无字段项）
  const updateMany = async (
    db: Database,
    list: { id: string; params: UpdateDocParams }[] = [],
  ): Promise<void> => {
    await Promise.all(list.map(({ id, params }) => update(db, id, params)));
  };

  // 元函数：根据 id 查询单个文档（排除软删除）
  const getById = async (db: Database, id: string): Promise<Doc | null> => {
    const rows = await db.select<Doc[]>(
      "SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  };

  // 元函数：查询文档总数（排除软删除，供启动时与搜索索引数量比对）
  const getCount = async (db: Database): Promise<number> => {
    const rows = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM documents WHERE deleted_at IS NULL",
    );
    return rows[0]?.count ?? 0;
  };

  // 元函数：查询全部文档的索引字段（id/title/plain_text，排除软删除），供全量重建索引
  const getAllForIndex = (db: Database): Promise<Doc[]> =>
    db.select<Doc[]>(
      "SELECT id, title, plain_text FROM documents WHERE deleted_at IS NULL",
    );

  // 排序字段 → SQL 列名白名单（db 层不信任上层传参，仅允许已知列参与 ORDER BY 拼接）
  const orderByExpr: Record<SortField, string> = {
    word_count: "word_count",
    viewed_at: "viewed_at",
    updated_at: "updated_at",
    created_at: "created_at",
  };

  // 元函数：按指定字段与方向查询排序后的文档分页（排除软删除），并返回总数用于计算页码
  const getSorted = async (
    db: Database,
    orderBy: SortField,
    direction: "ASC" | "DESC",
    limit: number,
    offset: number,
  ): Promise<SortedPage> => {
    const [rows, count] = await Promise.all([
      db.select<Doc[]>(
        `SELECT * FROM documents WHERE deleted_at IS NULL ORDER BY ${orderByExpr[orderBy]} ${direction} LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      getCount(db),
    ]);
    return { list: rows, total: count };
  };

  return {
    create,
    createMany,
    remove,
    removeMany,
    restore,
    purge,
    purgeMany,
    update,
    updateMany,
    getById,
    getCount,
    getAllForIndex,
    getSorted,
  };
};
