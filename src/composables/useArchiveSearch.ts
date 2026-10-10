import { useFdSvc } from "@/services/folder.ts";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { notifyEditorFolderChange } from "@/infrastructure/api/windowEvent.ts";
import { TitleInvertedIndex } from "@/utils/invertedIndex.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";

// useArchiveSearch.ts: 归档搜索组合式函数，提供仅基于标题（归档名称）的倒排索引搜索
// 元函数：获取归档服务单例（同步工厂）
const folderSvc = useFdSvc();
// 模块级单例：仅索引归档名称的倒排索引与归档快照（按 id 回查展示数据）
const index = new TitleInvertedIndex();
const folderMap = new Map<string, Folder>();

export const useArchiveSearch = () => {
  const archiveSearchStore = useArchiveSearchStore();

  // 元函数：按得分顺序将命中 id 转换为归档列表
  const toResults = (ids: string[]): Folder[] =>
    ids
      .map((id) => folderMap.get(id))
      .filter((f): f is Folder => f !== undefined);

  // 元函数：执行标题搜索，关键词为空时清空结果
  const searchFolders = (queryStr: string) => {
    archiveSearchStore.setQuery(queryStr);
    if (!queryStr.trim()) {
      archiveSearchStore.setArchives([]);
      return;
    }
    archiveSearchStore.setArchives(toResults(index.search(queryStr)));
  };

  // 元函数：加载全部归档并重建标题倒排索引；已有关键词时自动重搜
  const refreshFolders = async () => {
    const folders = await folderSvc.getSortedFolders({});
    folderMap.clear();
    index.clear();
    for (const f of folders) {
      folderMap.set(f.id, f);
      index.add(f.id, f.name);
    }
    if (archiveSearchStore.query.trim()) searchFolders(archiveSearchStore.query);
  };

  // 元函数：重命名归档并同步更新索引、快照与搜索结果（同步通知 editor 更新当前展示的归档名）
  const renameFolder = async (id: string, name: string) => {
    await folderSvc.renameFolder({ id, name });
    const folder = folderMap.get(id);
    if (folder) folderMap.set(id, { ...folder, name });
    index.add(id, name);
    if (archiveSearchStore.query.trim()) searchFolders(archiveSearchStore.query);
    await notifyEditorFolderChange(id);
  };

  // 元函数：删除归档并同步移除索引与搜索结果（同步通知 editor 清空已删除归档的展示）
  const removeFolder = async (id: string) => {
    await folderSvc.deleteFolder({ id });
    index.remove(id);
    folderMap.delete(id);
    archiveSearchStore.setArchives(
      archiveSearchStore.archives.filter((r) => r.id !== id),
    );
    await notifyEditorFolderChange(id);
  };

  return { searchFolders, refreshFolders, renameFolder, removeFolder };
};
