// icons/docTypeIcons.ts: 新建文档类型图标常量，集中管理各文档类型图标名称
export const icons = {
  add: "mdi:add",
} as const;

type Icon = typeof icons[keyof typeof icons];
type IconKey = keyof typeof icons;

// 重命名导出
export const rightBarIcons = icons;
export type { Icon as rightBarIcon, IconKey as rightBarIconKey };
