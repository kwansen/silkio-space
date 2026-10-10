import { defineStore } from "pinia";
import { ref } from "vue";
import type { Folder } from "@/infrastructure/db/folder.ts";

// 归档重命名弹窗状态：folder 非空表示弹窗打开（弹窗实例由 App.vue 全局挂载，各处通过 open 唤起）
export const useArchiveRenameStore = defineStore("archiveRename", () => {
  // 待编辑归档：null 表示弹窗关闭
  const folder = ref<Folder | null>(null);

  const open = (f: Folder) => {
    folder.value = f;
  };

  const close = () => {
    folder.value = null;
  };

  return { folder, open, close };
});
