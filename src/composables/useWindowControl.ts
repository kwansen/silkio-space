import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, ref } from "vue";

export const useWindowControl = () => {
  const win = getCurrentWindow();
  const isMaximized = ref<boolean>(false);

  const minimize = async () => {
    await win.minimize();
  };

  const toggleMaximize = async () => {
    await win.toggleMaximize();
  };

  const hide = async () => {
    await win.hide();
  };

  onMounted(async () => {
    isMaximized.value = await win.isMaximized();
    win.onResized(async () => {
      isMaximized.value = await win.isMaximized();
    });
  });

  return {
    isMaximized,
    minimize,
    toggleMaximize,
    hide,
  };
};
