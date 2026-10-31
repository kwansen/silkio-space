import { useDocSvc } from "@/services/document";
import {
  notifyDataChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";

import { useDocSearchStore } from "@/stores/docSearchStore";
import { useUiStore } from "@/stores/uiStore";
import { useDocSortStore } from "@/stores/docSortStore";

export const useDocAction = () => {
  const svc = useDocSvc();
  const uiStore = useUiStore();
  const searchStore = useDocSearchStore();
  const sortStore = useDocSortStore();

  const openDoc = async (id: string) => {
    await notifyEditorOpen("doc", id);
    await svc.update(id, { viewed_at: Date.now() });
    notifyDataChanged();
  };

  // 创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      notifyDataChanged();
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    await svc.remove(id);
    notifyDataChanged();
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
    await sortStore.getSortedDocs(uiStore.docSort, page);
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
