<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore.ts";
import DocEntries from "./DocEntries.vue";
import Toc from "./Toc.vue";
const uiStore = useUiStore();
</script>

<template>
  <!-- 卡片容器：与编辑区白卡一致，内部自行滚动 -->
  <div class="w-65 h-full select-none bg-white rounded-lg overflow-hidden flex flex-col">
    <DocEntries v-if="uiStore.leftbarOption === 'docEntries'" />
    <Toc v-else />
  </div>
</template>
