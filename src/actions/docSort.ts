import { useDocSvc } from "@/services/document";
import { useDocSortStore } from "@/stores/docSortStore";
import { useUiStore } from "@/stores/uiStore";
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
    const sort = toBackendSort(option);
    const result = await svc.getSortedInPage(sort, page);
    setDocs(result.list);
    setTotal(result.total);
    setPage(page);
  };

  const goToPage = (page: number) => {
    getSortedDocs(sort.value, page);
  };

  const goPrev = async () => {
    if (currentPage.value <= 1) return;
    else {
      const prev = currentPage.value - 1;
      getSortedDocs(sort.value, prev);
    }
  };

  const goNext = async () => {
    if (currentPage.value >= totalPages.value) return;
    else {
      const next = currentPage.value + 1;
      getSortedDocs(sort.value, next);
    }
  };
  return {
    getSortedDocs,
    goToPage,
    goPrev,
    goNext,
  };
};
