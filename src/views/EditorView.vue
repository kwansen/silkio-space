<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useFdSvc } from "@/services/folder";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted, ref } from "vue";

const id = ref("");
const title = ref("");
const content = ref("");
const oldTitle = ref("");
const oldContent = ref("");

const key = ref("");
const archiveId = ref("");
const fdSvc = useFdSvc();
const viewType = ref<"archive" | "doc">("archive");
let stopOnOpen: (() => void) | null = null;
const docSvc = useDocSvc();

// 打开事件序号：连续快速打开多个文档时 getById 是异步的，可能乱序返回，
// 用序号丢弃过期结果，避免旧文档的标题/内容覆盖新打开的文档
let openSeq = 0;

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    async (event) => {
      const seq = ++openSeq;
      const data = event.payload;
      const t = data.type;
      viewType.value = t;
      if (t === "doc") {
        const doc = await docSvc.getById(data.id);
        if (seq !== openSeq) return;
        key.value = String(seq);
        // 数据加载完成后再切换 id，加载期间旧编辑器仍可编辑且保存目标不变
        id.value = data.id;
        title.value = doc?.title || "";
        content.value = doc?.content || "";
        // 重置比对基线，避免跨文档误判“内容未变化”而跳过保存
        oldTitle.value = title.value;
        oldContent.value = content.value;
      } else if (t === "archive") {
        const folderId = data.id;
        archiveId.value = folderId;
        const archive = await fdSvc.getFolderById({ id: folderId });
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

import { useDebounceFn } from "@vueuse/core";
import { emitTo } from "@tauri-apps/api/event";
import { useDocSvc } from "@/services/document";

const delayedSaveTitle = useDebounceFn(async (docId: string, v: string) => {
  if (v === oldTitle.value) return;
  await docSvc.update(docId, { title: v });
  oldTitle.value = v;
  // 等保存落库完成后再通知主窗口刷新，否则主窗口会查到旧数据
  emitTo("main", "refresh");
}, 1000);

const onTitleSave = (v: string) => {
  // 事件触发时就固定文档 id，避免 debounce 触发时 id 已切换成新文档，
  // 把旧文档的标题写进新打开的文档
  delayedSaveTitle(id.value, v);
};

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
  delayedSaveContent(id.value, content, plain_text, word_count);
};
</script>

<template>
  <div class="w-full h-full flex">
    <LeftBar :id="archiveId" />
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText
          v-if="viewType === 'doc'"
          :id="id"
          :title="title"
          :content="content"
          :key="key"
          @on-ready="ready"
          @on-title-save="onTitleSave"
          @on-content-save="onContentSave"
        />
        <EditorEmpty
          v-if="viewType === 'archive'"
          :key="key"
          @on-ready="ready"
        />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
