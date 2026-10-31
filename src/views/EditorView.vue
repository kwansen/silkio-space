<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useFdSvc } from "@/services/folder";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { nextTick, onMounted, onUnmounted } from "vue";
import { notifyDataChanged } from "@/infrastructure/api/windowEvent";
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
let stopOnDataChanged: (() => void) | null = null;
const docSvc = useDocSvc();

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

  // 数据事实统一入口：任何写操作后与 DB 对账（不盲改当前文档，避免打断编辑）
  stopOnDataChanged = await listen("data:changed", async () => {
    // 归档模式：重拉目录与归档名
    if (archiveId.value) {
      setDocEntries(await fdSvc.getArchiveDocEntries({ id: archiveId.value }));
      try {
        name.value = await fdSvc.getArchiveName({ id: archiveId.value });
      } catch (e) {
        console.error(e);
      }
    }
    // 当前文档已失效（被删，或已不在所在归档目录）：切到首项，无则清空编辑区
    const stale = id.value
      ? archiveId.value
        ? !docEntries.value.some((e) => e.id === id.value)
        : !(await docSvc.getById(id.value))
      : false;
    if (stale) {
      const next = docEntries.value[0];
      setDoc(next ? await docSvc.getById(next.id) : null);
    }
  });
});

// 显示窗口：由 RichText 的就绪信号或空态渲染完成后调用
const showWindow = () => {
  getCurrentWindow().unminimize();
  getCurrentWindow().show();
  getCurrentWindow().setFocus();
  notifyDataChanged();
};

onUnmounted(() => {
  stopOnOpen?.();
  stopOnDataChanged?.();
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
