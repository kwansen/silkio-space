import { onUnmounted, ref } from "vue";

// 工具栏悬浮面板（hover intent）：悬浮 200ms 延迟展开，移出立即收起；
// 点击触发器即时切换。纯 CSS group-hover 过于灵敏，鼠标划过工具条即弹面板易误触。
// 参照 .examples/mindmap 与 .examples/flowchart 的工具栏实现。
export function useHoverMenu() {
  const openMenu = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleMenu = (id: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (openMenu.value = id), 200);
  };

  const closeMenu = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    openMenu.value = null;
  };

  const toggleMenu = (id: string) => {
    const wasOpen = openMenu.value === id;
    closeMenu();
    if (!wasOpen) openMenu.value = id;
  };

  onUnmounted(closeMenu);

  return { openMenu, scheduleMenu, closeMenu, toggleMenu };
}
