<script setup lang="ts">
import { computed, ref } from "vue";

interface TreeItem {
  id: string;
  name: string;
  order: number;
  children?: TreeItem[];
}

interface FlatItem {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  order: number;
}

const tree = ref<TreeItem[]>([
  {
    id: "ai",
    name: "AI",
    order: 0,
    children: [
      { id: "chatgpt", name: "chatgpt", order: 0 },
      { id: "qwen", name: "qwen", order: 1 },
    ],
  },
  {
    id: "video",
    name: "视频",
    order: 1,
    children: [
      { id: "youtube", name: "youtube", order: 0 },
      { id: "bilibili", name: "bilibili", order: 1 },
    ],
  },
  {
    id: "search",
    name: "搜索引擎",
    order: 2,
    children: [
      { id: "google", name: "google", order: 0 },
      { id: "bing", name: "bing", order: 1 },
    ],
  },
]);

function treeToList(tree: TreeItem[]): FlatItem[] {
  const result: FlatItem[] = [];

  const walk = (nodes: TreeItem[], parentId: string | null, level: number) => {
    for (const node of nodes) {
      result.push({
        id: node.id,
        name: node.name,
        level,
        parentId,
        order: node.order,
      });
      if (node.children?.length) {
        walk(node.children, node.id, level + 1);
      }
    }
  };

  walk(tree, null, 1);
  return result;
}

const list = computed(() => treeToList(tree.value));

const draggingId = ref<string | null>(null);

function onDragStart(id: string) {
  draggingId.value = id;
}

function isDescendant(targetId: string, ancestorId: string): boolean {
  let cur = list.value.find((i) => i.id === targetId);
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = list.value.find((i) => i.id === cur!.parentId);
  }
  return false;
}

function onDrop(target: FlatItem) {
  if (!draggingId.value || draggingId.value === target.id) return;
  const dragged = list.value.find((i) => i.id === draggingId.value);

  if (!dragged) return;
  if (isDescendant(target.id, dragged.id)) return;
  const fromList = getSiblings(dragged.parentId);
  const toList = getSiblings(target.parentId);
  const fromIndex = fromList.findIndex((n) => n.id === dragged.id);
  const [moved] = fromList.splice(fromIndex, 1);
  const toIndex = toList.findIndex((n) => n.id === target.id);
  const insertIndex = dropPos.value === "after" ? toIndex + 1 : toIndex;
  toList.splice(insertIndex, 0, moved);
  fromList.forEach((n, idx) => (n.order = idx));
  toList.forEach((n, idx) => (n.order = idx));
}

function getSiblings(parentId: string | null): TreeItem[] {
  if (parentId === null) return tree.value;
  const stack = [...tree.value];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === parentId) return node.children ?? [];
    if (node.children) stack.push(...node.children);
  }
  return [];
}

const dragOverId = ref<string | null>(null);
const dropPos = ref<"before" | "after">("before");

function onDragOver(e: DragEvent, item: FlatItem) {
  dragOverId.value = item.id;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  dropPos.value = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
</script>

<template>
  <div class="w-65 h-full">
    <div>归档的标题</div>
    <div
      v-for="i in list"
      :key="i.id"
      draggable="true"
      @dragstart="onDragStart(i.id)"
      @dragover.prevent="onDragOver($event, i)"
      @drop="onDrop(i)"
      @dragend="
        draggingId = null;
        dragOverId = null;
        dropPos = 'before';
      "
      :style="{ paddingLeft: `${i.level * 16 - 16}px` }"
      class="select-none"
      :class="{
        'opacity-40': i.id === draggingId,
        'border-t-2 border-blue-500':
          i.id === dragOverId && i.id !== draggingId && dropPos === 'before',
        'border-b-2 border-blue-500':
          i.id === dragOverId && i.id !== draggingId && dropPos === 'after',
      }"
    >
      {{ i.name }}
    </div>
  </div>
</template>
