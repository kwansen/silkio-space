import { useDocSvc } from "@/services/document";
import { emitTo } from "@tauri-apps/api/event";

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

  // 非 main 窗口（如 search）调用时需 notifyMain，由 main 监听 refresh 自行刷新
  const openDoc = async (id: string, opts?: { notifyMain?: boolean }) => {
    await emitTo("editor", "open", { type: "doc", id });
    await svc.update(id, { viewed_at: Date.now() });
    if (opts?.notifyMain) {
      await emitTo("main", "refresh");
    } else {
      await refreshAll();
    }
  };

  // 创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      await refreshAll();
      await emitTo("editor", "open", { type: "doc", id });
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    await svc.remove(id);
    await refreshAll();
  };

  // 元函数：按关键词搜索文档
  const searchDocs = async (q: string) => {
    searchStore.setQuery(q);
    const results = await svc.search(q);
    searchStore.setDocs(results);
    searchStore.setPage(1);
  };

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），保持当前页，无关键词时跳过
  const refreshSearched = async () => {
    if (!searchStore.query) return;
    const page = searchStore.currentPage;
    await searchDocs(searchStore.query);
    // 结果变少时回退到最后一页
    searchStore.setPage(Math.max(1, Math.min(page, searchStore.totalPages)));
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
  const refreshSorted = (page: number = sortStore.currentPage) =>
    getSortedDocs(uiStore.docSort, page);

  const goToSortedPage = (page: number) => getSortedDocs(uiStore.docSort, page);

  const goSortedPrev = async () => {
    if (sortStore.currentPage > 1) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage - 1);
      const index = sortStore.activeIndex;
      sortStore.setActiveIndex(index - 10 - (index % 10));
    }
  };

  const goSortedNext = async () => {
    if (sortStore.currentPage < sortStore.totalPages) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage + 1);
      const index = sortStore.activeIndex;
      sortStore.setActiveIndex(index + 10 - (index % 10));
    }
  };

  // 移动 activeIndex；跨页时派生页码变化，需重新拉取对应页数据（保留光标）
  const activateSortedPrev = async () => {
    const page = sortStore.currentPage;
    const i = sortStore.activeIndex;
    if (i > 0) {
      sortStore.setActiveIndex(i - 1);
      if (sortStore.currentPage !== page)
        await getSortedDocs(uiStore.docSort, sortStore.currentPage);
    }
  };

  const activateSortedNext = async () => {
    const prevPage = sortStore.currentPage;
    const count = sortStore.activeIndex + 1;
    if (count < sortStore.total) {
      sortStore.setActiveIndex(count);
      if (sortStore.currentPage !== prevPage)
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
  };
};
