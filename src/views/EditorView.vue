<script setup lang="ts">
import ArchiveTree from "@/components/sections/ArchiveTree/ArchiveTree.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import MindMapCanvas from "@/components/sections/MindMapCanvas/MindMapCanvas.vue";
import Empty from "@/components/shared/Empty.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { onMounted, onUnmounted } from "vue";

const store = useEditorViewStore();
const { setKey, setDoc } = store;

let stopOnOpen: (() => void) | null;
let stopOnClose: (() => void) | null;

// 元函数：取消最小化、显示并聚焦 editor 窗口，并通知 main 刷新列表（viewed_at 已变化）
// [日志]
const show = async () => {
  let t = performance.now();
  const win = getCurrentWindow();
  await win.unminimize();
  await win.show();
  await win.setFocus();
  await notifyMainRefresh();
  console.log(
    `[perf] editor 窗口显示完成 +${(performance.now() - t).toFixed(0)}ms`,
  );
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
      let t = performance.now();
      console.log(`[perf] editor 收到 open 事件 t=${t.toFixed(0)}`);
      try {
        const { type, id } = event.payload;
        if (type === "doc") {
          const svc = await useDocSvc();
          console.log(
            `[perf] editor useDocSvc done +${(performance.now() - t).toFixed(0)}ms`,
          );
          const doc = await svc.getById(id);
          console.log(
            `[perf] editor getById done +${(performance.now() - t).toFixed(0)}ms`,
          );
          setDoc(doc);
          console.log(
            `[perf] editor setDoc done +${(performance.now() - t).toFixed(0)}ms`,
          );
        } else if (type === "folder") {
          // 归档暂无可渲染内容：清空当前文档并直接显示窗口（文档内容由 on-ready 触发显示）
          setDoc(null);
          await show();
        }
      } catch (e) {
        console.error(e);
      }
      setKey(Date.now());
      console.log(
        `[perf] editor setKey done +${(performance.now() - t).toFixed(0)}ms`,
      );
    },
  );
});

onUnmounted(() => {
  stopOnOpen?.();
  stopOnClose?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <ArchiveTree />
    <!-- 无文档时（如打开归档）渲染空状态占位 -->
    <div class="flex-1 pr-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <Empty v-if="!store.doc" />
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
