import type { CreateDocParams } from "@/infrastructure/db/document";
import type { DocType } from "@/types/doc";

// 各类型文档新建时的默认落库参数（标题/内容），数据模型参照 .examples demo：
// mindMap：{ text, children } 节点树，新建仅含根节点；标题恒等于根节点文本
// （MindMap 挂载即同步标题），创建时预置同一标题可避免目录先显示
// 「未命名标题」再跳成「中心主题」的闪烁，同步时快照比对相等也不会重复落库
// flowChart：{ nodes, edges }，新建仅含一个"开始"端点节点；标题不与内容同步
const MINDMAP_ROOT_TEXT = "中心主题";

const DEFAULTS: Partial<Record<DocType, CreateDocParams>> = {
  mindMap: {
    title: MINDMAP_ROOT_TEXT,
    content: JSON.stringify({ text: MINDMAP_ROOT_TEXT, children: [] }),
  },
  flowChart: {
    content: JSON.stringify({
      nodes: [{ id: "start", shape: "ellipse", x: 80, y: 200, text: "开始" }],
      edges: [],
    }),
  },
};

// 元函数：取指定类型的默认创建参数（无默认值的类型返回空对象）
export const typedDocDefaults = (docType: DocType): CreateDocParams =>
  DEFAULTS[docType] ?? {};
