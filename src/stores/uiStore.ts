import { defineStore } from "pinia";
import { ref } from "vue";

// 全局 UI 状态：跨域导航与窗口布局（各域自身状态在对应域 store 中）
export const useUiStore = defineStore("ui", () => {
  //#region docTab的切换
  const docTab = ref<DocTabOption>("docSort");
  const setDocTab = (v: DocTabOption) => {
    docTab.value = v;
  };
  //#endregion

  // 归档选择弹窗的目标文档 id（"" 为关闭）
  const openId = ref("");
  const setOpenId = (v: string) => {
    openId.value = v;
  };

  //#region 左侧栏
  const leftbarOption = ref<LeftBarOption>("docEntries");
  const setLeftbarOption = (v: LeftBarOption) => {
    leftbarOption.value = v;
  };

  const showLeftbar = ref<boolean>(true);
  const setLeftbarShow = (v: boolean) => {
    showLeftbar.value = v;
  };
  const toggleLeftbar = () => {
    showLeftbar.value = !showLeftbar.value;
  };
  //#endregion

  //#region 右侧栏
  const showRightbar = ref<boolean>(true);
  const setRightbarShow = (v: boolean) => {
    showRightbar.value = v;
  };
  const toggleRightbar = () => {
    showRightbar.value = !showRightbar.value;
  };
  //#endregion

  const showSettingDialog = ref<boolean>(false);
  const setSettingDialogShow = (v: boolean) => {
    showSettingDialog.value = v;
  };

  return {
    docTab,
    setDocTab,
    openId,
    setOpenId,
    leftbarOption,
    setLeftbarOption,
    showLeftbar,
    setLeftbarShow,
    toggleLeftbar,
    showRightbar,
    setRightbarShow,
    toggleRightbar,
    showSettingDialog,
    setSettingDialogShow,
  };
});
