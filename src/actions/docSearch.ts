import { useDocSvc } from "@/services/document";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { storeToRefs } from "pinia";

export const useDocSearchAction = () => {
  const svc = useDocSvc();
  const store = useDocSearchStore();
  const { setDocs, setPage } = store;
  const { currentPage, totalPages } = storeToRefs(store);

  // 元函数：按关键词搜索文档
  const searchDocs = async (query: string) => {
    const results = await svc.search(query);
    setDocs(results);
    setPage(1);
  };

  const goToPage = (v: number) => {
    setPage(v);
  };

  const goPrev = async () => {
    if (currentPage.value <= 1) return;
    else {
      const prev = currentPage.value - 1;
      setPage(prev);
    }
  };

  const goNext = async () => {
    if (currentPage.value >= totalPages.value) return;
    else {
      const next = currentPage.value + 1;
      setPage(next);
    }
  };

  return { searchDocs, goToPage, goPrev, goNext };
};
