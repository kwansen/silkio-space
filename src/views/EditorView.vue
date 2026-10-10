<script setup lang="ts">
import RichText from "@/components/sections/RichText/RichText.vue";
import MindMapCanvas from "@/components/sections/MindMapCanvas/MindMapCanvas.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocSvc } from "@/services/document.ts";
import { useFdSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { onMounted, onUnmounted } from "vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import EditorViewEmpty from "@/components/sections/EditorViewEmpty/EditorViewEmpty.vue";

const store = useEditorViewStore();
const navTreeStore = useNavTreeStore();
const { setKey, setDoc, setFolder, setSidebarView } = store;

let stopOnOpen: (() => void) | null;
let stopOnFolderChange: (() => void) | null;
let stopOnDocRemoved: (() => void) | null;

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
          // 打开归档：加载归档信息并渲染归档子树内第一篇文档（优先根容器按加入顺序）
          // 有文档时由 on-ready 触发显示；无文档时清空当前文档并直接显示窗口
          // 侧栏默认回到列表视图
          pendingShow = true;
          const folderSvc = useFdSvc();
          const folder = await folderSvc.getFolderById({ id });
          setFolder(folder);
          const doc = await folderSvc.getFirstDocInSubtree({ folderId: id });
          setDoc(doc);
          setSidebarView("nav");
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
  // 归档被删除时清空展示，当前文档已不在归档子树内时切换为归档子树内第一篇文档
  stopOnFolderChange = await listen<{ folderId: string }>(
    "folderChange",
    async (event) => {
      try {
        const { folderId } = event.payload;
        if (store.folder?.id !== folderId) return;
        const folderSvc = useFdSvc();
        const folder = await folderSvc.getFolderById({ id: folderId });
        if (!folder) {
          // 归档已被删除：清空展示并隐藏窗口（空页面无意义，下次打开时再显示）
          setFolder(null);
          setDoc(null);
          setKey(Date.now());
          await getCurrentWindow().hide();
          return;
        }
        setFolder(folder);
        const docInSubtree =
          store.doc?.id &&
          (await folderSvc.hasDocInSubtree({
            folderId,
            docId: store.doc.id,
          }));
        if (!docInSubtree) {
          setDoc(await folderSvc.getFirstDocInSubtree({ folderId }));
        }
        setKey(Date.now());
      } catch (e) {
        console.error(e);
      }
    },
  );
  // 元函数：监听 docRemoved 事件（main 窗口永久删除文档时通知）：
  // nav 树重载以移除该文档；当前展示该文档时清空展示（渲染 empty 占位）
  stopOnDocRemoved = await listen<{ docId: string }>(
    "docRemoved",
    async (event) => {
      try {
        const { docId } = event.payload;
        if (store.doc?.id === docId) {
          setDoc(null);
          setKey(Date.now());
        }
        navTreeStore.bump();
      } catch (e) {
        console.error(e);
      }
    },
  );
});

onUnmounted(() => {
  stopOnOpen?.();
  stopOnFolderChange?.();
  stopOnDocRemoved?.();
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
