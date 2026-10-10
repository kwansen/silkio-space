<script setup lang="ts">
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { computed, ref, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { docTypeIcons } from "@/icons";
import { useDoc } from "@/composables/useDocuments.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import { useDocAddPopoverStore } from "@/stores/docAddPopover.ts";

// 全局「新建文档」浮动菜单：状态由 docAddPopover store 承载，实例由 App.vue 挂载
const store = useDocAddPopoverStore();

const { isOpen, targetEl } = storeToRefs(store);

const floatingRef = useTemplateRef<HTMLElement>("floatingRef");

const { floatingStyles } = useFloating(targetEl, floatingRef, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

// 忽略触发按钮：点击按钮时交给 toggle 处理开/关，避免先关后开的抖动
onClickOutside(
  floatingRef,
  () => {
    store.close();
  },
  { ignore: [computed(() => targetEl.value)] },
);

// 元函数：组装文档组合式函数与排序刷新组合式函数
const { createRichText, createMindMap } = useDoc();
const { refreshDocs } = useSortDocs();

// 元函数：创建富文本文档、通知 editor 窗口打开、关闭菜单并刷新列表
const handleCreateRichText = async () => {
  try {
    const id = await createRichText();
    await notifyEditorOpen("doc", id);
    store.close();
    await refreshDocs();
  } catch (e) {
    console.error(e);
  }
};
// 元函数：创建思维导图文档、通知 editor 窗口打开、关闭菜单并刷新列表
const handleCreateMindMap = async () => {
  try {
    const id = await createMindMap();
    await notifyEditorOpen("doc", id);
    store.close();
    await refreshDocs();
  } catch (e) {
    console.error(e);
  }
};
const list = ref<PopoverItem[]>([
  {
    icon: docTypeIcons.richText,
    name: "富文本",
    action: handleCreateRichText,
  },
  {
    icon: docTypeIcons.mindMap,
    name: "思维导图",
    action: handleCreateMindMap,
  },
  {
    icon: docTypeIcons.flowChart,
    name: "流程图",
    action: () => console.log(),
  },
]);
</script>

<template>
  <Popover
    v-if="isOpen"
    :list="list"
    ref="floatingRef"
    :style="floatingStyles"
  />
</template>
