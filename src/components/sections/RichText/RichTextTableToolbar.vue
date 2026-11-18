<script setup lang="ts">
import AddBottomRow from "@/components/icons/AddBottomRow.vue";
import AddLeftCol from "@/components/icons/AddLeftCol.vue";
import AddRightCol from "@/components/icons/AddRightCol.vue";
import AddTopRow from "@/components/icons/AddTopRow.vue";
import Delete from "@/components/icons/Delete.vue";
import DeleteCol from "@/components/icons/DeleteCol.vue";
import DeleteRow from "@/components/icons/DeleteRow.vue";
import MergeCell from "@/components/icons/MergeCell.vue";
import SplitCell from "@/components/icons/SplitCell.vue";
import { Editor } from "@tiptap/vue-3";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Btn } from "./type";

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

// 滚动不会触发响应式更新，用一个计数器在滚动时使 computed 失效
const scrollCount = ref(0);
const onScroll = () => {
  scrollCount.value++;
};

onMounted(() => {
  // capture: true 捕获任意祖先滚动容器（含编辑器内部）的滚动
  window.addEventListener("scroll", onScroll, { capture: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll, { capture: true });
});

const getCoords = () => {
  scrollCount.value; // 依赖滚动计数，滚动时触发重算
  const pos = props.editor?.state.selection.from ?? 0;
  if (!props.editor?.view) return null;
  return props.editor.view.coordsAtPos(pos);
};

const y = computed(() => {
  const base = getCoords()?.top ?? 0;
  return base - 140;
});

interface SelfBtn extends Btn {
  class: string;
}

const btnList: SelfBtn[] = [
  {
    name: "添加左侧列",
    icon: AddLeftCol,
    action: () => props.editor?.chain().focus().addColumnBefore().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "添加右侧列",
    icon: AddRightCol,
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
    class: "hover:bg-red-200",
  },
  {
    name: "添加上方行",
    icon: AddTopRow,
    action: () => props.editor?.chain().focus().addRowBefore().run(),
    shortcut: "",
    active: () => false,
    disabled: () => false,
    class: "hover:bg-gray-100",
  },
  {
    name: "添加下方行",
    icon: AddBottomRow,
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
    class: "hover:bg-red-200",
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
    class: "hover:bg-red-200",
  },
];
</script>

<template>
  <div
    class="z-9 absolute left-1/2 -translate-x-1/2 w-fit flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg text-gray-500"
    :style="{ top: `${y}px` }"
  >
    <div
      v-for="btn in btnList"
      :key="btn.name"
      class="size-7 rounded-md grid place-items-center"
      :class="btn.disabled() ? 'opacity-30 cursor-not-allowed' : btn.class"
      :title="btn.name"
      @click="btn.action()"
    >
      <component :is="btn.icon" class="size-4" />
    </div>
  </div>
</template>
