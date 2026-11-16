<script setup lang="ts">
import Maximize from "@/components/icons/Maximize.vue";
import UnMaximize from "@/components/icons/UnMaximize.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, ref } from "vue";

const win = getCurrentWindow();
const isMax = ref<boolean>(false);

const handleClick = async () => {
  try {
    await win.toggleMaximize();
  } catch {
    console.error;
  }
};

onMounted(async () => {
  isMax.value = await win.isMaximized();
  win.onResized(async () => {
    isMax.value = await win.isMaximized();
  });
});
</script>

<template>
  <div
    class="h-full aspect-square grid place-items-center hover:bg-gray-100"
    @click="handleClick"
  >
    <Maximize v-if="isMax" class="size-4" />
    <UnMaximize v-else class="size-4" />
  </div>
</template>
