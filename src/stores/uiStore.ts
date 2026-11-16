import { defineStore } from "pinia";
import { computed, ref } from "vue";

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

  //#region 窗口宽度驱动的侧栏自适应
  // 侧栏实际可见 = 用户偏好 && 宽度足够。偏好仅在手动开关时修改，
  // 窄窗口自动隐藏不写偏好，因此宽度恢复后自然回到用户原本的选择
  // （偏好本来是关的，恢复后依然是关的），无需"恢复原样"的额外状态
  const windowWidth = ref(
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const setWindowWidth = (v: number) => {
    windowWidth.value = v;
  };
  // 左栏占 260 + 主区最少 480 + padding 16 → 至少 760（即窗口 minWidth）
  const leftbarFits = computed(() => windowWidth.value >= 760);
  // 右栏在左栏实际会显示时需要额外 260，否则按左栏不占位计算
  const rightbarFits = computed(
    () =>
      windowWidth.value >= (showLeftbar.value && leftbarFits.value ? 1020 : 760),
  );
  //#endregion

  const showSettingDialog = ref<boolean>(false);
  const setSettingDialogShow = (v: boolean) => {
    showSettingDialog.value = v;
  };
  // 设置对话框页签：允许其他组件打开设置时直达指定页（如 AI 面板齿轮 → AI 服务）
  const settingNav = ref<string>("common");
  const setSettingNav = (v: string) => {
    settingNav.value = v;
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
    windowWidth,
    setWindowWidth,
    leftbarFits,
    rightbarFits,
    showSettingDialog,
    setSettingDialogShow,
    settingNav,
    setSettingNav,
  };
});
