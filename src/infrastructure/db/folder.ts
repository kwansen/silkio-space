import Database from "@tauri-apps/plugin-sql";

// 归档（文件夹）创建参数
export interface CreateFolderParams {
  name?: string;
  parent_id?: string | null;
}

// 可排序字段：归档仅有创建与更新两种时间
export type FolderSortField = "updated_at" | "created_at";

// 归档对象
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

// 含文档数量的归档对象
export interface FolderWithCount extends Folder {
  doc_count: number;
}

// 排序分页查询结果：当前页归档列表与归档总数
export interface SortedFolderPage {
  list: FolderWithCount[];
  total: number;
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
      `INSERT INTO folders (id, name, parent_id, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, params.name ?? "新建归档", params.parent_id ?? null, 0, now, now],
    );
    return id;
  };

  // 元函数：删除单个归档（不处理其下文档关联）
  const remove = async (db: Database, id: string): Promise<void> => {
    await db.execute("DELETE FROM folders WHERE id = $1", [id]);
  };

  // 元函数：按指定字段与方向查询排序后的归档分页（附文档数量），并返回总数用于计算页码
  const getSorted = async (
    db: Database,
    orderBy: FolderSortField,
    direction: "ASC" | "DESC",
    limit: number,
    offset: number,
  ): Promise<SortedFolderPage> => {
    const [rows, countRows] = await Promise.all([
      db.select<FolderWithCount[]>(
        `SELECT f.*, (SELECT COUNT(*) FROM folder_document fd WHERE fd.folder_id = f.id) AS doc_count
         FROM folders f ORDER BY f.${orderBy} ${direction} LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      db.select<{ count: number }[]>("SELECT COUNT(*) AS count FROM folders"),
    ]);
    return { list: rows, total: countRows[0]?.count ?? 0 };
  };

  return { create, remove, getSorted };
};
