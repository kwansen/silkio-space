<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import type { FolderSortField } from "@/infrastructure/db/folder.ts";
import { docTypeIcons } from "@/icons";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveSortStore } from "@/stores/archiveSort";

type Sort = "最近更新" | "最近创建";

// 排序选项文案 → 数据库排序字段
const sortFieldMap: Record<Sort, FolderSortField> = {
  最近更新: "updated_at",
  最近创建: "created_at",
};

// 元函数：获取归档排序 store（排序状态唯一数据源）
const archiveSortStore = useArchiveSortStore();

// 当前排序文案：由 store 的 sortField 派生，避免重复维护排序状态
const currentSort = computed(
  () =>
    (Object.keys(sortFieldMap) as Sort[]).find(
      (key) => sortFieldMap[key] === archiveSortStore.sortField,
    ) ?? "最近更新",
);
const sorts: Sort[] = ["最近更新", "最近创建"];
const isOpen = ref<boolean>(false);
const name = ref<string>("");

// 元函数：组装归档排序组合式函数
const { refreshFolders, createFolder } = useArchiveSort();

// 元函数：切换排序方式，数据返回后排序与列表一次性更新（避免 meta 闪烁），并回到第一页
const handleSortChange = async (sort: Sort) => {
  if (currentSort.value === sort) return;
  await refreshFolders({ page: 1, sortField: sortFieldMap[sort] });
};

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

// 元函数：展开/收起新建归档输入框，展开时自动聚焦
const toggleOpen = async () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) await nextTick(() => inputRef.value?.focus());
};

// 元函数：确认创建归档（名称为空则取消），创建后收起输入框并刷新列表
const handleCreate = async () => {
  const v = name.value.trim();
  name.value = "";
  isOpen.value = false;
  if (!v) return;
  try {
    await createFolder(v);
  } catch (e) {
    console.error(e);
  }
};

// 元函数：取消创建，收起输入框并清空名称
const handleCancel = () => {
  isOpen.value = false;
  name.value = "";
};

const wrapperRef = useTemplateRef<HTMLElement>("wrapperRef");

onClickOutside(
  wrapperRef,
  () => {
    if (isOpen.value) handleCancel();
  },
);
</script>

<template>
  <div
    ref="wrapperRef"
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
    <template v-if="isOpen">
      <input
        ref="inputRef"
        v-model="name"
        type="text"
        placeholder="归档名称"
        class="h-7 w-40 text-sm px-2 rounded-md border border-purple-300 outline-none focus:border-purple-500"
        @keydown.enter="handleCreate"
        @keydown.esc="handleCancel"
      />
      <Icon
        :icon="docTypeIcons.docCreate"
        class="w-5 h-5 text-neutral-500"
        @click="handleCreate"
      />
    </template>
    <div
      v-else
      class="hover:bg-gray-200 text-sm rounded-md p-1"
      @click="toggleOpen"
    >
      <Icon :icon="docTypeIcons.docCreate" class="w-5 h-5" />
    </div>
  </div>
</template>
