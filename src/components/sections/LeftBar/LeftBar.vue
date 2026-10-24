<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore.ts";
import DocEntries from "./DocEntries.vue";
import Toc from "./Toc.vue";
const uiStore = useUiStore();
</script>

<template>
  <div class="w-65 h-full select-none">
    <DocEntries v-if="uiStore.leftbarOption === 'docEntries'" />
    <Toc v-else />
  </div>
</template>
