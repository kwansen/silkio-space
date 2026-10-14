<script setup lang="ts">
import RichText from "@/components/sections/RichText/RichText.vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted, ref } from "vue";
const data = ref();
let stopOnOpen: (() => void) | null = null;

onMounted(async () => {
  stopOnOpen = await listen("open", (event) => {
    data.value = event.payload;
    getCurrentWindow().unminimize();
    getCurrentWindow().show();
    getCurrentWindow().setFocus();
  });
});

onUnmounted(() => {
  stopOnOpen?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-65 h-full"></div>
    <div class="flex-1 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
