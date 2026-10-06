import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Doc, SortField } from "@/infrastructure/db/document.ts";
import { generatePages } from "@zhencai/generate-pages";

export const useSortDocStore = defineStore("sortDoc", () => {
  // 当前页文档列表
  const docs = ref<Doc[]>([]);
  // 文档总数（用于计算总页码）
  const total = ref<number>(0);
  // 排序字段
  const sortField = ref<SortField>("viewed_at");
  // 当前页码
  const currentPage = ref<number>(1);

  // 元函数：设置当前页文档列表
  const setDocs = (v: Doc[]) => {
    docs.value = v;
  };

  // 元函数：设置文档总数
  const setTotal = (v: number) => {
    total.value = v;
  };

  // 元函数：设置排序字段
  const setSortField = (v: SortField) => {
    sortField.value = v;
  };

  // 元函数：设置当前页码
  const setCurrentPage = (v: number) => {
    currentPage.value = v;
  };

  const totalPages = computed(()=>Math.ceil(total.value / 10))

  // 页码列表：由当前页码与总数派生，自动保持同步
  const pages = computed(() => generatePages(currentPage.value, totalPages.value));

  return {
    docs,
    total,
    totalPages,
    pages,
    sortField,
    currentPage,
    setDocs,
    setTotal,
    setSortField,
    setCurrentPage,
  };
});
