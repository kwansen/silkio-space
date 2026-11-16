// AI 回答的 Markdown 渲染：comark 解析（流式自动补全未闭合语法）+ HTML 渲染。
// 模型输出属于不可信内容：关闭默认 HTML 插件让原始 HTML 只作为纯文本显示，
// 再用 security 插件过滤危险链接协议与属性，链接自动识别交给 linkify 插件。
import { createSerializedMarkdownParser } from "comark";
import linkify from "comark/plugins/linkify";
import security from "comark/plugins/security";
import { renderHtmlFromDocument } from "comark/render/html";
import type { ElementNode, MarkdownDocument, Node } from "comark";

// 串行解析器在流式重复解析时复用稳定节点，避免每个 SSE 分片全量重解析
const parse = createSerializedMarkdownParser({
  registerDefaultPlugins: false,
  plugins: [linkify(), security()],
});

// 流式光标插到最后一个块元素末尾；浅拷贝节点，避免污染解析器缓存的 AST
function withCaret(doc: MarkdownDocument): MarkdownDocument {
  const nodes: Node[] = [...doc.nodes];
  const caret: ElementNode = ["span", { class: "comark-caret" }];
  const last = nodes.at(-1);
  if (last && typeof last !== "string" && last[0] !== null) {
    const [tag, attrs, ...children] = last;
    const appended: ElementNode = [tag, attrs, ...children, caret];
    nodes[nodes.length - 1] = appended;
  } else {
    nodes.push(caret);
  }
  return { ...doc, nodes };
}

export async function renderMarkdown(src: string, streaming = false): Promise<string> {
  const doc = await parse(src, { streaming });
  return renderHtmlFromDocument(streaming ? withCaret(doc) : doc);
}
