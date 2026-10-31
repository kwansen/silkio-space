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

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），光标尽量停在原位，结果变少时收敛到末项
  const refreshSearched = async () => {
    if (!searchStore.query) return;
    const index = searchStore.activeIndex;
    await searchDocs(searchStore.query);
    searchStore.setActiveIndex(
      Math.max(0, Math.min(index, searchStore.searchedDocs.length - 1)),
    );
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
    const page = sortStore.currentPage;
    // 已在页首且非第一页：先拉上一页数据，prevDoc 内部会回退页码并激活末条
    if (sortStore.activeIndex <= 0 && page > 1) {
      await getSortedDocs(uiStore.docSort, page - 1);
    }
    sortStore.prevDoc();
  };

  const activateSortedNext = async () => {
    const page = sortStore.currentPage;
    sortStore.nextDoc();
    // nextDoc 跨页时已前进页码：重拉新页数据并激活首条
    if (sortStore.currentPage !== page) {
      await getSortedDocs(uiStore.docSort, sortStore.currentPage);
      sortStore.activateFirst();
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  return {
    openDoc,
    createRichtext,
    remove,
    refreshSearched,
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
