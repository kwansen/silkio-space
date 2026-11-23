<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Component } from "vue";
import { onKeyStroke } from "@vueuse/core";
import { FocusScope } from "@zhencai/vue-focus-scope";
import { listen } from "@tauri-apps/api/event";
import { useDocSvc } from "@/services/document";
import { useFdSvc } from "@/services/folder";
import {
  notifyArchiveChanged,
  notifyDocChanged,
} from "@/infrastructure/api/windowEvent";
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

// 单项彻底删除：先弹确认框，确认后才执行
const doPurgeItem = async () => {
  const item = pendingPurgeItem.value;
  pendingPurgeItem.value = null;
  if (item) await purgeItem(item);
};

// 清空回收站需二次确认：点按钮先弹确认框，确认后才真正执行
const showPurgeConfirm = ref(false);
// 单项彻底删除同样需二次确认：记录待删除项，确认后执行
const pendingPurgeItem = ref<TrashItem | null>(null);

// 清空回收站：批量物理删除全部软删文档与归档（均不可恢复）
const doPurgeAll = async () => {
  showPurgeConfirm.value = false;
  await docSvc.purgeMany(
    items.value.filter((i) => i.kind === "doc").map((i) => i.id),
  );
  for (const i of items.value.filter((i) => i.kind === "folder")) {
    await fdSvc.purgeFolder({ id: i.id });
  }
  await reload();
};

// 确认框打开时才响应 ESC（取消）与回车（确认）
onKeyStroke("Escape", () => {
  if (showPurgeConfirm.value) showPurgeConfirm.value = false;
  if (pendingPurgeItem.value) pendingPurgeItem.value = null;
});
onKeyStroke("Enter", () => {
  if (showPurgeConfirm.value) doPurgeAll();
  else if (pendingPurgeItem.value) doPurgeItem();
});
</script>

<template>
  <div>
    <!-- 头部：与其他四个视图一致的 h-16 + 紫色分隔线，右侧清空按钮 size-8 -->
    <div
      class="h-16 shrink-0 flex items-center px-5 gap-4 border-b border-purple-300"
    >
      <span class="flex-1 text-sm font-medium">回收站</span>
      <span class="text-xs text-neutral-400"> {{ items.length }} 项 </span>
      <button
        v-if="!isEmpty"
        title="清空回收站"
        class="size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:text-red-600 hover:bg-red-50"
        @click="showPurgeConfirm = true"
      >
        <Broom class="size-5" />
      </button>
    </div>
    <EmptyHint v-if="!loading && isEmpty" class="h-16 border-b border-gray-100">
      空空如也
    </EmptyHint>
    <template v-else>
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
        <!-- pr-5 使右侧按钮（size-8）与头部清空按钮（px-5）同轴：中心均在距右缘 36px 处 -->
        <div
          class="pr-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            @click="pendingPurgeItem = item"
          >
            <Delete class="size-5" />
          </button>
        </div>
      </div>
    </template>

    <!-- 单项删除确认框：风格与清空确认框一致 -->
    <div
      v-if="pendingPurgeItem"
      class="fixed inset-0 grid place-items-center bg-black/10"
    >
      <FocusScope
        class="w-96 bg-white rounded-2xl px-6 pt-6 pb-4 select-none"
        autofocus
      >
        <div class="text-sm font-medium">彻底删除</div>
        <div class="mt-2 text-xs text-neutral-400">
          将彻底删除「{{ pendingPurgeItem.name }}」，此操作不可恢复。
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="h-9 bg-gray-100 px-4 rounded-md cursor-pointer"
            @click="pendingPurgeItem = null"
          >
            取消
          </button>
          <button
            class="h-9 bg-red-500 px-4 rounded-md text-white cursor-pointer hover:bg-red-600"
            @click="doPurgeItem"
          >
            删除
          </button>
        </div>
      </FocusScope>
    </div>

    <!-- 清空确认框：风格与 ArchivePickerDialog 一致 -->
    <div
      v-if="showPurgeConfirm"
      class="fixed inset-0 grid place-items-center bg-black/10"
    >
      <FocusScope
        class="w-96 bg-white rounded-2xl px-6 pt-6 pb-4 select-none"
        autofocus
      >
        <div class="text-sm font-medium">清空回收站</div>
        <div class="mt-2 text-xs text-neutral-400">
          将彻底删除全部 {{ items.length }} 项，此操作不可恢复。
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="h-9 bg-gray-100 px-4 rounded-md cursor-pointer"
            @click="showPurgeConfirm = false"
          >
            取消
          </button>
          <button
            class="h-9 bg-red-500 px-4 rounded-md text-white cursor-pointer hover:bg-red-600"
            @click="doPurgeAll"
          >
            清空
          </button>
        </div>
      </FocusScope>
    </div>
  </div>
</template>
