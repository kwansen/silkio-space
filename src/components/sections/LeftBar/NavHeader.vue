<script setup lang="ts">
import { useTemplateRef } from "vue";
import Archive from "@/components/icons/Archive.vue";
import Add from "@/components/icons/Add.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavAddPopoverStore } from "@/stores/navAddPopover.ts";

const store = useEditorViewStore();
const navAddPopoverStore = useNavAddPopoverStore();

const targetRef = useTemplateRef<HTMLElement>("targetRef");

// 元函数：唤起/关闭「导航区新建」浮动菜单（菜单逻辑在 NavAddPopover，实例由 App.vue 挂载）
const toggleOpen = () => {
  navAddPopoverStore.toggle(targetRef.value);
};
</script>
<template>
  <div class="h-full flex items-center">
    <Archive class="w-4 h-4 mx-2 text-neutral-400" />
    <div class="truncate text-xs text-neutral-400">
      {{ store.folder?.name }}
    </div>
    <div class="flex-1"></div>
    <div
      ref="targetRef"
      class="w-7 h-7 rounded-md grid place-items-center mr-2"
      :class="navAddPopoverStore.isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'"
      @click="toggleOpen"
    >
      <Add class="w-5 h-5" />
    </div>
  </div>
</template>
