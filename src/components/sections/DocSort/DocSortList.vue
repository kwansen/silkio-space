<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import DocIcon from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import DocItem from "@/components/shared/DocItem.vue";
import { useDocSortStore } from "@/stores/docSortStore";
import { useUiStore } from "@/stores/uiStore";
import { Doc, DocType } from "@/types/doc";
import { storeToRefs } from "pinia";
import { Component, onMounted, onUnmounted } from "vue";
const docSortStore = useDocSortStore();
const { sortedDocs: docs, activeId } = storeToRefs(docSortStore);
const uiStore = useUiStore();
const { docSort: sort } = storeToRefs(uiStore);
const action = useDocAction();

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

const openResult = async (id: string | undefined) => {
  if (!id) return;
  await action.openDoc(id);
};

const handleKeyDown = (event: KeyboardEvent) => {
  const { key } = event;
  switch (key) {
    case "ArrowDown":
      event.preventDefault();
      docSortStore.activateSortedNext();
      break;
    case "ArrowUp":
      event.preventDefault();
      docSortStore.activateSortedPrev();
      break;
    case "PageUp":
      event.preventDefault();
      docSortStore.goSortedPrev();
      break;
    case "PageDown":
      event.preventDefault();
      docSortStore.goSortedNext();
      break;
    case "Enter":
      openResult(activeId.value);
      break;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <DocItem
    v-for="doc in docs"
    :active="activeId === doc.id"
    :item-key="doc.id"
    :title="doc.title || '未命名标题'"
    :content="doc.plain_text?.trim() || '暂无内容'"
    :icon="getIcon(doc)"
    :meta="getMeta(doc)"
  />
</template>
