import Database from "@tauri-apps/plugin-sql";

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
  const create = async (
    db: Database,
    params: CreateFolderParams = {},
  ): Promise<string> => {
    const id = genId();
    const now = Date.now();
    await db.execute(
      `INSERT INTO folders (id, name, parent_id, sort_order, viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, params.name ?? "新建归档", params.parent_id ?? null, 0, null, now, now],
    );
    return id;
  };

  // 元函数：删除单个归档（不处理其下文档关联）
  const remove = async (db: Database, id: string): Promise<void> => {
    await db.execute("DELETE FROM folders WHERE id = $1", [id]);
  };

  // 元函数：更新归档浏览时间（打开归档时调用，不影响 updated_at）
  const touch = async (db: Database, id: string): Promise<void> => {
    await db.execute("UPDATE folders SET viewed_at = $1 WHERE id = $2", [
      Date.now(),
      id,
    ]);
  };

  // 排序字段 → SQL ORDER BY 表达式
  const orderByExpr: Record<FolderSortField, string> = {
    sort_order: "sort_order",
    name: "name",
    viewed_at: "viewed_at",
  };

  // 元函数：按传入 id 顺序批量重写 sort_order（0,1,2...），用于自由排序持久化
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

  // 元函数：按指定字段与方向查询排序后的全部归档（数量少，不分页）
  const getSorted = async (
    db: Database,
    orderBy: FolderSortField,
    direction: "ASC" | "DESC",
  ): Promise<Folder[]> => {
    return await db.select<Folder[]>(
      `SELECT * FROM folders ORDER BY ${orderByExpr[orderBy]} ${direction}`,
    );
  };

  return { create, remove, touch, getById, getSorted, reorder };
};
