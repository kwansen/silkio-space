<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import { useNavTreeStore } from "@/stores/navTree";
import { useFdSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

// 文件夹删除弹窗：状态自持（读取全局 navTree store，不经由父级传参），实例由 App.vue 挂载
const navTreeStore = useNavTreeStore();

// 元函数：关闭弹窗
const close = () => {
  navTreeStore.removeFolderTarget = null;
};

// 元函数：确认删除：级联删除该文件夹及其全部子文件夹的关联（文档本体保留）
const handleConfirm = async () => {
  const folder = navTreeStore.removeFolderTarget;
  if (!folder) return;
  try {
    const folderSvc = useFdSvc();
    await folderSvc.deleteFolder({ id: folder.id });
    if (navTreeStore.selectedFolderId === folder.id) {
      navTreeStore.setSelectedFolder(null);
    }
    navTreeStore.bump();
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
  close();
};

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && navTreeStore.removeFolderTarget) close();
});
</script>

<template>
  <!-- 文件夹删除确认弹窗：级联删除文件夹及其子文件夹，文档本体保留 -->
  <div
    v-if="navTreeStore.removeFolderTarget"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="close"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">删除文件夹</div>
      <div class="text-xs text-neutral-500 mb-3">
        将删除「{{ navTreeStore.removeFolderTarget.name }}」及其全部子文件夹，其中的文档不会被删除
      </div>
      <div class="flex justify-end gap-2">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="close"
        >
          取消
        </TextButton>
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
          @click="handleConfirm"
        >
          删除
        </TextButton>
      </div>
    </div>
  </div>
</template>
