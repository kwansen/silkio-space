<script setup lang="ts">
import { computed } from "vue";
import { useEditorViewStore } from "@/stores/editorView";
import NavHeader from "./NavHeader.vue";
import TocHeader from "./TocHeader.vue";
import NavMain from "./NavMain.vue";
import TocMain from "./TocMain.vue";

const store = useEditorViewStore();

// 元函数：当前是否为大纲视图（直接打开文档时固定大纲，打开归档时由标题栏切换控制）
const isOutline = computed(() =>
  store.folder ? store.sidebarView === "outline" : true,
);
</script>

<template>
  <div class="w-65 h-full px-2 flex flex-col">
    <!-- 导航头部 -->
    <NavHeader v-if="!isOutline" />
    <!-- 大纲头部 -->
    <TocHeader v-else />
    <!-- 导航列表 -->
    <NavMain v-if="!isOutline" />
    <!-- 大纲列表 -->
    <TocMain v-else />
  </div>
</template>
