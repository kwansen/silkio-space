<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useEditorViewStore } from "@/stores/editorView";

const store = useEditorViewStore();
</script>
<template>
  <!-- 列表视图头部：显示归档名与新建按钮 -->
  <div class="h-9 flex items-center hover:bg-gray-100 px-2 rounded-md select-none">
    <Icon icon="mdi:archive" class="w-4 h-4 mr-2 text-neutral-400" />
    <div class="truncate text-xs text-neutral-400">{{ store.folder?.name }}</div>
    <div class="flex-1"></div>
    <div class="w-7 h-7 rounded-md hover:bg-gray-200 grid place-items-center">
      <Icon icon="mdi:add" class="w-5 h-5" />
    </div>
  </div>
</template>
