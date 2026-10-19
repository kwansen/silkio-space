<!--
因为列表项样式和弹层开关共享同一份状态,
用组件也逃不掉手动维护 openedKey,
所以对手写一个简单下拉来说,组件收益不大。
复杂度隔离优于组件复用
-->

<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import More from "../icons/More.vue";
import { useTemplateRef } from "vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import Archive from "../icons/Archive.vue";
import Delete from "../icons/Delete.vue";
import { useDocAction } from "@/actions/doc.ts";

interface Props {
  itemKey: string;
  name: string;
  meta?: string;
  icon: Component;
}

const props = defineProps<Props>();

const hoverKey = ref<string>("");
const openedKey = ref<string>("");
const target = useTemplateRef("target");
const floating = useTemplateRef("floating");
const { openDoc } = useDocAction();

const hover = (v: string) => {
  hoverKey.value = v;
};

const unHover = () => {
  hoverKey.value = "";
};

const handleClickBtn = () => {
  openedKey.value = openedKey.value ? "" : props.itemKey;
};

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floating,
  () => {
    openedKey.value = "";
  },
  { ignore: [computed(() => target.value)] },
);

interface ListItem {
  icon: Component;
  text: string;
  action: () => void;
  class: string;
}

const list: ListItem[] = [
  {
    icon: Archive,
    text: "归档",
    action: () => console.log("归档"),
    class: "hover:bg-gray-100",
  },
  {
    icon: Delete,
    text: "删除",
    action: () => console.log("删除"),
    class: "hover:bg-red-100",
  },
];
</script>
<template>
  <div
    class="h-10 grid grid-cols-[1fr_auto] border-b border-gray-100 select-none relative group"
    :class="hoverKey === itemKey || openedKey === itemKey ? 'bg-gray-100' : ''"
    @mouseenter="hover(itemKey)"
    @mouseleave="unHover"
    @click="openDoc(itemKey)"
  >
    <!-- 图标 -->
    <!-- <div class="w-full flex items-center">
      <div class="h-full aspect-square grid place-items-center">
        <component :is="icon" />
      </div>
    </div> -->

    <!-- 标题与内容 -->
    <div class="w-full flex flex-col justify-center min-w-0">
      <div class="truncate">{{ name }}</div>
    </div>

    <!-- 数据 -->
    <div
      v-if="meta"
      class="whitespace-nowrap pl-4 text-right text-xs text-neutral-400 flex items-center"
    >
      {{ meta }}
    </div>
    <!-- 悬浮按钮 -->
    <div
      v-if="hoverKey === itemKey || openedKey === itemKey"
      class="h-full aspect-square bg-gray-100 absolute top-0 right-0 grid place-items-center"
    >
      <div
        ref="target"
        class="w-7 h-7 grid place-items-center rounded-md relative"
        :class="openedKey === itemKey ? 'bg-gray-200' : 'hover:bg-gray-200'"
        @click.stop="handleClickBtn"
      >
        <More />
      </div>
    </div>
  </div>
  <!-- popover -->
  <div
    v-if="openedKey === itemKey"
    ref="floating"
    class="bg-white z-10 select-none text-xs rounded-lg overflow-hidden p-1 shadow-2xl"
    :style="floatingStyles"
  >
    <div
      v-for="i in list"
      class="pl-4 pr-8 py-2 flex items-center gap-2 rounded-md"
      :class="i.class"
    >
      <component :is="i.icon" class="w-5 h-5" />
      <span>{{ i.text }}</span>
    </div>
  </div>
</template>
