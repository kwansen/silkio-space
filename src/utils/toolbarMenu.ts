import { onUnmounted, ref } from "vue";

// 工具栏点击菜单：点击触发器开合，同一时间只允许一个面板打开；
// 点击外部（onClickOutside）或 Esc 关闭。
// 曾用 hover intent 展开，但画布编辑中鼠标大幅移动易误弹面板遮挡画布，
// 且按钮与面板间缝隙会导致移入面板前菜单提前收起，故改为纯点击交互。
export function useToolbarMenu() {
  const openMenu = ref<string | null>(null);

  const closeMenu = () => {
    openMenu.value = null;
  };

  const toggleMenu = (id: string) => {
    openMenu.value = openMenu.value === id ? null : id;
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMenu();
  };
  window.addEventListener("keydown", onKeydown);

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
    closeMenu();
  });

  return { openMenu, closeMenu, toggleMenu };
}
