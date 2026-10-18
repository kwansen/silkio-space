import { useDocSvc } from "@/services/document";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { storeToRefs } from "pinia";

export const useDocSearchAction = () => {
  const svc = useDocSvc();
  const store = useDocSearchStore();
  const { setDocs, setPage, setQuery } = store;
  const { query, currentPage, totalPages } = storeToRefs(store);

  // 元函数：按关键词搜索文档
  const searchDocs = async (q: string) => {
    setQuery(q);
    const results = await svc.search(q);
    setDocs(results);
    setPage(1);
  };

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），保持当前页，无关键词时跳过
  const refresh = async () => {
    if (!query.value) return;
    const page = currentPage.value;
    await searchDocs(query.value);
    // 结果变少时回退到最后一页
    setPage(Math.max(1, Math.min(page, totalPages.value)));
  };

  const goToPage = (v: number) => {
    setPage(v);
  };

  const goPrev = async () => {
    if (currentPage.value > 1) await setPage(currentPage.value - 1);
  };

  const goNext = async () => {
    if (currentPage.value < totalPages.value)
      await setPage(currentPage.value + 1);
  };

  return { searchDocs, refresh, goToPage, goPrev, goNext };
};
