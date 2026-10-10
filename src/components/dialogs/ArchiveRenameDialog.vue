<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import { useArchiveRenameStore } from "@/stores/archiveRename";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";

// 元函数：弹窗状态自持（读取全局 archiveRename store，不经由父级传参）
const archiveRenameStore = useArchiveRenameStore();
// 元函数：组装归档搜索与排序组合式函数（重命名后同步索引与列表）
const { renameFolder } = useArchiveSearch();
const { refreshFolders } = useArchiveSort();

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const name = ref("");

// 元函数：弹窗打开时回填名称并全选聚焦
watch(
  () => archiveRenameStore.folder,
  async (folder) => {
    if (!folder) return;
    name.value = folder.name;
    await nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  },
);

// 元函数：确认编辑（名称为空或未变化则直接关闭），否则执行重命名（db 更新 + 搜索索引同步 + 归档列表刷新）后关闭弹窗
const handleConfirm = async () => {
  const folder = archiveRenameStore.folder;
  const v = name.value.trim();
  if (!folder || !v || v === folder.name) {
    archiveRenameStore.close();
    return;
  }
  try {
    await renameFolder(folder.id, v);
    await refreshFolders();
  } catch (e) {
    console.error(e);
  }
  archiveRenameStore.close();
};

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && archiveRenameStore.folder)
    archiveRenameStore.close();
});
</script>

<template>
  <!-- 独立归档重命名弹窗：遮罩点击关闭 -->
  <div
    v-if="archiveRenameStore.folder"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="archiveRenameStore.close()"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">编辑归档名称</div>
      <input
        ref="inputRef"
        v-model="name"
        type="text"
        placeholder="归档名称"
        class="w-full h-8 text-sm px-2 rounded-md border border-purple-300 outline-none focus:border-purple-500 mb-3"
        @keydown.enter="handleConfirm"
      />
      <div class="flex justify-end gap-2">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="archiveRenameStore.close()"
        >
          取消
        </TextButton>
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
          @click="handleConfirm"
        >
          确定
        </TextButton>
      </div>
    </div>
  </div>
</template>
