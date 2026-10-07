import { defineStore } from "pinia";
import { ref } from "vue";
import type { Folder } from "@/infrastructure/db/folder.ts";

// 归档搜索 store：关键词与命中的归档列表（归档数量少，不分页）
export const useArchiveSearchStore = defineStore("archiveSearch", () => {
  // 搜索关键词
  const query = ref("");
  // 命中的归档列表（按索引得分降序）
  const results = ref<Folder[]>([]);

  // 元函数：设置搜索关键词
  const setQuery = (v: string) => {
    query.value = v;
  };

  // 元函数：设置搜索结果
  const setResults = (v: Folder[]) => {
    results.value = v;
  };

  return {
    query,
    results,
    setQuery,
    setResults,
  };
});
