<script setup lang="ts">
import { useDocSortAction } from "@/actions/docSort";
import Add from "@/components/icons/Add.vue";
import Doc from "@/components/icons/Doc.vue";
import DocMian from "@/components/icons/DocMian.vue";
import FlowchartMian from "@/components/icons/FlowchartMian.vue";
import MindmapMian from "@/components/icons/MindmapMian.vue";
import { useUiStore } from "@/stores/uiStore";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { type Component, computed, ref, useTemplateRef } from "vue";

const store = useUiStore();
const { currentDocSort: sort } = storeToRefs(store);
const { setDocSort } = store;
const action = useDocSortAction();
const list: { key: DocSortOption; show: string }[] = [
  { key: "viewedAt", show: "最近浏览" },
  { key: "updatedAt", show: "最近更新" },
  { key: "createdAt", show: "最近创建" },
  { key: "wordCount", show: "最多字数" },
];

const handleClick = (option: DocSortOption) => {
  setDocSort(option);
  action.getSortedDocs(option, 1);
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

const popoverList: PopoverListItem[] = [
  {
    icon: DocMian,
    text: "富文本",
    action: () => console.log(""),
  },
  {
    icon: MindmapMian,
    text: "思维导图",
    action: () => console.log(""),
  },
  {
    icon: FlowchartMian,
    text: "流程图",
    action: () => console.log(""),
  },
];

const handleClickBtn = () => {
  show.value = !show.value;
};
</script>

<template>
  <div class="flex items-center py-2 gap-4 border-b border-purple-300">
    <div v-for="i in list" class="select-none" @click="handleClick(i.key)">
      <span :class="i.key === sort ? 'text-purple-700' : ''">
        {{ i.show }}
      </span>
      <div
        class="w-full h-1 rounded-full"
        :class="i.key === sort ? 'bg-purple-200' : ''"
      />
    </div>

    <div class="flex-1"></div>
    <div
      ref="target"
      class="w-7 h-7 grid place-items-center rounded-md"
      :class="show ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'"
      @click="handleClickBtn"
    >
      <Add />
    </div>
  </div>
  <div
    v-if="show"
    ref="floating"
    class="bg-white z-10 select-none text-xs rounded-lg overflow-hidden p-1 shadow-2xl"
    :style="floatingStyles"
  >
    <div
      v-for="i in popoverList"
      class="pl-4 pr-8 py-2 flex items-center gap-2 rounded-md hover:bg-gray-100"
    >
      <component :is="i.icon" class="w-5 h-5" />
      <span>{{ i.text }}</span>
    </div>
  </div>
</template>
