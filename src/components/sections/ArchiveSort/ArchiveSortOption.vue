<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import TextButton from "./TextButton.vue";
import { useDocStore } from "@/stores/docStore";
import { sortIcons, type SortType } from "@/icons/sortIcons";

interface SortOption {
  key: SortType;
  label: string;
  icon: string;
}

// 排序选项配置
const sortOptions: SortOption[] = [
  { key: "viewed", label: "最近浏览", icon: sortIcons.viewed },
  { key: "updated", label: "最近更新", icon: sortIcons.updated },
  { key: "created", label: "最近创建", icon: sortIcons.created },
  { key: "wordcount", label: "最多字数", icon: sortIcons.wordcount },
];

const emit = defineEmits<{
  (e: "create"): void;
}>();

const docStore = useDocStore();

// 当前激活的排序类型
const activeSort = computed<SortType>({
  get: () => docStore.sortType,
  set: (val) => docStore.setSortType(val),
});

// 切换排序类型
function handleSortClick(key: SortType) {
  activeSort.value = key;
}

// 判断排序是否激活
const isActive = (key: SortType) => activeSort.value === key;
</script>

<template>
  <div class="mt-10 h-14 pl-8 pr-8 flex items-center bg-white">
    <div class="flex items-center gap-1">
      <TextButton
        v-for="opt in sortOptions"
        :key="opt.key"
        :class="
          isActive(opt.key) ? 'bg-gray-200 text-gray-900 font-medium' : ''
        "
        @click="handleSortClick(opt.key)">
        <Icon :icon="opt.icon" class="w-4 h-4 mr-1" />
        {{ opt.label }}
      </TextButton>
    </div>
    <div class="flex-1"></div>
    <button
      class="h-8 px-4 flex items-center justify-center rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
      @click="emit('create')">
      <Icon icon="mdi:archive-arrow-up" class="w-4 h-4 mr-1" />
      归档文档
    </button>
  </div>
</template>
