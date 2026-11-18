// 字数统计：去除所有空白字符后计数（RichText / MindMap / FlowChart 统一口径）。
// plain_text 本身保留原文（含空白），供 AI 面板等需要上下文的场景使用
export const countWords = (text: string): number =>
  text.replace(/\s/g, "").length;
