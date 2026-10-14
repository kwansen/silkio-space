import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import HardBreak from "@tiptap/extension-hard-break";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  BulletList,
  OrderedList,
  ListItem,
  ListKeymap,
  TaskList,
  TaskItem,
} from "@tiptap/extension-list";
import { UndoRedo } from "@tiptap/extensions";
import { Mathematics } from "@tiptap/extension-mathematics";
import { TableKit } from "@tiptap/extension-table";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Editor, useEditor } from "@tiptap/vue-3";
import { Ref } from "vue";

interface Options {
  content: string;
  onUpdated: () => void;
}

const extensions = [
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
  TableKit,
];

export const createRichtextEditor = (
  options: Options,
): Ref<Editor | undefined> => {
  const { content, onUpdated } = options;
  const editor = useEditor({
    content: content,
    extensions: extensions,
    onUpdate: () => onUpdated(),
  });
  return editor;
};
