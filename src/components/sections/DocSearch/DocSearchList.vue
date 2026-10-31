<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import DocIcon from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import DocItem from "@/components/shared/DocItem.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { DocType, ScoredDoc } from "@/types/doc";
import { storeToRefs } from "pinia";
import { Component, onMounted, onUnmounted } from "vue";

const iconMap: Record<DocType, Component> = {
  mindMap: Mindmap,
  flowChart: Flowchart,
  richText: DocIcon,
};

const getIcon = (doc: ScoredDoc) => iconMap[doc.doc_type] ?? DocIcon;

const store = useDocSearchStore();
const { docsThisPage: docs, activeId } = storeToRefs(store);
const action = useDocAction();

const openResult = async (id: string | null | undefined) => {
  if (!id) return;
  await action.openDoc(id);
};

const handleKeyDown = (event: KeyboardEvent) => {
  const { key } = event;
  switch (key) {
    case "Escape":
      store.setQuery("");
      break;
    case "ArrowDown":
      event.preventDefault();
      store.activateNext();
      break;
    case "ArrowUp":
      event.preventDefault();
      store.activatePrev();
      break;
    case "PageUp":
      event.preventDefault();
      store.prevPage();
      break;
    case "PageDown":
      event.preventDefault();
      store.nextPage();
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
  />
</template>
