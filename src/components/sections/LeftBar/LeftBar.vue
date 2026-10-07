<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from '@iconify/vue';
import { useEditorViewStore } from "@/stores/editorView";
import { useDocSvc } from "@/services/document.ts";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { docTypeIcons, type DocTypeIconKey } from "@/icons";
import type { Doc } from "@/infrastructure/db/document.ts";

const store = useEditorViewStore();
const { setDoc, setKey } = store;

// 元函数：按文档类型取图标，未识别类型回退为普通文件图标
const iconFor = (d: Doc) =>
  docTypeIcons[d.doc_type as DocTypeIconKey] ?? "mdi:file-outline";

// 元函数：加载侧栏文档列表（按归档内加入顺序 sort_order 升序，无归档时为空）
const docs = ref<Doc[]>([]);

const loadDocs = async () => {
  if (!store.folder) {
    docs.value = [];
    return;
  }
  try {
    const folderSvc = await useFolderSvc();
    docs.value = await folderSvc.getDocs(store.folder.id);
  } catch (e) {
    console.error(e);
  }
};

// 元函数：归档变化时刷新文档列表
watch(
  () => store.folder?.id,
  () => loadDocs(),
  { immediate: true },
);

// 元函数：点击列表项打开文档（更新浏览时间、通知 main 刷新列表）并刷新自身列表
const openDoc = async (id: string) => {
  try {
    const svc = await useDocSvc();
    await svc.update(id, { viewed_at: Date.now() });
    const doc = await svc.getById(id);
    setDoc(doc);
    setKey(Date.now());
    notifyMainRefresh();
    await loadDocs();
  } catch (e) {
    console.error(e);
  }
};

// 大纲项：标题层级、文本与出现顺序（用于映射编辑器 DOM 节点）
interface OutlineItem {
  level: number;
  text: string;
  index: number;
}

// 元函数：递归拼接节点文本
const nodeText = (node: any): string => {
  if (typeof node?.text === "string") return node.text;
  if (Array.isArray(node?.content)) return node.content.map(nodeText).join("");
  return "";
};

// 元函数：解析当前富文本文档内容 JSON，按顺序收集标题生成大纲
const outline = computed<OutlineItem[]>(() => {
  const raw = store.doc?.content;
  if (!raw || store.doc?.doc_type !== "richText") return [];
  try {
    const root = JSON.parse(raw);
    const items: OutlineItem[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (node.type === "heading") {
        items.push({
          level: Number(node.attrs?.level ?? 1),
          text: nodeText(node),
          index: items.length,
        });
      }
      if (Array.isArray(node.content)) node.content.forEach(walk);
    };
    walk(root);
    return items;
  } catch {
    return [];
  }
});

// 元函数：点击大纲项滚动编辑器到对应标题（顺序与内容 JSON 一致）
const scrollToHeading = (index: number) => {
  const nodes = document.querySelectorAll<HTMLElement>(
    ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6",
  );
  nodes[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>

<template>
  <div class="w-65 h-full px-2 flex flex-col">
    <!-- 头部：当前归档名 + 新建按钮 -->
    <div class="h-9 flex items-center hover:bg-gray-100 px-2 rounded-md">
      <div class="truncate">{{ store.folder?.name }}</div>
      <div class="flex-1"></div>
      <div class="w-7 h-7 rounded-md hover:bg-gray-200 grid place-items-center">
        <Icon icon="mdi:add" class="w-5 h-5"/>
      </div>
    </div>

    <!-- 文档列表（由标题栏切换按钮控制）：归档内文档（无归档时为最近浏览文档），点击切换渲染 -->
    <div v-if="store.sidebarView === 'list'" class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
      <div
        v-if="docs.length < 1"
        class="h-20 flex items-center justify-center text-xs text-neutral-400"
      >
        暂无文档
      </div>
      <div
        v-for="d in docs"
        :key="d.id"
        class="h-9 flex items-center gap-2 px-2 rounded-md text-xs cursor-pointer select-none shrink-0"
        :class="
          d.id === store.doc?.id
            ? 'bg-gray-100 text-neutral-700'
            : 'text-neutral-600 hover:bg-gray-100'
        "
        @click="openDoc(d.id)"
      >
        <Icon
          :icon="iconFor(d)"
          class="w-4 h-4 shrink-0"
          :class="d.id === store.doc?.id ? 'text-purple-600' : 'text-neutral-400'"
        />
        <div class="truncate">{{ d.title || "未命名标题" }}</div>
      </div>
    </div>

    <!-- 大纲：当前富文本文档的标题层级，点击滚动到对应位置 -->
    <div v-else class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
      <div
        v-if="outline.length < 1"
        class="h-20 flex items-center justify-center text-xs text-neutral-400"
      >
        暂无大纲
      </div>
      <div
        v-for="h in outline"
        :key="h.index"
        class="h-8 flex items-center rounded-md text-xs cursor-pointer select-none shrink-0 text-neutral-600 hover:bg-gray-100"
        :style="{ paddingLeft: `calc(${(h.level - 1) * 12}px + 8px)` }"
        @click="scrollToHeading(h.index)"
      >
        <div class="truncate">{{ h.text || "无标题" }}</div>
      </div>
    </div>
  </div>
</template>
