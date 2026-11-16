import { Doc, DocEntry, DocType } from "@/types/doc";
import { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";

export const useEditorStore = defineStore("editor", () => {
  const id = ref<string>();
  const setId = (v: string | undefined) => {
    id.value = v;
  };
  const editorMode = ref<EditorMode>("doc");
  const setEditorMode = (v: EditorMode) => {
    editorMode.value = v;
  };
  // 当前打开的富文本弹窗类型（"" 为关闭）：link / math / image
  const richtextDialog = ref<RichTextDialog>("");
  const setRichtextDialog = (v: RichTextDialog) => {
    richtextDialog.value = v;
  };
  const title = ref("");
  const setTitle = (v: string) => {
    title.value = v;
  };
  const content = ref("");
  const setContent = (v: string) => {
    content.value = v;
  };
  const docEntries = ref<DocEntry[]>([]);
  const setDocEntries = (v: DocEntry[]) => {
    docEntries.value = v;
  };
  // 同步更新目录列表中对应文档的标题（左侧栏实时跟随标题编辑）
  const updateDocEntryTitle = (docId: string, v: string) => {
    const entry = docEntries.value.find((e) => e.id === docId);
    if (entry) entry.title = v;
  };
  const docType = ref<DocType>();
  const setDocType = (v: DocType | undefined) => {
    docType.value = v;
  };
  const key = ref("");
  const setKey = (v: string) => {
    key.value = v;
  };
  // 上次落库的内容快照，用于跳过无变化的保存
  const oldContent = ref("");
  // 上次落库的标题快照，用于跳过无变化的保存
  const oldTitle = ref("");
  // 文档切换中：为 true 时用遮罩盖住编辑区，避免切换间隙残留上一个文档造成闪烁
  const switching = ref(false);
  const setSwitching = (v: boolean) => {
    switching.value = v;
  };
  // 最近一次落库的富文本纯文本快照（saveContent 时顺手记录），
  // 供 AI 面板取当前文档正文作上下文，避免解析 content JSON
  const plainText = ref("");
  const setPlainText = (v: string) => {
    plainText.value = v;
  };
  const toc = ref<TableOfContentData>([]);
  const setToc = (v: TableOfContentData) => {
    toc.value = v;
  };
  // 元函数：整册替换当前文档（id/title/content/docType），并重置内容/标题快照、目录与重挂载 key
  const setDoc = (doc: Doc | null) => {
    setId(doc?.id);
    const c = doc?.content || "";
    oldContent.value = c;
    oldTitle.value = doc?.title || "";
    setTitle(doc?.title || "");
    setContent(c);
    setDocType(doc?.doc_type);
    setPlainText("");
    setKey(Date.now().toString());
    // 目录随文档清空：空态下 RichText 已卸载、不会回填新 toc，不清会残留上一文档的旧标题
    setToc([]);
  };
  const name = ref("");
  const setName = (v: string) => {
    name.value = v;
  };
  // 当前打开的归档 id（archive 模式下创建文档需归档关联）
  const archiveId = ref<string>();
  const setArchiveId = (v: string | undefined) => {
    archiveId.value = v;
  };
  // 左侧栏是否有内容可显示（唯一判定源，EditorView 与 WindowControl 共用）：
  // 归档模式总有文档目录；doc 模式仅富文本有大纲，flowChart/mindMap 两者皆无
  const leftbarApplicable = computed(
    () =>
      editorMode.value === "archive" ||
      (editorMode.value === "doc" && docType.value === "richText"),
  );
  return {
    leftbarApplicable,
    id,
    setId,
    editorMode,
    setEditorMode,
    richtextDialog,
    setRichtextDialog,
    title,
    setTitle,
    content,
    setContent,
    docEntries,
    setDocEntries,
    updateDocEntryTitle,
    docType,
    setDocType,
    key,
    setKey,
    plainText,
    setPlainText,
    oldContent,
    oldTitle,
    switching,
    setSwitching,
    setDoc,
    name,
    setName,
    archiveId,
    setArchiveId,
    toc,
    setToc,
  };
});

// 开发环境 HMR 热更新 store（否则修改 store 后热更新不会重跑 setup，新增 state 不生效）
if (import.meta.hot) {
  acceptHMRUpdate(useEditorStore, import.meta.hot);
}
