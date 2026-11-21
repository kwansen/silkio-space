<script setup lang="ts">
import AlignCenter from "@/components/icons/AlignCenter.vue";
import AlignJustify from "@/components/icons/AlignJustify.vue";
import AlignStart from "@/components/icons/AlignStart.vue";
import AlignEnd from "@/components/icons/AlignEnd.vue";
import Bold from "@/components/icons/Bold.vue";
import SquareCode from "@/components/icons/SquareCode.vue";
import H1 from "@/components/icons/H1.vue";
import H2 from "@/components/icons/H2.vue";
import H3 from "@/components/icons/H3.vue";
import H4 from "@/components/icons/H4.vue";
import H5 from "@/components/icons/H5.vue";
import H6 from "@/components/icons/H6.vue";
import Highlight from "@/components/icons/Highlight.vue";
import Image from "@/components/icons/Image.vue";
import Code from "@/components/icons/Code.vue";
import Italic from "@/components/icons/Italic.vue";
import LetterT from "@/components/icons/LetterT.vue";
import Link from "@/components/icons/Link.vue";
import Sigma from "@/components/icons/Sigma.vue";
import OrderedList from "@/components/icons/OrderedList.vue";
import Quote from "@/components/icons/Quote.vue";
import Redo from "@/components/icons/Redo.vue";
import Strike from "@/components/icons/Strike.vue";
import Subscript from "@/components/icons/Subscript.vue";
import Superscript from "@/components/icons/Superscript.vue";
import Table from "@/components/icons/Table.vue";
import CheckList from "@/components/icons/CheckList.vue";
import Underline from "@/components/icons/Underline.vue";
import Undo from "@/components/icons/Undo.vue";
import BulletList from "@/components/icons/BulletList.vue";
import RSToolbarDropdown from "./RSToolbarDropdown.vue";
import RTSearchPopover from "./RTSearchPopover.vue";
import { Editor } from "@tiptap/vue-3";
import { useRichtextStore } from "@/stores/richtextStore";
import Eraser from "@/components/icons/Eraser.vue";
import GapVertical from "@/components/icons/GapVertical.vue";
import { Btn } from "./type.ts";
import RSToolbarBtn from "./RSToolbarBtn.vue";
import { computed, useTemplateRef } from "vue";
import { useElementSize } from "@vueuse/core";
const { setDialog } = useRichtextStore();

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
  icon: Code,
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
  icon: BulletList,
  shortcut: "Ctrl + Shift + 8",
  action: () => props.editor?.chain().focus().toggleBulletList().run(),
  disabled: () => !props.editor?.can().toggleBulletList(),
  active: () => props.editor?.isActive("bulletList") ?? false,
};
const taskList: Btn = {
  name: "任务列表",
  icon: CheckList,
  shortcut: "Ctrl + Shift + 9",
  action: () => props.editor?.chain().focus().toggleTaskList().run(),
  disabled: () => !props.editor?.can().toggleTaskList(),
  active: () => props.editor?.isActive("taskList") ?? false,
};
//#endregion

//#region 对齐
const alignLeft: Btn = {
  name: "左对齐",
  icon: AlignStart,
  shortcut: "Ctrl + Shift + L",
  action: () => props.editor?.chain().focus().setTextAlign("left").run(),
  disabled: () => !props.editor?.can().setTextAlign("left"),
  active: () => props.editor?.isActive({ textAlign: "left" }) ?? false,
};
const alignCenter: Btn = {
  name: "居中对齐",
  icon: AlignCenter,
  shortcut: "Ctrl + Shift + E",
  action: () => props.editor?.chain().focus().setTextAlign("center").run(),
  disabled: () => !props.editor?.can().setTextAlign("center"),
  active: () => props.editor?.isActive({ textAlign: "center" }) ?? false,
};
const alignRight: Btn = {
  name: "右对齐",
  icon: AlignEnd,
  shortcut: "Ctrl + Shift + R",
  action: () => props.editor?.chain().focus().setTextAlign("right").run(),
  disabled: () => !props.editor?.can().setTextAlign("right"),
  active: () => props.editor?.isActive({ textAlign: "right" }) ?? false,
};
const alignJustify: Btn = {
  name: "两端对齐",
  icon: AlignJustify,
  shortcut: "Ctrl + Shift + J",
  action: () => props.editor?.chain().focus().setTextAlign("justify").run(),
  disabled: () => !props.editor?.can().setTextAlign("justify"),
  active: () => props.editor?.isActive({ textAlign: "justify" }) ?? false,
};
//#endregion

//#region 插入
const link: Btn = {
  name: "链接",
  icon: Link,
  shortcut: "Ctrl + K",
  action: () => setDialog("link"),
  disabled: () => !props.editor?.can().setLink({ href: "#" }),
  active: () => props.editor?.isActive("link") ?? false,
};
const math: Btn = {
  name: "公式",
  icon: Sigma,
  shortcut: "Ctrl + Shift + M",
  action: () => setDialog("math"),
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
  icon: SquareCode,
  shortcut: "Ctrl + Alt + C",
  action: () => props.editor?.chain().focus().toggleCodeBlock().run(),
  disabled: () => !props.editor?.can().toggleCodeBlock(),
  active: () => props.editor?.isActive("codeBlock") ?? false,
};
const table: Btn = {
  name: "表格",
  icon: Table,
  shortcut: "Ctrl + Shift + T",
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
  shortcut: "Ctrl + Alt + I",
  action: () => setDialog("image"),
  disabled: () => !props.editor?.can().setImage({ src: "#" }),
  active: () => false,
};
const divider: Btn = {
  name: "分割线",
  icon: GapVertical,
  shortcut: "Ctrl + Shift + -",
  action: () => props.editor?.chain().focus().setHorizontalRule().run(),
  disabled: () => !props.editor?.can().setHorizontalRule(),
  active: () => false,
};
//#endregion

//#region 清除
const clear: Btn = {
  name: "清除",
  icon: Eraser,
  shortcut: "Ctrl + \\",
  action: () => props.editor?.chain().focus().unsetAllMarks().run(),
  disabled: () => false,
  active: () => false,
};
//#endregion

// 五个类别：文字 / 正文与标题 / 列表 / 对齐 / 插入
const textBtns: Btn[] = [
  bold,
  italic,
  underline,
  strike,
  superscript,
  subscript,
  inlineCode,
  highlight,
  clear,
];
const headingBtns: Btn[] = [paragraph, h1, h2, h3, h4, h5, h6];
const listBtns: Btn[] = [orderedList, bulletList, taskList];
const alignBtns: Btn[] = [alignLeft, alignCenter, alignRight, alignJustify];
const insertBtns: Btn[] = [
  link,
  math,
  blockquote,
  codeBlock,
  table,
  image,
  divider,
];

// —— 手动精算的档位表 ——
// 每档折叠项按"折叠收益 ≈ 溢出量"配平，剩余空白 ≤60px，工具栏始终接近满宽。
// 折叠收益（平铺宽 - 折叠后下拉 48px）：列表 64 / 对齐 104 / 正文 224 / 插入 224 / 文字 304
// 全平铺 ≈1366px，全折叠 ≈446px（窗口最小宽度已保证放得下）。
// 阈值含少量安全余量，如实际渲染有偏差可微调。
const TIERS: { min: number; flat: string[] }[] = [
  { min: 1366, flat: ["text", "heading", "list", "align", "insert"] },
  { min: 1310, flat: ["text", "heading", "align", "insert"] },
  { min: 1206, flat: ["text", "heading", "insert"] },
  { min: 982, flat: ["text", "insert"] },
  { min: 758, flat: ["text"] },
  { min: 678, flat: ["insert"] },
  { min: 622, flat: ["list", "align"] },
  { min: 558, flat: ["align"] },
  { min: 518, flat: ["list"] },
  { min: 0, flat: [] },
];

const containerRef = useTemplateRef("containerRef");
const { width } = useElementSize(containerRef);

// 当前档位下平铺的类别
const flatSet = computed(
  () =>
    new Set(
      (TIERS.find((t) => width.value >= t.min) ?? TIERS[TIERS.length - 1]).flat,
    ),
);
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-11 px-1.5 bg-gray-100 flex items-center gap-2 overflow-hidden"
  >
    <RSToolbarBtn :b="undo" />
    <RSToolbarBtn :b="redo" />
    <div class="h-1/3 border-x text-neutral-300 shrink-0"></div>

    <!-- 文字 -->
    <div v-if="flatSet.has('text')" class="flex items-center gap-2 shrink-0">
      <RSToolbarBtn v-for="b in textBtns" :key="b.name" :b="b" />
    </div>
    <RSToolbarDropdown v-else :icon="Bold" :buttons="textBtns" />

    <!-- 正文与标题 -->
    <div v-if="flatSet.has('heading')" class="flex items-center gap-2 shrink-0">
      <RSToolbarBtn v-for="b in headingBtns" :key="b.name" :b="b" />
    </div>
    <RSToolbarDropdown v-else :icon="LetterT" :buttons="headingBtns" />

    <div class="h-1/3 border-x text-neutral-300 shrink-0"></div>

    <!-- 列表 -->
    <div v-if="flatSet.has('list')" class="flex items-center gap-2 shrink-0">
      <RSToolbarBtn v-for="b in listBtns" :key="b.name" :b="b" />
    </div>
    <RSToolbarDropdown v-else :icon="BulletList" :buttons="listBtns" />

    <!-- 对齐 -->
    <div v-if="flatSet.has('align')" class="flex items-center gap-2 shrink-0">
      <RSToolbarBtn v-for="b in alignBtns" :key="b.name" :b="b" />
    </div>
    <RSToolbarDropdown v-else :icon="AlignJustify" :buttons="alignBtns" />

    <div class="h-1/3 border-x text-neutral-300 shrink-0"></div>

    <!-- 插入 -->
    <div v-if="flatSet.has('insert')" class="flex items-center gap-2 shrink-0">
      <RSToolbarBtn v-for="b in insertBtns" :key="b.name" :b="b" />
    </div>
    <RSToolbarDropdown v-else :icon="Table" :buttons="insertBtns" />

    <div class="h-1/3 border-x text-neutral-300 shrink-0"></div>
    <RTSearchPopover :editor="editor" />
  </div>
</template>
