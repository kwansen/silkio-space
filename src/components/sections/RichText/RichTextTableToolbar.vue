<script setup lang="ts">
import AddRowBelow from "@/components/icons/AddRowBelow.vue";
import AddColLeft from "@/components/icons/AddColLeft.vue";
import AddColRight from "@/components/icons/AddColRight.vue";
import AddRowAbove from "@/components/icons/AddRowAbove.vue";
import Delete from "@/components/icons/Delete.vue";
import DeleteCol from "@/components/icons/DeleteCol.vue";
import DeleteRow from "@/components/icons/DeleteRow.vue";
import MergeCell from "@/components/icons/MergeCell.vue";
import SplitCell from "@/components/icons/SplitCell.vue";
import { Editor } from "@tiptap/vue-3";
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { Btn } from "./type";

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

// 定位思路：工具栏 absolute 定位在滚动容器内的 relative 祖先上，
// 锚定光标所在行（聚焦点上方），表格过高时工具栏始终随光标可见。
// 同一时刻取 光标视口坐标(coordsAtPos) 与容器 getBoundingClientRect()
// 相减，滚动量严格抵消，得到的是滚动内容坐标系（文档锚定）的 top，
// 与当前滚动位置无关。浏览器原生滚动时工具栏与内容必然同步移动，
// 无需监听滚动，也没有重渲染造成的滞后。

// 编辑器事务（移动光标、编辑表格等）不会触发 Vue 响应式，
// 在事务回调里主动更新位置
const rootRef = useTemplateRef("rootRef");

// 工具栏自身高度约 44px（p-1.5 + size-8 按钮），再留 8px 间隙
const GAP_ABOVE_CURSOR = 52;

const y = ref(0);

const isInTable = () => {
  const { $from } = props.editor!.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === "table") return true;
  }
  return false;
};

const updateY = () => {
  const editor = props.editor;
  if (!editor?.view || !rootRef.value) return;
  // 选区已不在表格内时不更新：此时 v-if 的卸载要等下一轮渲染才生效，
  // 若立即按新选区重算，工具栏会先跳到别处再消失，产生闪烁
  if (!isInTable()) return;
  const coords = editor.view.coordsAtPos(editor.state.selection.from);
  const container = rootRef.value.offsetParent;
  if (!container) return;
  // 两个视口坐标在同一次求值中取得，滚动偏移相消，
  // 得到相对滚动内容固定、与滚动位置无关的 top
  y.value =
    coords.top - container.getBoundingClientRect().top - GAP_ABOVE_CURSOR - 8;
};

onMounted(() => {
  props.editor?.on("transaction", updateY);
  updateY(); // 等模板 ref 挂载后计算一次初始位置
});

onBeforeUnmount(() => {
  props.editor?.off("transaction", updateY);
});

interface SelfBtn extends Btn {
  class: string;
}

const btnList: SelfBtn[] = [
  {
    name: "添加左侧列",
    icon: AddColLeft,
    action: () => props.editor?.chain().focus().addColumnBefore().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "添加右侧列",
    icon: AddColRight,
    action: () => props.editor?.chain().focus().addColumnAfter().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "删除列",
    icon: DeleteCol,
    action: () => props.editor?.chain().focus().deleteColumn().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-red-50 hover:text-red-400",
  },
  {
    name: "添加上方行",
    icon: AddRowAbove,
    action: () => props.editor?.chain().focus().addRowBefore().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "添加下方行",
    icon: AddRowBelow,
    action: () => props.editor?.chain().focus().addRowAfter().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "删除行",
    icon: DeleteRow,
    action: () => props.editor?.chain().focus().deleteRow().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-red-50 hover:text-red-400",
  },
  {
    name: "合并单元格",
    icon: MergeCell,
    action: () => props.editor?.chain().focus().mergeCells().run(),
    shortcut: "",
    active: () => false,
    disabled: () => !props.editor?.can().mergeCells(),
    class: "hover:bg-gray-100",
  },
  {
    name: "拆分单元格",
    icon: SplitCell,
    action: () => props.editor?.chain().focus().splitCell().run(),
    shortcut: "",
    active: () => false,
    disabled: () => !props.editor?.can().splitCell(),
    class: "hover:bg-gray-100",
  },
  {
    name: "删除表格",
    icon: Delete,
    action: () => props.editor?.chain().focus().deleteTable().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-red-50 hover:text-red-400",
  },
];
</script>

<template>
  <div
    ref="rootRef"
    class="absolute left-1/2 -translate-x-1/2 w-fit flex items-center gap-2.5 p-1.5 bg-white rounded-lg shadow-md ring ring-gray-100 text-gray-500"
    :style="{ top: `${y}px` }"
  >
    <div
      v-for="btn in btnList"
      :key="btn.name"
      class="size-8 rounded-md grid place-items-center"
      :class="
        btn.disabled()
          ? 'opacity-30 cursor-default'
          : ['cursor-pointer', btn.class]
      "
      :title="btn.name"
      @click="btn.action()"
    >
      <component :is="btn.icon" class="size-5" />
    </div>
  </div>
</template>
