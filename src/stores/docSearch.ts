import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SearchResult } from "@/infrastructure/api/search.ts";
import { generatePages } from "@zhencai/generate-pages";

// 每页结果数量
const PAGE_SIZE = 10;

// 搜索结果列表项：在 SearchResult 基础上补充文档类型用于图标展示
export interface SearchItem extends SearchResult {
  docType?: string;
}

export const useDocSearchStore = defineStore("docSearch", () => {
  // 搜索关键词
  const query = ref("");
  // 命中的搜索结果
  const results = ref<SearchItem[]>([]);
  // 当前页码
  const currentPage = ref<number>(1);

  // 元函数：设置搜索关键词
  const setQuery = (v: string) => {
    query.value = v;
  };

  // 元函数：设置搜索结果
  const setResults = (v: SearchItem[]) => {
    results.value = v;
  };

  // 元函数：设置当前页码
  const setCurrentPage = (v: number) => {
    currentPage.value = v;
  };

  // 总页数：由结果数量派生
  const totalPages = computed(() => Math.ceil(results.value.length / PAGE_SIZE));

  // 页码列表：由当前页码与总页数派生，自动保持同步
  const pages = computed(() => generatePages(currentPage.value, totalPages.value));

  // 当前页结果：由结果与页码派生（搜索结果一次性返回，客户端分页）
  const pageResults = computed(() =>
    results.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE),
  );

  return {
    query,
    results,
    currentPage,
    totalPages,
    pages,
    pageResults,
    setQuery,
    setResults,
    setCurrentPage,
  };
});
