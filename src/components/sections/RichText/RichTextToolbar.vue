<script setup lang="ts">
import Add from "@/components/icons/Add.vue";
import AlignCenter from "@/components/icons/AlignCenter.vue";
import AlignJustify from "@/components/icons/AlignJustify.vue";
import AlignLeft from "@/components/icons/AlignLeft.vue";
import AlignRight from "@/components/icons/AlignRight.vue";
import Bold from "@/components/icons/Bold.vue";
import CodeBlock from "@/components/icons/CodeBlock.vue";
import H1 from "@/components/icons/H1.vue";
import H2 from "@/components/icons/H2.vue";
import H3 from "@/components/icons/H3.vue";
import H4 from "@/components/icons/H4.vue";
import H5 from "@/components/icons/H5.vue";
import H6 from "@/components/icons/H6.vue";
import Highlight from "@/components/icons/Highlight.vue";
import Image from "@/components/icons/Image.vue";
import InlineCode from "@/components/icons/InlineCode.vue";
import Italic from "@/components/icons/Italic.vue";
import LetterT from "@/components/icons/LetterT.vue";
import Link from "@/components/icons/Link.vue";
import Math from "@/components/icons/Math.vue";
import OrderedList from "@/components/icons/OrderedList.vue";
import Quote from "@/components/icons/Quote.vue";
import Redo from "@/components/icons/Redo.vue";
import Strike from "@/components/icons/Strike.vue";
import Subscript from "@/components/icons/Subscript.vue";
import Superscript from "@/components/icons/Superscript.vue";
import Table from "@/components/icons/Table.vue";
import TaskList from "@/components/icons/TaskList.vue";
import Underline from "@/components/icons/Underline.vue";
import Undo from "@/components/icons/Undo.vue";
import UnorderList from "@/components/icons/UnorderList.vue";
import RSToolbarDropdown from "./RSToolbarDropdown.vue";
import { Btn, Group } from "./type.ts";
import RSToolbarInlineGroup from "./RSToolbarInlineGroup.vue";
import { Editor } from "@tiptap/vue-3";
import { useUiStore } from "@/stores/uiStore";
const uiStore = useUiStore();
const { setRichtextDialog } = uiStore;

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

//#region 历史
const undo: Btn = {
  name: "撤销",
  icon: Undo,
  shortcut: "Ctrl + Z",
  action: () => props.editor?.chain().focus().undo().run(),
  disabled: () => !props.editor?.can().undo(),
  active: () => false,
};
const redo: Btn = {
  name: "重做",
  icon: Redo,
  shortcut: "Ctrl + Y",
  action: () => props.editor?.chain().focus().redo().run(),
  disabled: () => !props.editor?.can().redo(),
  active: () => false,
};
//#endregion

//#region 文字
const bold: Btn = {
  name: "加粗",
  icon: Bold,
  shortcut: "Ctrl + B",
  action: () => props.editor?.chain().focus().toggleBold().run(),
  disabled: () => !props.editor?.can().toggleBold(),
  active: () => props.editor?.isActive("bold") ?? false,
};
const italic: Btn = {
  name: "斜体",
  icon: Italic,
  shortcut: "Ctrl + I",
  action: () => props.editor?.chain().focus().toggleItalic().run(),
  disabled: () => !props.editor?.can().toggleItalic(),
  active: () => props.editor?.isActive("italic") ?? false,
};
const underline: Btn = {
  name: "下划线",
  icon: Underline,
  shortcut: "Ctrl + U",
  action: () => props.editor?.chain().focus().toggleUnderline().run(),
  disabled: () => !props.editor?.can().toggleUnderline(),
  active: () => props.editor?.isActive("underline") ?? false,
};
const strike: Btn = {
  name: "删除线",
  icon: Strike,
  shortcut: "Ctrl + Shift + S",
  action: () => props.editor?.chain().focus().toggleStrike().run(),
  disabled: () => !props.editor?.can().toggleStrike(),
  active: () => props.editor?.isActive("strike") ?? false,
};
const superscript: Btn = {
  name: "上标",
  icon: Superscript,
  shortcut: "Ctrl + .",
  action: () => props.editor?.chain().focus().toggleSuperscript().run(),
  disabled: () => !props.editor?.can().toggleSuperscript(),
  active: () => props.editor?.isActive("superscript") ?? false,
};
const subscript: Btn = {
  name: "下标",
  icon: Subscript,
  shortcut: "Ctrl + ,",
  action: () => props.editor?.chain().focus().toggleSubscript().run(),
  disabled: () => !props.editor?.can().toggleSubscript(),
  active: () => props.editor?.isActive("subscript") ?? false,
};
const inlineCode: Btn = {
  name: "行内代码",
  icon: InlineCode,
  shortcut: "Ctrl + E",
  action: () => props.editor?.chain().focus().toggleCode().run(),
  disabled: () => !props.editor?.can().toggleCode(),
  active: () => props.editor?.isActive("code") ?? false,
};
const highlight: Btn = {
  name: "高亮",
  icon: Highlight,
  shortcut: "Ctrl + Shift + H",
  action: () => props.editor?.chain().focus().toggleHighlight().run(),
  disabled: () => !props.editor?.can().toggleHighlight(),
  active: () => props.editor?.isActive("highlight") ?? false,
};
//#endregion

//#region 段落
const paragraph: Btn = {
  name: "正文",
  icon: LetterT,
  shortcut: "Ctrl + Alt + 0",
  action: () => props.editor?.chain().focus().setParagraph().run(),
  disabled: () => !props.editor?.can().setParagraph(),
  active: () => props.editor?.isActive("paragraph") ?? false,
};
const h1: Btn = {
  name: "标题 1",
  icon: H1,
  shortcut: "Ctrl + Alt + 1",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 1 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 1 }),
  active: () => props.editor?.isActive("heading", { level: 1 }) ?? false,
};
const h2: Btn = {
  name: "标题 2",
  icon: H2,
  shortcut: "Ctrl + Alt + 2",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 2 }),
  active: () => props.editor?.isActive("heading", { level: 2 }) ?? false,
};
const h3: Btn = {
  name: "标题 3",
  icon: H3,
  shortcut: "Ctrl + Alt + 3",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 3 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 3 }),
  active: () => props.editor?.isActive("heading", { level: 3 }) ?? false,
};
const h4: Btn = {
  name: "标题 4",
  icon: H4,
  shortcut: "Ctrl + Alt + 4",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 4 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 4 }),
  active: () => props.editor?.isActive("heading", { level: 4 }) ?? false,
};
const h5: Btn = {
  name: "标题 5",
  icon: H5,
  shortcut: "Ctrl + Alt + 5",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 5 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 5 }),
  active: () => props.editor?.isActive("heading", { level: 5 }) ?? false,
};
const h6: Btn = {
  name: "标题 6",
  icon: H6,
  shortcut: "Ctrl + Alt + 6",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 6 }).run(),
  disabled: () => !props.editor?.can().toggleHeading({ level: 6 }),
  active: () => props.editor?.isActive("heading", { level: 6 }) ?? false,
};
//#endregion

//#region 列表
const orderedList: Btn = {
  name: "有序列表",
  icon: OrderedList,
  shortcut: "Ctrl + Shift + 7",
  action: () => props.editor?.chain().focus().toggleOrderedList().run(),
  disabled: () => !props.editor?.can().toggleOrderedList(),
  active: () => props.editor?.isActive("orderedList") ?? false,
};
const bulletList: Btn = {
  name: "无序列表",
  icon: UnorderList,
  shortcut: "Ctrl + Shift + 8",
  action: () => props.editor?.chain().focus().toggleBulletList().run(),
  disabled: () => !props.editor?.can().toggleBulletList(),
  active: () => props.editor?.isActive("bulletList") ?? false,
};
const taskList: Btn = {
  name: "任务列表",
  icon: TaskList,
  shortcut: "Ctrl + Shift + 9",
  action: () => props.editor?.chain().focus().toggleTaskList().run(),
  disabled: () => !props.editor?.can().toggleTaskList(),
  active: () => props.editor?.isActive("taskList") ?? false,
};
//#endregion

//#region 对齐
const alignLeft: Btn = {
  name: "左对齐",
  icon: AlignLeft,
  shortcut: "",
  action: () => props.editor?.chain().focus().setTextAlign("left").run(),
  disabled: () => !props.editor?.can().setTextAlign("left"),
  active: () => props.editor?.isActive({ textAlign: "left" }) ?? false,
};
const alignCenter: Btn = {
  name: "居中对齐",
  icon: AlignCenter,
  shortcut: "",
  action: () => props.editor?.chain().focus().setTextAlign("center").run(),
  disabled: () => !props.editor?.can().setTextAlign("center"),
  active: () => props.editor?.isActive({ textAlign: "center" }) ?? false,
};
const alignRight: Btn = {
  name: "右对齐",
  icon: AlignRight,
  shortcut: "",
  action: () => props.editor?.chain().focus().setTextAlign("right").run(),
  disabled: () => !props.editor?.can().setTextAlign("right"),
  active: () => props.editor?.isActive({ textAlign: "right" }) ?? false,
};
const alignJustify: Btn = {
  name: "两端对齐",
  icon: AlignJustify,
  shortcut: "",
  action: () => props.editor?.chain().focus().setTextAlign("justify").run(),
  disabled: () => !props.editor?.can().setTextAlign("justify"),
  active: () => props.editor?.isActive({ textAlign: "justify" }) ?? false,
};
//#endregion

//#region 插入
const link: Btn = {
  name: "链接",
  icon: Link,
  shortcut: "",
  action: () => setRichtextDialog("link"),
  disabled: () => !props.editor?.can().setLink({ href: "#" }),
  active: () => props.editor?.isActive("link") ?? false,
};
const math: Btn = {
  name: "公式",
  icon: Math,
  shortcut: "",
  action: () => setRichtextDialog("math"),
  disabled: () => !props.editor?.can().insertContent("$ E = mc^2 $"),
  active: () => false,
};
const blockquote: Btn = {
  name: "引用",
  icon: Quote,
  shortcut: "Ctrl + Shift + B",
  action: () => props.editor?.chain().focus().toggleBlockquote().run(),
  disabled: () => !props.editor?.can().toggleBlockquote(),
  active: () => props.editor?.isActive("blockquote") ?? false,
};
const codeBlock: Btn = {
  name: "代码块",
  icon: CodeBlock,
  shortcut: "Ctrl + Alt + C",
  action: () => props.editor?.chain().focus().toggleCodeBlock().run(),
  disabled: () => !props.editor?.can().toggleCodeBlock(),
  active: () => props.editor?.isActive("codeBlock") ?? false,
};
const table: Btn = {
  name: "表格",
  icon: Table,
  shortcut: "",
  action: () =>
    props.editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run(),
  disabled: () =>
    !props.editor?.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
  active: () => false,
};
const image: Btn = {
  name: "图片",
  icon: Image,
  shortcut: "",
  action: () => {
    const src = window.prompt("请输入图片地址");
    if (src) props.editor?.chain().focus().setImage({ src }).run();
  },
  disabled: () => !props.editor?.can().setImage({ src: "#" }),
  active: () => false,
};
//#endregion

const groupList: Group[] = [
  { name: "历史", button: [undo, redo], type: "inline", groupIcon: H1 },
  {
    name: "文字",
    button: [
      bold,
      italic,
      underline,
      strike,
      superscript,
      subscript,
      inlineCode,
      highlight,
    ],
    type: "inline",
    groupIcon: Bold,
  },
  {
    name: "段落",
    button: [paragraph, h1, h2, h3, h4, h5, h6],
    type: "grouped",
    groupIcon: H1,
  },
  {
    name: "列表",
    button: [orderedList, bulletList, taskList],
    type: "grouped",
    groupIcon: UnorderList,
  },
  {
    name: "对齐",
    button: [alignLeft, alignCenter, alignRight, alignJustify],
    type: "grouped",
    groupIcon: AlignJustify,
  },
  {
    name: "插入",
    button: [link, math, blockquote, codeBlock, table, image],
    type: "inline",
    groupIcon: Add,
  },
];
</script>

<template>
  <div class="sticky top-0 z-10 h-10 bg-gray-100 flex items-center">
    <div v-for="group in groupList" class="flex h-full items-center">
      <RSToolbarInlineGroup v-if="group.type === 'inline'" :group="group" />
      <!-- 下拉菜单 -->
      <RSToolbarDropdown v-else-if="group.type === 'grouped'" :group="group" />

      <!-- 分隔符，对齐后面永远有，插入后面永远没有 -->
      <div
        v-if="
          (group.type === 'inline' && group.name !== '插入') ||
          group.name === '对齐'
        "
        class="h-1/3 border-x text-neutral-300 mx-1"
      ></div>
    </div>
  </div>
</template>
