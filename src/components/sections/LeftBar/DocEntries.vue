<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import { useEditorStore } from "@/stores/editorStore";
import { useDocSvc } from "@/services/document";
import { useFdSvc } from "@/services/folder";
import { DocEntry, DocType } from "@/types/doc";
import { storeToRefs } from "pinia";
import Drag from "vuedraggable";
import Archive from "@/components/icons/Archive.vue";
import Add from "@/components/icons/Add.vue";
import DocMian from "@/components/icons/DocMian.vue";
import MindmapMian from "@/components/icons/MindmapMian.vue";
import FlowchartMian from "@/components/icons/FlowchartMian.vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { type Component, computed, ref, useTemplateRef } from "vue";
import { emitTo } from "@tauri-apps/api/event";

const store = useEditorStore();
const { docEntries, name, id, docType, archiveId } = storeToRefs(store);
const docSvc = useDocSvc();
const fdSvc = useFdSvc();

const openEntry = async (entry: DocEntry) => {
  const doc = await docSvc.getById(entry.id);
  store.setDoc(doc);
};

const { setDoc, setDocEntries } = store;

// 拖拽结束持久化新顺序：vuedraggable 已通过 :list 原地更新 docEntries，此处仅写库
const dragEnd = () => {
  if (!archiveId.value) return;
  fdSvc.reorderDocs({
    folderId: archiveId.value,
    documentIds: docEntries.value.map((e) => e.id),
  });
};

// 在当前归档下创建文档：加入归档 → 刷新左侧目录 → 在已打开的编辑区展示新文档
const createDoc = async (newType: DocType) => {
  try {
    if (!archiveId.value) return;
    const docId = await docSvc.create({ doc_type: newType });
    await fdSvc.addDocToFolder({ folderId: archiveId.value, docId });
    setDocEntries(await fdSvc.getArchiveDocEntries({ id: archiveId.value }));
    const doc = await docSvc.getById(docId);
    if (doc) setDoc(doc);
    await emitTo("main", "refresh");
  } catch (e) {
    console.error(e);
  }
};

const show = ref<boolean>(false);
const floating = useTemplateRef("floating");
const target = useTemplateRef("target");

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-end",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floating,
  () => {
    show.value = false;
  },
  { ignore: [computed(() => target.value)] },
);

interface PopoverListItem {
  icon: Component;
  text: string;
  action: () => void;
}

const popoverList: PopoverListItem[] = [
  {
    icon: DocMian,
    text: "富文本",
    action: () => {
      createDoc("richText");
      show.value = false;
    },
  },
  {
    icon: MindmapMian,
    text: "思维导图",
    action: () => {
      createDoc("mindMap");
      show.value = false;
    },
  },
  {
    icon: FlowchartMian,
    text: "流程图",
    action: () => {
      createDoc("flowChart");
      show.value = false;
    },
  },
];

const handleClickBtn = () => {
  show.value = !show.value;
};
</script>

<template>
  <div class="h-11 flex items-center pl-4 gap-1 border-b border-purple-300">
    <Archive class="size-4" />{{ name }}
    <div class="flex-1"></div>
    <div
      ref="target"
      class="size-7 grid place-items-center rounded-md"
      :class="show ? 'bg-gray-200' : 'bg-gray-50 hover:bg-gray-200'"
      @click="handleClickBtn"
    >
      <Add class="size-5" />
    </div>
  </div>
  <div
    v-if="show"
    ref="floating"
    class="bg-white z-10 select-none text-xs rounded-lg overflow-hidden p-1 shadow-2xl"
    :style="floatingStyles"
  >
    <div
      v-for="i in popoverList"
      class="pl-4 pr-8 py-2 flex items-center gap-2 rounded-md hover:bg-gray-100"
      @click="i.action()"
    >
      <component :is="i.icon" class="w-5 h-5" />
      <span>{{ i.text }}</span>
    </div>
  </div>
  <Drag
    :list="docEntries"
    :animation="200"
    ghost-class="ghost"
    item-key="id"
    @end="dragEnd"
  >
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
        <span>{{ element.title || "未命名标题" }}</span>
      </div>
    </template>
  </Drag>
</template>
