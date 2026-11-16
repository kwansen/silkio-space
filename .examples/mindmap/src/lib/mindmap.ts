// 导图 Demo 的静态配置：级数样式、示例数据、工具条选项与图标映射。
// 纯数据模块，不依赖 Vue 响应式。
import type { EdgeShape } from "@silkor/core";
import type { MindMapNode, Style } from "silkio-mindmap";

export type LayoutDirection = "left" | "right" | "down" | "both";

// 级数样式配置：index 0 为根节点（一级），依次向深层级递增，超出配置长度套用最后一项
export const levelStyles: Style[] = [
  // 一级样式：根节点
  {
    color: "#ffffffff",
    backgroundColor: "#A4B3C2",
    fontSize: 24,
    fontWeight: 500,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [8, 24],
  },
  // 二级样式：分支节点
  {
    color: "#1f2937",
    backgroundColor: "#DCE2E8",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 16],
  },
  // 三级样式
  {
    color: "#1f2937",
    backgroundColor: "#F9FAFB",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 12],
  },
  // 四级及以后样式（叶子节点）
  {
    color: "#1f2937",
    backgroundColor: "",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 12],
  },
];

// 首档示例数据：节点上的 style 可覆盖级数配置，缺省时按级数取 levelStyles
export const sampleData: MindMapNode = {
  text: "三角形",
  children: [
    { text: "锐角三角形", children: [] },
    { text: "直角三角形", children: [] },
    { text: "钝角三角形", children: [] },
  ],
};

// 布局方向选项：value 同时是触发器图标 data-icon-value 与菜单项值
export const layoutOptions: {
  value: LayoutDirection;
  short: string;
  title: string;
}[] = [
  { value: "right", short: "横向", title: "横向思维导图" },
  { value: "left", short: "左向", title: "左向思维导图" },
  { value: "both", short: "双向", title: "双向平衡布局" },
  { value: "down", short: "组织结构", title: "组织结构图" },
];

// 连线形状选项：'bezier' 纯贝塞尔 S 曲线，'path' Z 字折线，'rPath' 圆角 Z 字折线
export const edgeOptions: { value: EdgeShape; short: string; title: string }[] = [
  { value: "bezier", short: "贝塞尔", title: "贝塞尔曲线" },
  { value: "path", short: "Z 折线", title: "Z 字折线" },
  { value: "rPath", short: "圆角折线", title: "圆角折线" },
];

// value → 图标 symbol 映射：触发器与下拉菜单复用同一套图标
export const layoutIcons: Record<LayoutDirection, string> = {
  right: "i-layout-right",
  left: "i-layout-left",
  both: "i-layout-both",
  down: "i-layout-down",
};

export const edgeIcons: Record<EdgeShape, string> = {
  bezier: "i-edge-bezier",
  path: "i-edge-path",
  rPath: "i-edge-rpath",
};

// 触发浏览器下载：URL.revokeObjectURL 在 click 同步消费后即可释放
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
