<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useFdSvc } from "@/services/folder";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { nextTick, onMounted, onUnmounted } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { emitTo } from "@tauri-apps/api/event";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/stores/uiStore";

const editorStore = useEditorStore();
const uiStore = useUiStore();
const { id, docEntries, content, docType, key, oldContent, name, archiveId } =
  storeToRefs(editorStore);
const { setDoc, setDocEntries, setArchiveId } = editorStore;

const fdSvc = useFdSvc();
let stopOnOpen: (() => void) | null = null;
let stopOnDelete: (() => void) | null = null;
const docSvc = useDocSvc();

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    async (event) => {
      const data = event.payload;
      const t = data.type;
      if (t === "doc") {
        const doc = await docSvc.getById(data.id);
        uiStore.setEditorMode("doc");
        uiStore.setLeftbarOption("toc");
        setDoc(doc);
      } else if (t === "archive") {
        uiStore.setEditorMode("archive");
        uiStore.setLeftbarOption("docEntries");
        setArchiveId(data.id);
        const docEntries = await fdSvc.getArchiveDocEntries({ id: data.id });
        try {
          name.value = await fdSvc.getArchiveName({ id: data.id });
        } catch (e) {
          console.error(e);
        }

        setDocEntries(docEntries);
        const doc = docEntries[0]
          ? await docSvc.getById(docEntries[0].id)
          : null;
        setDoc(doc);
        // 空归档没有富文本视图挂载、不会有就绪信号，渲染完成后直接显示窗口
        if (!doc) {
          await nextTick();
          showWindow();
        }
      }
    },
  );

  // 监听 main 窗口的文档删除事件（删除落库时关联已随之清理，是否刷新依据本地目录判断）
  stopOnDelete = await listen<{ type: "doc"; id: string }>(
    "delete",
    async (event) => {
      const deletedId = event.payload.id;
      // 被删文档有关联且在当前归档目录中：刷新左侧目录
      if (archiveId.value && docEntries.value.some((e) => e.id === deletedId)) {
        setDocEntries(
          await fdSvc.getArchiveDocEntries({ id: archiveId.value }),
        );
      }
      // 展示的正是被删文档：切到目录首项，无则清空编辑区
      if (id.value === deletedId) {
        const next = docEntries.value[0];
        if (next) {
          setDoc(await docSvc.getById(next.id));
        } else {
          setDoc(null);
        }
      }
    },
  );
});

// 显示窗口：由 RichText 的就绪信号或空态渲染完成后调用
const showWindow = () => {
  getCurrentWindow().unminimize();
  getCurrentWindow().show();
  getCurrentWindow().setFocus();
  emitTo("main", "refresh");
};

onUnmounted(() => {
  stopOnOpen?.();
  stopOnDelete?.();
});

const delayedSaveContent = useDebounceFn(
  async (
    docId: string,
    content: string,
    plain_text: string,
    word_count: number,
  ) => {
    if (content === oldContent.value) return;
    await docSvc.update(docId, {
      content: content,
      plain_text: plain_text,
      word_count: word_count,
    });
    oldContent.value = content;
    // 等保存落库完成后再通知主窗口刷新，否则主窗口会查到旧数据
    emitTo("main", "refresh");
  },
  1000,
);

const onContentSave = (
  content: string,
  plain_text: string,
  word_count: number,
) => {
  if (!id.value) return;
  delayedSaveContent(id.value, content, plain_text, word_count);
};
</script>

<template>
  <div
    class="w-full h-full grid place-items-center"
    v-if="uiStore.editorMode === 'doc' && !id"
  >
    空空如也
  </div>
  <div class="w-full h-full flex" v-else>
    <LeftBar v-if="uiStore.showLeftbar" v-model="docEntries" />
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText
          v-if="docType === 'richText'"
          :content="content"
          :key="key"
          @on-ready="showWindow"
          @on-content-save="onContentSave"
        />
        <EditorEmpty v-if="!docType" />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
