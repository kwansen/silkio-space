<script setup lang="ts">
import { useSettingStore } from "@/stores/settingStore.ts";
import ShortcutItem from "./ShortcutItem.vue";
import { storeToRefs } from "pinia";

const settingStore = useSettingStore();
const { openSearchWindow, openToolWindow } = storeToRefs(settingStore);
</script>
<template>
  <ShortcutItem v-model="openSearchWindow" label="快捷搜索文档" />
  <ShortcutItem v-model="openToolWindow" label="快捷创建文档" />
</template>
