<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useTemplateRef, computed } from "vue";
import RichTextToolbar from "./RichTextToolbar.vue";
import { EditorContent as RichTextEditor } from "@tiptap/vue-3";
import { useDoc } from "@/composables/useDocuments.ts";
import { useEditorViewStore } from "@/stores/editorView";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import RichTextTitle from "./RichTextTitle.vue";
import { createRichtextEditor } from "@/composables/useRichtext.ts";
import "@/assets/richtext/index.css";
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

interface Emits {
  onReady: [];
}

const emit = defineEmits<Emits>();

const scrollAreaRef = useTemplateRef<HTMLDivElement>("scrollAreaRef");
const titleRef = useTemplateRef<HTMLElement>("titleRef");
const scrollAreaHeight = ref(0);

let resizeObserver: ResizeObserver | null = null;

// 计算滚动区域高度的一半作为最后一个div的最小高度
const minHalfHeight = computed(() => `${scrollAreaHeight.value / 2}px`);

onMounted(() => {
  emit("onReady");
  // 元函数：挂载后回填文档标题
  title.value = store.doc?.title ?? "";
  // 元函数：挂载后聚焦标题输入框
  titleRef.value?.focus();
  if (scrollAreaRef.value) {
    scrollAreaHeight.value = scrollAreaRef.value.clientHeight;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        scrollAreaHeight.value = entry.contentRect.height;
      }
    });
    resizeObserver.observe(scrollAreaRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

// 点击空白区域聚焦编辑器
const handleBlankClick = () => editor?.value?.commands.focus();

const title = ref<string>("");

const store = useEditorViewStore();
// 元函数：组装文档组合式函数
const { updateContent, updateTitle } = useDoc();

// 元函数：解析文档存储的 JSON 内容，空或非法时回退为空字符串
const parseContent = () => {
  const raw = store.doc?.content;
  if (!raw) return "";
  try {
    return JSON.parse(raw);
  } catch {
    return "";
  }
};

const editor = createRichtextEditor({
  content: parseContent(),
  onUpdated() {
    const ed = editor.value;
    const doc = store.doc;
    if (!ed || !doc?.id) return;
    const content = JSON.stringify(ed.getJSON());
    const plainText = ed.getText();
    // 元函数：内容变化时同步到编辑视图 store，保持侧栏大纲实时更新
    doc.content = content;
    doc.plain_text = plainText;
    // 元函数：内容变化时保存 JSON 内容与纯文本，并通知 main 窗口刷新列表
    updateContent(doc.id, content, plainText)
      .then(notifyMainRefresh)
      .catch(console.error);
  },
});

// 元函数：标题失焦时保存标题，并通知 main 窗口刷新列表
const handleTitleChange = () => {
  const doc = store.doc;
  if (!doc?.id) return;
  // 元函数：标题变化时同步到编辑视图 store，保持侧栏标题实时更新
  doc.title = title.value;
  updateTitle(doc.id, title.value).then(notifyMainRefresh).catch(console.error);
};

// 元函数：标题回车时在编辑器文档开头插入空段落并聚焦开头
const handleTitleEnter = () => {
  const ed = editor.value;
  if (!ed) return;
  ed.commands.insertContentAt(0, { type: "paragraph" });
  ed.commands.focus("start");
};

// 元函数：标题 tab 时聚焦编辑器首行末尾
const handleTitleTab = () => {
  const ed = editor.value;
  if (!ed) return;
  const first = ed.state.doc.content.firstChild;
  if (!first) return;
  ed.commands.setTextSelection(first.nodeSize);
  ed.commands.focus();
};
</script>

<template>
  <div class="w-full h-full" ref="scrollAreaRef">
    <OverlayScrollbarsComponent defer class="w-full h-full">
        <!-- Toolbar：不占用 flex 空间，固定高度 -->
        <RichTextToolbar :editor="editor" class="sticky top-0 z-10" />
        <div class="w-full max-w-176 mx-auto flex flex-col">
          <RichTextTitle
            ref="titleRef"
            :editor="editor"
            v-model="title"
            class="w-full px-6 py-2"
            @on-change="handleTitleChange"
            @on-enter="handleTitleEnter"
            @on-tab="handleTitleTab"
          />
          <RichTextEditor :editor="editor" class="px-6 pt-6 pb-4 outline-none" />
          <div
            class="flex-1 bg-green-100"
            :style="{ minHeight: minHalfHeight }"
            @click="handleBlankClick"
          ></div>
        </div>
    </OverlayScrollbarsComponent>
  </div>
</template>
<style>
.ProseMirror:focus {
  outline: none !important;
}
/* 高亮、任务列表等扩展样式见 src/assets/richtext/ */
</style>
