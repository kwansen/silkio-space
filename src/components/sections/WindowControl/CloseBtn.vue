<script setup lang="ts">
import Close from "@/components/icons/Close.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref } from "vue";

const isHover = ref<boolean>(false);

const handleClick = async () => {
  try {
    await getCurrentWindow().hide();
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
    :class="isHover ? 'bg-red-500 text-white' : ''"
    @mouseenter="hover"
    @mouseleave="unhover"
    @click="handleClick"
  >
    <Close class="size-5" />
  </div>
</template>
