<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
import { PopoverItem } from "./Popover.vue";
import { ref, watchEffect } from "vue";
import { useArchivePopoverStore } from "@/stores/archivePopover.ts";
import draggable from "vuedraggable";

// 归档列表：仅展示归档名称与 meta，支持拖拽排序，popover 操作菜单由 App.vue 全局挂载
type Key = number | string | null;

export interface Item {
  key: string | number;
  title: string;
  meta?: string;
}

interface Props {
  list: Item[];
  popoverList: PopoverItem[];
  // 是否开启拖拽排序（由调用方按业务场景控制，如自由排序模式）
  draggable?: boolean;
}

const props = defineProps<Props>();

interface Emits {
  onClick: [item: Item];
  onDragEnd: [oldIndex: number, newIndex: number];
}

const emit = defineEmits<Emits>();

const archivePopoverStore = useArchivePopoverStore();

// 元函数：挂载期间向全局菜单注册本列表的菜单项（切换列表时自动替换并关闭旧菜单）
watchEffect(() => {
  archivePopoverStore.register(props.popoverList);
});

const hoverKey = ref<Key>();

const hoverIconKey = ref<Key>();

const setHoverKey = (v: Key) => {
  hoverKey.value = v;
};

const setHoverIconKey = (v: Key) => {
  hoverIconKey.value = v;
};

// 元函数：打开/切换条目的菜单（开合与定位由 archivePopover store 管理）
const setOpenKey = (v: Key, e: Event | null) => {
  archivePopoverStore.open(v, (e?.currentTarget as HTMLElement) ?? null);
};

// 处理item点击事件并触发emit
const handleItemClick = (item: Item) => {
  emit("onClick", item);
};

// 处理拖拽结束事件，转换为前后索引后转发（未移动则不触发）
const handleDragEnd = (e: { oldIndex?: number; newIndex?: number }) => {
  if (e.oldIndex === undefined || e.newIndex === undefined) return;
  if (e.oldIndex === e.newIndex) return;
  emit("onDragEnd", e.oldIndex, e.newIndex);
};
</script>

<template>
  <draggable
    :list="list"
    item-key="key"
    :disabled="!draggable"
    :animation="150"
    @end="handleDragEnd"
  >
    <template #item="{ element: item }">
      <div
        @mouseenter="setHoverKey(item.key)"
        @mouseleave="setHoverKey(null)"
        @click="handleItemClick(item)"
        class="h-15 flex relative overflow-hidden select-none border-b border-neutral-100"
        :class="[
          hoverKey === item.key || archivePopoverStore.openKey === item.key
            ? 'bg-gray-100'
            : 'bg-white',
        ]"
      >
        <div class="flex-1 overflow-hidden flex flex-col justify-center">
          <div class="flex items-center">
            <div class="flex-1 truncate">
              {{ item.title || "未命名标题" }}
            </div>
            <div v-if="item.meta" class="text-[10px] text-neutral-400">
              {{ item.meta }}
            </div>
          </div>
        </div>
        <div
          v-if="
            hoverKey === item.key || archivePopoverStore.openKey === item.key
          "
          class="h-full aspect-square bg-gray-100 grid place-content-center absolute right-0 top-0"
        >
          <SquareButton
            icon="mdi:file-outline"
            class="w-8 h-8 rounded-md text-neutral-400 ignore"
            :class="[
              hoverIconKey === item.key ||
              archivePopoverStore.openKey === item.key
                ? 'bg-gray-200'
                : '',
            ]"
            icon-class="w-5 h-5"
            @click.stop="setOpenKey(item.key, $event)"
            @mouseenter="setHoverIconKey(item.key)"
            @mouseleave="setHoverIconKey(null)"
          />
        </div>
      </div>
    </template>
  </draggable>
</template>
