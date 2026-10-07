<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useEditorViewStore } from "@/stores/editorView";

const editorViewStore = useEditorViewStore();
</script>

<template>
  <div class="w-65 h-full px-2">
    <div class="h-9 flex items-center hover:bg-gray-100 px-2 rounded-md">
      <div>{{ editorViewStore.folder?.name }}</div>
      <div class="flex-1"></div>
      <div class="w-7 h-7 rounded-md hover:bg-gray-200 grid place-items-center">
        <Icon icon="mdi:add" class="w-5 h-5"/>
      </div>
    </div>
  </div>
</template>
