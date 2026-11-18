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
import { useDocAction } from "@/actions/docAction.ts";
import { useUiStore } from "@/stores/uiStore.ts";

interface Props {
  active: boolean;
  itemKey: string;
  title: string;
  content: string;
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

const action = useDocAction();
const store = useUiStore();

const list: ListItem[] = [
  {
    icon: Archive,
    text: "归档",
    action: () => {
      store.setOpenId(props.itemKey);
      openedKey.value = "";
    },
    class: "hover:bg-gray-100",
  },
  {
    icon: Delete,
    text: "删除",
    action: async () => {
      await action.remove(props.itemKey);
      openedKey.value = "";
    },
    class: "hover:bg-red-100",
  },
];

const getClass = () => {
  if (props.active) {
    return "bg-purple-100";
  } else if (
    hoverKey.value === props.itemKey ||
    openedKey.value === props.itemKey
  ) {
    return "bg-gray-100";
  } else {
    return "";
  }
};
</script>
<template>
  <div
    class="h-16 cursor-pointer grid grid-cols-[4rem_1fr_auto] border-t border-gray-100 select-none relative group"
    :class="getClass()"
    @mouseenter="hover(itemKey)"
    @mouseleave="unHover"
    @click="openDoc(itemKey)"
  >
    <!-- 图标 -->
    <div class="w-full h-full grid place-items-center">
      <div class="h-7 w-7 bg-gray-50 rounded-md grid place-items-center">
        <component :is="icon" class="size-4 text-gray-400" />
      </div>
    </div>

    <!-- 标题与内容 -->
    <div class="w-full flex flex-col justify-center min-w-0">
      <div class="truncate">{{ title }}</div>
      <div class="truncate text-xs text-neutral-400">
        {{ content }}
      </div>
    </div>

    <!-- 数据：悬浮出现"更多"按钮时隐藏，避免文字被按钮底色遮挡 -->
    <div
      v-if="meta"
      class="whitespace-nowrap px-4 text-right text-xs text-neutral-400 flex items-center transition-opacity"
      :class="
        hoverKey === itemKey || openedKey === itemKey ? 'opacity-0' : ''
      "
    >
      {{ meta }}
    </div>
    <!-- 悬浮按钮：同 ArchiveItem，mask 与行背景同色不可见，
         More 按钮经 pr-4 落在 item 内容轴上，与头部添加按钮近似同轴 -->
    <div
      v-if="hoverKey === itemKey || openedKey === itemKey"
      :class="active ? 'bg-purple-100' : 'bg-gray-100'"
      class="h-full aspect-square absolute top-0 right-0 flex items-center justify-end pr-4"
    >
      <div
        ref="target"
        class="size-7 grid place-items-center rounded-md relative"
        :class="openedKey === itemKey ? 'bg-gray-200' : 'hover:bg-gray-200'"
        @click.stop="handleClickBtn"
      >
        <More class="size-4" />
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
      @click="i.action"
    >
      <component :is="i.icon" class="size-5" />
      <span>{{ i.text }}</span>
    </div>
  </div>
</template>
