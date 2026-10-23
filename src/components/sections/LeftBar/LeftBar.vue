<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import { useEditorStore } from "@/stores/editorStore";
import { useDocSvc } from "@/services/document";
import { DocEntry } from "@/types/doc";
import { storeToRefs } from "pinia";
import Drag from "vuedraggable";
import Archive from "@/components/icons/Archive.vue";
const store = useEditorStore();
const { docEntries, name, id, docType } = storeToRefs(store);
const docSvc = useDocSvc();

const openEntry = async (entry: DocEntry) => {
  const doc = await docSvc.getById(entry.id);
  store.setDoc(doc);
};
</script>

<template>
  <div class="w-65 h-full select-none">
    <div class="h-11 flex items-center pl-4 gap-1 border-b border-purple-300">
      <Archive class="size-4" />{{ name }}
      <div class="flex-1"></div>
      <div class="size-7 grid place-items-center rounded-md bg-gray-50"></div>
    </div>
    <Drag :list="docEntries" :animation="200" ghost-class="ghost" item-key="id">
      <template #item="{ element }: { element: DocEntry }">
        <div
          class="flex items-center gap-1 py-0.5 px-4"
          :class="id === element.id ? 'bg-purple-200' : 'hover:bg-gray-50'"
          @click="openEntry(element)"
        >
          <Mindmap v-if="element.doc_type === 'mindMap'" class="size-4" />
          <Flowchart
            v-else-if="element.doc_type === 'flowChart'"
            class="size-4"
          />
          <Doc v-if="element.doc_type === 'richText'" class="size-4" />
          <span>{{ element.title }}</span>
        </div>
      </template>
    </Drag>
    {{ docType }}
  </div>
</template>
