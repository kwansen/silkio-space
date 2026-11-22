import { getDb } from "@/infrastructure/db/index.ts";
import {
  useFolderDb,
  type ChildRef,
  type ContainerChild,
  type FolderSortField,
} from "@/infrastructure/db/folder.ts";
import { useFolderDocumentDb } from "@/infrastructure/db/folderDocument.ts";
import { Folder } from "@/types/archive";
import { Doc, DocEntry } from "@/types/doc";

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
   * @param params.viewedAt   - 可选，最近打开时间；不传时取当前时间（仅同步服务端数据时填写）
   * @param params.createdAt  - 可选，创建时间，仅同步服务端数据时使用，一般无需填写
   * @param params.updatedAt  - 可选，最近更新时间，仅同步服务端数据时使用，一般无需填写
   * @returns 新建归档 id
   ***/
  const createFolder = async (params: CreateFolderParams): Promise<string> => {
    const db = getDb();
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

  //#region CKECKED：删除文件夹（软删除）
  /***
   * 仅标记 deleted_at，后代随之在树查询中不可达，folder_document 关联保留（恢复后成员关系原地回归）；
   * 文档本体与文档的其他归档关联均不受影响
   * @param params.id - 必须，待删除文件夹 id
   ***/
  const deleteFolder = async (params: { id: string }): Promise<void> => {
    const db = getDb();
    return folderDb.remove(db, params.id);
  };
  //#endregion

  //#region CKECKED：恢复软删除文件夹
  /***
   * 清除 deleted_at 标记，其子树与归档成员关系随之恢复可见
   * @param params.id - 必须，待恢复文件夹 id
   ***/
  const restoreFolder = async (params: { id: string }): Promise<void> => {
    const db = getDb();
    return folderDb.restore(db, params.id);
  };
  //#endregion

  //#region CKECKED：彻底删除文件夹（物理删除）
  /***
   * 物理删除该文件夹及其子树（含已软删的后代），folder_document 关联由 v1 trigger 级联清理；
   * 文档本体保留。软删除超过保留期（90 天）的归档由此 GC
   * @param params.id - 必须，待彻底删除文件夹 id
   ***/
  const purgeFolder = async (params: { id: string }): Promise<void> => {
    const db = getDb();
    return folderDb.purge(db, params.id);
  };
  //#endregion

  //#region CKECKED：获取回收站文件夹
  /***
   * 全部软删除文件夹，按删除时间倒序
   ***/
  const getTrashedFolders = async (): Promise<Folder[]> => {
    const db = getDb();
    return folderDb.getTrashed(db);
  };
  //#endregion

  //#region CKECKED：自动清理过期的软删除文件夹（回收站 90 天保留期）
  /***
   * 物理删除软删除超过保留期的文件夹（连同其子树，trigger 级联清关联）。
   * 注意：未来接入同步后，墓碑 GC 需升级为「所有设备确认收到删除」后才清除（同文档）
   * @param retentionDays 可选，保留天数，默认 90
   ***/
  const purgeExpiredFolders = async (retentionDays = 90): Promise<void> => {
    const db = getDb();
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const ids = await folderDb.getExpiredIds(db, cutoff);
    for (const id of ids) {
      await folderDb.purge(db, id);
    }
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
    const db = getDb();
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
    const db = getDb();
    return folderDb.touch(db, params.id, params.viewedAt);
  };
  //#endregion

  //#region CHECKED：更新文件夹（通用）
  /***
   * 通用更新：仅更新传入字段（name/parentId/sortOrder/viewedAt），同时刷新 updated_at
   * （归档不参与搜索索引，无需索引同步；parent_id 变更不做环检测，拖拽移动请使用 moveFolderInto）
   * @param params.id        必须，文件夹 id
   * @param params.name      可选，新名称
   * @param params.parentId  可选，父节点 id；传 null 表示移至根级
   * @param params.sortOrder 可选，排序值
   * @param params.viewedAt  可选，最近打开时间；仅更新该字段时不刷新 updated_at（仅同步服务端数据时填写）
   ***/
  const update = async (params: {
    id: string;
    name?: string;
    parentId?: string | null;
    sortOrder?: number;
    viewedAt?: number;
  }): Promise<void> => {
    const db = getDb();
    return folderDb.update(db, params.id, {
      name: params.name,
      parent_id: params.parentId,
      sort_order: params.sortOrder,
      viewed_at: params.viewedAt,
    });
  };
  //#endregion

  //#region CKECKED：获取归档子项
  /***
   * 获取归档下的文件夹和文档（统一 sort_order 升序穿插排列）
   * @param params.id 必须，归档id
   * @returns 子项数组，文件夹与文档可任意穿插（kind 区分类型）
   ***/
  const getArchiveChildren = async (params: {
    id: string;
  }): Promise<ContainerChild[]> => {
    const db = getDb();
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
    const db = getDb();
    return folderDb.reorderChildren(db, params.id, params.items);
  };
  //#endregion

  //#region CHECKED：重排序根归档
  /***
   * 按传入顺序批量重写归档 sort_order（0,1,2...），用于自由排序持久化
   * （根归档无所属容器，与容器内子项重排的统一编号空间无关，仅写 folders.sort_order）
   * @param params.ids 必须，归档 id 的目标顺序数组
   ***/
  const reorderFolders = async (ids: string[]): Promise<void> => {
    const db = getDb();
    return folderDb.reorder(db, ids);
  };
  //#endregion

  //#region CHECKED：重排序归档内文档
  /***
   * 按传入文档 id 顺序批量重写该归档内文档 sort_order（0,1,2...），用于左侧目录拖拽排序持久化
   * @param params.folderId     必须，归档 id
   * @param params.documentIds  必须，目标顺序的文档 id 数组（须为该归档内全部直接关联文档）
   ***/
  const reorderDocs = async (params: {
    folderId: string;
    documentIds: string[];
  }): Promise<void> => {
    const db = getDb();
    return folderDocumentDb.reorder(db, params.folderId, params.documentIds);
  };
  //#endregion

  //#region CKECKED：获取归档
  /***
   * 获取全部根归档（仅 parent_id 为空的归档展示于主窗口，数量少，不分页，按 sort_order 升序）
   * @returns 根归档数组
   ***/
  const getArchives = async (): Promise<Folder[]> => {
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
    return folderDocumentDb.remove(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：删除文档的全部归档关联
  /***
   * 文档被永久删除时调用：删除该文档在所有归档中的 folder_document 关联行
   * @param params.docId 必须，文档 id
   ***/
  const removeDocRelations = async (params: {
    docId: string;
  }): Promise<void> => {
    const db = getDb();
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
    const db = getDb();
    return folderDocumentDb.add(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：查询文档已加入的归档 id 集合
  /***
   * @param params.docId 必须，文档 id
   * @returns 归档 id 数组
   ***/
  const getFolderIdsByDoc = async (params: {
    docId: string;
  }): Promise<string[]> => {
    const db = getDb();
    return folderDocumentDb.getFolderIdsByDoc(db, params.docId);
  };
  //#endregion

  //#region CHECKED：对齐文档的归档关联
  /***
   * 将文档的归档关联对齐到传入集合（数据库最终恰好等于 folderIds，不多不少）：
   * - 已关联且在 folderIds 中：保持不变
   * - 未关联且在 folderIds 中：加入（各自追加到统一排序空间末尾）
   * - 已关联但不在 folderIds 中：移除
   * 先加后删，中途失败不会导致关联全部丢失
   * @param params.folderIds 必须，目标归档 id 集合（文档最终应关联的全部归档）
   * @param params.docId     必须，文档 id
   ***/
  const addDocToFolders = async (params: {
    folderIds: string[];
    docId: string;
  }): Promise<void> => {
    const db = getDb();
    const currentIds = await folderDocumentDb.getFolderIdsByDoc(
      db,
      params.docId,
    );
    const targetSet = new Set(params.folderIds);
    const currentSet = new Set(currentIds);
    const toAdd = params.folderIds.filter((id) => !currentSet.has(id));
    const toRemove = currentIds.filter((id) => !targetSet.has(id));
    if (toAdd.length > 0) {
      await folderDocumentDb.addMany(db, toAdd, params.docId);
    }
    if (toRemove.length > 0) {
      await folderDocumentDb.removeMany(db, toRemove, params.docId);
    }
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
    const db = getDb();
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
    const db = getDb();
    const descendantIds = await folderDb.getDescendantIds(db, params.folderId);
    const folderIds = await folderDocumentDb.getFolderIdsByDoc(
      db,
      params.docId,
    );
    const inSubtree = folderIds.filter(
      (id) => id === params.folderId || descendantIds.includes(id),
    );
    await folderDocumentDb.removeMany(db, inSubtree, params.docId);
  };
  //#endregion

  //#region CHECKED：获取归档下直接关联的文档
  /***
   * 仅返回直接关联该归档的文档（不含子文件夹内文档），按加入顺序 sort_order 升序
   * @param params.id 必须，归档 id
   ***/
  const getDocsByFolder = async (params: { id: string }): Promise<Doc[]> => {
    const db = getDb();
    return folderDocumentDb.getDocsByFolder(db, params.id);
  };
  //#endregion

  //#region CHECKED：获取归档下文档条目（目录）
  /***
   * 仅返回直接关联该归档的文档条目（不含子文件夹内文档，不含 content/plain_text），按加入顺序 sort_order 升序
   * @param params.id 必须，归档 id
   * @returns 文档条目数组（DocNav，用作目录列表）
   ***/
  const getArchiveDocEntries = async (params: {
    id: string;
  }): Promise<DocEntry[]> => {
    const db = getDb();
    return folderDocumentDb.getDocEntriesByFolder(db, params.id);
  };
  //#endregion

  //#region CHECKED：根据 id 查询归档名称
  /***
   * @param params.id 必须，归档 id
   * @returns 归档名称，不存在时返回空字符串
   ***/
  const getArchiveName = async (params: { id: string }): Promise<string> => {
    const db = getDb();
    const folder = await folderDb.getById(db, params.id);
    return folder?.name ?? "";
  };
  //#endregion

  //#region CHECKED：根据 id 查询归档
  /***
   * @param params.id 必须，归档 id
   ***/
  const getFolderById = async (params: {
    id: string;
  }): Promise<Folder | null> => {
    const db = getDb();
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
    const db = getDb();
    return folderDb.hasDocInSubtree(db, params.folderId, params.docId);
  };
  //#endregion

  //#region CHECKED：获取后代归档 id 集合
  /***
   * @param params.id 必须，归档 id
   * @returns 全部后代归档 id（不含自身）
   ***/
  const getDescendantIds = async (params: {
    id: string;
  }): Promise<string[]> => {
    const db = getDb();
    return folderDb.getDescendantIds(db, params.id);
  };
  //#endregion

  //#region CHECKED：查询归档子树内的全部子文件夹
  /***
   * @param params.id 必须，归档 id（不含根自身）
   ***/
  const getSubtreeFolders = async (params: {
    id: string;
  }): Promise<Folder[]> => {
    const db = getDb();
    return folderDb.getSubtreeFolders(db, params.id);
  };
  //#endregion

  //#region CHECKED：查询归档子树内的全部文档
  /***
   * @param params.id 必须，归档 id
   * @returns 文档数组，携带所属容器 container_id 与容器内排序 container_order
   ***/
  const getSubtreeDocs = async (params: { id: string }) => {
    const db = getDb();
    return folderDb.getSubtreeDocs(db, params.id);
  };
  //#endregion
  return {
    createFolder,
    deleteFolder,
    restoreFolder,
    purgeFolder,
    getTrashedFolders,
    purgeExpiredFolders,
    renameFolder,
    updateFolderViewedAt,
    update,
    getArchiveChildren,
    reorderChildren,
    reorderFolders,
    reorderDocs,
    getArchives,
    getSortedFolders,
    moveFolderInto,
    moveDocInto,
    removeDocFromFolder,
    removeDocRelations,
    addDocToFolder,
    getFolderIdsByDoc,
    addDocToFolders,
    removeDocFromFolders,
    removeDocFromSubtree,
    getDocsByFolder,
    getArchiveDocEntries,
    getArchiveName,
    getFolderById,
    hasDocInSubtree,
    getDescendantIds,
    getSubtreeFolders,
    getSubtreeDocs,
  };
};
