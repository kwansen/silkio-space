import { Doc, DocEntry, DocType } from "@/types/doc";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useEditorStore = defineStore("editor", () => {
  const id = ref<string>();
  const setId = (v: string | undefined) => {
    id.value = v;
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
  // 元函数：整册替换当前文档（id/title/content/docType），并重置内容快照与重挂载 key
  const setDoc = (doc: Doc | null) => {
    setId(doc?.id);
    const c = doc?.content || "";
    oldContent.value = c;
    setTitle(doc?.title || "");
    setContent(c);
    setDocType(doc?.doc_type);
    setKey(Date.now().toString());
  };

  return {
    id,
    setId,
    title,
    setTitle,
    content,
    setContent,
    docEntries,
    setDocEntries,
    docType,
    setDocType,
    key,
    setKey,
    oldContent,
    setDoc,
  };
});
