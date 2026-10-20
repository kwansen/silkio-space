<script setup lang="ts">
import { useArchiveAction } from "@/actions/archiveAction";
import { useDocSortAction } from "@/actions/docSort";
import ArchiveSearch from "@/components/sections/ArchiveSearch/ArchiveSearch.vue";
import ArchiveSort from "@/components/sections/ArchiveSort/ArchiveSort.vue";
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import ArchivePickerDialog from "@/components/shared/ArchivePickerDialog.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { useUiStore } from "@/stores/uiStore";
import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted } from "vue";

const store = useUiStore();
const { currentDocTab: tab } = storeToRefs(store);
const docAction = useDocSortAction();
const archiveAction = useArchiveAction();

let stopOnUpdate: (() => void) | null = null;

onMounted(async () => {
  // 挂载时获取文档
  await docAction.refresh();
  // 挂载时获取归档
  await archiveAction.refresh();

  stopOnUpdate = await listen("refresh", async () => {
    console.log("更新了");
    // 挂载时获取文档
    await docAction.refresh();
    // 挂载时获取归档
    await archiveAction.refresh();
  });
});

onUnmounted(() => {
  stopOnUpdate?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-10 h-full">
      <DocTabs />
    </div>
    <div class="flex-1 pr-2 pb-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="py-14 w-full max-w-176 mx-auto">
          <div class="p-10 bg-white rounded-lg">
            <DocSort v-if="tab === 'docSort'" />
            <DocSearch v-if="tab === 'docSearch'" />
            <ArchiveSort v-if="tab === 'archiveSort'" />
            <ArchiveSearch v-if="tab === 'archiveSearch'" />
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
  <ArchivePickerDialog v-if="store.openId" :id="store.openId" />
</template>
