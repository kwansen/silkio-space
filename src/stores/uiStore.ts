import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  //#region mode的切换
  const appMode = ref<AppModeOption>("document");
  const setAppMode = (v: AppModeOption) => {
    appMode.value = v;
  };
  //#endregion
  //#region docTab的切换
  const docTab = ref<DocTabOption>("docSort");
  const setDocTab = (v: DocTabOption) => {
    docTab.value = v;
  };
  //#endregion
  //#region docSort的切换
  const docSort = ref<DocSortOption>("viewedAt");
  const setDocSort = (v: DocSortOption) => {
    docSort.value = v;
  };
  //#endregion
  //#region archiveSort的切换
  const archiveSort = ref<ArchiveSortOption>("manual");
  const setArchiveSort = (v: ArchiveSortOption) => {
    archiveSort.value = v;
  };
  //#endregion

  const richtextDialog = ref<RichTextDialog>("");
  const setRichtextDialog = (v: RichTextDialog) => {
    richtextDialog.value = v;
  };

  const openId = ref("");
  const setOpenId = (v: string) => {
    openId.value = v;
  };

  const editorMode = ref<EditorMode>("doc");
  const setEditorMode = (v: EditorMode) => {
    editorMode.value = v;
  };

  const leftbarOption = ref<LeftBarOption>("docEntries");
  const setLeftbarOption = (v: LeftBarOption) => {
    leftbarOption.value = v;
  };

  return {
    appMode,
    setAppMode,
    docTab,
    setDocTab,
    docSort,
    setDocSort,
    archiveSort,
    setArchiveSort,
    richtextDialog,
    setRichtextDialog,
    openId,
    setOpenId,
    editorMode,
    setEditorMode,
    leftbarOption,
    setLeftbarOption,
  };
});
