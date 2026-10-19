<script setup lang="ts">
import ScrollArea from "@/components/shared/ScrollArea.vue";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import {
  BulletList,
  ListItem,
  ListKeymap,
  OrderedList,
  TaskItem,
  TaskList,
} from "@tiptap/extension-list";
import Mathematics from "@tiptap/extension-mathematics";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { UndoRedo, Gapcursor, TrailingNode } from "@tiptap/extensions";
import { Editor, EditorContent } from "@tiptap/vue-3";
import "@/assets/richtext/index.css";
import RichTextToolbar from "./RichTextToolbar.vue";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { useUiStore } from "@/stores/uiStore.ts";
import RichTextLinkDialog from "./RichTextLinkDialog.vue";
import RichTextTableToolbar from "./RichTextTableToolbar.vue";
import RichTextMathInsertDialog from "./RichTextMathInsertDialog.vue";
import RichTextMathUpdateDialog from "./RichTextMathUpdateDialog.vue";
import { storeToRefs } from "pinia";
import "katex/dist/katex.min.css";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import type { Node } from "@tiptap/pm/model";
import RichtextImageDialog from "./RichtextImageDialog.vue";
import RichTextTitle from "./RichTextTitle.vue";
import { CustomHr } from "./extensions/CustomHr.ts";
import { CustomCodeBlock } from "./extensions/CustomCodeBlock.ts";
import { CustomLink } from "./extensions/CustomLink.ts";
// import CodeBlock from "@tiptap/extension-code-block";
import { CustomShortcut } from "./extensions/customShortcut.ts";
import FindAndReplace from "@tiptap/extension-find-and-replace";
import { useDocSvc } from "@/services/document.ts";
import { nextTick } from "vue";

const node = ref<Node>();
const pos = ref<number>(0);
const block = ref<boolean>(false);
const oldTitle = ref("");
const oldContent = ref("");

const uiStore = useUiStore();
const { richtextDialog: dialog } = storeToRefs(uiStore);

const openMathDialog = (n: Node, p: number, b: boolean) => {
  node.value = n;
  pos.value = p;
  block.value = b;
};

const closeMathDialog = () => {
  node.value = undefined;
  pos.value = 0;
  block.value = false;
};

const createEditor = (v: any): Editor => {
  return new Editor({
    content: v,
    extensions: [
      FindAndReplace,
      CustomShortcut,
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Strike,
      Code,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Blockquote,
      // CodeBlock,
      CustomCodeBlock.configure({
        enableTabIndentation: true,
        tabSize: 4, // 设置缩进空格数
      }),
      // HorizontalRule,
      CustomHr,
      HardBreak,
      CustomLink.configure({
        openOnClick: false,
        markdownLinks: true,
        defaultProtocol: "https",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image,
      Subscript,
      Superscript,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      ListKeymap.configure({
        listTypes: [
          { itemName: "listItem", wrapperNames: ["bulletList", "orderedList"] },
          { itemName: "taskItem", wrapperNames: ["taskList"] },
        ],
      }),
      UndoRedo,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos) => openMathDialog(node, pos, false),
        },
        blockOptions: {
          onClick: (node, pos) => openMathDialog(node, pos, true),
        },
      }),
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
      Gapcursor,
      TrailingNode,
    ],
    onUpdate: ({ editor }) => {
      content.value = JSON.stringify(editor.getJSON());
      if (content.value === oldContent.value) return;
      const text = editor.getText();
      const length = text.length;
      delayedSaveContent(content.value, text, length);
      oldContent.value = content.value;
    },
  });
};

// 对话框关闭后（FocusScope 已卸载）把焦点还给编辑器，
// 否则焦点落在 body 上，addKeyboardShortcuts 的快捷键不会触发
watch(
  dialog,
  (val, oldVal) => {
    if (oldVal && !val) {
      editor.value?.commands.focus();
    }
  },
  { flush: "post" },
);

interface Props {
  id: string;
}

const editor = shallowRef<Editor>();

const props = defineProps<Props>();
const svc = useDocSvc();

const title = ref("");
const content = ref("");

const emit = defineEmits<{
  onReady: []; // 事件名是 ready，参数是一个空元组
}>();

onMounted(async () => {
  const doc = await svc.getById(props.id);
  if (doc) {
    const t = doc.title || "";
    title.value = t;
    oldTitle.value = t;
    const c = doc.content || "";
    content.value = c;
    oldContent.value = c;
    let v;
    try {
      v = JSON.parse(c);
    } catch {
      v = c;
    }
    editor.value = createEditor(v);
  }
  // 等待dom加载完毕,再通知父组件打开窗口，否则打开新文档时，dom未加载完毕，窗口打开有dom的闪烁
  await nextTick();
  emit("onReady");
});

import { useDebounceFn } from "@vueuse/core";
import { emitTo } from "@tauri-apps/api/event";

const delayedSaveTitle = useDebounceFn(async (v: string) => {
  await svc.update(props.id, { title: v });
  // 等保存落库完成后再通知主窗口刷新，否则主窗口会查到旧数据
  emitTo("main", "refresh");
}, 1000);

watch(
  () => title.value,
  (v) => {
    // 防止重复保存，尤其是最开始挂载引发保存
    if (v === oldTitle.value) return;
    delayedSaveTitle(v);
    oldTitle.value = v;
  },
);

const delayedSaveContent = useDebounceFn(
  async (content: string, plain_text: string, word_count: number) => {
    await svc.update(props.id, {
      content: content,
      plain_text: plain_text,
      word_count: word_count,
    });
    // 等保存落库完成后再通知主窗口刷新，否则主窗口会查到旧数据
    emitTo("main", "refresh");
  },
  1000,
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <RichTextToolbar :editor="editor" />
    <div class="flex-1 min-h-0">
      <ScrollArea class="relative">
        <div class="w-full max-w-176 mx-auto relative">
          <RichTextTitle :editor="editor" v-model="title" />
          <EditorContent :editor="editor" class="" />
          <div
            class="h-screen cursor-text"
            @click="editor?.chain().focus('end').run()"
          ></div>
          <RichTextTableToolbar
            v-if="editor?.isActive('table')"
            :editor="editor"
          />
        </div>
      </ScrollArea>
    </div>
  </div>
  <RichTextLinkDialog :editor="editor" v-if="dialog === 'link'" />
  <RichtextImageDialog :editor="editor" v-if="dialog === 'image'" />
  <RichTextMathInsertDialog :editor="editor" v-if="dialog === 'math'" />
  <RichTextMathUpdateDialog
    v-if="node"
    :editor="editor"
    :node="node"
    :pos="pos"
    :block="block"
    @close="closeMathDialog"
  />
</template>
