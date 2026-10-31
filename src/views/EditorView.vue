<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useFdSvc } from "@/services/folder";
import { notifyDocChanged } from "@/infrastructure/api/windowEvent";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { nextTick, onMounted, onUnmounted } from "vue";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/stores/uiStore";

const editorStore = useEditorStore();
const uiStore = useUiStore();
const { id, docEntries, content, docType, key, name, archiveId } =
  storeToRefs(editorStore);
const { setDoc, setDocEntries, setArchiveId } = editorStore;

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
    setDoc(next ? await docSvc.getById(next.id) : null);
  }
};

onMounted(async () => {
  stopOnOpen = await listen<{ type: "doc" | "archive"; id: string }>(
    "open",
    async (event) => {
      const data = event.payload;
      const t = data.type;
      if (t === "doc") {
        const doc = await docSvc.getById(data.id);
        editorStore.setEditorMode("doc");
        uiStore.setLeftbarOption("toc");
        // 切到独立文档视图必须清掉归档态，否则对账逻辑仍挂在旧归档上，
        // 会把不在该归档目录中的当前文档误判为失效并回切到目录首项
        setArchiveId(undefined);
        setDocEntries([]);
        name.value = "";
        setDoc(doc);
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
        const doc = docEntries[0]
          ? await docSvc.getById(docEntries[0].id)
          : null;
        setDoc(doc);
        // 空归档没有富文本视图挂载、不会有就绪信号，渲染完成后直接显示窗口
        if (!doc) {
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

// 显示窗口：由 RichText 的就绪信号或空态渲染完成后调用；
// viewed_at 等待同步广播在此补发，保证 main 刷新发生在 editor 已显示之后
const showWindow = () => {
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

const { saveContent } = useEditorAction();
</script>

<template>
  <div
    class="w-full h-full grid place-items-center"
    v-if="editorStore.editorMode === 'doc' && !id"
  >
    空空如也
  </div>
  <div class="w-full h-full flex" v-else>
    <LeftBar v-if="uiStore.showLeftbar" v-model="docEntries" />
    <div class="flex-1 min-w-0 px-2 pb-2">
      <div class="w-full h-full bg-white rounded-lg overflow-hidden">
        <RichText
          v-if="docType === 'richText'"
          :content="content"
          :key="key"
          @on-ready="showWindow"
          @on-content-save="saveContent"
        />
        <EditorEmpty v-if="!docType" />
        <!-- <MindMap />
        <FlowChart /> -->
      </div>
    </div>
    <div class="w-65 h-full"></div>
  </div>
</template>
