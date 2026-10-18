import { useDocSvc } from "@/services/document";
import { useDocSortStore } from "@/stores/docSortStore";
import { useUiStore } from "@/stores/uiStore";
import { SortField } from "@/types/doc";
import { storeToRefs } from "pinia";

const SORT_MAP: Record<DocSortOption, SortField> = {
  viewedAt: "viewed_at",
  updatedAt: "updated_at",
  createdAt: "created_at",
  wordCount: "word_count",
};

function toBackendSort(sort: DocSortOption): SortField {
  return SORT_MAP[sort];
}

export const useDocSortAction = () => {
  const uiStore = useUiStore();
  const { currentDocSort: sort } = storeToRefs(uiStore);
  const docSortStore = useDocSortStore();
  const { currentPage, totalPages } = storeToRefs(docSortStore);
  const { setDocs, setTotal, setPage } = docSortStore;
  const svc = useDocSvc();

  const getSortedDocs = async (option: DocSortOption, page: number) => {
    const sortField = toBackendSort(option);
    const result = await svc.getSortedInPage(sortField, page);
    setDocs(result.list);
    setTotal(result.total);
    setPage(page);
  };

  // 元函数：按当前排序重新拉取列表，默认当前页（供增删改后刷新）
  const refresh = (page: number = currentPage.value) =>
    getSortedDocs(sort.value, page);

  const goToPage = (page: number) => getSortedDocs(sort.value, page);

  const goPrev = async () => {
    if (currentPage.value > 1)
      await getSortedDocs(sort.value, currentPage.value - 1);
  };

  const goNext = async () => {
    if (currentPage.value < totalPages.value)
      await getSortedDocs(sort.value, currentPage.value + 1);
  };

  return {
    getSortedDocs,
    refresh,
    goToPage,
    goPrev,
    goNext,
  };
};
