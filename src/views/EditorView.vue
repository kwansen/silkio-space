<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useFdSvc } from "@/services/folder";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted, ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { emitTo } from "@tauri-apps/api/event";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { storeToRefs } from "pinia";

const oldContent = ref("");

const archiveId = ref("");
const fdSvc = useFdSvc();
let stopOnOpen: (() => void) | null = null;
const docSvc = useDocSvc();

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    async (event) => {
      const data = event.payload;
      const t = data.type;
      if (t === "doc") {
        const doc = await docSvc.getById(data.id);
        setId(doc?.id);
        const c = doc?.content || "";
        oldContent.value = c;
        setTitle(doc?.title || "");
        setContent(c);
        setDocType(doc?.doc_type);
        setKey(Date.now().toString());
      } else if (t === "archive") {
        archiveId.value = data.id;
        const docEntries = await fdSvc.getArchiveDocEntries({ id: data.id });
        setDocEntries(docEntries);
        const doc = docEntries[0]
          ? await docSvc.getById(docEntries[0].id)
          : null;
        setId(doc?.id);
        const c = doc?.content || "";
        oldContent.value = c;
        setTitle(doc?.title || "");
        setContent(c);
        setDocType(doc?.doc_type);
        setKey(Date.now().toString());
      }
    },
  );
});

const ready = () => {
  getCurrentWindow().unminimize();
  getCurrentWindow().show();
  getCurrentWindow().setFocus();
};

onUnmounted(() => {
  stopOnOpen?.();
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

const editorStore = useEditorStore();
const { id, docEntries, title, content, docType, key } =
  storeToRefs(editorStore);
const { setId, setTitle, setContent, setDocType, setDocEntries, setKey } =
  editorStore;
</script>

<template>
  <div class="w-full h-full flex">
    <LeftBar v-if="docEntries" v-model="docEntries" />
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText
          v-if="docType === 'richText'"
          :title="title"
          :content="content"
          :key="key"
          @on-ready="ready"
          @on-content-save="onContentSave"
        />
        <EditorEmpty v-if="!docType" :key="key" @on-ready="ready" />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
