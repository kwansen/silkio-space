// RichText AI 编辑协议：操作 DSL 与 LLM 输出容错解析。
// 形态对齐 silkio-mindmap 包内 ai-protocol（ops JSON / answer 纯文本，三层容错），
// 差异点：目标定位以「块级纯文本」为锚（ProseMirror 位置不稳定，不进协议），
// 内容载荷统一用 Markdown 表示（应用侧经编辑器 Markdown 扩展转换为文档节点）

// 插入位次：相对 target 块的前/后；无 target 时追加到文档末尾
export type RichTextInsertWhere = "before" | "after";

export interface RichTextInsertOp {
  op: "insert";
  target?: string;
  where?: RichTextInsertWhere;
  content: string;
}

export interface RichTextReplaceOp {
  op: "replace";
  target: string;
  content: string;
}

export interface RichTextDeleteOp {
  op: "delete";
  target: string;
}

export interface RichTextAnswerOp {
  op: "answer";
  text: string;
}

export interface RichTextUndoOp {
  op: "undo";
}

export interface RichTextRedoOp {
  op: "redo";
}

// 文档标题在编辑器外单独维护：改标题不是文档事务，走宿主注入的回调落库
export interface RichTextSetTitleOp {
  op: "setTitle";
  title: string;
}

export type RichTextOp =
  | RichTextInsertOp
  | RichTextReplaceOp
  | RichTextDeleteOp
  | RichTextAnswerOp
  | RichTextUndoOp
  | RichTextRedoOp
  | RichTextSetTitleOp;

export interface RichTextAITurn {
  role: "user" | "assistant";
  text: string;
}

export interface RichTextAIRequest {
  prompt: string;
  // 当前文档（Markdown 序列化；超长截断）
  markdown: string;
  // markdown 是否因超长被截断（提示词中据 此告知模型文档不完整）
  truncated?: boolean;
  title?: string;
  // 光标所在块的纯文本（"缺省改动位置"参考）
  anchorText?: string;
  // 当前选区纯文本（"改的就是这段"提示）
  selectionText?: string;
  // 顶层块列表（纯文本预览，序号即提示词中的块定位锚点 "#n"）
  blocks?: string[];
  history: RichTextAITurn[];
}

export interface RichTextAIStep {
  op: RichTextOp;
  label: string;
  status: "applied" | "skipped";
}

export interface RichTextAIResult {
  applied: number;
  ops: RichTextOp[];
  steps: RichTextAIStep[];
  answer?: string;
}

export type RichTextAIGenerate = (
  req: RichTextAIRequest,
) => Promise<RichTextOp[] | string>;

// 解析定位段："矩阵" → { text: "矩阵", nth: 1 }；"矩阵[2]" → 第 2 个同名块
// （语义移植 silkio-mindmap 同名函数）
export function parseTargetSegment(seg: string): {
  text: string;
  nth: number;
} {
  const m = seg.match(/^(.*)\[(\d+)\]$/);
  if (!m) return { text: seg, nth: 1 };
  return { text: m[1], nth: Math.max(1, parseInt(m[2], 10)) };
}

// 校验并规整 LLM 返回（数组 / { ops: [...] }），非法即抛错：
// 不做"部分应用"，脏输出整体拒绝，避免半套变更破坏文档
export function normalizeAIOps(raw: unknown): RichTextOp[] {
  if (!Array.isArray(raw)) throw new Error("AI 返回格式错误：应为操作数组");
  return raw.map((item, i) => {
    const op = item as Record<string, unknown> & { op?: string };
    const no = `（第 ${i + 1} 项）`;
    if (
      op.target !== undefined &&
      op.target !== null &&
      typeof op.target !== "string"
    )
      throw new Error(
        `AI 操作的 target 应为目标块文本或带序号文本（"文本[2]"）${no}`,
      );
    if (op.op === "insert") {
      if (typeof op.content !== "string" || !op.content.trim())
        throw new Error(`AI insert 操作缺少 content（Markdown 文本）${no}`);
      if (op.where !== undefined && op.where !== "before" && op.where !== "after")
        throw new Error(`AI insert 操作的 where 应为 "before" 或 "after"${no}`);
    } else if (op.op === "replace") {
      if (typeof op.target !== "string" || !op.target.trim())
        throw new Error(`AI replace 操作缺少 target${no}`);
      if (typeof op.content !== "string" || !op.content.trim())
        throw new Error(`AI replace 操作缺少 content（Markdown 文本）${no}`);
    } else if (op.op === "delete") {
      if (typeof op.target !== "string" || !op.target.trim())
        throw new Error(`AI delete 操作缺少 target${no}`);
    } else if (op.op === "answer") {
      if (typeof op.text !== "string" || !op.text)
        throw new Error(`AI answer 操作缺少 text${no}`);
    } else if (op.op === "setTitle") {
      if (typeof op.title !== "string" || !op.title.trim())
        throw new Error(`AI setTitle 操作缺少 title（新标题文本）${no}`);
    } else if (op.op !== "undo" && op.op !== "redo") {
      throw new Error(`AI 返回了未知操作类型${no}: ${String(op?.op)}`);
    }
    return item as RichTextOp;
  });
}

// 解析 AI 响应为「操作 + 回答」：编辑类指令产出操作序列，提问/咨询类产出
// 自然语言回答（answer）。容错三层（语义移植 silkio parseAIResponse）——
// 1. JSON 数组 / {ops:[...]}：标准操作序列，可含 {"op":"answer","text":...}（提取为 answer）
// 2. {answer:"..."} / {ops:[...],answer:"..."}：回答可独立或伴随操作
// 3. 非 JSON 纯文本：整体视为回答（LLM 对提问的直答；模型输出坏 JSON 时也能
//    看到它实际说了什么，便于诊断）
export function parseAIResponse(
  raw: RichTextOp[] | string,
): { ops: RichTextOp[]; answer?: string } {
  let data: unknown = raw;
  if (typeof raw === "string") {
    const text = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    try {
      data = JSON.parse(text);
    } catch {
      return { ops: [], answer: text };
    }
  }
  if (Array.isArray(data)) {
    const ops = normalizeAIOps(data);
    const rest = ops.filter((o) => o.op !== "answer");
    const answer = ops.find((o) => o.op === "answer")?.text;
    return { ops: rest, answer };
  }
  const obj = data as Record<string, unknown> | null;
  const answer =
    typeof obj?.answer === "string" && obj.answer ? obj.answer : undefined;
  if (obj?.ops !== undefined) return { ops: normalizeAIOps(obj.ops), answer };
  if (answer !== undefined) return { ops: [], answer };
  throw new Error("AI 返回格式错误：应为操作数组或回答文本");
}
