<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import FlowChart from "@/components/sections/FlowChart/FlowChart.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import MindMap from "@/components/sections/MindMap/MindMap.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useFdSvc } from "@/services/folder";
import { notifyDocChanged } from "@/infrastructure/api/windowEvent";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { computed, nextTick, onMounted, onUnmounted } from "vue";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/stores/uiStore";

const editorStore = useEditorStore();
const uiStore = useUiStore();
const { id, docEntries, content, docType, key, name, archiveId } =
  storeToRefs(editorStore);
const { setDocEntries, setArchiveId } = editorStore;
const { saveContent, openDocById } = useEditorAction();

// 左侧栏可见性：store 的 leftbarApplicable 是唯一判定源（WindowControl 同源），
// 这里仅叠加用户手动收起/展开的偏好
const leftbarVisible = computed(
  () => uiStore.showLeftbar && editorStore.leftbarApplicable,
);

const fdSvc = useFdSvc();
let stopOnOpen: (() => void) | null = null;
let stopOnDocChanged: (() => void) | null = null;
let stopOnArchiveChanged: (() => void) | null = null;
// openDoc 落库 viewed_at 后不广播，改由本窗口显示后补发 doc:changed，
// 避免 main 在 editor 未显示时先刷新而闪烁；空归档路径不置位、不补发
let pendingDocChanged = false;
const docSvc = useDocSvc();

// stale 对账：当前文档已失效（被删，或已不在所在归档目录）→ 切到首项，无则清空编辑区
const reconcileStale = async () => {
  const stale = id.value
    ? archiveId.value
      ? !docEntries.value.some((e) => e.id === id.value)
      : !(await docSvc.getById(id.value))
    : false;
  if (stale) {
    const next = docEntries.value[0];
    await openDocById(next ? next.id : null);
  }
};

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    async (event) => {
      const data = event.payload;
      const t = data.type;
      if (t === "doc") {
        editorStore.setEditorMode("doc");
        uiStore.setLeftbarOption("toc");
        // 切到独立文档视图必须清掉归档态，否则对账逻辑仍挂在旧归档上，
        // 会把不在该归档目录中的当前文档误判为失效并回切到目录首项
        setArchiveId(undefined);
        setDocEntries([]);
        name.value = "";
        await openDocById(data.id);
        // viewed_at 变化由本窗口显示后补发广播（见 showWindow）
        pendingDocChanged = true;
      } else if (t === "archive") {
        editorStore.setEditorMode("archive");
        uiStore.setLeftbarOption("docEntries");
        setArchiveId(data.id);
        const docEntries = await fdSvc.getArchiveDocEntries({ id: data.id });
        try {
          name.value = await fdSvc.getArchiveName({ id: data.id });
        } catch (e) {
          console.error(e);
        }

        setDocEntries(docEntries);
        await openDocById(docEntries[0]?.id ?? null);
        // 空归档没有富文本视图挂载、不会有就绪信号，渲染完成后直接显示窗口
        if (!editorStore.id) {
          await nextTick();
          showWindow();
        }
      }
    },
  );

  // 数据事实按域订阅，收到后与 DB 对账（不盲改当前文档，避免打断编辑）
  // doc:changed：文档本体变化。归档模式下目录里的文档可能被删/改名，重拉目录
  stopOnDocChanged = await listen("doc:changed", async () => {
    if (archiveId.value) {
      setDocEntries(
        await fdSvc.getArchiveDocEntries({ id: archiveId.value }),
      );
    }
    await reconcileStale();
  });

  // archive:changed：归档本体或成员变化。归档模式下重拉目录与归档名
  stopOnArchiveChanged = await listen("archive:changed", async () => {
    if (archiveId.value) {
      setDocEntries(
        await fdSvc.getArchiveDocEntries({ id: archiveId.value }),
      );
      try {
        name.value = await fdSvc.getArchiveName({ id: archiveId.value });
      } catch (e) {
        console.error(e);
      }
    }
    await reconcileStale();
  });
});

// 显示窗口：由编辑器的就绪信号或空态渲染完成后调用；
// 就绪信号意味着新文档已完成绘制，此时才解除切换遮罩
// viewed_at 等待同步广播在此补发，保证 main 刷新发生在 editor 已显示之后
const showWindow = () => {
  editorStore.setSwitching(false);
  getCurrentWindow().unminimize();
  getCurrentWindow().show();
  getCurrentWindow().setFocus();
  if (pendingDocChanged) {
    pendingDocChanged = false;
    notifyDocChanged();
  }
};

onUnmounted(() => {
  stopOnOpen?.();
  stopOnDocChanged?.();
  stopOnArchiveChanged?.();
});
</script>

<template>
  <div
    class="w-full h-full grid place-items-center"
    v-if="editorStore.editorMode === 'doc' && !id"
  >
    空空如也
  </div>
  <div class="relative w-full h-full flex" v-else>
    <!-- 切换遮罩：盖住整个视图（含 LeftBar 的旧目录/旧 Toc 残留），
         就绪后由 showWindow 解除 -->
    <div
      v-if="editorStore.switching"
      class="absolute inset-0 z-20 bg-white"
    ></div>
    <LeftBar v-if="leftbarVisible" v-model="docEntries" />
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="relative w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText
          v-if="docType === 'richText'"
          :content="content"
          :key="key"
          @on-ready="showWindow"
          @on-content-save="saveContent"
        />
        <EditorEmpty v-if="!docType" />
        <MindMap
          v-if="docType === 'mindMap'"
          :content="content"
          :key="key"
          @on-ready="showWindow"
          @on-content-save="saveContent"
        />
        <FlowChart
          v-if="docType === 'flowChart'"
          :content="content"
          :key="key"
          @on-ready="showWindow"
          @on-content-save="saveContent"
        />
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
