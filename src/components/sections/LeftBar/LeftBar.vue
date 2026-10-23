<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import { useEditorStore } from "@/stores/editorStore";
import { useDocSvc } from "@/services/document";
import { DocEntry } from "@/types/doc";
import { storeToRefs } from "pinia";
import Drag from "vuedraggable";
const store = useEditorStore();
const { docEntries } = storeToRefs(store);
const docSvc = useDocSvc();

const openEntry = async (entry: DocEntry) => {
  const doc = await docSvc.getById(entry.id);
  store.setId(doc?.id);
  store.setTitle(doc?.title || "");
  store.setContent(doc?.content || "");
  store.setDocType(doc?.doc_type);
  store.setKey(Date.now().toString());
};
</script>

<template>
  <div class="w-65 h-full select-none">
    <div></div>
    <Drag :list="docEntries" :animation="200" ghost-class="ghost">
      <template #item="{ element }: { element: DocEntry }">
        <div
          class="flex items-center gap-1 py-0.5 hover:bg-gray-50 px-4 cursor-pointer"
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
  </div>
</template>
