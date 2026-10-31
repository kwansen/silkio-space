<script setup lang="ts">
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import "@/assets/richtext/index.css";
import RichTextToolbar from "./RichTextToolbar.vue";
import RichTextLinkDialog from "./RichTextLinkDialog.vue";
import RichTextTableToolbar from "./RichTextTableToolbar.vue";
import RichTextMathInsertDialog from "./RichTextMathInsertDialog.vue";
import RichTextMathUpdateDialog from "./RichTextMathUpdateDialog.vue";
import { storeToRefs } from "pinia";
import "katex/dist/katex.min.css";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { Node } from "@tiptap/pm/model";
import RichtextImageDialog from "./RichtextImageDialog.vue";
import RichTextTitle from "./RichTextTitle.vue";
import { nextTick } from "vue";
import { useEditorStore } from "@/stores/editorStore.ts";
import type { OverlayScrollbars } from "overlayscrollbars";
import { createExtensions } from "./extensions";

const node = ref<Node>();
const pos = ref<number>(0);
const block = ref<boolean>(false);
const editorStore = useEditorStore();

const { richtextDialog: dialog } = storeToRefs(editorStore);

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

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const editorReady = ref<boolean>(false);
const tocReady = ref<boolean>(false);

const allReady = computed(() => {
  if (!editorReady.value) return false;
  else if (!tocReady.value) return false;
  else return true;
});

// 保证渲染完成后再打开，否则闪烁
watch(
  () => allReady.value,
  async (v) => {
    if (!v) return;
    await nextTick(); // 等 sidebar/toc 渲染提交
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r)); // 等 paint
    emit("onReady");
  },
);

const createEditor = (v: any): Editor => {
  return new Editor({
    content: v,
    extensions: createExtensions({
      onMathClick: openMathDialog,
      onTocUpdate: (content) => {
        editorStore.toc = content;
        tocReady.value = true;
      },
    }),
    onUpdate: ({ editor }) => {
      content.value = JSON.stringify(editor.getJSON());
      const text = editor.getText();
      const length = text.length;
      emit("onContentSave", content.value, text, length);
    },
    onCreate: () => {
      editorReady.value = true;
      // emit("onReady");
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

// 编辑区滚动发生在 OverlayScrollbars 视口里而非 window，
// 而 table-of-contents 扩展默认监听 window 滚动来计算 isActive，
// 导致 toc 项的 isActive 永远为 false、目录高亮不生效。
// 这里手动同步滚动位置并触发目录重算。
const onScrollViewport = (os: OverlayScrollbars) => {
  if (!editor.value) return;
  const storage = editor.value.storage.tableOfContents;
  if (!storage) return;
  storage.scrollPosition = os.elements().viewport.scrollTop;
  editor.value.commands.updateTableOfContents();
};

interface Props {
  content: string;
}

const editor = shallowRef<Editor>();

const props = defineProps<Props>();

const content = ref("");

onMounted(async () => {
  const c = props.content;
  content.value = c;
  let v;
  try {
    v = JSON.parse(c);
  } catch {
    v = c;
  }
  editor.value = createEditor(v);
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <RichTextToolbar :editor="editor" />
    <div class="flex-1 min-h-0">
      <ScrollArea class="relative" @os-scroll="onScrollViewport">
        <div class="w-full max-w-176 mx-auto relative">
          <RichTextTitle :editor="editor" />
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
