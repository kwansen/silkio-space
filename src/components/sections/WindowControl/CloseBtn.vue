<script setup lang="ts">
import Close from "@/components/icons/Close.vue";
import PixelAlign from "@/components/shared/PixelAlign.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ref } from "vue";

const isHover = ref<boolean>(false);

const handleClick = async () => {
  try {
    // 走 close 请求而非直接 hide：由 App.vue 统一处理（editor 需先合成
    // 中性帧再隐藏，避免下次打开闪现旧内容）
    await getCurrentWindow().close();
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
    <PixelAlign><Close /></PixelAlign>
  </div>
</template>
