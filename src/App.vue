<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import WindowControl from "./components/sections/WindowControl/WindowControl.vue";
import { onMounted, onUnmounted } from "vue";
import MainView from "./views/MainView.vue";
import EditorView from "./views/EditorView.vue";

const label = getCurrentWindow().label;

let stopOnClose: (() => void) | null = null;

onMounted(async () => {
  try {
    // 挂载时阻止窗口关闭，改为隐藏
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
  <div
    class="w-screen h-screen flex flex-col overflow-hidden bg-gray-200 scrollbar-thumb-red-400"
  >
    <WindowControl
      v-if="label === 'main' || label === 'editor'"
      :label="label"
    />
    <div class="flex-1 min-h-0 scrollbar-thumb-red-400">
      <MainView v-if="label === 'main'" />
      <EditorView v-else-if="label === 'editor'" />
      <!-- <SearchView v-else-if="label === 'search'" />
      <InsertView v-else-if="label === 'insert'" />
      <ToolView v-else-if="label === 'tool'" /> -->
    </div>

    <!-- <ArchivePickerDialog />
    <ArchiveRenameDialog />
    <DocRemoveDialog />
    <FolderRemoveDialog />
    <DocPopover />
    <ArchivePopover />
    <DocAddPopover />
    <NavAddPopover /> -->
  </div>
</template>
