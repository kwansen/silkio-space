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

  // 元函数：自由排序拖拽结束后调整列表顺序（本地先行，随后由调用方持久化）
  const moveFolder = (oldIndex: number, newIndex: number) => {
    const [moved] = folders.value.splice(oldIndex, 1);
    folders.value.splice(newIndex, 0, moved);
  };

  return {
    folders,
    sortField,
    setFolders,
    setSortField,
    moveFolder,
  };
});
