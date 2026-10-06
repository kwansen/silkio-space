// icons/docTypeIcons.ts: 新建文档类型图标常量，集中管理各文档类型图标名称
export const icons = {
  // 富文本
  richText: "mdi:file-outline",
  // 思维导图
  mindMap: "icon-park-outline:mindmap-map",
  // 流程图
  flowChart: "fluent:flowchart-24-regular",
  // 归档（文件夹）
  folder: "mdi:folder-outline",
  // 新建文档
  docCreate: "akar-icons:circle-plus",
} as const;

type Icon = typeof icons[keyof typeof icons];
type IconKey = keyof typeof icons;

// 重命名导出
export const docTypeIcons = icons;
export type { Icon as DocTypeIcon, IconKey as DocTypeIconKey };
