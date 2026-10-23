<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import { DocNav } from "@/types/doc";
import Drag from "vuedraggable";
const list = defineModel<DocNav[]>();
</script>

<template>
  <Drag :list="list">
    <template #item="{ element }: { element: DocNav }">
      <div class="flex items-center py-0.5">
        <Mindmap v-if="element.doc_type === 'mindMap'" />
        <Flowchart v-else-if="element.doc_type === 'flowChart'" />
        <Doc v-if="element.doc_type === 'richText'" />
        <span>{{ element.title }}</span>
      </div>
    </template>
  </Drag>
</template>
