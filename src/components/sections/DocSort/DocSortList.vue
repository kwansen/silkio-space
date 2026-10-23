<script setup lang="ts">
import DocIcon from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import DocItem from "@/components/shared/DocItem.vue";
import { useDocSortStore } from "@/stores/docSortStore";
import { useUiStore } from "@/stores/uiStore";
import { Doc, DocType } from "@/types/doc";
import { storeToRefs } from "pinia";
import { Component } from "vue";
const docSortStore = useDocSortStore();
const { sortedDocs: docs } = storeToRefs(docSortStore);
const uiStore = useUiStore();
const { docSort: sort } = storeToRefs(uiStore);

const dtf = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const metaGetters: Record<DocSortOption, (doc: Doc) => string> = {
  updatedAt: (doc) => dtf.format(new Date(doc.updated_at)),
  createdAt: (doc) => dtf.format(new Date(doc.created_at)),
  viewedAt: (doc) => dtf.format(new Date(doc.viewed_at)),
  wordCount: (doc) => `${doc.word_count} 字`,
};

const getMeta = (doc: Doc) => metaGetters[sort.value](doc);

const iconMap: Record<DocType, Component> = {
  mindMap: Mindmap,
  flowChart: Flowchart,
  richText: DocIcon,
};

const getIcon = (doc: Doc) => iconMap[doc.doc_type] ?? DocIcon;
</script>

<template>
  <DocItem
    v-for="doc in docs"
    :item-key="doc.id"
    :title="doc.title || '未命名标题'"
    :content="doc.plain_text || '暂无内容'"
    :icon="getIcon(doc)"
    :meta="getMeta(doc)"
  />
</template>
