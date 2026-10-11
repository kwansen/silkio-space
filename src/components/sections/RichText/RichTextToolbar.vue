<script setup lang="ts">
import type { Component } from "vue";
import SquareButton from "@/components/shared/SquareButton.vue";
import { Editor } from "@tiptap/vue-3";
import { twMerge } from "tailwind-merge";
import H1 from "@/components/icons/H1.vue";
import H2 from "@/components/icons/H2.vue";
import H3 from "@/components/icons/H3.vue";
import H4 from "@/components/icons/H4.vue";
import H5 from "@/components/icons/H5.vue";
import H6 from "@/components/icons/H6.vue";
import UnorderList from "@/components/icons/UnorderList.vue";
import OrderedList from "@/components/icons/OrderedList.vue";
import TaskList from "@/components/icons/TaskList.vue";
import Bold from "@/components/icons/Bold.vue";
import Italic from "@/components/icons/Italic.vue";
import Underline from "@/components/icons/Underline.vue";
import Strike from "@/components/icons/Strike.vue";
import InlineCode from "@/components/icons/InlineCode.vue";
import Subscript from "@/components/icons/Subscript.vue";
import Superscript from "@/components/icons/Superscript.vue";
import Eraser from "@/components/icons/Eraser.vue";
import LetterT from "@/components/icons/LetterT.vue";
import Quote from "@/components/icons/Quote.vue";
import Highlight from "@/components/icons/Highlight.vue";
import CodeBlock from "@/components/icons/CodeBlock.vue";
import Divider from "@/components/icons/Divider.vue";
import Link from "@/components/icons/Link.vue";
import Image from "@/components/icons/Image.vue";
import Math from "@/components/icons/Math.vue";
import Undo from "@/components/icons/Undo.vue";
import Redo from "@/components/icons/Redo.vue";
import AlignLeft from "@/components/icons/AlignLeft.vue";
import AlignCenter from "@/components/icons/AlignCenter.vue";
import AlignRight from "@/components/icons/AlignRight.vue";
import AlignJustify from "@/components/icons/AlignJustify.vue";

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

// 图标：Vue 图标组件
interface Item {
  name: string;
  icon: Component;
  active: () => boolean;
  disabled: () => boolean;
  action: () => void;
  shortcut: string;
}

// 加粗
const boldItem: Item = {
  name: "加粗",
  icon: Bold,
  active: () => props.editor?.isActive("bold") || false,
  disabled: () => !props.editor?.can().toggleBold(),
  shortcut: "Ctrl+B",
  action: () => props.editor?.chain().focus().toggleBold().run(),
};

// 斜体
const italicItem: Item = {
  name: "斜体",
  icon: Italic,
  active: () => props.editor?.isActive("italic") || false,
  disabled: () => !props.editor?.can().toggleItalic(),
  shortcut: "Ctrl+I",
  action: () => props.editor?.chain().focus().toggleItalic().run(),
};

// 下划线
const underlineItem: Item = {
  name: "下划线",
  icon: Underline,
  active: () => props.editor?.isActive("underline") || false,
  disabled: () => !props.editor?.can().toggleUnderline(),
  shortcut: "Ctrl+U",
  action: () => props.editor?.chain().focus().toggleUnderline().run(),
};

// 删除线
const strikeItem: Item = {
  name: "删除线",
  icon: Strike,
  active: () => props.editor?.isActive("strike") || false,
  disabled: () => !props.editor?.can().toggleStrike(),
  shortcut: "Ctrl+Shift+X",
  action: () => props.editor?.chain().focus().toggleStrike().run(),
};

// 橡皮擦（清除格式）
const resetItem: Item = {
  name: "清除格式",
  icon: Eraser,
  active: () => false,
  disabled: () => !props.editor?.can().unsetAllMarks(),
  shortcut: "",
  action: () => props.editor?.chain().focus().unsetAllMarks().run(),
};

// 行内代码
const codeItem: Item = {
  name: "行内代码",
  icon: InlineCode,
  active: () => props.editor?.isActive("code") || false,
  disabled: () => !props.editor?.can().toggleCode(),
  shortcut: "Ctrl+E",
  action: () => props.editor?.chain().focus().toggleCode().run(),
};

// 下标
const subscriptItem: Item = {
  name: "下标",
  icon: Subscript,
  active: () => props.editor?.isActive("subscript") || false,
  disabled: () => !props.editor?.can().toggleSubscript(),
  shortcut: "",
  action: () => props.editor?.chain().focus().toggleSubscript().run(),
};

// 上标
const superscriptItem: Item = {
  name: "上标",
  icon: Superscript,
  active: () => props.editor?.isActive("superscript") || false,
  disabled: () => !props.editor?.can().toggleSuperscript(),
  shortcut: "",
  action: () => props.editor?.chain().focus().toggleSuperscript().run(),
};

// 撤销
const undoItem: Item = {
  name: "撤销",
  icon: Undo,
  active: () => false,
  disabled: () => !props.editor?.can().undo(),
  shortcut: "Ctrl+Z",
  action: () => props.editor?.chain().focus().undo().run(),
};

// 重做
const redoItem: Item = {
  name: "重做",
  icon: Redo,
  active: () => false,
  disabled: () => !props.editor?.can().redo(),
  shortcut: "Ctrl+Shift+Z",
  action: () => props.editor?.chain().focus().redo().run(),
};

// 无序列表
const bulletListItem: Item = {
  name: "无序列表",
  icon: UnorderList,
  active: () => props.editor?.isActive("bulletList") || false,
  disabled: () => !props.editor?.can().toggleBulletList(),
  shortcut: "Ctrl+Shift+8",
  action: () => props.editor?.chain().focus().toggleBulletList().run(),
};

// 有序列表
const orderedListItem: Item = {
  name: "有序列表",
  icon: OrderedList,
  active: () => props.editor?.isActive("orderedList") || false,
  disabled: () => !props.editor?.can().toggleOrderedList(),
  shortcut: "Ctrl+Shift+7",
  action: () => props.editor?.chain().focus().toggleOrderedList().run(),
};

// 任务列表
const taskListItem: Item = {
  name: "任务列表",
  icon: TaskList,
  active: () => props.editor?.isActive("taskList") || false,
  disabled: () => !props.editor?.can().toggleTaskList(),
  shortcut: "",
  action: () => props.editor?.chain().focus().toggleTaskList().run(),
};

// 引用块
const blockquoteItem: Item = {
  name: "引用块",
  icon: Quote,
  active: () => props.editor?.isActive("blockquote") || false,
  disabled: () => !props.editor?.can().toggleBlockquote(),
  shortcut: "Ctrl+Shift+B",
  action: () => props.editor?.chain().focus().toggleBlockquote().run(),
};

// 代码块
const codeBlockItem: Item = {
  name: "代码块",
  icon: CodeBlock,
  active: () => props.editor?.isActive("codeBlock") || false,
  disabled: () => !props.editor?.can().toggleCodeBlock(),
  shortcut: "Ctrl+Alt+C",
  action: () => props.editor?.chain().focus().toggleCodeBlock().run(),
};

// 高亮
const highlightItem: Item = {
  name: "高亮",
  icon: Highlight,
  active: () => props.editor?.isActive("highlight") || false,
  disabled: () => !props.editor?.can().toggleHighlight({ color: "#FFFF00" }),
  shortcut: "Ctrl+H",
  action: () =>
    props.editor?.chain().focus().toggleHighlight({ color: "#FFFF00" }).run(),
};

// 分割线
const horizontalRuleItem: Item = {
  name: "分割线",
  icon: Divider,
  active: () => false,
  disabled: () => !props.editor?.can().setHorizontalRule(),
  shortcut: "Ctrl+Shift+_",
  action: () => props.editor?.chain().focus().setHorizontalRule().run(),
};

// 插入链接
const linkItem: Item = {
  name: "插入链接",
  icon: Link,
  active: () => props.editor?.isActive("link") || false,
  disabled: () => !props.editor?.can().setLink({ href: "https://baidu.com" }),
  shortcut: "Ctrl+K",
  action: () =>
    props.editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: "" })
      .run(),
};

// 左对齐
const alignLeftItem: Item = {
  name: "左对齐",
  icon: AlignLeft,
  active: () => props.editor?.isActive({ textAlign: "left" }) || false,
  disabled: () => !props.editor?.can().setTextAlign("left"),
  shortcut: "Ctrl+Shift+L",
  action: () => props.editor?.chain().focus().setTextAlign("left").run(),
};

// 居中对齐
const alignCenterItem: Item = {
  name: "居中对齐",
  icon: AlignCenter,
  active: () => props.editor?.isActive({ textAlign: "center" }) || false,
  disabled: () => !props.editor?.can().setTextAlign("center"),
  shortcut: "Ctrl+Shift+E",
  action: () => props.editor?.chain().focus().setTextAlign("center").run(),
};

// 右对齐
const alignRightItem: Item = {
  name: "右对齐",
  icon: AlignRight,
  active: () => props.editor?.isActive({ textAlign: "right" }) || false,
  disabled: () => !props.editor?.can().setTextAlign("right"),
  shortcut: "Ctrl+Shift+R",
  action: () => props.editor?.chain().focus().setTextAlign("right").run(),
};

// 两端对齐
const alignJustifyItem: Item = {
  name: "两端对齐",
  icon: AlignJustify,
  active: () => props.editor?.isActive({ textAlign: "justify" }) || false,
  disabled: () => !props.editor?.can().setTextAlign("justify"),
  shortcut: "Ctrl+Shift+J",
  action: () => props.editor?.chain().focus().setTextAlign("justify").run(),
};

// 标题1
const h1Item: Item = {
  name: "标题 1",
  icon: H1,
  active: () => props.editor?.isActive("heading", { level: 1 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 1 }),
  shortcut: "Ctrl+Alt+1",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 1 }).run(),
};

// 标题2
const h2Item: Item = {
  name: "标题 2",
  icon: H2,
  active: () => props.editor?.isActive("heading", { level: 2 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 2 }),
  shortcut: "Ctrl+Alt+2",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
};

// 标题3
const h3Item: Item = {
  name: "标题 3",
  icon: H3,
  active: () => props.editor?.isActive("heading", { level: 3 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 3 }),
  shortcut: "Ctrl+Alt+3",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 3 }).run(),
};

// 标题4
const h4Item: Item = {
  name: "标题 4",
  icon: H4,
  active: () => props.editor?.isActive("heading", { level: 4 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 4 }),
  shortcut: "Ctrl+Alt+4",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 4 }).run(),
};

// 标题5
const h5Item: Item = {
  name: "标题 5",
  icon: H5,
  active: () => props.editor?.isActive("heading", { level: 5 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 5 }),
  shortcut: "Ctrl+Alt+5",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 5 }).run(),
};

// 标题6
const h6Item: Item = {
  name: "标题 6",
  icon: H6,
  active: () => props.editor?.isActive("heading", { level: 6 }) || false,
  disabled: () => !props.editor?.can().toggleHeading({ level: 6 }),
  shortcut: "Ctrl+Alt+6",
  action: () => props.editor?.chain().focus().toggleHeading({ level: 6 }).run(),
};

// 段落
const paragraphItem: Item = {
  name: "段落",
  icon: LetterT,
  active: () => props.editor?.isActive("paragraph") || false,
  disabled: () => !props.editor?.can().setParagraph(),
  shortcut: "Ctrl+Alt+0",
  action: () => props.editor?.chain().focus().setParagraph().run(),
};

// 插入图片
const imageItem: Item = {
  name: "插入图片",
  icon: Image,
  active: () => props.editor?.isActive("image") || false,
  disabled: () => !props.editor?.can().setImage({ src: "" }),
  shortcut: "",
  action: () => props.editor?.chain().focus().setImage({ src: "" }).run(),
};

// 插入数学公式
const mathItem: Item = {
  name: "数学公式",
  icon: Math,
  active: () => props.editor?.isActive("inlineMath") || false,
  disabled: () => !props.editor?.can().insertInlineMath({ latex: "x" }),
  shortcut: "",
  action: () =>
    props.editor?.chain().focus().insertInlineMath({ latex: "x" }).run(),
};

// 工具栏分组列表
const groups: { name: string; items: Item[] }[] = [
  { name: "历史操作", items: [undoItem, redoItem] },
  {
    name: "文本样式",
    items: [
      boldItem,
      italicItem,
      underlineItem,
      strikeItem,
      codeItem,
      subscriptItem,
      superscriptItem,
      highlightItem,
      linkItem,
      resetItem,
    ],
  },
  {
    name: "标题段落",
    items: [paragraphItem, h1Item, h2Item, h3Item, h4Item, h5Item, h6Item],
  },
  {
    name: "列表",
    items: [bulletListItem, orderedListItem, taskListItem],
  },
  {
    name: "块级元素",
    items: [
      blockquoteItem,
      codeBlockItem,
      imageItem,
      mathItem,
      horizontalRuleItem,
    ],
  },
  {
    name: "对齐方式",
    items: [alignLeftItem, alignCenterItem, alignRightItem, alignJustifyItem],
  },
];

// 按激活/禁用的四种组合分别返回 twMerge 合并后的样式
const getClass = (active: boolean, disabled: boolean) => {
  const base = "w-7 h-7 rounded transition-colors duration-200 shrink-0";
  const a = "bg-purple-200 text-purple-700";
  const h = "hover:bg-gray-200";
  const p = "cursor-pointer";
  const d = "opacity-30 cursor-default";
  if (active && disabled) {
    return twMerge(base, a, d);
  } else if (active && !disabled) {
    return twMerge(base, a, p);
  } else if (!active && disabled) {
    return twMerge(base, d);
  } else if (!active && !disabled) {
    return twMerge(base, h, p);
  }
};
</script>

<template>
  <div class="w-full bg-gray-100 overflow-x-auto">
    <div class="flex items-center gap-1 p-2 w-max">
      <template v-for="(group, groupIndex) in groups" :key="group.name">
        <!-- 分组之间的分隔线 -->
        <div
          v-if="groupIndex > 0"
          class="w-px h-5 bg-gray-300 mx-1 shrink-0"
        ></div>
        <SquareButton
          v-for="(item, index) in group.items"
          :key="`${group.name}-${index}`"
          :title="`${item.name}${item.shortcut ? ` (${item.shortcut})` : ''}`"
          :class="getClass(item.active(), item.disabled())"
          @click="!item.disabled() && item.action()"
        >
          <component :is="item.icon" class="w-5 h-5" />
        </SquareButton>
      </template>
    </div>
  </div>
</template>
<style></style>
