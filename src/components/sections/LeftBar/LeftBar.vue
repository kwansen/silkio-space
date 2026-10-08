<script setup lang="ts">
import { computed } from "vue";
import { useEditorViewStore } from "@/stores/editorView";
import ListHeader from "./ListHeader.vue";
import OutlineHeader from "./OutlineHeader.vue";
import DocListView from "./DocListView.vue";
import OutlineView from "./OutlineView.vue";

const store = useEditorViewStore();

// 元函数：当前是否为大纲视图（直接打开文档时固定大纲，打开归档时由标题栏切换控制）
const isOutline = computed(() =>
  store.folder ? store.sidebarView === "outline" : true,
);
</script>

<template>
  <div class="w-65 h-full px-2 flex flex-col">
    <!-- 头部：列表视图显示归档名与新建按钮，大纲视图显示文档标题 -->
    <ListHeader v-if="!isOutline" />
    <OutlineHeader v-else />

    <!-- 列表视图：打开归档时展示归档内文档；大纲视图：展示当前文档标题大纲 -->
    <DocListView v-if="!isOutline" />
    <OutlineView v-else />
  </div>
</template>
