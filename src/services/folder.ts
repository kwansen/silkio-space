import { getDb } from "@/infrastructure/db/index.ts";
import { useFolderDb, type FolderSortField, type Folder } from "@/infrastructure/db/folder.ts";
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

  // 元函数：创建归档（默认挂在根目录）并返回新 id
  const create = (name?: string): Promise<string> => folderDb.create(db, { name });

  // 元函数：按排序字段查询全部归档（数量少，不分页）：最近打开倒序，名称与自由排序升序
  const getSorted = (sortField: FolderSortField): Promise<Folder[]> =>
    folderDb.getSorted(db, sortField, sortField === "viewed_at" ? "DESC" : "ASC");

  // 元函数：根据 id 查询单个归档
  const getById = (id: string): Promise<Folder | null> => folderDb.getById(db, id);

  // 元函数：更新归档浏览时间（打开归档时调用）
  const touch = (id: string): Promise<void> => folderDb.touch(db, id);

  // 元函数：按传入 id 顺序批量持久化自由排序结果
  const reorder = (ids: string[]): Promise<void> => folderDb.reorder(db, ids);

  // 元函数：删除单个归档
  const remove = (id: string): Promise<void> => folderDb.remove(db, id);

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

  return { create, getSorted, getById, touch, reorder, remove, addDoc, removeDoc, getFolderIdsByDoc, getFirstDoc, getDocs };
};
