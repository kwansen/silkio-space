import { defineStore } from "pinia";
import { ref } from "vue";
import type { Doc } from "@/infrastructure/db/document.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";

// 左侧栏视图类型：列表 / 大纲
export type SidebarView = "nav" | "outline";

export const useEditorViewStore = defineStore('editorView', () => {
  const key = ref<number>(0)
  const doc = ref<Doc | null>(null)
  const folder = ref<Folder | null>(null)
  const sidebarView = ref<SidebarView>("nav")

  const setKey = (v: number) => {
    key.value = v
  }

  const setDoc = (v: Doc | null) => {
    doc.value = v
  }

  const setFolder = (v: Folder | null) => {
    folder.value = v
  }

  const setSidebarView = (v: SidebarView) => {
    sidebarView.value = v
  }

  return {
    key, doc, folder, sidebarView, setKey, setDoc, setFolder, setSidebarView
  }
})
