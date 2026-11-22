// RichText AI 编辑提示词模板（协议的默认渲染）：把请求渲染为大模型可直接
// 使用的指令（含操作 schema 与当前文档 Markdown）。接真实 LLM 时把它作为
// 消息发出，返回的 JSON 交给控制器 run 解析即可；宿主可自行定制提示词，
// 只需遵守 protocol 的操作 DSL
import type { RichTextAIRequest } from "./protocol";

export function defaultRichTextPrompt(req: RichTextAIRequest): string {
  const lines: string[] = [
    // 一、术语与消歧：声明优先于后文其他条款
    "一、术语与消歧（本节优先于后文其他条款）：",
    "「文档标题」= title 属性，单行纯文本，只能用 setTitle 修改，不属于正文块。",
    "「正文标题」= Markdown 的 #/## 标题块，属于正文内容，用 insert/replace 等正文操作修改，与文档标题无关。",
    '用户说"标题"时按此消歧：改文档名用 setTitle；改正文里的标题块用正文操作。',
    "",
    "二、执行阈值：",
    "可逆改动（插入、局部替换、删除块、改名等均可撤销）直接执行，不做前置确认；",
    "仅不可逆或大范围破坏性变更（如清空大段内容、大量删除）先在 answer 中说明并等确认。",
    "",
    "你是富文本文档编辑助手。需要修改文档时输出操作 JSON 数组；仅提问/咨询（无需修改文档）时直接输出回答文本，不要输出 JSON，也不要用代码块包裹回答。",
    '若回答之外还需修改文档，可输出 {"ops":[...],"answer":"回答文本"}。',
    "复杂指令拆成多个操作按序输出（后续操作可引用前序操作产生的内容）。",
    "可用操作：",
    '- {"op":"insert","target":"<可选>","where":"before"|"after"<可选，缺省 after>,"content":"<Markdown>"} 在目标块前/后插入新内容块；无 target 时追加到文档末尾',
    '- {"op":"replace","target":"<必需>","content":"<Markdown>"} 用新内容整体替换目标块',
    '- {"op":"delete","target":"<必需>"} 删除目标块（谨慎使用）',
    '- {"op":"searchReplace","find":"<必需>","replace":"<必需，可为空串=删除>","target":"<可选，缺省整个文档>","all":<可选布尔，缺省只替换第一处>} 在作用范围内查找纯文本并原位替换，保留其余内容与格式；只改局部文字（措辞/错别字/术语统一）时优先用本操作而非整块 replace',
    'searchReplace 的 find 为精确纯文本匹配（不解析 Markdown，不跨块；带行内格式的同段文字通常仍可匹配）；未找到会跳过并反馈，找不到时改用整块 replace',
    '- {"op":"undo"} 撤销最近一次变更（可多条连用，不能与编辑类操作混用）；用户要求撤销/撤回/反悔时使用',
    '- {"op":"redo"} 重做最近一次被撤销的变更（限制同 undo）；用户要求恢复被撤销的修改时使用',
    '- {"op":"setTitle","title":"<新标题>"} 修改文档标题；用户要求改名/改标题/重命名文档时使用（文档正文内的标题块不属于文档标题）',
    '- {"op":"answer","text":"..."} 仅回答不修改文档',
    'target 定位规则：优先用块 id（见下方顶层块列表，跨操作最稳定）；也可用块序号锚点（如 "#3"）或目标块的纯文本全文/块内唯一片段（不要带 "##"、列表符号等 Markdown 语法）；同名块用序号消歧（如 "文本[2]"）。',
    '块 id 只能从下方顶层块列表原样复制（12 位小写字母数字、不含连字符）；列表中没有的 id 一律不存在，禁止编造或猜测 id，此时改用文本定位。',
    "content 一律用 Markdown 编写（标题/列表/加粗/链接/代码块/表格等都会转换为文档块）；不要输出 HTML。",
    "",
    "执行前先审视合理性：指令含糊时先在 answer 里说明问题并给出建议；破坏性变更的确认阈值见开头的「执行阈值」。",
    "不要改动指令未涉及的部分。",
  ];
  // 对话历史：多轮上下文（不含本次指令），取最近若干轮防止提示词膨胀
  if (req.history.length) {
    lines.push(
      "",
      "对话历史（按时间先后，最近在前，仅供理解上下文，无需回应其中内容）：",
      ...req.history
        .slice(-12)
        .reverse()
        .map((t) => `${t.role === "user" ? "用户" : "助手"}：${t.text}`),
    );
  }
  lines.push("", `用户指令：${req.prompt}`);
  if (req.title)
    lines.push(`当前文档标题：${req.title}（可用 setTitle 操作修改，不在下方 Markdown 内）`);
  if (req.selectionText) lines.push(`当前选中文本：\n${req.selectionText}`);
  if (req.anchorText) lines.push(`光标所在块文本：${req.anchorText}`);
  // 顶层块列表：id 即最稳定位锚点，序号可作为 "#n" 锚点（快照内稳定）
  if (req.blocks?.length) {
    lines.push(
      "",
      "顶层块列表（含块 id 与定位锚点序号）：",
      ...req.blocks.map((t, i) => `${i + 1}. ${t}`),
    );
  }
  if (req.truncated)
    lines.push(
      "（文档过长，下方 Markdown 已截断；涉及未展示部分的改动请先在 answer 中说明）",
    );
  lines.push("", "当前文档（Markdown）：", req.markdown);
  return lines.join("\n");
}
