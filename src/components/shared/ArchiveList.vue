<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
import More from "@/components/icons/More.vue";
import { ref } from "vue";
import { useArchivePopoverStore } from "@/stores/archivePopover.ts";
import draggable from "vuedraggable";

// 归档列表：仅展示归档名称与 meta，支持拖拽排序；菜单项由各列表自行向 archivePopover store 注册，弹层由 App.vue 全局挂载
type Key = number | string | null;

export interface Item {
  key: string | number;
  title: string;
  meta?: string;
}

interface Props {
  list: Item[];
  // 是否开启拖拽排序（由调用方按业务场景控制，如自由排序模式）
  draggable?: boolean;
}

defineProps<Props>();

interface Emits {
  onClick: [item: Item];
  onDragEnd: [oldIndex: number, newIndex: number];
}

const emit = defineEmits<Emits>();

const archivePopoverStore = useArchivePopoverStore();

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
            class="w-8 h-8 rounded-md text-neutral-400 ignore"
            :class="[
              hoverIconKey === item.key ||
              archivePopoverStore.openKey === item.key
                ? 'bg-gray-200'
                : '',
            ]"
            @click.stop="setOpenKey(item.key, $event)"
            @mouseenter="setHoverIconKey(item.key)"
            @mouseleave="setHoverIconKey(null)"
          >
            <More class="w-5 h-5" />
          </SquareButton>
        </div>
      </div>
    </template>
  </draggable>
</template>
