<script setup lang="ts">
import RichText from "@/components/sections/RichText/RichText.vue";
import MindMapCanvas from "@/components/sections/MindMapCanvas/MindMapCanvas.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocSvc } from "@/services/document.ts";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { onMounted, onUnmounted } from "vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import EditorViewEmpty from "@/components/sections/EditorViewEmpty/EditorViewEmpty.vue";

const store = useEditorViewStore();
const { setKey, setDoc, setFolder, setSidebarView } = store;

let stopOnOpen: (() => void) | null;
let stopOnClose: (() => void) | null;
let stopOnFolderChange: (() => void) | null;

// 窗口显示闸门：仅 open 事件加载完成后（on-ready）允许显示窗口；
// folderChange 等数据刷新引起的重渲染不唤起（显示/聚焦）窗口
let pendingShow = false;

// 元函数：取消最小化、显示并聚焦 editor 窗口，并通知 main 刷新列表（viewed_at 已变化）
// [日志]
const show = async () => {
  if (!pendingShow) return;
  pendingShow = false;
  const win = getCurrentWindow();
  await win.unminimize();
  await win.show();
  await win.setFocus();
  await notifyMainRefresh();
};

onMounted(async () => {
  // 元函数：阻止窗口关闭，改为隐藏（下次打开更快，无需重新创建窗口）
  stopOnClose = await getCurrentWindow().onCloseRequested(async (event) => {
    event.preventDefault();
    await getCurrentWindow().hide();
  });

  // 元函数：监听 open 事件，根据类型与 id 加载文档
  stopOnOpen = await listen<{ type: string; id: string }>(
    "open",
    async (event) => {
      try {
        const { type, id } = event.payload;
        if (type === "doc") {
          pendingShow = true;
          const svc = await useDocSvc();
          const doc = await svc.getById(id);
          setDoc(doc);
          setFolder(null);
        } else if (type === "folder") {
          // 打开归档：加载归档信息并渲染归档下第一个文档（按加入顺序 sort_order 升序）
          // 有文档时由 on-ready 触发显示；无文档时清空当前文档并直接显示窗口
          // 侧栏默认回到列表视图
          pendingShow = true;
          const folderSvc = await useFolderSvc();
          const folder = await folderSvc.getById(id);
          setFolder(folder);
          const doc = await folderSvc.getFirstDoc(id);
          setDoc(doc);
          setSidebarView("list");
          if (!doc) await show();
        }
      } catch (e) {
        console.error(e);
      }
      setKey(Date.now());
    },
  );

  // 元函数：监听 folderChange 事件（main 窗口对归档改名/删除或归档内文档增删时通知）
  // 仅当变化的归档正是当前展示的归档时同步：刷新归档信息与侧栏列表，
  // 归档被删除时清空展示，当前文档已不在归档内时切换为归档内第一个文档
  stopOnFolderChange = await listen<{ folderId: string }>(
    "folderChange",
    async (event) => {
      try {
        const { folderId } = event.payload;
        if (store.folder?.id !== folderId) return;
        const folderSvc = await useFolderSvc();
        const folder = await folderSvc.getById(folderId);
        if (!folder) {
          setFolder(null);
          setDoc(null);
          setKey(Date.now());
          return;
        }
        setFolder(folder);
        const docs = await folderSvc.getDocs(folderId);
        if (!docs.some((d) => d.id === store.doc?.id)) {
          setDoc(docs[0] ?? null);
        }
        setKey(Date.now());
      } catch (e) {
        console.error(e);
      }
    },
  );
});

onUnmounted(() => {
  stopOnOpen?.();
  stopOnClose?.();
  stopOnFolderChange?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <LeftBar />
    <!-- 无文档时（如打开归档）渲染空状态占位 -->
    <div class="flex-1 pr-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <EditorViewEmpty v-if="!store.doc" />
        <RichText
          v-if="store.doc?.doc_type === 'richText'"
          :key="store.key"
          @on-ready="show"
        />
        <MindMapCanvas
          v-if="store.doc?.doc_type === 'mindMap'"
          :key="store.key"
          @on-ready="show"
        />
        <!-- <FlowChart /> -->
      </div>
    </div>
  </div>
</template>
