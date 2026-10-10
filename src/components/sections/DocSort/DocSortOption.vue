<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, useTemplateRef } from "vue";
import { docTypeIcons } from "@/icons";
import type { SortField } from "@/infrastructure/db/document.ts";
import { useDocSortStore } from "@/stores/docSort";
import { useDocAddPopoverStore } from "@/stores/docAddPopover";
import { useSortDocs } from "@/composables/useSortDocs.ts";

type Sort = '最近浏览'|'最近更新'|'最近创建'|'最多字数'

// 排序选项文案 → 数据库排序字段
const sortFieldMap: Record<Sort, SortField> = {
  最近浏览: "viewed_at",
  最近更新: "updated_at",
  最近创建: "created_at",
  最多字数: "word_count",
};

// 元函数：获取排序文档 store（排序状态唯一数据源）
const docSortStore = useDocSortStore();

// 当前排序文案：由 store 的 sortField 派生，避免重复维护排序状态
const currentSort = computed(
  () =>
    (Object.keys(sortFieldMap) as Sort[]).find(
      (key) => sortFieldMap[key] === docSortStore.sortField,
    ) ?? "最近浏览",
);
const sorts: Sort[] = ["最近浏览", "最近更新", "最近创建", "最多字数"];

// 元函数：切换排序方式，数据返回后排序与列表一次性更新（避免 meta 闪烁），并回到第一页
const handleSortChange = async (sort: Sort) => {
  if (currentSort.value === sort) return;
  await refreshDocs({ page: 1, sortField: sortFieldMap[sort] });
};
// 元函数：组装排序文档组合式函数
const { refreshDocs } = useSortDocs();

// 元函数：获取新建文档菜单 store（菜单开合状态唯一数据源，弹层由 App.vue 全局挂载）
const docAddPopoverStore = useDocAddPopoverStore();

const targetRef = useTemplateRef<HTMLElement>("targetRef");

// 元函数：以按钮为锚点唤起/关闭新建文档菜单
const toggleOpen = () => {
  docAddPopoverStore.toggle(targetRef.value);
};
</script>

<template>
  <div
    class="h-10 flex items-center select-none border-b border-purple-300 gap-4"
  >
    <div
      v-for="sort in sorts"
      :key="sort"
      :class="currentSort === sort ? 'text-purple-700' : 'text-neutral-500 hover:text-neutral-700'"
      @click="handleSortChange(sort)"
    >
      <div>{{ sort }}</div>
      <div
        class="h-1 rounded-full w-full"
        :class="currentSort === sort ? 'bg-purple-200' : 'bg-transparent'"
      ></div>
    </div>
    <div class="flex-1"></div>
    <div
      ref="targetRef"
      class="hover:bg-gray-200 text-sm rounded-md p-1"
      :class="[docAddPopoverStore.isOpen ? 'bg-gray-200' : '']"
      @click="toggleOpen"
    >
      <Icon :icon="docTypeIcons.docCreate" class="w-5 h-5" />
    </div>
  </div>
</template>
