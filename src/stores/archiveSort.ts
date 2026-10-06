import { defineStore } from "pinia";
import { ref } from "vue";
import type { Folder, FolderSortField } from "@/infrastructure/db/folder.ts";

export const useArchiveSortStore = defineStore("archiveSort", () => {
  // 全量归档列表（数量少，不分页）
  const folders = ref<Folder[]>([]);
  // 排序字段（默认自由排序）
  const sortField = ref<FolderSortField>("sort_order");

  // 元函数：设置归档列表
  const setFolders = (v: Folder[]) => {
    folders.value = v;
  };

  // 元函数：设置排序字段
  const setSortField = (v: FolderSortField) => {
    sortField.value = v;
  };

  return {
    folders,
    sortField,
    setFolders,
    setSortField,
  };
});
