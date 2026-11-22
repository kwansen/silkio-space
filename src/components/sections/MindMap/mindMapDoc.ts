// 思维导图文档层纯逻辑：文档解析/序列化、层级样式、选项清单。
// 不依赖画布实例与 UI，便于单独维护与测试。
import type { EdgeShape } from "@silkor/core";
import type { MindMapNode, MindMapOptions, Style } from "silkio-mindmap";

export type LayoutDirection = NonNullable<MindMapOptions["direction"]>;

// 合法的偏好取值（parseContent 校验用）
export const DIRECTION_VALUES: LayoutDirection[] = [
  "right",
  "left",
  "both",
  "down",
];
export const EDGE_SHAPE_VALUES: EdgeShape[] = ["bezier", "path", "rPath"];

// 级数样式配置（参照 .examples/mindmap 的 levelStyles）：index 0 为根节点（一级），
// 依次向深层级递增，超出配置长度套用最后一项。节点一律无边框（borderWidth: 0），
// 层级靠背景色深浅区分
export const LEVEL_STYLES: Style[] = [
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

// 场景偏好（direction/edgeStyle）不随 MindMap.toJSON 导出（仅节点树），参照
// .examples/mindmap 的 MindMapDoc：与数据树并列作为顶层字段持久化，打开时整场景还原
type Prefs = {
  direction?: LayoutDirection;
  edgeStyle?: EdgeShape;
};
export type SavedDoc = { data: MindMapNode } & Prefs;
export type ParsedDoc = { data: MindMapNode } & Required<Prefs>;

// 解析文档内容：新格式为 { data, direction, edgeStyle } 包装；兼容旧格式
// （裸节点树，或偏好并入根节点字段的过渡格式），空/损坏数据回退默认树
export const parseContent = (raw: string): ParsedDoc => {
  const fallback: ParsedDoc = {
    data: { text: "中心主题", children: [] },
    direction: "right",
    edgeStyle: "rPath",
  };
  try {
    const parsed = JSON.parse(raw) as (SavedDoc & Prefs) | null;
    if (!parsed) return fallback;
    // 新格式：包装对象
    if (parsed.data && typeof parsed.data.text === "string") {
      return {
        data: parsed.data,
        direction: DIRECTION_VALUES.includes(
          parsed.direction as LayoutDirection,
        )
          ? (parsed.direction as LayoutDirection)
          : fallback.direction,
        edgeStyle: EDGE_SHAPE_VALUES.includes(parsed.edgeStyle as EdgeShape)
          ? (parsed.edgeStyle as EdgeShape)
          : fallback.edgeStyle,
      };
    }
    // 旧格式：裸节点树（可能带过渡期并入根节点的偏好字段）
    const legacy = parsed as unknown as MindMapNode & Prefs;
    if (typeof legacy.text === "string") {
      return {
        data: legacy,
        direction: DIRECTION_VALUES.includes(
          legacy.direction as LayoutDirection,
        )
          ? (legacy.direction as LayoutDirection)
          : fallback.direction,
        edgeStyle: EDGE_SHAPE_VALUES.includes(legacy.edgeStyle as EdgeShape)
          ? (legacy.edgeStyle as EdgeShape)
          : fallback.edgeStyle,
      };
    }
  } catch {
    // 回退默认树
  }
  return fallback;
};

// 汇总整棵树的纯文本与字数
export const collectText = (
  node: MindMapNode,
  out: string[] = [],
): string[] => {
  if (node.text) out.push(node.text);
  for (const child of node.children ?? []) collectText(child, out);
  return out;
};
