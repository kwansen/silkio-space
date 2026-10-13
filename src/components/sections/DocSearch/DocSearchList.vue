<script setup lang="ts">
import DocIcon from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import DocItem from "@/components/shared/DocItem.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { DocType, ScoredDoc } from "@/types/doc";
import { storeToRefs } from "pinia";
import { Component } from "vue";

const iconMap: Record<DocType, Component> = {
  mindMap: Mindmap,
  flowChart: Flowchart,
  richText: DocIcon,
};

const getIcon = (doc: ScoredDoc) => iconMap[doc.doc_type] ?? DocIcon;

const store = useDocSearchStore();
const { docsThisPage: docs } = storeToRefs(store);
</script>

<template>
  <DocItem
    v-for="doc in docs"
    :item-key="doc.id"
    :title="doc.title || '未命名标题'"
    :content="doc.plain_text || '暂无内容'"
    :icon="getIcon(doc)"
  />
</template>
