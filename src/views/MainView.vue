<script setup lang="ts">
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

const store = useUiStore();
const { setDocTab } = store;
const { currentDocTab: tab } = storeToRefs(store);
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-10 h-full">
      <DocTabs />
    </div>
    <div class="flex-1 pr-2 pb-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="py-14 w-full max-w-176 mx-auto h-1000">
          <div class="p-10 bg-white rounded-lg">
            <DocSort v-if="tab === 'docSort'" />
            <DocSearch v-if="tab === 'docSearch'" />
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
