<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import type { FolderSortField } from "@/infrastructure/db/folder.ts";
import Add from "@/components/icons/Add.vue";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveSortStore } from "@/stores/archiveSort";

const sortOptions: { key: FolderSortField; show: string }[] = [
  {
    key: "sort_order",
    show: "自由排序",
  },
  {
    key: "name",
    show: "名称排序",
  },
  {
    key: "viewed_at",
    show: "最近打开",
  },
];

// 归档排序 store（排序状态唯一数据源）
const archiveSortStore = useArchiveSortStore();

// 元函数：组装归档排序组合式函数
const { refreshFolders, createFolder } = useArchiveSort();

// 元函数：切换排序方式，数据返回后排序与列表一次性更新（避免 meta 闪烁，store 由 refreshFolders 统一更新）
const handleSortChange = async (sort: FolderSortField) => {
  if (archiveSortStore.sortField === sort) return;
  await refreshFolders({ sortField: sort });
};

const isOpen = ref<boolean>(false);
const name = ref<string>("");

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

onClickOutside(wrapperRef, () => {
  if (isOpen.value) handleCancel();
});
</script>

<template>
  <div
    ref="wrapperRef"
    class="h-10 flex items-center select-none border-b border-purple-300 gap-4"
  >
    <div
      v-for="option in sortOptions"
      :key="option.key"
      :class="
        archiveSortStore.sortField === option.key
          ? 'text-purple-700'
          : 'text-neutral-500 hover:text-neutral-700'
      "
      @click="handleSortChange(option.key)"
    >
      <div>{{ option.show }}</div>
      <div
        class="h-1 rounded-full w-full"
        :class="
          archiveSortStore.sortField === option.key
            ? 'bg-purple-200'
            : 'bg-transparent'
        "
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
      <Add class="w-5 h-5 text-neutral-500" @click="handleCreate" />
    </template>
    <div
      v-else
      class="hover:bg-gray-200 text-sm rounded-md p-1"
      @click="toggleOpen"
    >
      <Add class="w-5 h-5" />
    </div>
  </div>
</template>
