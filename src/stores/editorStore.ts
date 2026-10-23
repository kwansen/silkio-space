import { DocNav, DocType } from "@/types/doc";
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
  const docNavList = ref<DocNav[]>([]);
  const setDocNavList = (v: DocNav[]) => {
    docNavList.value = v;
  };
  const docType = ref<DocType>();
  const setDocType = (v: DocType | undefined) => {
    docType.value = v;
  };

  return {
    id,
    setId,
    title,
    setTitle,
    content,
    setContent,
    docNavList,
    setDocNavList,
    docType,
    setDocType,
  };
});
