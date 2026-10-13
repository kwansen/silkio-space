<script setup lang="ts">
import Minimize from "@/components/icons/Minimize.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref } from "vue";

const isHover = ref<boolean>(false);

const handleClick = async () => {
  try {
    await getCurrentWindow().minimize();
    unhover();
  } catch {
    console.error;
  }
};

const hover = () => {
  isHover.value = true;
};

const unhover = () => {
  isHover.value = false;
};
</script>

<template>
  <div
    class="h-full aspect-square grid place-items-center"
    :class="isHover ? 'bg-gray-100' : ''"
    @mouseenter="hover"
    @mouseleave="unhover"
    @click="handleClick"
  >
    <Minimize class="w-5 h-5" />
  </div>
</template>
