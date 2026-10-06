import { getDb } from "@/infrastructure/db/index.ts";
import { useFolderDb, type FolderSortField, type SortedFolderPage } from "@/infrastructure/db/folder.ts";

// 每页归档数量
const PAGE_SIZE = 10;

// 归档服务层：组装归档数据库元函数提供业务能力
export const useFolderSvc = async () => {
  // 元函数：获取数据库实例（getDb 内部已单例缓存）
  const db = await getDb();
  // 元函数：组装归档数据库元函数集合
  const folderDb = useFolderDb();

  // 元函数：创建归档（默认挂在根目录）并返回新 id
  const create = (name?: string): Promise<string> => folderDb.create(db, { name });

  // 元函数：按排序字段与分页参数查询归档分页（页码从 1 开始），并返回总数用于计算页码
  const getSortedInPage = (
    sortField: FolderSortField,
    page: number,
  ): Promise<SortedFolderPage> =>
    folderDb.getSorted(db, sortField, "DESC", PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return { create, getSortedInPage };
};
