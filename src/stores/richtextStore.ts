import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";

// 富文本编辑器专属状态：从 editorStore 下沉，避免非富文本文档
// （MindMap/FlowChart）也背上用不到的 dialog/toc 状态
export const useRichtextStore = defineStore("richtext", () => {
  // 当前打开的富文本弹窗类型（"" 为关闭）：link / math / image
  // RichTextDialog 为 types/ui.ts 的全局声明类型（非模块导出），直接使用
  const dialog = ref<RichTextDialog>("");
  const setDialog = (v: RichTextDialog) => {
    dialog.value = v;
  };
  // 大纲（TOC）数据：由 tiptap table-of-contents 扩展产生，仅富文本有
  const toc = ref<TableOfContentData>([]);
  const setToc = (v: TableOfContentData) => {
    toc.value = v;
  };
  return {
    dialog,
    setDialog,
    toc,
    setToc,
  };
});

// 开发环境 HMR 热更新 store（否则修改 store 后热更新不会重跑 setup，新增 state 不生效）
if (import.meta.hot) {
  acceptHMRUpdate(useRichtextStore, import.meta.hot);
}
