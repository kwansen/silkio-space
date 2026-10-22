<script setup lang="ts">
import { createSpliceTree } from "@splicetree/core";
import { useSpliceTree, SpliceTreeNode } from "@splicetree/adapter-vue";
import dnd, { DropPosition } from "@splicetree/plugin-dnd";
import Folder from "@/components/icons/Folder.vue";
import { ref } from "vue";
import Doc from "@/components/icons/Doc.vue";
import ArrowRight from "@/components/icons/ArrowRight.vue";
import FolderOpenLine from "@/components/icons/FolderOpenLine.vue";

interface CustomNode {
  id: string;
  title: string;
  parent: string | null;
  type: "folder" | "doc";
}

const data = ref<CustomNode[]>([
  { id: "a", title: "搜索引擎", parent: null, type: "folder" },
  { id: "b", title: "百度", parent: "a", type: "doc" },
  { id: "c", title: "Google", parent: "a", type: "doc" },
  { id: "d", title: "Bing", parent: "a", type: "doc" },
  { id: "e", title: "搜狗", parent: "a", type: "doc" },
  { id: "f", title: "360", parent: "a", type: "doc" },
  { id: "g", title: "在线文档", parent: null, type: "folder" },
  { id: "h", title: "飞书", parent: "g", type: "doc" },
  { id: "i", title: "金山文档", parent: "g", type: "doc" },
  { id: "j", title: "腾讯文档", parent: "g", type: "doc" },
  { id: "k", title: "轻流", parent: "g", type: "doc" },
]);

const { items, dragProps, ghostStyle } = useSpliceTree(data, {
  configuration: {
    keyField: "id",
    parentField: "parent",
  },
  plugins: [dnd],
});

function allowNest(target: SpliceTreeNode<unknown>) {
  return (target.original as CustomNode).type !== "doc";
}

function allowSortable(_target: SpliceTreeNode<unknown>) {
  return true;
}
</script>
<template>
  <div class="w-65 h-full select-none relative">
    <div v-bind="ghostStyle()"></div>
    <div
      v-for="i in items"
      :key="i.id"
      v-bind="
        dragProps(i.id, {
          nestable: allowNest,
          sortable: allowSortable,
        })
      "
      :style="{ paddingLeft: `${i.level * 16}px` }"
      class="flex items-center hover:bg-white py-0.5"
      @click="i.toggleExpand()"
    >
      <ArrowRight
        class="size-4"
        v-if="i.original?.type === 'folder'"
        :class="i.isExpanded() ? 'rotate-90' : ''"
      />

      <Folder
        v-if="i.original?.type === 'folder' && !i.isExpanded()"
        class="size-4"
      />
      <FolderOpenLine
        v-if="i.original?.type === 'folder' && i.isExpanded()"
        class="size-4"
      />
      <Doc v-if="i.original?.type === 'doc'" class="size-4" />

      <span class="pl-1"> {{ i.original.title }}</span>
    </div>
  </div>
</template>
