<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import WindowControl from "./components/sections/WindowControl/WindowControl.vue";
import SettingDialog from "./components/sections/SettingDialog/SettingDialog.vue";
import { onMounted, onUnmounted } from "vue";
import { useUiStore } from "@/stores/uiStore";
import MainView from "./views/MainView.vue";
import EditorView from "./views/EditorView.vue";
import SearchView from "./views/SearchView.vue";
import ToolView from "./views/ToolView.vue";

const label = getCurrentWindow().label;
const uiStore = useUiStore();

let stopOnClose: (() => void) | null = null;

// 窗口尺寸变化同步进 uiStore，驱动侧栏自适应隐藏（leftbarFits/rightbarFits）
const onWindowResize = () => uiStore.setWindowWidth(window.innerWidth);

onMounted(async () => {
  onWindowResize();
  window.addEventListener("resize", onWindowResize);
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

// 元函数：卸载时取消关闭拦截与尺寸监听
onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  stopOnClose?.();
});
</script>

<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden">
    <WindowControl
      v-if="label === 'main' || label === 'editor'"
      :label="label"
    />
    <div class="flex-1 min-h-0">
      <MainView v-if="label === 'main'" />
      <EditorView v-else-if="label === 'editor'" />
      <SearchView v-else-if="label === 'search'" />
      <ToolView v-else-if="label === 'tool'" />
    </div>
    <!-- 设置对话框：仅 main 窗口提供（editor 的 AI 面板不再有设置入口） -->
    <SettingDialog
      v-if="uiStore.showSettingDialog && label === 'main'"
    />
  </div>
</template>
