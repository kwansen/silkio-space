<script setup lang="ts">
import { useEditorViewStore, type SidebarView } from "@/stores/editorView";

// ListAndOutline.vue: 标题栏左侧栏视图切换（列表 / 大纲），状态存于 editorView store 供 LeftBar 消费
const views: { key: SidebarView; label: string }[] = [
  { key: "nav", label: "导航" },
  { key: "outline", label: "大纲" },
];

const store = useEditorViewStore();
</script>

<template>
  <!-- 仅打开归档时显示切换（直接打开文档时侧栏固定为大纲） -->
  <div
    v-if="store.folder"
    class="h-10 px-2 flex items-center gap-1 select-none"
    style="-webkit-app-region: no-drag"
  >
    <div
      v-for="view in views"
      :key="view.key"
      class="h-7 px-3 flex items-center rounded-md text-xs transition-colors duration-200"
      :class="
        store.sidebarView === view.key
          ? 'bg-gray-100 text-neutral-700'
          : 'text-gray-400 hover:bg-gray-100 hover:text-neutral-700'
      "
      @click="store.setSidebarView(view.key)"
    >
      {{ view.label }}
    </div>
  </div>
</template>
