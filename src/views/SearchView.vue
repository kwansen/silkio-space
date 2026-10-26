<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  getCurrentWindow().hide();
});
</script>
<template>
  <div class="p-1">
    <div class="h-20 bg-white p-4 rounded-2xl">
      <input
        type="text"
        class="w-full h-full px-4 outline-none border border-gray-200 focus:border-purple-300"
      />
    </div>
  </div>
</template>
