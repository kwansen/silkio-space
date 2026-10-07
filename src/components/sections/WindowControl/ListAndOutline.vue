<script setup lang="ts">
import { useEditorViewStore, type SidebarView } from "@/stores/editorView";

// ListAndOutline.vue: 标题栏左侧栏视图切换（列表 / 大纲），状态存于 editorView store 供 LeftBar 消费
const views: { key: SidebarView; label: string }[] = [
  { key: "list", label: "列表" },
  { key: "outline", label: "大纲" },
];

const store = useEditorViewStore();
</script>

<template>
  <div
    class="h-10 px-2 flex items-center gap-1 select-none"
    style="-webkit-app-region: no-drag"
  >
    <div
      v-for="view in views"
      :key="view.key"
      class="h-7 px-3 flex items-center rounded-md text-xs cursor-pointer transition-colors duration-200"
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
