<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Component } from "vue";
import { listen } from "@tauri-apps/api/event";
import { useDocSvc } from "@/services/document";
import { useFdSvc } from "@/services/folder";
import { notifyArchiveChanged, notifyDocChanged } from "@/infrastructure/api/windowEvent";
import { Doc, DocType } from "@/types/doc";
import { Folder } from "@/types/archive";
import DocIcon from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import Archive from "@/components/icons/Archive.vue";
import Undo from "@/components/icons/Undo.vue";
import Broom from "@/components/icons/Broom.vue";
import Delete from "@/components/icons/Delete.vue";
import EmptyHint from "@/components/shared/EmptyHint.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";

const docSvc = useDocSvc();
const fdSvc = useFdSvc();
type TrashItem = {
  kind: "doc" | "folder";
  id: string;
  name: string;
  deletedAt: number;
  icon: Component;
};

const items = ref<TrashItem[]>([]);
const loading = ref(true);

const dtf = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const iconMap: Record<DocType, Component> = {
  mindMap: Mindmap,
  flowChart: Flowchart,
  richText: DocIcon,
};

const isEmpty = computed(() => items.value.length === 0);

const reload = async () => {
  const [docs, folders] = await Promise.all([
    docSvc.getTrashed(),
    fdSvc.getTrashedFolders(),
  ]);
  items.value = [
    ...folders.map(
      (f: Folder): TrashItem => ({
        kind: "folder",
        id: f.id,
        name: f.name,
        deletedAt: f.deleted_at ?? 0,
        icon: Archive,
      }),
    ),
    ...docs.map(
      (d: Doc): TrashItem => ({
        kind: "doc",
        id: d.id,
        name: d.title || "未命名标题",
        deletedAt: d.deleted_at ?? 0,
        icon: iconMap[d.doc_type] ?? DocIcon,
      }),
    ),
  ].sort((a, b) => b.deletedAt - a.deletedAt);
  loading.value = false;
};

let stopOnDocChanged: (() => void) | null = null;
let stopOnArchiveChanged: (() => void) | null = null;

onMounted(async () => {
  await reload();
  // 文档域/归档域变化（其他页签/窗口删除文档或文件夹）时自动刷新回收站列表
  stopOnDocChanged = await listen("doc:changed", reload);
  stopOnArchiveChanged = await listen("archive:changed", reload);
});

onUnmounted(() => {
  stopOnDocChanged?.();
  stopOnArchiveChanged?.();
});

// 统一操作入口：按 kind 分发到文档/归档的恢复与彻底删除
const restoreItem = async (item: TrashItem) => {
  if (item.kind === "doc") {
    await docSvc.restore(item.id);
    notifyDocChanged();
  } else {
    // 恢复归档：清除软删标记，其子树与归档成员关系随之恢复
    await fdSvc.restoreFolder({ id: item.id });
    notifyArchiveChanged();
  }
  await reload();
};

const purgeItem = async (item: TrashItem) => {
  if (item.kind === "doc") {
    // 物理清除文档本体（v1 trigger 级联清归档关联）并移除索引
    await docSvc.purge(item.id);
  } else {
    // 物理清除归档子树（trigger 级联清归档关联，文档本体保留）
    await fdSvc.purgeFolder({ id: item.id });
    notifyArchiveChanged();
  }
  await reload();
};

// 清空回收站：批量物理删除全部软删文档与归档（均不可恢复）
const purgeAll = async () => {
  await docSvc.purgeMany(
    items.value.filter((i) => i.kind === "doc").map((i) => i.id),
  );
  for (const i of items.value.filter((i) => i.kind === "folder")) {
    await fdSvc.purgeFolder({ id: i.id });
  }
  await reload();
};
</script>

<template>
  <div>
    <!-- 头部：与其他四个视图一致的 h-16 + 紫色分隔线，右侧清空按钮 size-8 -->
    <div
      class="h-16 shrink-0 flex items-center px-5 gap-4 border-b border-purple-300"
    >
      <span class="flex-1 text-sm font-medium">回收站</span>
      <span class="text-xs text-neutral-400">
        {{ items.length }} 项
      </span>
      <button
        v-if="!isEmpty"
        title="清空回收站"
        class="size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:text-red-600 hover:bg-red-50"
        @click="purgeAll"
      >
        <Broom class="size-5" />
      </button>
    </div>
    <EmptyHint
      v-if="!loading && isEmpty"
      class="h-15 border-b border-neutral-100"
    >
      回收站是空的
    </EmptyHint>
    <ScrollArea v-else class="max-h-128">
      <div
        v-for="item in items"
        :key="item.kind + item.id"
        class="h-16 cursor-default grid grid-cols-[4rem_1fr_auto] border-t border-gray-100 select-none relative group"
      >
        <div class="w-full h-full grid place-items-center">
          <div class="h-7 w-7 bg-gray-50 rounded-md grid place-items-center">
            <component :is="item.icon" class="size-5 text-gray-400" />
          </div>
        </div>
        <div class="w-full flex flex-col justify-center min-w-0">
          <div class="truncate">{{ item.name }}</div>
          <div class="truncate text-xs text-neutral-400">
            {{ dtf.format(new Date(item.deletedAt)) }} 删除
          </div>
        </div>
        <div
          class="px-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            class="size-8 grid place-items-center rounded-md text-gray-500 hover:bg-gray-100 cursor-pointer"
            title="恢复"
            @click="restoreItem(item)"
          >
            <Undo class="size-5" />
          </button>
          <button
            class="size-8 grid place-items-center rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600 cursor-pointer"
            title="彻底删除"
            @click="purgeItem(item)"
          >
            <Delete class="size-5" />
          </button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
