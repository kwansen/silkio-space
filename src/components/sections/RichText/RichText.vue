<script setup lang="ts">
import ScrollArea from "@/components/shared/ScrollArea.vue";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
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
import { UndoRedo } from "@tiptap/extensions";
import { Editor, EditorContent, useEditor } from "@tiptap/vue-3";
import "@/assets/richtext/index.css";
import RichTextToolbar from "./RichTextToolbar.vue";

const editor = useEditor({
  extensions: [
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
    CodeBlock,
    HorizontalRule,
    HardBreak,
    Link.configure({ openOnClick: false }),
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
    Mathematics,
  ],
});
</script>

<template>
  <ScrollArea>
    <RichTextToolbar />
    <div class="w-full max-w-176 mx-auto">
      <input class="h-10 w-full outline-none" />
      <EditorContent :editor="editor" />
      <div class="h-screen bg-red-200"></div>
    </div>
  </ScrollArea>
</template>
