<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import MainView from "./views/MainView.vue";
import EditorView from "./views/EditorView.vue";
import SearchView from "./views/SearchView.vue";
import InsertView from "./views/InsertView.vue";
import ToolView from "./views/ToolView.vue";
import WindowControl from "./components/sections/WindowControl/WindowControl.vue";
import ArchivePickerDialog from "@/components/dialogs/ArchivePickerDialog.vue";
import ArchiveRenameDialog from "@/components/dialogs/ArchiveRenameDialog.vue";
import { onMounted, onUnmounted } from "vue";
import DocPopover from "./components/popovers/DocPopover.vue";
import ArchivePopover from "./components/popovers/ArchivePopover.vue";
import DocAddPopover from "./components/popovers/DocAddPopover.vue";

const label = getCurrentWindow().label;

let stopOnClose: (() => void) | null = null;

// 元函数：挂载时阻止窗口关闭，改为隐藏（下次打开更快，无需重新创建窗口）
onMounted(async () => {
  try {
    stopOnClose = await getCurrentWindow().onCloseRequested(async (event) => {
      event.preventDefault();
      await getCurrentWindow().hide();
    });
  } catch (e) {
    console.error(e);
  }
});

// 元函数：卸载时取消关闭拦截
onUnmounted(() => {
  stopOnClose?.();
});
</script>

<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden bg-gray-200">
    <WindowControl v-if="label === 'main' || label === 'editor'" />
    <div class="flex-1 flex overflow-hidden">
      <MainView v-if="label === 'main'" />
      <EditorView v-else-if="label === 'editor'" />
      <SearchView v-else-if="label === 'search'" />
      <InsertView v-else-if="label === 'insert'" />
      <ToolView v-else-if="label === 'tool'" />
    </div>
    <!-- 全局归档选择弹窗：内部自持 archivePicker store，任意窗口通过 open 唤起 -->
    <ArchivePickerDialog />
    <!-- 全局归档重命名弹窗：内部自持 archiveRename store，任意窗口通过 open 唤起 -->
    <ArchiveRenameDialog />
    <!-- 全局列表浮动菜单：列表组件经各自 store 注册菜单项并唤起 -->
    <DocPopover />
    <ArchivePopover />
    <!-- 全局「新建文档」浮动菜单：DocSortOption 触发按钮经 docAddPopover store 唤起 -->
    <DocAddPopover />
  </div>
</template>
