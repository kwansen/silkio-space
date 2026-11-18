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
import Delete from "../icons/Delete.vue";
import Pencil from "../icons/Pencil.vue";
import ArchiveItemInput from "./ArchiveItemInput.vue";
import { useArchiveAction } from "@/actions/archiveAction.ts";

interface Props {
  itemKey: string;
  name: string;
  meta?: string;
  editing?: boolean;
  // 悬浮高亮由父列表统一管理；弹层开关状态仍由 item 内部维护
  hovered?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:editing": [v: boolean];
}>();

const openedKey = ref<string>("");
const target = useTemplateRef("target");
const floating = useTemplateRef("floating");
const { openArchive } = useArchiveAction();

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

const rename = () => {
  emit("update:editing", true);
};

const list: ListItem[] = [
  {
    icon: Pencil,
    text: "重命名",
    action: () => {
      rename();
      openedKey.value = "";
    },
    class: "hover:bg-gray-100",
  },
  {
    icon: Delete,
    text: "删除",
    action: () => {
      action.remove(openedKey.value);
      openedKey.value = "";
    },
    class: "hover:bg-red-100",
  },
];

const action = useArchiveAction();
</script>
<template>
  <div class="h-10">
    <ArchiveItemInput
      :name="name"
      :id="itemKey"
      v-if="editing"
      @close="emit('update:editing', false)"
    />
    <div
      v-else
      class="h-10 px-4 grid grid-cols-[1fr_auto] select-none relative group cursor-pointer"
      :class="hovered || openedKey === itemKey ? 'bg-gray-100' : ''"
      @click="openArchive(itemKey)"
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

      <!-- 数据：悬浮出现"更多"按钮时隐藏，避免文字被按钮底色遮挡 -->
      <div
        v-if="meta"
        class="whitespace-nowrap pl-4 text-right text-xs text-neutral-400 flex items-center transition-opacity"
        :class="hovered || openedKey === itemKey ? 'opacity-0' : ''"
      >
        {{ meta }}
      </div>
      <!-- 悬浮按钮：mask 底色与行 hover 背景同色（视觉不可见），More 按钮通过
           justify-end + pr-4 落在 item 内容轴上（px-4），与工具栏的添加按钮
           右缘（px-5）同轴，避免悬浮按钮比头部按钮更贴近边缘 -->
      <div
        v-if="hovered || openedKey === itemKey"
        class="h-full aspect-square bg-gray-100 absolute top-0 right-0 flex items-center justify-end pr-4"
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
      <!-- popover -->
      <Teleport to="body">
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
            @click.stop="i.action"
          >
            <component :is="i.icon" class="size-4" />
            <span>{{ i.text }}</span>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
