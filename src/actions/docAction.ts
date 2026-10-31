import { useDocSvc } from "@/services/document";
import {
  notifyArchiveChanged,
  notifyDocChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";

import { useDocSearchStore } from "@/stores/docSearchStore";
import { useDocSortStore } from "@/stores/docSortStore";

export const useDocAction = () => {
  const svc = useDocSvc();
  const searchStore = useDocSearchStore();
  const sortStore = useDocSortStore();

  const openDoc = async (id: string) => {
    await notifyEditorOpen("doc", id);
    await svc.update(id, { viewed_at: Date.now() });
    notifyDocChanged();
  };

  // 创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      notifyDocChanged();
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  // 删除文档动了两个域：本体删除广播 doc:changed，级联清理归档关联广播 archive:changed
  const remove = async (id: string) => {
    await svc.remove(id);
    notifyDocChanged();
    notifyArchiveChanged();
    await refreshAll();
  };

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），光标尽量停在原位，结果变少时收敛到末项
  const refreshSearched = async () => {
    if (!searchStore.query) return;
    const index = searchStore.activeIndex;
    await searchStore.searchDocs(searchStore.query);
    searchStore.setActiveIndex(
      Math.max(0, Math.min(index, searchStore.searchedDocs.length - 1)),
    );
  };

  // 元函数：按当前排序重新拉取列表，默认当前页（供增删改后刷新），只同步数据与光标、不挪页码
  const refreshSorted = async (page: number = sortStore.currentPage) => {
    await sortStore.getSortedDocs(sortStore.docSort, page);
    sortStore.activateFirst();
  };

  const refreshAll = async () => {
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  return {
    openDoc,
    createRichtext,
    remove,
    refreshSearched,
    refreshSorted,
    refreshAll,
  };
};
