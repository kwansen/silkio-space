<script setup lang="ts">
import ArchiveSearch from "@/components/sections/ArchiveSearch/ArchiveSearch.vue";
import ArchiveSort from "@/components/sections/ArchiveSort/ArchiveSort.vue";
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import { useDocTabStore } from "@/stores/docTab";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted } from "vue";

const docTabStore = useDocTabStore();
// 元函数：组装排序文档组合式函数
const { refreshDocs } = useSortDocs();

let stopOnRefresh: (() => void) | null = null;
let stopOnClose: (() => void) | null = null;

// 元函数：挂载时获取当前页文档并监听刷新事件
onMounted(async () => {
  try {
    // 元函数：阻止窗口关闭，改为隐藏（下次打开更快，无需重新创建窗口）
    stopOnClose = await getCurrentWindow().onCloseRequested(async (event) => {
      event.preventDefault();
      await getCurrentWindow().hide();
    });

    await refreshDocs();
    stopOnRefresh = await listen("refresh", () => refreshDocs());
  } catch (e) {
    console.error(e);
  }
});

// 元函数：卸载时取消刷新事件监听
onUnmounted(() => {
  stopOnRefresh?.();
  stopOnClose?.();
});
</script>

<template>
  <div class="w-full h-full flex rounded-2xl">
    <DocTabs />
    <div class="flex-1 overflow-hidden pr-2 pb-2 ">
      <div class="w-full h-full bg-gray-50 rounded-lg flex justify-center overflow-y-auto">
        <div class="min-w-0 w-full max-w-200">
          <DocSort v-if="docTabStore.tab === 'docSort'" />
          <DocSearch v-else-if="docTabStore.tab === 'docSearch'" />
          <ArchiveSort v-else-if="docTabStore.tab === 'archiveSort'" />
          <ArchiveSearch v-else-if="docTabStore.tab === 'archiveSearch'" />
        </div>
      </div>
    </div>
  </div>
</template>
