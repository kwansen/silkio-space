import { useSearchApi } from "@/infrastructure/api/search.ts";
import { useDocSvc } from "@/services/document.ts";
import { useDocSearchStore, type SearchItem } from "@/stores/docSearch";

// useDocSearch.ts: 文档搜索组合式函数，提供关键词搜索与结果分页等业务能力
// 元函数：组装搜索索引元函数集合
const searchApi = useSearchApi();
// 元函数：获取文档服务单例（模块顶层允许 await，内部已同步维护搜索索引）
const docSvc = await useDocSvc();

export const useDocSearch = () => {
  const docSearchStore = useDocSearchStore();

  // 元函数：执行关键词搜索，回查数据库补充标题/内容/文档类型，结果与页码一次性更新
  // 搜索索引仅返回 id/标题/得分，内容需按 id 回查文档获得
  const searchDocs = async (queryStr: string) => {
    docSearchStore.setQuery(queryStr);
    // 关键词为空时直接清空结果，不发起搜索
    if (!queryStr.trim()) {
      docSearchStore.setResults([]);
      docSearchStore.setCurrentPage(1);
      return;
    }
    const results = await searchApi.search(queryStr);
    // 元函数：按 id 回查文档，补充类型、标题与纯文本内容
    const docs = await Promise.all(results.map((r) => docSvc.getById(r.id)));
    const items: SearchItem[] = results.map((r, i) => ({
      id: r.id,
      title: docs[i]?.title ?? r.title,
      content: docs[i]?.plain_text ?? "",
      score: r.score,
      docType: docs[i]?.doc_type,
    }));
    docSearchStore.setResults(items);
    docSearchStore.setCurrentPage(1);
  };

  // 元函数：跳转到指定页码（结果已在内存中，仅移动页码）
  const goToPage = (page: number) => {
    if (page <= 0 || page > docSearchStore.totalPages) return;
    if (page === docSearchStore.currentPage) return;
    docSearchStore.setCurrentPage(page);
  };

  return { searchDocs, goToPage };
};
