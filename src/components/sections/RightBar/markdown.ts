// AI 回答的 Markdown 渲染（最小实现）：先整体 HTML 转义再生成受控标签，
// 原始 HTML 一律作为纯文本显示，天然无 XSS 面，无需引入额外依赖。
// 支持聊天回答常用子集：代码块/行内代码、标题、有序/无序列表、引用、
// 粗体/斜体/链接/删除线、段落与换行。

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// 行内元素（输入已转义，安全）
const renderInline = (text: string): string =>
  text
    .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let listTag: "ul" | "ol" | null = null;
  let inQuote = false;

  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`);
      listTag = null;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };

  for (const line of lines) {
    // 代码块围栏
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      closeList();
      closeQuote();
      if (inCode) {
        out.push(
          `<pre class="ai-code-block"${codeLang ? ` data-lang="${codeLang}"` : ""}><code>${codeBuf.join("\n")}</code></pre>`,
        );
        inCode = false;
        codeBuf = [];
        codeLang = "";
      } else {
        inCode = true;
        codeLang = fence[1];
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      closeQuote();
      continue;
    }

    // 标题
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      closeQuote();
      const level = heading[1].length;
      out.push(`<h${level} class="ai-h">${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    // 引用
    const quote = trimmed.match(/^&gt;\s?(.*)$/);
    if (quote) {
      closeList();
      if (!inQuote) {
        out.push('<blockquote class="ai-quote">');
        inQuote = true;
      }
      out.push(`<p class="ai-p">${renderInline(quote[1])}</p>`);
      continue;
    }
    closeQuote();

    // 无序列表
    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (listTag !== "ul") {
        closeList();
        out.push('<ul class="ai-list">');
        listTag = "ul";
      }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      continue;
    }
    // 有序列表
    const ol = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ol) {
      if (listTag !== "ol") {
        closeList();
        out.push('<ol class="ai-list">');
        listTag = "ol";
      }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      continue;
    }
    closeList();

    // 普通段落（软换行转 <br>）
    out.push(`<p class="ai-p">${renderInline(trimmed)}</p>`);
  }

  // 收尾未闭合的代码块
  if (inCode) {
    out.push(
      `<pre class="ai-code-block"><code>${codeBuf.join("\n")}</code></pre>`,
    );
  }
  closeList();
  closeQuote();
  return out.join("\n");
}
