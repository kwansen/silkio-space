<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
import { offset, useFloating, flip, autoUpdate } from "@floating-ui/vue";
import { watch } from "vue";
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Popover, { PopoverItem } from "./Popover.vue";

type Key = number | string | null;

export interface Item {
  key: string | number;
  title: string;
  content: string;
  meta?: string;
  docType?: string;
}

// doc_type 对应的列表图标，未识别的类型回退为普通文件图标
const typeIcons: Record<string, string> = {
  richText: "mdi:file-document-outline",
  mindMap: "mdi:sitemap",
};

const iconFor = (item: Item) => typeIcons[item.docType ?? ""] ?? "mdi:file-outline";

interface Props {
  list: Item[];
  popoverList: PopoverItem[];
}

const props = defineProps<Props>();

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const hoverKey = ref<Key>();

const hoverIconKey = ref<Key>();

const openKey = ref<Key>();

const targetRef = ref<HTMLElement | null>(null);

const floatingRef = ref<HTMLElement | null>(null);

const setHoverKey = (v: Key) => {
  hoverKey.value = v;
};

const setHoverIconKey = (v: Key) => {
  hoverIconKey.value = v;
};

const setOpenKey = (v: Key, e: Event | null) => {
  if (v !== null && v === openKey.value) {
    openKey.value = null;
    targetRef.value = null;
    return;
  }
  targetRef.value = e ? (e.currentTarget as HTMLElement) : null;
  openKey.value = v;
};

// 处理item点击事件并触发emit
const handleItemClick = (item: Item) => {
  emit("onClick", item);
};

const { floatingStyles, update } = useFloating(targetRef, floatingRef, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

watch(
  () => targetRef.value,
  () => update(),
);

onClickOutside(
  floatingRef,
  () => {
    setOpenKey(null, null);
  },
  {
    ignore: [".ignore"],
  },
);
</script>

<template>
  <div
    v-for="item in list"
    @mouseenter="setHoverKey(item.key)"
    @mouseleave="setHoverKey(null)"
    @click="handleItemClick(item)"
    class="h-15 flex relative overflow-hidden select-none border-b border-neutral-100"
    :class="[
      hoverKey === item.key || openKey === item.key
        ? 'bg-gray-100'
        : 'bg-white',
    ]"
  >
    <div class="w-10 h-full flex items-center">
      <SquareButton
        :icon="iconFor(item)"
        class="w-8 h-8 rounded-md text-neutral-400 bg-gray-100"
        icon-class="w-5 h-5"
      />
    </div>

    <!-- -->
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
    <!-- <Transition name="x"> -->
    <div
      v-if="hoverKey === item.key || openKey === item.key"
      class="h-full aspect-square bg-gray-100 grid place-content-center absolute right-0 top-0"
    >
      <SquareButton
        icon="mdi:file-outline"
        class="w-8 h-8 rounded-md text-neutral-400 ignore"
        :class="[
          hoverIconKey === item.key || openKey === item.key
            ? 'bg-gray-200'
            : '',
        ]"
        icon-class="w-5 h-5"
        @click.stop="setOpenKey(item.key, $event)"
        @mouseenter="setHoverIconKey(item.key)"
        @mouseleave="setHoverIconKey(null)"
      />
    </div>
    <!-- </Transition> -->
  </div>
  <Popover
    v-if="openKey"
    :list="popoverList"
    ref="floatingRef"
    :style="floatingStyles"
  />
</template>
<!-- <style scoped>
.x-enter-active,
.x-leave-active {
  transition: transform 0.3s ease;
}

.x-enter-from,
.x-leave-to {
  transform: translateX(100%);
}

.x-enter-to,
.x-leave-from {
  transform: translateX(0);
}
</style> -->
