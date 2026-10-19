<script setup lang="ts">
import RichText from "@/components/sections/RichText/RichText.vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted, ref } from "vue";
const id = ref("");
const key = ref("");
let stopOnOpen: (() => void) | null = null;

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    (event) => {
      const data = event.payload;
      if (data.type === "doc") {
        key.value = Date.now().toString();
        id.value = data.id;
      }
    },
  );
});

const ready = () => {
  getCurrentWindow().unminimize();
  getCurrentWindow().show();
  getCurrentWindow().setFocus();
};

onUnmounted(() => {
  stopOnOpen?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-65 h-full"></div>
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText v-if="id" :id="id" :key="key" @on-ready="ready" />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
