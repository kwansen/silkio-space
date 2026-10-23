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

  const openDoc = async (id: string) => {
    await emitTo("editor", "open", { type: "doc", id });
    await svc.update(id, { viewed_at: Date.now() });
    await refreshAll();
  };

  // 元函数：创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
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

  const getSortedDocs = async (option: DocSortOption, page: number) => {
    const sortField = toBackendSort(option);
    const result = await svc.getSortedInPage(sortField, page);
    console.log(result.list);
    sortStore.setDocs(result.list);
    sortStore.setTotal(result.total);
    sortStore.setPage(page);
  };

  // 元函数：按当前排序重新拉取列表，默认当前页（供增删改后刷新）
  const refreshSorted = (page: number = sortStore.currentPage) =>
    getSortedDocs(uiStore.currentDocSort, page);

  const goToSortedPage = (page: number) =>
    getSortedDocs(uiStore.currentDocSort, page);

  const goSortedPrev = async () => {
    if (sortStore.currentPage > 1)
      await getSortedDocs(uiStore.currentDocSort, sortStore.currentPage - 1);
  };

  const goSortedNext = async () => {
    if (sortStore.currentPage < sortStore.totalPages)
      await getSortedDocs(uiStore.currentDocSort, sortStore.currentPage + 1);
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
    getSortedDocs,
    refreshSorted,
    goToSortedPage,
    goSortedPrev,
    goSortedNext,
  };
};
