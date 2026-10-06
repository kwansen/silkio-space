import { getDb } from "@/infrastructure/db/index.ts";
import { useFolderDb, type FolderSortField, type Folder } from "@/infrastructure/db/folder.ts";

// 归档服务层：组装归档数据库元函数提供业务能力
export const useFolderSvc = async () => {
  // 元函数：获取数据库实例（getDb 内部已单例缓存）
  const db = await getDb();
  // 元函数：组装归档数据库元函数集合
  const folderDb = useFolderDb();

  // 元函数：创建归档（默认挂在根目录）并返回新 id
  const create = (name?: string): Promise<string> => folderDb.create(db, { name });

  // 元函数：按排序字段查询全部归档（数量少，不分页）：最近打开倒序，名称与自由排序升序
  const getSorted = (sortField: FolderSortField): Promise<Folder[]> =>
    folderDb.getSorted(db, sortField, sortField === "viewed_at" ? "DESC" : "ASC");

  // 元函数：更新归档浏览时间（打开归档时调用）
  const touch = (id: string): Promise<void> => folderDb.touch(db, id);

  // 元函数：按传入 id 顺序批量持久化自由排序结果
  const reorder = (ids: string[]): Promise<void> => folderDb.reorder(db, ids);

  // 元函数：删除单个归档
  const remove = (id: string): Promise<void> => folderDb.remove(db, id);

  return { create, getSorted, touch, reorder, remove };
};
