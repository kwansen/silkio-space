import { getDb } from "@/infrastructure/db/index.ts";
import {
  useFolderDb,
  type CreateFolderParams,
  type FolderSortField,
  type Folder,
} from "@/infrastructure/db/folder.ts";
import { useFolderDocumentDb } from "@/infrastructure/db/folderDocument.ts";
import type { Doc } from "@/infrastructure/db/document.ts";

// 归档服务层：组装归档数据库元函数提供业务能力
export const useFolderSvc = async () => {
  // 元函数：获取数据库实例（getDb 内部已单例缓存）
  const db = await getDb();
  // 元函数：组装归档数据库元函数集合
  const folderDb = useFolderDb();
  // 元函数：组装归档-文档关联数据库元函数集合
  const folderDocumentDb = useFolderDocumentDb();

  // 元函数：创建归档并返回新 id
  // 仅根文件夹（parent_id 为空）可作为归档展示于主窗口；
  // parent_id 非空时为导航内子文件夹（挂在目标容器下末尾）
  const create = (params: CreateFolderParams = {}): Promise<string> =>
    folderDb.create(db, params);

  // 元函数：按排序字段查询全部归档（数量少，不分页）：最近打开倒序，名称与自由排序升序
  const getSorted = (sortField: FolderSortField): Promise<Folder[]> =>
    folderDb.getSorted(db, sortField, sortField === "viewed_at" ? "DESC" : "ASC");

  // 元函数：根据 id 查询单个归档
  const getById = (id: string): Promise<Folder | null> => folderDb.getById(db, id);

  // 元函数：更新归档浏览时间（打开归档时调用）
  const touch = (id: string): Promise<void> => folderDb.touch(db, id);

  // 元函数：重命名归档并刷新 updated_at
  const rename = (id: string, name: string): Promise<void> =>
    folderDb.rename(db, id, name);

  // 元函数：按传入 id 顺序批量持久化自由排序结果
  const reorder = (ids: string[]): Promise<void> => folderDb.reorder(db, ids);

  // 元函数：删除单个归档（级联删除其全部子文件夹及关联的 folder_document 行，文档本体保留）
  const remove = (id: string): Promise<void> => folderDb.remove(db, id);

  // 元函数：查询归档的直接子文件夹（按 sort_order 升序）
  const getChildren = (parentId: string): Promise<Folder[]> =>
    folderDb.getChildren(db, parentId);

  // 元函数：查询归档的全部后代 id（不含自身），用于拖拽环检测
  const getDescendantIds = (id: string): Promise<string[]> =>
    folderDb.getDescendantIds(db, id);

  // 元函数：移动归档到目标父级（null 表示挂到根目录）
  const setParent = (id: string, parentId: string | null): Promise<void> =>
    folderDb.setParent(db, id, parentId);

  // 元函数：查询归档子树内是否包含指定文档
  const hasDocInSubtree = (folderId: string, docId: string): Promise<boolean> =>
    folderDb.hasDocInSubtree(db, folderId, docId);

  // 元函数：查询归档子树内第一篇文档（优先根容器第一篇，其次后代层级）
  const getFirstDocInSubtree = (folderId: string): Promise<Doc | null> =>
    folderDb.getFirstDocInSubtree(db, folderId);

  // 元函数：将文档从归档子树的所有容器中移除（导航内删除文档时使用）
  const removeDocFromSubtree = async (
    folderId: string,
    docId: string,
  ): Promise<void> => {
    const ids = await folderDb.getSubtreeIds(db, folderId);
    for (const fid of ids) await folderDocumentDb.remove(db, fid, docId);
  };

  // 元函数：将文档加入归档（幂等，重复加入自动忽略）
  const addDoc = (folderId: string, docId: string): Promise<void> =>
    folderDocumentDb.add(db, folderId, docId);

  // 元函数：将文档移出归档
  const removeDoc = (folderId: string, docId: string): Promise<void> =>
    folderDocumentDb.remove(db, folderId, docId);

  // 元函数：查询文档已加入的归档 id 集合
  const getFolderIdsByDoc = (docId: string): Promise<string[]> =>
    folderDocumentDb.getFolderIdsByDoc(db, docId);

  // 元函数：查询归档下第一个文档（按加入顺序 sort_order 升序，无文档返回 null）
  const getFirstDoc = (folderId: string): Promise<Doc | null> =>
    folderDocumentDb.getFirstDoc(db, folderId);

  // 元函数：查询归档下全部文档（按加入顺序 sort_order 升序）
  const getDocs = (folderId: string): Promise<Doc[]> =>
    folderDocumentDb.getDocsByFolder(db, folderId);

  // 元函数：按传入文档 id 顺序批量持久化归档内文档的手动排序结果
  const reorderDocs = (folderId: string, documentIds: string[]): Promise<void> =>
    folderDocumentDb.reorder(db, folderId, documentIds);

  return { create, getSorted, getById, touch, rename, reorder, remove, getChildren, getDescendantIds, setParent, hasDocInSubtree, getFirstDocInSubtree, removeDocFromSubtree, addDoc, removeDoc, getFolderIdsByDoc, getFirstDoc, getDocs, reorderDocs };
};
