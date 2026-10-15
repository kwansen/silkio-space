import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  //#region mode的切换
  const currentMode = ref<AppModeOption>("document");
  const setMode = (v: AppModeOption) => {
    currentMode.value = v;
  };
  //#endregion
  //#region docTab的切换
  const currentDocTab = ref<DocTabOption>("docSort");
  const setDocTab = (v: DocTabOption) => {
    currentDocTab.value = v;
  };
  //#endregion
  //#region docSort的切换
  const currentDocSort = ref<DocSortOption>("viewedAt");
  const setDocSort = (v: DocSortOption) => {
    currentDocSort.value = v;
  };
  //#endregion
  //#region archiveSort的切换
  const currentArchiveSort = ref<ArchiveSortOption>("manual");
  const setArchiveSort = (v: ArchiveSortOption) => {
    currentArchiveSort.value = v;
  };
  //#endregion

  const richtextDialog = ref<RichTextDialog>("");
  const setRichtextDialog = (v: RichTextDialog) => {
    richtextDialog.value = v;
  };

  return {
    currentMode,
    setMode,
    currentDocTab,
    setDocTab,
    currentDocSort,
    setDocSort,
    currentArchiveSort,
    setArchiveSort,
    richtextDialog,
    setRichtextDialog,
  };
});
