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

type DropMode = "before" | "after" | "inside" | "";

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

const dropTargetId = ref("");
const dropMode = ref<DropMode>("");

function onDragOver(e: DragEvent, item: FlatItem) {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;

  dropTargetId.value = item.id;
  if (ratio < 0.25) {
    dropMode.value = "before";
  } else if (ratio > 0.75) {
    dropMode.value = "after";
  } else {
    dropMode.value = "inside";
  }
}

const cl = computed(() => {
  if (dropMode.value === "before") {
    return "-top-px bg-red-600";
  } else if (dropMode.value === "after") {
    return "-bottom-px bg-black";
  } else {
    return "";
  }
});

function onDragLeave(e: DragEvent, item: FlatItem) {
  const el = e.currentTarget as HTMLElement;
  if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
  if (dropTargetId.value === item.id) {
    dropTargetId.value = "";
    dropMode.value = "";
  }
}

function onDragEnd() {
  dropTargetId.value = "";
  dropMode.value = "";
}
</script>

<template>
  <div class="w-65 h-full">
    <div class="h-10 flex items-center">归档的标题</div>
    <div v-for="i in list" :key="i.id" class="relative">
      <div
        draggable="true"
        class="relative select-none py-0.5 hover:bg-gray-50"
        :style="{ paddingLeft: `${i.level * 16 - 16}px` }"
        @dragover.prevent="onDragOver($event, i)"
        @dragleave="onDragLeave($event, i)"
        @dragend="onDragEnd"
      >
        {{ i.name }}
      </div>
      <div
        v-if="
          (dropMode === 'after' || dropMode === 'before') &&
          dropTargetId === i.id
        "
        class="absolute w-full h-0.5 left-0 pointer-events-none"
        :class="cl"
      ></div>
    </div>
  </div>
</template>
