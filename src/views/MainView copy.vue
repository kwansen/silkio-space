<script setup lang="ts">
import ArchiveSearch from "@/components/sections/ArchiveSearch/ArchiveSearch.vue";
import ArchiveSort from "@/components/sections/ArchiveSort/ArchiveSort.vue";
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import { useDocTabStore } from "@/stores/docTab";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useDocSearch } from "@/composables/useDocSearch.ts";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";
import { useDocSearchStore } from "@/stores/docSearch";
import { listen } from "@tauri-apps/api/event";
import { onMounted, onUnmounted } from "vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";

const docTabStore = useDocTabStore();
// 元函数：组装排序文档与搜索文档组合式函数
const { refreshDocs } = useSortDocs();
const { searchDocs } = useDocSearch();
const docSearchStore = useDocSearchStore();
// 元函数：组装归档搜索组合式函数
const { refreshFolders } = useArchiveSearch();

let stopOnRefresh: (() => void) | null = null;

// 元函数：挂载时获取当前页文档并监听刷新事件
onMounted(async () => {
  try {
    await refreshDocs();
    // 挂载时加载归档并重建标题倒排索引
    await refreshFolders();
    // editor 窗口的文档增删等变化只通过 refresh 事件通知：排序与搜索列表一并刷新
    stopOnRefresh = await listen("refresh", async () => {
      await refreshDocs();
      await searchDocs(docSearchStore.query);
    });
  } catch (e) {
    console.error(e);
  }
});

// 元函数：卸载时取消刷新事件监听
onUnmounted(() => {
  stopOnRefresh?.();
});
</script>

<template>
  <div class="w-full h-full flex rounded-2xl">
    <DocTabs />
    <div class="flex-1 overflow-hidden pr-2 pb-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="min-w-0 w-full max-w-200 py-14 mx-auto">
          <DocSort v-if="docTabStore.tab === 'docSort'" />
          <DocSearch v-else-if="docTabStore.tab === 'docSearch'" />
          <ArchiveSort v-else-if="docTabStore.tab === 'archiveSort'" />
          <ArchiveSearch v-else-if="docTabStore.tab === 'archiveSearch'" />
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
