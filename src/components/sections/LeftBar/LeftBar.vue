<script setup lang="ts">
import { createSpliceTree } from "@splicetree/core";
import { useSpliceTree, SpliceTreeNode } from "@splicetree/adapter-vue";
import dnd, { DropPosition } from "@splicetree/plugin-dnd";
import Folder from "@/components/icons/Folder.vue";
import { watch, ref } from "vue";
import Doc from "@/components/icons/Doc.vue";
import ArrowRight from "@/components/icons/ArrowRight.vue";
import FolderOpenLine from "@/components/icons/FolderOpenLine.vue";
import { useFdSvc } from "@/services/folder";
import type { DocType } from "@/types/doc";

interface Props {
  id: string;
}

const props = defineProps<Props>();

// 树节点类型：folder 为归档文件夹，其余为文档类型（与数据库 doc_type 一致）
type NodeType = "folder" | DocType;

interface CustomNode {
  id: string;
  title: string;
  parent: string | null;
  type: NodeType;
}

const svc = useFdSvc();
const data = ref<CustomNode[]>([]);

// 加载该 archive 子树：根归档 + 全部后代文件夹 + 全部文档（按容器归属与 sort_order 排列）
const loadArchive = async (id: string) => {
  if (!id) {
    data.value = [];
    return;
  }
  const [folder, folders, docs] = await Promise.all([
    svc.getFolderById({ id }),
    svc.getSubtreeFolders({ id }),
    svc.getSubtreeDocs({ id }),
  ]);
  if (!folder) {
    data.value = [];
    return;
  }
  data.value = [
    { id: folder.id, title: folder.name, parent: null, type: "folder" },
    ...folders.map((f) => ({
      id: f.id,
      title: f.name,
      parent: f.parent_id,
      type: "folder" as const,
    })),
    ...docs.map((d) => ({
      id: d.id,
      title: d.title ?? "未命名标题",
      parent: d.container_id,
      type: d.doc_type,
    })),
  ];
};

// 挂载时即按当前 id 加载，archive 切换（id 变化）时重新加载
watch(
  () => props.id,
  (id) => loadArchive(id),
  { immediate: true },
);

const { items, dragProps, ghostStyle } = useSpliceTree(data, {
  configuration: {
    keyField: "id",
    parentField: "parent",
  },
  plugins: [dnd],
});

function allowNest(target: SpliceTreeNode<unknown>) {
  return (target.original as CustomNode).type === "folder";
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
      <Doc v-if="i.original?.type !== 'folder'" class="size-4" />

      <span class="pl-1"> {{ i.original.title }}</span>
    </div>
  </div>
</template>
