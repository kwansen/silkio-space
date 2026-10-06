// icons/windowControlIcons.ts: 窗口控制图标常量，集中管理窗口控制按钮图标名称
const icons = {
  // 最小化
  minimize: "material-symbols-light:horizontal-rule-rounded",
  // 最大化
  maximize: "material-symbols-light:crop-square-outline-sharp",
  // 还原
  restore: "material-symbols-light:crop-square-sharp",
  // 关闭
  close: "material-symbols-light:close-rounded",
} as const;

type Icon = typeof icons[keyof typeof icons];
type IconKey = keyof typeof icons;

export const windowControlIcons = icons;
export type { Icon as WindowControlIcon, IconKey as WindowControlIconKey };
