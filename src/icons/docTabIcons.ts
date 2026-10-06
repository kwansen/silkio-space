// icons/tabIcons.ts: 侧边栏标签页图标常量，集中管理所有标签页图标名称
export const icons = {
  // 文件排序
  docSort: "mdi:file-outline",
  // 文件搜索
  docSearch: "mdi:file-search-outline",
  // 归档排序
  archiveSort: "mdi:archive-outline",
  // 归档搜索
  archiveSearch: "mdi:archive-search-outline",
} as const;

type Icon = typeof icons[keyof typeof icons];
type IconKey = keyof typeof icons;

// 重命名导出
export const docTabIcons = icons;
export type { Icon as DocTabIcon, IconKey as DocTabIconKey };
