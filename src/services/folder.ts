import { getDb } from "@/infrastructure/db/index.ts";
import {
  useFolderDb,
  type ChildRef,
  type ContainerChild,
  type Folder,
  type FolderSortField,
} from "@/infrastructure/db/folder.ts";
import { useFolderDocumentDb } from "@/infrastructure/db/folderDocument.ts";
import type { Doc } from "@/infrastructure/db/document.ts";

// 归档（文件夹）创建参数（id 与时间字段仅在同步服务端数据时传入，本地创建自动生成/取当前时间）
export interface CreateFolderParams {
  id?: string;
  name: string;
  sortOrder?: number;
  parentId?: string;
  viewedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

// 归档服务层：组装归档数据库元函数提供业务能力
export const useFdSvc = () => {
  // 元函数：组装归档数据库元函数集合
  const folderDb = useFolderDb();
  // 元函数：组装归档-文档关联数据库元函数集合
  const folderDocumentDb = useFolderDocumentDb();

  //#region CKECKED：创建文件夹
  /***
   * @param params.id         - 可选，归档 id；仅同步服务端数据时使用（保持与服务端一致），一般无需填写
   * @param params.name       - 必须，名称
   * @param params.sortOrder  - 可选，排序值；不传时取同级当前最大值 +1（根归档取根级最大值 +1）
   * @param params.parentId   - 可选，父节点 id；不传表示根 archive，传了表示 archive 下的文件夹
   * @param params.viewedAt   - 可选，最近打开时间，仅同步服务端数据时使用，一般无需填写
   * @param params.createdAt  - 可选，创建时间，仅同步服务端数据时使用，一般无需填写
   * @param params.updatedAt  - 可选，最近更新时间，仅同步服务端数据时使用，一般无需填写
   * @returns 新建归档 id
   ***/
  const createFolder = async (params: CreateFolderParams): Promise<string> => {
    const db = await getDb();
    return folderDb.create(db, {
      id: params.id,
      name: params.name,
      parent_id: params.parentId ?? null,
      sort_order: params.sortOrder,
      viewed_at: params.viewedAt,
      created_at: params.createdAt,
      updated_at: params.updatedAt,
    });
  };
  //#endregion

  //#region CKECKED：删除文件夹
  /***
   * @param params.id - 必须，级联删除其全部后代文件夹及关联的folder_document行，文档本体保留
   ***/
  const deleteFolder = async (params: { id: string }): Promise<void> => {
    const db = await getDb();
    return folderDb.remove(db, params.id);
  };
  //#endregion

  //#region CKECKED：重命名文件夹
  /***
   * @param params.id     必须，文件夹 id
   * @param params.name   必须，新名称；同时刷新 updated_at
   ***/
  const renameFolder = async (params: {
    id: string;
    name: string;
  }): Promise<void> => {
    const db = await getDb();
    return folderDb.rename(db, params.id, params.name);
  };
  //#endregion

  //#region CKECKED：修改文件夹最近打开时间
  /***
   * @param params.id       必须，文件夹 id
   * @param params.viewedAt 可选，最近打开时间；不传时取当前时间，仅同步服务端数据时填写
   ***/
  const updateFolderViewedAt = async (params: {
    id: string;
    viewedAt?: number;
  }): Promise<void> => {
    const db = await getDb();
    return folderDb.touch(db, params.id, params.viewedAt);
  };
  //#endregion
  
  //#region CKECKED：获取归档子项
  /***
   * 获取归档下的文件夹和文档（统一 sort_order 升序穿插排列）
   * @param params.id 必须，归档id
   * @returns 子项数组，文件夹与文档可任意穿插（kind 区分类型）
   ***/
  const getArchiveChildren = async (params: { id: string }): Promise<ContainerChild[]> => {
    const db = await getDb();
    return folderDb.getChildrenMerged(db, params.id);
  };
  //#endregion

  //#region CKECKED：重排序
  /***
   * 重排序容器内全部子项：子文件夹与文档共用统一 sort_order 编号空间，按传入顺序写 0,1,2...，
   * 支持任意穿插（如 文档、文件夹、文档）；文件夹写 folders.sort_order，文档写 folder_document.sort_order
   * @param params.id     必须，容器归档 id
   * @param params.items  必须，该容器内全部子项的目标顺序数组（kind 区分文件夹与文档）
   ***/
  const reorderChildren = async (params: {
    id: string;
    items: ChildRef[];
  }): Promise<void> => {
    const db = await getDb();
    return folderDb.reorderChildren(db, params.id, params.items);
  };
  //#endregion

  //#region CKECKED：获取归档
  /***
   * 获取全部根归档（仅 parent_id 为空的归档展示于主窗口，数量少，不分页，按 sort_order 升序）
   * @returns 根归档数组
   ***/
  const getArchives = async (): Promise<Folder[]> => {
    const db = await getDb();
    return folderDb.getSorted(db, "sort_order", "ASC");
  };
  //#endregion

  //#region CHECKED：获取排序的归档列表
  /***
   * @param params.sortField 可选，排序字段；不传时按自由排序（sort_order 升序）
   * @returns 根归档数组
   ***/
  const getSortedFolders = async (params: {
    sortField?: FolderSortField;
  }): Promise<Folder[]> => {
    const db = await getDb();
    return folderDb.getSorted(db, params.sortField ?? "sort_order", "ASC");
  };
  //#endregion
  
  //#region CKECKED：将文件夹/文档拖拽到其他文件夹
  /***
   * 将文件夹拖入目标容器：parent_id 更新为目标容器，并追加到其统一排序空间末尾
   * @param params.id       必须，被拖拽文件夹 id
   * @param params.targetId 必须，目标容器归档 id；不得为该文件夹自身或其后代（拖拽成环）
   ***/
  const moveFolderInto = async (params: {
    id: string;
    targetId: string;
  }): Promise<void> => {
    const db = await getDb();
    if (params.id === params.targetId) {
      throw new Error("不能将文件夹拖入其自身");
    }
    const descendantIds = await folderDb.getDescendantIds(db, params.id);
    if (descendantIds.includes(params.targetId)) {
      throw new Error("不能将文件夹拖入其后代文件夹");
    }
    await folderDb.setParent(db, params.id, params.targetId);
    // 追加到目标容器统一排序空间末尾（子文件夹与文档共用一个序列）
    const maxSort = await folderDb.getMaxChildSortOrder(db, params.targetId);
    await folderDb.setSortOrder(db, params.id, maxSort + 1);
  };

  /***
   * 将文档拖入目标容器：追加到其统一排序空间末尾；
   * sourceId 非空且不同于目标容器时，先加入目标再从源容器移除（移动语义，避免中途失败两边都丢）
   * @param params.id       必须，被拖拽文档 id
   * @param params.targetId 必须，目标容器归档 id
   * @param params.sourceId 可选，源容器归档 id；仅加入目标容器（不移动）时不传
   ***/
  const moveDocInto = async (params: {
    id: string;
    targetId: string;
    sourceId?: string;
  }): Promise<void> => {
    const db = await getDb();
    if (params.sourceId === params.targetId) return;
    await folderDocumentDb.add(db, params.targetId, params.id);
    if (params.sourceId) {
      await folderDocumentDb.remove(db, params.sourceId, params.id);
    }
  };
  //#endregion

  //#region CKECKED：删除文件夹内的文档（不是删除文档，只是取消关联）
  /***
   * 将文档从文件夹中移除（仅删除 folder_document 关联行，文档本体保留，不影响其与其他文件夹的关联）
   * @param params.folderId 必须，文件夹 id
   * @param params.docId    必须，文档 id
   ***/
  const removeDocFromFolder = async (params: {
    folderId: string;
    docId: string;
  }): Promise<void> => {
    const db = await getDb();
    return folderDocumentDb.remove(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：删除文档的全部归档关联
  /***
   * 文档被永久删除时调用：删除该文档在所有归档中的 folder_document 关联行
   * @param params.docId 必须，文档 id
   ***/
  const removeDocRelations = async (params: { docId: string }): Promise<void> => {
    const db = await getDb();
    return folderDocumentDb.removeByDoc(db, params.docId);
  };
  //#endregion

  //#region CHECKED：将文档加入归档
  /***
   * 将文档加入归档（幂等，重复加入自动忽略，追加到统一排序空间末尾）
   * @param params.folderId 必须，归档 id
   * @param params.docId    必须，文档 id
   ***/
  const addDocToFolder = async (params: {
    folderId: string;
    docId: string;
  }): Promise<void> => {
    const db = await getDb();
    return folderDocumentDb.add(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：查询文档已加入的归档 id 集合
  /***
   * @param params.docId 必须，文档 id
   * @returns 归档 id 数组
   ***/
  const getFolderIdsByDoc = async (params: { docId: string }): Promise<string[]> => {
    const db = await getDb();
    return folderDocumentDb.getFolderIdsByDoc(db, params.docId);
  };
  //#endregion

  //#region CHECKED：批量将文档加入归档
  /***
   * 将文档批量加入多个归档（幂等，重复加入自动忽略，各自追加到统一排序空间末尾）
   * @param params.folderIds 必须，归档 id 集合
   * @param params.docId     必须，文档 id
   ***/
  const addDocToFolders = async (params: {
    folderIds: string[];
    docId: string;
  }): Promise<void> => {
    const db = await getDb();
    return folderDocumentDb.addMany(db, params.folderIds, params.docId);
  };
  //#endregion

  //#region CHECKED：批量将文档移出归档
  /***
   * 将文档批量移出多个归档（仅删除关联行，文档本体保留）
   * @param params.folderIds 必须，归档 id 集合
   * @param params.docId     必须，文档 id
   ***/
  const removeDocFromFolders = async (params: {
    folderIds: string[];
    docId: string;
  }): Promise<void> => {
    const db = await getDb();
    return folderDocumentDb.removeMany(db, params.folderIds, params.docId);
  };
  //#endregion

  //#region CHECKED：将文档从归档子树移除
  /***
   * 将文档从归档及其全部后代文件夹的关联中移除（仅删除 folder_document 关联行，文档本体保留）
   * @param params.folderId 必须，归档（容器）id
   * @param params.docId    必须，文档 id
   ***/
  const removeDocFromSubtree = async (params: {
    folderId: string;
    docId: string;
  }): Promise<void> => {
    const db = await getDb();
    const descendantIds = await folderDb.getDescendantIds(db, params.folderId);
    const folderIds = await folderDocumentDb.getFolderIdsByDoc(db, params.docId);
    const inSubtree = folderIds.filter(
      (id) => id === params.folderId || descendantIds.includes(id),
    );
    await folderDocumentDb.removeMany(db, inSubtree, params.docId);
  };
  //#endregion

  //#region CHECKED：获取归档子树内第一篇文档
  /***
   * 按加入顺序（sort_order 升序）返回归档子树内第一篇文档，无文档返回 null
   * @param params.folderId 必须，归档（容器）id
   ***/
  const getFirstDocInSubtree = async (params: {
    folderId: string;
  }): Promise<Doc | null> => {
    const db = await getDb();
    const descendantIds = await folderDb.getDescendantIds(db, params.folderId);
    const ids = [params.folderId, ...descendantIds];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await db.select<Doc[]>(
      `SELECT d.* FROM folder_document fd
       JOIN documents d ON d.id = fd.document_id
       WHERE fd.folder_id IN (${placeholders})
       ORDER BY fd.sort_order ASC
       LIMIT 1`,
      ids,
    );
    return rows[0] ?? null;
  };
  //#endregion

  //#region CHECKED：根据 id 查询归档
  /***
   * @param params.id 必须，归档 id
   ***/
  const getFolderById = async (params: { id: string }): Promise<Folder | null> => {
    const db = await getDb();
    return folderDb.getById(db, params.id);
  };
  //#endregion

  //#region CHECKED：查询归档子树内是否包含指定文档
  /***
   * @param params.folderId 必须，归档 id
   * @param params.docId    必须，文档 id
   ***/
  const hasDocInSubtree = async (params: {
    folderId: string;
    docId: string;
  }): Promise<boolean> => {
    const db = await getDb();
    return folderDb.hasDocInSubtree(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：获取后代归档 id 集合
  /***
   * @param params.id 必须，归档 id
   * @returns 全部后代归档 id（不含自身）
   ***/
  const getDescendantIds = async (params: { id: string }): Promise<string[]> => {
    const db = await getDb();
    return folderDb.getDescendantIds(db, params.id);
  };
  //#endregion

  //#region CHECKED：查询归档子树内的全部子文件夹
  /***
   * @param params.id 必须，归档 id（不含根自身）
   ***/
  const getSubtreeFolders = async (params: { id: string }): Promise<Folder[]> => {
    const db = await getDb();
    return folderDb.getSubtreeFolders(db, params.id);
  };
  //#endregion

  //#region CHECKED：查询归档子树内的全部文档
  /***
   * @param params.id 必须，归档 id
   * @returns 文档数组，携带所属容器 container_id 与容器内排序 container_order
   ***/
  const getSubtreeDocs = async (params: { id: string }) => {
    const db = await getDb();
    return folderDb.getSubtreeDocs(db, params.id);
  };
  //#endregion
  return { createFolder, deleteFolder, renameFolder, updateFolderViewedAt, getArchiveChildren, reorderChildren, getArchives, getSortedFolders, moveFolderInto, moveDocInto, removeDocFromFolder, removeDocRelations, addDocToFolder, getFolderIdsByDoc, addDocToFolders, removeDocFromFolders, removeDocFromSubtree, getFirstDocInSubtree, getFolderById, hasDocInSubtree, getDescendantIds, getSubtreeFolders, getSubtreeDocs };
};
