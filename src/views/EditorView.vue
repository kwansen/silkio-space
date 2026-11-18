<script setup lang="ts">
import EditorEmpty from "@/components/sections/EditorEmpty.vue";
import FlowChart from "@/components/sections/FlowChart/FlowChart.vue";
import LeftBar from "@/components/sections/LeftBar/LeftBar.vue";
import MindMap from "@/components/sections/MindMap/MindMap.vue";
import RichText from "@/components/sections/RichText/RichText.vue";
import RightBar from "@/components/sections/RightBar/RightBar.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useFdSvc } from "@/services/folder";
import {
  notifyDocChanged,
  onEditorOpen,
  type EditorOpenPayload,
} from "@/infrastructure/api/windowEvent";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { computed, nextTick, onMounted, onUnmounted, watch } from "vue";
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
// 叠加用户手动偏好与窄窗口自适应（宽度不足时自动隐藏，不写偏好）
const leftbarVisible = computed(
  () =>
    uiStore.showLeftbar && editorStore.leftbarApplicable && uiStore.leftbarFits,
);

// 大纲（TOC）只对富文本有意义：归档模式下切到 mindMap/flowChart 时，
// 若左栏停留在「大纲」tab 则回退到「目录」，避免出现永远为空的大纲面板
watch(
  () => [editorStore.docType, uiStore.leftbarOption] as const,
  ([type, option]) => {
    if (option === "toc" && type !== "richText") {
      uiStore.setLeftbarOption("docEntries");
    }
  },
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

// 执行一次打开（doc / archive）：事件触发与启动兜底共用
const runOpen = async (data: EditorOpenPayload) => {
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
};

onMounted(async () => {
  // 跨窗口打开事件 = 销毁渲染再重建：
  // 1) setDoc(null) 清空文档态，编辑区所有渲染器（tiptap/画布）随 v-if
  //    立即卸载，回到中性空态——配合屏幕外驻留（合成持续进行），空态帧
  //    会真实提交进交换链，旧文档画面被彻底替换，不残留旧数据；
  // 2) runOpen 用新文档重建渲染，就绪后才显示窗口。
  // JS 运行时、store、事件监听全部保留；挂起的旧编辑由 openDocById
  // 内部的 flushPendingSaves 落库，不受清空影响（pending 快照自带 docId）
  stopOnOpen = await onEditorOpen(async (data) => {
    editorStore.setDoc(null);
    await runOpen(data);
  });

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

// 显示窗口：由编辑器的就绪信号或空态渲染完成后调用
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
</script>

<template>
  <div
    class="w-full h-full grid place-items-center"
    v-if="editorStore.editorMode === 'doc' && !id"
  >
    空空如也
  </div>
  <!-- 行容器统一控制四周与列间留白（8px），各卡片不再自带边距，避免叠加 -->
  <div class="relative w-full h-full flex gap-2 px-2 pb-2" v-else>
    <!-- 左侧栏：与编辑区一致的白色圆角卡片 -->
    <div v-if="leftbarVisible" class="h-full">
      <LeftBar v-model="docEntries" />
    </div>
    <div class="flex-1 min-w-[480px]">
      <div class="relative w-full h-full bg-white rounded-lg overflow-hidden">
        <!-- 富文本不按 key 重挂载：同类型切换由组件内原地 setContent 完成 -->
        <RichText
          v-if="docType === 'richText'"
          :content="content"
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
    <!-- 右侧 AI 面板：用户偏好 && 宽度足够；关闭时整个右侧栏隐藏 -->
    <RightBar v-if="uiStore.showRightbar && uiStore.rightbarFits" />
  </div>
</template>
