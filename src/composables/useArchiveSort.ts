import { useFolderSvc } from "@/services/folder.ts";
import { useArchiveSortStore } from "@/stores/archiveSort";
import type { FolderSortField } from "@/infrastructure/db/folder.ts";

// useArchiveSort.ts: 归档排序组合式函数，提供按排序方式刷新归档列表、创建归档等业务能力
// 元函数：获取归档服务单例（模块顶层允许 await）
const folderSvc = await useFolderSvc();

export const useArchiveSort = () => {
  const archiveSortStore = useArchiveSortStore();

  // 元函数：按排序方式刷新归档列表（全量，不分页）
  // 可选传入目标排序字段：数据返回后将排序与列表一次性更新，避免闪烁
  const refreshFolders = async (options?: { sortField?: FolderSortField }) => {
    const targetSortField = options?.sortField ?? archiveSortStore.sortField;
    const list = await folderSvc.getSorted(targetSortField);
    archiveSortStore.setSortField(targetSortField);
    archiveSortStore.setFolders(list);
  };

  // 元函数：创建归档并刷新列表
  const createFolder = async (name?: string) => {
    await folderSvc.create(name);
    await refreshFolders();
  };

  // 元函数：打开归档（更新浏览时间）并刷新列表
  const touchFolder = async (id: string) => {
    await folderSvc.touch(id);
    await refreshFolders();
  };

  // 元函数：将当前列表顺序持久化为 sort_order（0,1,2...）
  const reorderFolders = async () => {
    await folderSvc.reorder(archiveSortStore.folders.map((f) => f.id));
  };

  return { refreshFolders, createFolder, touchFolder, reorderFolders };
};
