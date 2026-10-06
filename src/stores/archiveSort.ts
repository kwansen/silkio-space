import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { FolderWithCount, FolderSortField } from "@/infrastructure/db/folder.ts";
import { generatePages } from "@zhencai/generate-pages";

export const useArchiveSortStore = defineStore("archiveSort", () => {
  // 当前页归档列表
  const folders = ref<FolderWithCount[]>([]);
  // 归档总数（用于计算总页码）
  const total = ref<number>(0);
  // 排序字段
  const sortField = ref<FolderSortField>("updated_at");
  // 当前页码
  const currentPage = ref<number>(1);

  // 元函数：设置当前页归档列表
  const setFolders = (v: FolderWithCount[]) => {
    folders.value = v;
  };

  // 元函数：设置归档总数
  const setTotal = (v: number) => {
    total.value = v;
  };

  // 元函数：设置排序字段
  const setSortField = (v: FolderSortField) => {
    sortField.value = v;
  };

  // 元函数：设置当前页码
  const setCurrentPage = (v: number) => {
    currentPage.value = v;
  };

  const totalPages = computed(() => Math.ceil(total.value / 10));

  // 页码列表：由当前页码与总数派生，自动保持同步
  const pages = computed(() => generatePages(currentPage.value, totalPages.value));

  return {
    folders,
    total,
    totalPages,
    pages,
    sortField,
    currentPage,
    setFolders,
    setTotal,
    setSortField,
    setCurrentPage,
  };
});
