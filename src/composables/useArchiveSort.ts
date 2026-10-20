import { useFdSvc } from "@/services/folder.ts";
import { useArchiveStore } from "@/stores/archiveSort";
import { notifyEditorFolderChange } from "@/infrastructure/api/windowEvent.ts";
import type { FolderSortField } from "@/infrastructure/db/folder.ts";

// useArchiveSort.ts: 归档排序组合式函数，提供按排序方式刷新归档列表、创建归档等业务能力
// 元函数：获取归档服务单例（同步工厂）
const folderSvc = useFdSvc();

export const useArchiveSort = () => {
  const archiveSortStore = useArchiveStore();

  // 元函数：按排序方式刷新归档列表（全量，不分页）
  // 可选传入目标排序字段：数据返回后将排序与列表一次性更新，避免闪烁
  const refreshFolders = async (options?: { sortField?: FolderSortField }) => {
    const targetSortField = options?.sortField ?? archiveSortStore.sortField;
    const list = await folderSvc.getSortedFolders({
      sortField: targetSortField,
    });
    archiveSortStore.setSortField(targetSortField);
    archiveSortStore.setFolders(list);
  };

  // 元函数：创建归档（根文件夹）并刷新列表
  const createFolder = async (name: string) => {
    await folderSvc.createFolder({ name });
    await refreshFolders();
  };

  // 元函数：打开归档（更新浏览时间）并刷新列表
  const touchFolder = async (id: string) => {
    await folderSvc.updateFolderViewedAt({ id });
    await refreshFolders();
  };

  // 元函数：重命名归档并刷新 updated_at（同步通知 editor 更新当前展示的归档名）
  const renameFolder = async (id: string, name: string): Promise<void> => {
    await folderSvc.renameFolder({ id, name });
    await refreshFolders();
    await notifyEditorFolderChange(id);
  };

  // 元函数：将当前列表顺序持久化为 sort_order（0,1,2...）
  const reorderFolders = async () => {
    await folderSvc.reorderFolders({
      ids: archiveSortStore.folders.map((f) => f.id),
    });
  };

  // 元函数：删除归档并刷新列表（同步通知 editor 清空已删除归档的展示）
  const removeFolder = async (id: string) => {
    await folderSvc.deleteFolder({ id });
    await refreshFolders();
    await notifyEditorFolderChange(id);
  };

  // 元函数：将文档加入归档（幂等，重复加入自动忽略，同步通知 editor 刷新归档列表）
  const addDocToFolder = async (folderId: string, docId: string) => {
    await folderSvc.addDocToFolder({ folderId, docId });
    await notifyEditorFolderChange(folderId);
  };

  // 元函数：将文档移出归档（同步通知 editor 刷新归档列表）
  const removeDocFromFolder = async (folderId: string, docId: string) => {
    await folderSvc.removeDocFromFolder({ folderId, docId });
    await notifyEditorFolderChange(folderId);
  };

  // 元函数：查询文档已加入的归档 id 集合
  const getFolderIdsByDoc = (docId: string) =>
    folderSvc.getFolderIdsByDoc({ docId });

  return {
    refreshFolders,
    createFolder,
    touchFolder,
    renameFolder,
    reorderFolders,
    removeFolder,
    addDocToFolder,
    removeDocFromFolder,
    getFolderIdsByDoc,
  };
};
