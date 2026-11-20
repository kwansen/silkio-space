<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import Plus from "@/components/icons/Plus.vue";
import DocIcon from "@/components/icons/Doc.vue";
import FlowchartIcon from "@/components/icons/Flowchart.vue";
import MindmapIcon from "@/components/icons/Mindmap.vue";
import { useDocSortStore } from "@/stores/docSortStore";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { type Component, computed, ref, useTemplateRef } from "vue";

const sortStore = useDocSortStore();
const { docSort: sort } = storeToRefs(sortStore);
const { setDocSort } = sortStore;
const list: { key: DocSortOption; show: string }[] = [
  { key: "viewedAt", show: "最近浏览" },
  { key: "updatedAt", show: "最近更新" },
  { key: "createdAt", show: "最近创建" },
  { key: "wordCount", show: "最多字数" },
];

const handleClick = (option: DocSortOption) => {
  setDocSort(option);
  sortStore.goToSortedPage(1);
};

const show = ref<boolean>(false);
const floating = useTemplateRef("floating");
const target = useTemplateRef("target");

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floating,
  () => {
    show.value = false;
  },
  { ignore: [computed(() => target.value)] },
);

interface PopoverListItem {
  icon: Component;
  text: string;
  action: () => void;
}

const { createRichtext, createMindmap, createFlowchart } = useDocAction();

const popoverList: PopoverListItem[] = [
  {
    icon: DocIcon,
    text: "富文本",
    action: () => {
      createRichtext();
      show.value = false;
    },
  },
  {
    icon: MindmapIcon,
    text: "思维导图",
    action: () => {
      createMindmap();
      show.value = false;
    },
  },
  {
    icon: FlowchartIcon,
    text: "流程图",
    action: () => {
      createFlowchart();
      show.value = false;
    },
  },
];

const handleClickBtn = () => {
  show.value = !show.value;
};
</script>

<template>
  <div class="flex items-center h-16 px-5 gap-4 border-b border-purple-300">
    <div
      v-for="i in list"
      class="select-none relative cursor-pointer"
      @click="handleClick(i.key)"
    >
      <span :class="i.key === sort ? 'text-purple-700' : ''">
        {{ i.show }}
      </span>
      <div
        class="w-full h-1 absolute top-full left-0 rounded-full"
        :class="i.key === sort ? 'bg-purple-200' : ''"
      />
    </div>

    <div class="flex-1"></div>
    <div
      ref="target"
      class="size-7 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:text-gray-700"
      :class="show ? 'bg-gray-100' : 'hover:bg-gray-100'"
      @click="handleClickBtn"
    >
      <Plus class="size-4" />
    </div>
  </div>
  <div
    v-if="show"
    ref="floating"
    class="bg-white z-10 select-none text-xs rounded-lg overflow-hidden p-1 shadow-2xl space-y-1"
    :style="floatingStyles"
  >
    <div
      v-for="i in popoverList"
      class="pl-4 pr-8 h-12 flex items-center gap-2 rounded-md hover:bg-gray-100"
      @click="i.action()"
    >
      <component :is="i.icon" class="size-4" />
      <span>{{ i.text }}</span>
    </div>
  </div>
</template>
