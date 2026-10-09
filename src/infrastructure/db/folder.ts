import Database from "@tauri-apps/plugin-sql";
import type { Doc } from "@/infrastructure/db/document.ts";

// 归档（文件夹）创建参数
export interface CreateFolderParams {
  name?: string;
  parent_id?: string | null;
}

// 可排序字段：手动排序（自由）、名称、归档自身浏览时间（最近打开）
export type FolderSortField = "sort_order" | "name" | "viewed_at";

// 归档对象（viewed_at 为归档自身的最近打开时间，null 表示从未打开）
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  viewed_at: number | null;
  created_at: number;
  updated_at: number;
}

export const useFolderDb = () => {
  // 元函数：生成新归档 id
  const genId = () => crypto.randomUUID();

  // 元函数：创建归档并返回新 id
  // 子文件夹（parent_id 非空）追加到该父级下末尾；根归档维持 sort_order 0（主窗口现状）
  const create = async (
    db: Database,
    params: CreateFolderParams = {},
  ): Promise<string> => {
    const id = genId();
    const now = Date.now();
    let sortOrder = 0;
    if (params.parent_id) {
      const rows = await db.select<{ max: number | null }[]>(
        "SELECT MAX(sort_order) AS max FROM folders WHERE parent_id = $1",
        [params.parent_id],
      );
      sortOrder = (rows[0]?.max ?? -1) + 1;
    }
    await db.execute(
      `INSERT INTO folders (id, name, parent_id, sort_order, viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, params.name ?? "新建归档", params.parent_id ?? null, sortOrder, null, now, now],
    );
    return id;
  };

  // 元函数：收集以 id 为根的子树全部归档 id（含自身）
  const getSubtreeIds = async (
    db: Database,
    id: string,
  ): Promise<string[]> => {
    const rows = await db.select<{ id: string }[]>(
      `WITH RECURSIVE sub(id) AS (
         SELECT $1
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT id FROM sub`,
      [id],
    );
    return rows.map((r) => r.id);
  };

  // 元函数：查询单个归档的直接子文件夹（按 sort_order 升序，同名次序按创建时间）
  const getChildren = async (
    db: Database,
    parentId: string,
  ): Promise<Folder[]> => {
    return db.select<Folder[]>(
      "SELECT * FROM folders WHERE parent_id = $1 ORDER BY sort_order ASC, created_at ASC",
      [parentId],
    );
  };

  // 元函数：查询归档的全部后代 id（不含自身），用于拖拽环检测
  const getDescendantIds = async (
    db: Database,
    id: string,
  ): Promise<string[]> => {
    const rows = await db.select<{ id: string }[]>(
      `WITH RECURSIVE sub(id) AS (
         SELECT id FROM folders WHERE parent_id = $1
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT id FROM sub`,
      [id],
    );
    return rows.map((r) => r.id);
  };

  // 元函数：移动归档到目标父级（环检测由服务层在调用前完成）
  const setParent = async (
    db: Database,
    id: string,
    parentId: string | null,
  ): Promise<void> => {
    await db.execute(
      "UPDATE folders SET parent_id = $1, updated_at = $2 WHERE id = $3",
      [parentId, Date.now(), id],
    );
  };

  // 元函数：级联删除单个归档（连同其全部后代 folders 行与对应 folder_document 关联，
  // documents 表文档本体保留；tauri-plugin-sql 单次仅执行一条语句，需先删关联再删归档）
  const remove = async (db: Database, id: string): Promise<void> => {
    const ids = await getSubtreeIds(db, id);
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await db.execute(
      `DELETE FROM folder_document WHERE folder_id IN (${placeholders})`,
      ids,
    );
    await db.execute(`DELETE FROM folders WHERE id IN (${placeholders})`, ids);
  };

  // 元函数：查询归档子树内是否包含指定文档（folder_document 关联存在于任意层级）
  const hasDocInSubtree = async (
    db: Database,
    folderId: string,
    docId: string,
  ): Promise<boolean> => {
    const ids = await getSubtreeIds(db, folderId);
    if (ids.length === 0) return false;
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
    const rows = await db.select<{ e: number }[]>(
      `SELECT EXISTS(
         SELECT 1 FROM folder_document
         WHERE document_id = $1 AND folder_id IN (${placeholders})
       ) AS e`,
      [docId, ...ids],
    );
    return (rows[0]?.e ?? 0) === 1;
  };

  // 元函数：查询归档子树内第一篇文档（优先根容器按加入顺序，其次后代层级）
  const getFirstDocInSubtree = async (
    db: Database,
    folderId: string,
  ): Promise<Doc | null> => {
    const rows = await db.select<Doc[]>(
      `WITH RECURSIVE sub(id) AS (
         SELECT $1
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT d.* FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id
       WHERE fd.folder_id IN (SELECT id FROM sub)
       ORDER BY (fd.folder_id = $1) DESC, fd.sort_order ASC
       LIMIT 1`,
      [folderId],
    );
    return rows.length > 0 ? rows[0] : null;
  };

  // 元函数：更新归档浏览时间（打开归档时调用，不影响 updated_at）
  const touch = async (db: Database, id: string): Promise<void> => {
    await db.execute("UPDATE folders SET viewed_at = $1 WHERE id = $2", [
      Date.now(),
      id,
    ]);
  };

  // 元函数：重命名归档并刷新 updated_at
  const rename = async (db: Database, id: string, name: string): Promise<void> => {
    await db.execute(
      "UPDATE folders SET name = $1, updated_at = $2 WHERE id = $3",
      [name, Date.now(), id],
    );
  };

  // 排序字段 → SQL ORDER BY 表达式
  const orderByExpr: Record<FolderSortField, string> = {
    sort_order: "sort_order",
    name: "name",
    viewed_at: "viewed_at",
  };

  // 元函数：按传入 id 顺序批量重写 sort_order（0,1,2...），用于自由排序持久化
  // （同一函数服务两类场景：主窗口根归档排序、导航内同级子文件夹排序）
  const reorder = async (db: Database, ids: string[]): Promise<void> => {
    for (let i = 0; i < ids.length; i++) {
      await db.execute("UPDATE folders SET sort_order = $1 WHERE id = $2", [
        i,
        ids[i],
      ]);
    }
  };

  // 元函数：根据 id 查询单个归档
  const getById = async (db: Database, id: string): Promise<Folder | null> => {
    const rows = await db.select<Folder[]>("SELECT * FROM folders WHERE id = $1", [id]);
    return rows.length > 0 ? rows[0] : null;
  };

  // 元函数：按指定字段与方向查询排序后的全部根归档（主窗口归档列表，数量少，不分页）
  const getSorted = async (
    db: Database,
    orderBy: FolderSortField,
    direction: "ASC" | "DESC",
  ): Promise<Folder[]> => {
    return await db.select<Folder[]>(
      `SELECT * FROM folders WHERE parent_id IS NULL ORDER BY ${orderByExpr[orderBy]} ${direction}`,
    );
  };

  return {
    create,
    remove,
    touch,
    rename,
    getById,
    getSorted,
    reorder,
    getChildren,
    getDescendantIds,
    getSubtreeIds,
    setParent,
    hasDocInSubtree,
    getFirstDocInSubtree,
  };
};
