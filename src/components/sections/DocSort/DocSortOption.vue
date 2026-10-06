<script setup lang="ts">
import TextButton from "@/components/shared/TextButton.vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { Icon } from "@iconify/vue";
import { onClickOutside } from "@vueuse/core";
import { ref, useTemplateRef } from "vue";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { docTypeIcons } from "@/icons";
import { useDoc } from "@/composables/useDocuments.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

type Sort = '最近浏览'|'最近更新'|'最近创建'|'最多字数'

const currentSort = ref<Sort>('最近浏览')
const sorts: Sort[] = ["最近浏览", "最近更新", "最近创建", "最多字数"];
const isOpen = ref<boolean>(false);
// 元函数：组装文档组合式函数
const { createRichText, createMindMap } = useDoc();
// 元函数：组装排序文档组合式函数
const { refreshDocs } = useSortDocs();

// 元函数：创建富文本文档、通知 editor 窗口打开、关闭菜单并刷新列表
const handleCreateRichText = async () => {
  try {
    const id = await createRichText();
    await notifyEditorOpen("doc", id);
    isOpen.value = false;
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
    isOpen.value = false;
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

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const targetRef = useTemplateRef<HTMLElement>("targetRef");

const floatingRef = useTemplateRef<HTMLElement>("floatingRef");

const { floatingStyles } = useFloating(targetRef, floatingRef, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floatingRef,
  () => {
    isOpen.value = false;
  },
  { ignore: [targetRef] },
);
</script>

<template>
  <div
    class="h-10 flex items-center select-none border-b border-purple-300 gap-4"
  >
    <div
      v-for="sort in sorts"
      :key="sort"
      :class="currentSort === sort ? 'text-purple-700' : 'text-neutral-500 hover:text-neutral-700'"
      @click="currentSort = sort"
    >
      <div>{{ sort }}</div>
      <div
        class="h-1 rounded-full w-full"
        :class="currentSort === sort ? 'bg-purple-200' : 'bg-transparent'"
      ></div>
    </div>
    <div class="flex-1"></div>
    <div
      ref="targetRef"
      class="hover:bg-gray-200 text-sm rounded-md p-1"
      :class="[isOpen ? 'bg-gray-200' : '']"
      @click="toggleOpen"
    >
      <Icon :icon="docTypeIcons.docCreate" class="w-5 h-5" />
    </div>
    <Popover
      v-if="isOpen"
      :list="list"
      ref="floatingRef"
      :style="floatingStyles"
    />
  </div>
</template>
