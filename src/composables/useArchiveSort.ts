import { useFolderSvc } from "@/services/folder.ts";
import { useArchiveSortStore } from "@/stores/archiveSort";
import type { FolderSortField } from "@/infrastructure/db/folder.ts";

// useArchiveSort.ts: 归档排序组合式函数，提供按排序方式刷新归档列表、创建归档等业务能力
// 元函数：获取归档服务单例（模块顶层允许 await）
const folderSvc = await useFolderSvc();

export const useArchiveSort = () => {
  const archiveSortStore = useArchiveSortStore();

  // 元函数：按排序方式刷新归档列表与总数
  // 可选传入目标页码/排序字段：数据返回后将排序、页码、列表、总数一次性更新，避免闪烁
  const refreshFolders = async (options?: {
    page?: number;
    sortField?: FolderSortField;
  }) => {
    const targetPage = options?.page ?? archiveSortStore.currentPage;
    const targetSortField = options?.sortField ?? archiveSortStore.sortField;
    const { list, total } = await folderSvc.getSortedInPage(
      targetSortField,
      targetPage,
    );
    archiveSortStore.setSortField(targetSortField);
    archiveSortStore.setCurrentPage(targetPage);
    archiveSortStore.setFolders(list);
    archiveSortStore.setTotal(total);
  };

  // 元函数：创建归档并刷新列表
  const createFolder = async (name?: string) => {
    await folderSvc.create(name);
    await refreshFolders();
  };

  return { refreshFolders, createFolder };
};
