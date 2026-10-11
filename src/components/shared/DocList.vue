<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
import { ref } from "vue";
import { useDocPopoverStore } from "@/stores/docPopover.ts";
import Doc from "../icons/Doc.vue";
import Mindmap from "../icons/Mindmap.vue";
import Flowchart from "../icons/Flowchart.vue";
import More from "../icons/More.vue";

// 文档列表：展示文档图标、标题、内容预览与 meta；菜单项由各列表自行向 docPopover store 注册，弹层由 App.vue 全局挂载
type Key = number | string | null;

export interface Item {
  key: string | number;
  title: string;
  content: string;
  meta?: string;
  docType?: string;
}

interface Props {
  list: Item[];
}

defineProps<Props>();

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const docPopoverStore = useDocPopoverStore();

const hoverKey = ref<Key>();

const hoverIconKey = ref<Key>();

const setHoverKey = (v: Key) => {
  hoverKey.value = v;
};

const setHoverIconKey = (v: Key) => {
  hoverIconKey.value = v;
};

// 元函数：打开/切换条目的菜单（开合与定位由 docPopover store 管理）
const setOpenKey = (v: Key, e: Event | null) => {
  docPopoverStore.open(v, (e?.currentTarget as HTMLElement) ?? null);
};

// 处理item点击事件并触发emit
const handleItemClick = (item: Item) => {
  emit("onClick", item);
};
</script>

<template>
  <div
    v-for="item in list"
    :key="item.key"
    @mouseenter="setHoverKey(item.key)"
    @mouseleave="setHoverKey(null)"
    @click="handleItemClick(item)"
    class="h-15 flex relative overflow-hidden select-none border-b border-neutral-100"
    :class="[
      hoverKey === item.key || docPopoverStore.openKey === item.key
        ? 'bg-gray-100'
        : 'bg-white',
    ]"
  >
    <div class="w-10 h-full flex items-center">
      <SquareButton class="w-8 h-8 rounded-md text-neutral-400 bg-gray-100">
        <Doc v-if="item.docType === 'richText'" />
        <Mindmap v-else-if="item.docType === 'mindMap'" />
        <Flowchart v-else-if="item.docType === 'flowChart'" />
      </SquareButton>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col justify-center">
      <div class="flex items-center">
        <div class="flex-1 truncate">
          {{ item.title || "未命名标题" }}
        </div>
        <div v-if="item.meta" class="text-[10px] text-neutral-400">
          {{ item.meta }}
        </div>
      </div>
      <div
        class="text-xs text-neutral-400 truncate mt-0.5"
        v-html="item.content || '暂无内容'"
      ></div>
    </div>
    <div
      v-if="hoverKey === item.key || docPopoverStore.openKey === item.key"
      class="h-full aspect-square bg-gray-100 grid place-content-center absolute right-0 top-0"
    >
      <SquareButton
        class="w-8 h-8 rounded-md text-neutral-400 ignore"
        :class="[
          hoverIconKey === item.key || docPopoverStore.openKey === item.key
            ? 'bg-gray-200'
            : '',
        ]"
        @click.stop="setOpenKey(item.key, $event)"
        @mouseenter="setHoverIconKey(item.key)"
        @mouseleave="setHoverIconKey(null)"
        ><More
      /></SquareButton>
    </div>
  </div>
</template>
