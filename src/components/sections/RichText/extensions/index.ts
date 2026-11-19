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
  getHierarchicalIndexes,
  TableOfContents,
} from "@tiptap/extension-table-of-contents";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
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
import { Markdown } from "@tiptap/markdown";
import { UniqueID } from "@tiptap/extension-unique-id";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import FindAndReplace from "@tiptap/extension-find-and-replace";
import type { Node } from "@tiptap/pm/model";
import { CustomHr } from "./CustomHr.ts";
import { CustomCodeBlock } from "./CustomCodeBlock.ts";
import { CustomLink } from "./CustomLink.ts";
import { CustomShortcut } from "./customShortcut.ts";

// 富文本完整扩展清单：与组件耦合的只有数学公式点击（弹窗状态）与目录更新（就绪信号），以回调注入
export const createExtensions = (options: {
  onMathClick: (node: Node, pos: number, isBlock: boolean) => void;
  onTocUpdate: (content: TableOfContentData) => void;
}) => [
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
  CustomCodeBlock.configure({
    enableTabIndentation: true,
    tabSize: 4, // 设置缩进空格数
  }),
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
  // Markdown 扩展：文档 ↔ Markdown 双向转换，AI 编辑控制器据此把模型输出的
  // Markdown content 转成合法文档块（默认 contentType 仍为 json，不影响既有存取链路）
  Markdown,
  // UniqueID：为顶层块节点注入持久化 id 属性（随文档 JSON 落库），供 AI 编辑
  // 协议按 id 稳定定位目标块（旧文档在 onCreate 时自动补齐，不进撤销历史）。
  // 仅顶层块类型：target 定位粒度为顶层块，嵌套节点不参与定位；
  // generateID 用 12 位 base36（文档内唯一即可，比默认 UUID v4 省提示词体积）
  UniqueID.configure({
    types: [
      "paragraph",
      "heading",
      "blockquote",
      "codeBlock",
      "bulletList",
      "orderedList",
      "taskList",
      "table",
      "image",
      "horizontalRule",
      "blockMath",
    ],
    generateID: () => {
      // 12 位 base36；随机数转 base36 可能因尾零变短，循环补齐保证定长
      let s = Math.random().toString(36).slice(2);
      while (s.length < 12) s += Math.floor(Math.random() * 36).toString(36);
      return s.slice(0, 12);
    },
  }),
  Mathematics.configure({
    inlineOptions: {
      onClick: (node, pos) => options.onMathClick(node, pos, false),
    },
    blockOptions: {
      onClick: (node, pos) => options.onMathClick(node, pos, true),
    },
  }),
  Table.configure({ resizable: true }),
  TableCell,
  TableHeader,
  TableRow,
  Gapcursor,
  TrailingNode,
  TableOfContents.configure({
    getIndex: getHierarchicalIndexes,
    onUpdate: (content) => options.onTocUpdate(content),
  }),
];
