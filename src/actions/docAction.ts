import { useDocSvc } from "@/services/document";
import {
  notifyDataChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";

import { useDocSearchStore } from "@/stores/docSearchStore";
import { useUiStore } from "@/stores/uiStore";
import { useDocSortStore } from "@/stores/docSortStore";
import { SortField } from "@/types/doc";

const SORT_MAP: Record<DocSortOption, SortField> = {
  viewedAt: "viewed_at",
  updatedAt: "updated_at",
  createdAt: "created_at",
  wordCount: "word_count",
};

function toBackendSort(sort: DocSortOption): SortField {
  return SORT_MAP[sort];
}

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

  // 元函数：按关键词搜索文档
  const searchDocs = async (q: string) => {
    searchStore.setQuery(q);
    const results = await svc.search(q);
    searchStore.setDocs(results);
    searchStore.setPage(1);
  };

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），光标尽量停在原位，结果变少时收敛到末项
  const refreshSearched = async () => {
    if (!searchStore.query) return;
    const index = searchStore.activeIndex;
    await searchDocs(searchStore.query);
    searchStore.setActiveIndex(
      Math.max(0, Math.min(index, searchStore.searchedDocs.length - 1)),
    );
  };

  const goToSearchedPage = (v: number) => {
    searchStore.setPage(v);
  };

  const goSearchedPrev = async () => {
    if (searchStore.currentPage > 1) {
      searchStore.setPage(searchStore.currentPage - 1);
    }
  };

  const goSearchedNext = async () => {
    if (searchStore.currentPage < searchStore.totalPages) {
      searchStore.setPage(searchStore.currentPage + 1);
    }
  };

  const activateSearchedPrev = () => {
    const i = searchStore.activeIndex;
    if (i > 0) {
      searchStore.setActiveIndex(i - 1);
    }
  };

  const activateSearchedNext = () => {
    const count = searchStore.activeIndex + 1;
    if (count < searchStore.searchedDocs.length) {
      searchStore.setActiveIndex(count);
    }
  };

  const getSortedDocs = async (option: DocSortOption, page: number) => {
    const sortField = toBackendSort(option);
    const result = await svc.getSortedInPage(sortField, page);
    sortStore.setDocs(result.list);
    sortStore.setTotal(result.total);
  };

  // 元函数：按当前排序重新拉取列表，默认当前页（供增删改后刷新）
  const refreshSorted = async (page: number = sortStore.currentPage) => {
    await getSortedDocs(uiStore.docSort, page);
    sortStore.activateFirst();
  };

  const goToSortedPage = (page: number) => getSortedDocs(uiStore.docSort, page);

  const goSortedPrev = async () => {
    if (sortStore.currentPage > 1) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage - 1);
      sortStore.prevPage();
    }
  };

  const goSortedNext = async () => {
    if (sortStore.currentPage < sortStore.totalPages) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage + 1);
      sortStore.nextPage();
    }
  };

  // 移动 activeIndex；跨页时派生页码变化，需重新拉取对应页数据（保留光标）
  const activateSortedPrev = async () => {
    console.log("上一个");
    const page = sortStore.currentPage;
    sortStore.prevDoc();
    if (sortStore.currentPage !== page) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage);
    }
  };

  const activateSortedNext = async () => {
    console.log("下一个");
    const page = sortStore.currentPage;
    sortStore.nextDoc();
    if (sortStore.currentPage !== page) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  return {
    openDoc,
    createRichtext,
    remove,
    searchDocs,
    refreshSearched,
    goToSearchedPage,
    goSearchedPrev,
    goSearchedNext,
    activateSearchedPrev,
    activateSearchedNext,
    getSortedDocs,
    refreshSorted,
    goToSortedPage,
    goSortedPrev,
    goSortedNext,
    activateSortedPrev,
    activateSortedNext,
    refreshAll,
  };
};
