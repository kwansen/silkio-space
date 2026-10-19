import Database from "@tauri-apps/plugin-sql";
import type { Doc } from "@/infrastructure/db/document.ts";

// 归档（文件夹）创建参数（id 与时间字段仅在同步服务端数据时传入，本地创建自动生成/取当前时间）
export interface CreateFolderParams {
  id?: string;
  name?: string;
  parent_id?: string | null;
  sort_order?: number;
  viewed_at?: number;
  created_at?: number;
  updated_at?: number;
}

// 可排序字段：手动排序（自由）、名称、归档自身浏览时间（最近打开）
export type FolderSortField = "sort_order" | "name" | "viewed_at";

// 归档子树内文档（附带所属容器 id 与容器内加入顺序，供导航树拍平分组）
export type DocInContainer = Doc & {
  container_id: string;
  container_order: number;
};

// 容器内子项（统一排序的最小载荷）：kind 区分文件夹与文档
export interface ChildRef {
  kind: "folder" | "doc";
  id: string;
}

// 容器内子项：子文件夹与文档共用统一 sort_order 编号空间，可任意穿插排列
export type ContainerChild =
  | ({ kind: "folder" } & Folder)
  | ({ kind: "doc"; container_id: string; sort_order: number } & Doc);

export const useFolderDb = () => {
  // 元函数：生成新归档 id
  const genId = () => crypto.randomUUID();

  // 元函数：查询容器统一排序空间当前最大 sort_order（子文件夹与文档共用一个序列，
  // 追加新子项取两表联合最大值 +1，避免新项插入到已有穿插序列中间）
  const getMaxChildSortOrder = async (
    db: Database,
    parentId: string | null,
  ): Promise<number> => {
    const rows = parentId
      ? await db.select<{ max: number | null }[]>(
          `SELECT MAX(sort_order) AS max FROM (
             SELECT sort_order FROM folders WHERE parent_id = $1
             UNION ALL
             SELECT sort_order FROM folder_document WHERE folder_id = $1
           )`,
          [parentId],
        )
      : await db.select<{ max: number | null }[]>(
          `SELECT MAX(sort_order) AS max FROM (
             SELECT sort_order FROM folders WHERE parent_id IS NULL
             UNION ALL
             SELECT sort_order FROM folder_document
             WHERE folder_id IN (SELECT id FROM folders WHERE parent_id IS NULL)
           )`,
        );
    return rows[0]?.max ?? -1;
  };

  // 元函数：创建归档并返回新 id
  // sort_order 未传时取容器统一排序空间当前最大值 +1（子文件夹与文档共用一个序列）；
  // 时间字段未传时取当前时间（viewed_at 默认 null 表示从未打开）
  const create = async (
    db: Database,
    params: CreateFolderParams = {},
  ): Promise<string> => {
    const id = params.id ?? genId();
    const now = Date.now();
    let sortOrder = params.sort_order ?? 0;
    if (params.sort_order === undefined) {
      sortOrder =
        (await getMaxChildSortOrder(db, params.parent_id ?? null)) + 1;
    }
    await db.execute(
      `INSERT INTO folders (id, name, parent_id, sort_order, viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        params.name ?? "新建归档",
        params.parent_id ?? null,
        sortOrder,
        params.viewed_at ?? null,
        params.created_at ?? now,
        params.updated_at ?? now,
      ],
    );
    return id;
  };

  // 元函数：收集以 id 为根的子树全部归档 id（含自身）
  const getSubtreeIds = async (db: Database, id: string): Promise<string[]> => {
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

  // 元函数：更新单个归档的 sort_order（文件夹拖拽移动到新容器末尾时使用）
  const setSortOrder = async (
    db: Database,
    id: string,
    sortOrder: number,
  ): Promise<void> => {
    await db.execute("UPDATE folders SET sort_order = $1 WHERE id = $2", [
      sortOrder,
      id,
    ]);
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

  // 元函数：更新归档浏览时间（打开归档时调用，不影响 updated_at；viewedAt 仅同步服务端数据时传入，不传取当前时间）
  const touch = async (
    db: Database,
    id: string,
    viewedAt?: number,
  ): Promise<void> => {
    await db.execute("UPDATE folders SET viewed_at = $1 WHERE id = $2", [
      viewedAt ?? Date.now(),
      id,
    ]);
  };

  // 元函数：重命名归档并刷新 updated_at
  const rename = async (
    db: Database,
    id: string,
    name: string,
  ): Promise<void> => {
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

  // 元函数：重排容器内全部子项（子文件夹与文档共用统一 sort_order 编号空间，可任意穿插排列）
  // 按传入顺序写 0,1,2...：文件夹写 folders.sort_order，文档写 folder_document.sort_order
  const reorderChildren = async (
    db: Database,
    parentId: string,
    items: ChildRef[],
  ): Promise<void> => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "folder") {
        await db.execute("UPDATE folders SET sort_order = $1 WHERE id = $2", [
          i,
          item.id,
        ]);
      } else {
        await db.execute(
          "UPDATE folder_document SET sort_order = $1 WHERE folder_id = $2 AND document_id = $3",
          [i, parentId, item.id],
        );
      }
    }
  };

  // 元函数：查询容器内全部子项（子文件夹 + 文档，统一 sort_order 升序穿插排列）
  // 历史数据两表 sort_order 独立编号可能同值，同值时文件夹排前；重排一次后编号即归一
  const getChildrenMerged = async (
    db: Database,
    parentId: string,
  ): Promise<ContainerChild[]> => {
    const [folders, docs] = await Promise.all([
      getChildren(db, parentId),
      db.select<(Doc & { container_order: number })[]>(
        `SELECT d.*, fd.sort_order AS container_order
         FROM folder_document fd
         JOIN documents d ON d.id = fd.document_id
         WHERE fd.folder_id = $1
         ORDER BY fd.sort_order ASC`,
        [parentId],
      ),
    ]);
    const children: ContainerChild[] = [
      ...folders.map((f) => ({ kind: "folder" as const, ...f })),
      ...docs.map(({ container_order, ...doc }) => ({
        kind: "doc" as const,
        container_id: parentId,
        sort_order: container_order,
        ...doc,
      })),
    ];
    return children.sort((a, b) => a.sort_order - b.sort_order);
  };

  // 元函数：根据 id 查询单个归档
  const getById = async (db: Database, id: string): Promise<Folder | null> => {
    const rows = await db.select<Folder[]>(
      "SELECT * FROM folders WHERE id = $1",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  };

  // 元函数：按指定字段与方向查询排序后的全部根归档（主窗口归档列表，数量少，不分页）
  // 仅根文件夹（parent_id 为空）可作为归档展示于主窗口
  const getSorted = async (
    db: Database,
    orderBy: FolderSortField,
    direction: "ASC" | "DESC",
  ): Promise<Folder[]> => {
    return await db.select<Folder[]>(
      `SELECT * FROM folders WHERE parent_id IS NULL ORDER BY ${orderByExpr[orderBy]} ${direction}`,
    );
  };

  // 元函数：查询归档子树内的全部子文件夹（不含根自身，按 sort_order 升序，同级按创建时间稳定次序）
  const getSubtreeFolders = async (
    db: Database,
    rootId: string,
  ): Promise<Folder[]> => {
    return db.select<Folder[]>(
      `WITH RECURSIVE sub(id) AS (
         SELECT $1
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT * FROM folders
       WHERE id IN (SELECT id FROM sub) AND id != $1
       ORDER BY sort_order ASC, created_at ASC`,
      [rootId],
    );
  };

  // 元函数：查询归档子树内的全部文档（含所属容器 folder_id 与容器内加入顺序）
  const getSubtreeDocs = async (
    db: Database,
    rootId: string,
  ): Promise<DocInContainer[]> => {
    return db.select<DocInContainer[]>(
      `WITH RECURSIVE sub(id) AS (
         SELECT $1
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT d.*, fd.folder_id AS container_id, fd.sort_order AS container_order
       FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id
       WHERE fd.folder_id IN (SELECT id FROM sub)
       ORDER BY fd.folder_id, fd.sort_order ASC`,
      [rootId],
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
    setSortOrder,
    hasDocInSubtree,
    getFirstDocInSubtree,
    getSubtreeFolders,
    getSubtreeDocs,
    reorderChildren,
    getChildrenMerged,
    getMaxChildSortOrder,
  };
};
