import { defineStore } from "pinia";
import { ref } from "vue";
import type { Doc } from "@/infrastructure/db/document.ts";

export const useEditorViewStore = defineStore('editorView', () => {
  const key = ref<number>(0)
  const doc = ref<Doc | null>(null)

  const setKey = (v: number) => {
    key.value = v
  }

  const setDoc = (v: Doc | null) => {
    doc.value = v
  }

  return {
    key, doc, setKey, setDoc
  }
})
