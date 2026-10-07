<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import ArchivePickerDialog from "@/components/shared/ArchivePickerDialog.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useSortDocStore } from "@/stores/sortDoc";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import type { Doc, SortField } from "@/infrastructure/db/document.ts";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const sortDocStore = useSortDocStore();

// 各排序字段对应的 meta 展示：时间字段显示日期和时间，字数显示数值
const metaFormatters: Record<SortField, (doc: Doc) => string> = {
  viewed_at: (doc) => new Date(doc.viewed_at).toLocaleString(),
  updated_at: (doc) => new Date(doc.updated_at).toLocaleString(),
  created_at: (doc) => new Date(doc.created_at).toLocaleString(),
  word_count: (doc) => `${doc.word_count} 字`,
};

// 元函数：将文档列表转换为 DocList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  sortDocStore.docs.map((doc) => ({
    key: doc.id,
    title: doc.title ?? "未命名标题",
    content: doc.plain_text ?? "",
    meta: metaFormatters[sortDocStore.sortField](doc),
    docType: doc.doc_type,
  })),
);

// 转发DocList的onClick事件
const handleClick = (item: Item) => {
  emit("onClick", item);
};

// 元函数：组装排序文档组合式函数
const { removeDoc } = useSortDocs();

// 待归档文档 id：非空时渲染归档选择弹窗
const archiveDocId = ref<string | null>(null);

// popover 菜单：归档（打开独立多选弹窗）与删除（key 由 DocList 注入，为当前文档 id）
const popoverList = computed<PopoverItem[]>(() => [
  {
    icon: "mdi:archive-outline",
    name: "归档",
    action: (key) => {
      if (key === null || key === undefined) return;
      archiveDocId.value = String(key);
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      await removeDoc(String(key));
    },
  },
]);
</script>

<template>
  <DocList :list="items" :popover-list="popoverList" @onClick="handleClick" />
  <ArchivePickerDialog :doc-id="archiveDocId" @on-close="archiveDocId = null" />
  <div v-if="items.length<1" class="h-15 flex items-center justify-center border-b border-gray-100">
    暂无文档，新建一个吧！
  </div> 
</template>
