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
import { notifyDataChanged } from "@/infrastructure/api/windowEvent";
import Close from "@/components/icons/Close.vue";

const store = useEditorStore();
const { docEntries, name, id, archiveId } = storeToRefs(store);
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
    await notifyDataChanged();
  } catch (e) {
    console.error(e);
  }
};

// 点击关闭：仅将文档移出当前归档（不删除文档本体），并刷新左侧目录
const removeEntry = async (entry: DocEntry) => {
  try {
    if (!archiveId.value) return;
    await fdSvc.removeDocFromFolder({
      folderId: archiveId.value,
      docId: entry.id,
    });
    setDocEntries(await fdSvc.getArchiveDocEntries({ id: archiveId.value }));
    // 若移出的正是当前打开的文档，则切换到列表中的第一个文档并加载（无则清空编辑区）
    if (id.value === entry.id) {
      const next = docEntries.value[0];
      if (next) {
        const doc = await docSvc.getById(next.id);
        if (doc) setDoc(doc);
      } else {
        setDoc(null);
      }
    }
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
  <div class="h-11 flex items-center pl-4 gap-1 border-b border-gray-100">
    <Archive class="size-4" />{{ name }}
    <div class="flex-1"></div>
    <div
      ref="target"
      class="size-7 grid place-items-center rounded-md cursor-pointer"
      :class="show ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'"
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
  <div class="h-2"></div>
  <Drag
    :list="docEntries"
    :animation="200"
    ghost-class="ghost"
    item-key="id"
    @end="dragEnd"
  >
    <template #item="{ element }: { element: DocEntry }">
      <div
        class="flex items-center gap-1 py-0.5 px-4 relative group"
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
        <div
          class="absolute cursor-pointer aspect-square hover:text-red-700 right-0.5 place-items-center h-full hidden group-hover:grid"
          @click.stop="removeEntry(element)"
        >
          <Close class="size-4" />
        </div>
      </div>
    </template>
  </Drag>
</template>
