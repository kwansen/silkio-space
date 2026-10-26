<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  getCurrentWindow().hide();
});
</script>
<template></template>
