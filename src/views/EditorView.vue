<script setup lang="ts">
import ArchiveTree from "@/components/sections/ArchiveTree/ArchiveTree.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import MindMapCanvas from "@/components/sections/MindMapCanvas/MindMapCanvas.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocSvc } from "@/services/document.ts";
import { onMounted, onUnmounted } from "vue";

const store = useEditorViewStore();
const { setKey, setDoc } = store;

let stopOnOpen: (() => void) | null;

// 元函数：取消最小化、显示并聚焦 editor 窗口
// [日志]
const show = async () => {
  let t = performance.now();
  const win = getCurrentWindow();
  await win.unminimize();
  await win.show();
  await win.setFocus();
  console.log(
    `[perf] editor 窗口显示完成 +${(performance.now() - t).toFixed(0)}ms`,
  );
};

onMounted(async () => {
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
});
</script>

<template>
  <div class="w-full h-full flex">
    <ArchiveTree />
    <RichText
      v-if="store.doc?.doc_type === 'richText'"
      :key="store.key"
      @on-ready="show" />
    <MindMapCanvas
      v-if="store.doc?.doc_type === 'mindMap'"
      :key="store.key"
      @on-ready="show" />
    <!-- <FlowChart /> -->
  </div>
</template>
