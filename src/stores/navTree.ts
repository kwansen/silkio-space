import { defineStore } from "pinia";
import { ref } from "vue";
import type { Doc } from "@/infrastructure/db/document.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";

// 导航树状态：选中文件夹、展开集合与版本号（供 LeftBar 导航树组件与 NavHeader 共享）
export const useNavTreeStore = defineStore("navTree", () => {
  // 当前选中的文件夹 id（null 表示未选中，新建目标是归档根目录）
  const selectedFolderId = ref<string | null>(null);

  // 展开的文件夹 id 集合（存于 store，树刷新后不丢失）
  const expandedIds = ref(new Set<string>());

  // 版本号：本地操作（新建/移动/删除）后自增，触发各级树容器重载
  const version = ref(0);

  // 弹窗目标：由各级树行设置（重命名经 archiveRename store 唤起），弹窗实例由 App.vue 挂载
  const removeFolderTarget = ref<Folder | null>(null);
  const removeDocTarget = ref<Doc | null>(null);

  const setSelectedFolder = (id: string | null) => {
    selectedFolderId.value = id;
  };

  // 元函数：切换展开/收起
  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedIds.value = next;
  };

  const expand = (id: string) => {
    if (expandedIds.value.has(id)) return;
    const next = new Set(expandedIds.value);
    next.add(id);
    expandedIds.value = next;
  };

  const bump = () => {
    version.value += 1;
  };

  // 元函数：归档切换时重置选中与展开状态
  const reset = () => {
    selectedFolderId.value = null;
    expandedIds.value = new Set<string>();
    removeFolderTarget.value = null;
    removeDocTarget.value = null;
    version.value += 1;
  };

  return {
    selectedFolderId,
    expandedIds,
    version,
    removeFolderTarget,
    removeDocTarget,
    setSelectedFolder,
    toggleExpanded,
    expand,
    bump,
    reset,
  };
});
