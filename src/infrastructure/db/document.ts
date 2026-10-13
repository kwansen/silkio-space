import Database from "@tauri-apps/plugin-sql";

// 文档创建参数
export interface CreateDocParams {
  id?: string;
  title?: string;
  content?: string;
  plain_text?: string;
  doc_type?: string;
}

// 文档更新参数
export interface UpdateDocParams {
  title?: string;
  content?: string;
  plain_text?: string;
  doc_type?: string;
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

  // 元函数：组装插入参数（与 9 列一一对应：id, title, content, plain_text, doc_type, word_count, viewed_at, created_at, updated_at）
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

  // 元函数：删除单个文档（先清理 folder_document 多对多关联再删本体，
  // tauri-plugin-sql 单次仅执行一条语句）
  const remove = async (db: Database, id: string): Promise<void> => {
    await db.execute("DELETE FROM folder_document WHERE document_id = $1", [
      id,
    ]);
    await db.execute("DELETE FROM documents WHERE id = $1", [id]);
  };

  // 元函数：批量删除文档（同上，先清理关联再删本体）
  const removeMany = async (
    db: Database,
    ids: string[] = [],
  ): Promise<void> => {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
      `DELETE FROM folder_document WHERE document_id IN (${placeholders})`,
      ids,
    );
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
      `UPDATE documents SET ${setSql} WHERE id = $${values.length}`,
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

  // 元函数：根据 id 查询单个文档
  const getById = async (db: Database, id: string): Promise<Doc | null> => {
    const rows = await db.select<Doc[]>(
      "SELECT * FROM documents WHERE id = $1",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  };

  // 元函数：按指定字段与方向查询排序后的文档分页，并返回总数用于计算页码
  const getSorted = async (
    db: Database,
    orderBy: SortField,
    direction: "ASC" | "DESC",
    limit: number,
    offset: number,
  ): Promise<SortedPage> => {
    const [rows, countRows] = await Promise.all([
      db.select<Doc[]>(
        `SELECT * FROM documents ORDER BY ${orderBy} ${direction} LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      db.select<{ count: number }[]>("SELECT COUNT(*) AS count FROM documents"),
    ]);
    return { list: rows, total: countRows[0]?.count ?? 0 };
  };

  return {
    create,
    createMany,
    remove,
    removeMany,
    update,
    updateMany,
    getById,
    getSorted,
  };
};
