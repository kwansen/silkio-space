import { defineStore } from "pinia";
import { ref } from "vue";
import type { Doc } from "@/infrastructure/db/document.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";

export const useEditorViewStore = defineStore('editorView', () => {
  const key = ref<number>(0)
  const doc = ref<Doc | null>(null)
  const folder = ref<Folder | null>(null)

  const setKey = (v: number) => {
    key.value = v
  }

  const setDoc = (v: Doc | null) => {
    doc.value = v
  }

  const setFolder = (v: Folder | null) => {
    folder.value = v
  }

  return {
    key, doc, folder, setKey, setDoc, setFolder
  }
})
