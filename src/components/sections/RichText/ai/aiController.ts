// RichText AI 编辑控制器（对标 silkio-mindmap 包内 AIEditingController 的角色）：
// run 为唯一入口——快照上下文（文档 Markdown + 锚点块/选区）→ 宿主适配器生成 →
// 容错解析 ops（protocol）→ 批内编译为单条 ProseMirror 事务：目标逐条在最新
// tr.doc 上定位（前序操作插入的块对后续操作可见），任一操作非法即抛错整体拒绝
// → 一次派发。一次 run 对撤销/重做是一个原子单元（单个 undo step）；
// undo/redo 直接驱动 Tiptap UndoRedo（与手动 Ctrl+Z 同源），不与编辑类操作混用
import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/vue-3";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  parseAIResponse,
  parseTargetSegment,
  type RichTextAIGenerate,
  type RichTextAIResult,
  type RichTextAIStep,
  type RichTextAITurn,
  type RichTextOp,
} from "./protocol";

// 单次请求上下文长度上限：与 aiAction 的聊天上下文一致，避免超长文档打爆 token 预算
const CONTEXT_LIMIT = 12000;

// 反馈链/报错里目标块文本的预览长度
const PREVIEW_LIMIT = 20;

// 文档顶层块快照：from/to 为块级边界位置，text 为块内纯文本（块间以换行
// 连接），供 target 定位与锚点上下文使用；id 为 UniqueID 扩展注入的持久化
// 节点 id（旧文档块可能尚无 id，为 undefined 时不可按 id 定位）
interface BlockInfo {
  from: number;
  to: number;
  text: string;
  id?: string;
}

// 块锚点跟踪项：快照块经事务映射跟踪到当前位置；deletedIn 记录被哪个操作
// 移除（后续操作引用已删锚点时报错并指向移除来源，语义对齐导图协议）
interface TrackedBlock extends BlockInfo {
  deletedIn?: string;
}

const collectBlocks = (doc: PMNode): BlockInfo[] => {
  const out: BlockInfo[] = [];
  doc.forEach((child, offset) => {
    out.push({
      from: offset,
      to: offset + child.nodeSize,
      text: doc.textBetween(offset, offset + child.nodeSize, "\n"),
      id: typeof child.attrs?.id === "string" ? child.attrs.id : undefined,
    });
  });
  return out;
};

// 反馈/报错里的块文本预览：压平空白并截断
const preview = (text: string) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > PREVIEW_LIMIT ? `${t.slice(0, PREVIEW_LIMIT)}…` : t;
};

// 提示词里顶层块列表的文本预览（比反馈链预览更长，保证可读可定位）
const listPreview = (text: string) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
};

// 目标文本归一化：去除 Markdown 装饰（模型常把 "## "、"- "、"1. " 等语法
// 带进 target）与空白差异，供宽松匹配
const normalizeTargetText = (s: string) =>
  s
    .replace(/^\s{0,3}#{1,6}\s+/, "") // 标题
    .replace(/^\s{0,3}>\s?/, "") // 引用
    .replace(/^\s{0,3}[-*+]\s+(?:\[[ xX]\]\s+)?/, "") // 列表/任务项
    .replace(/^\s{0,3}\d+[.)]\s+/, "") // 有序列表
    .replace(/[*_`~]/g, "") // 行内强调
    .replace(/\s+/g, " ")
    .trim();

export interface RichTextAIRunOptions {
  // AI 编辑对话历史（不含本次指令）
  history?: RichTextAITurn[];
  // 文档标题：仅作上下文提示（标题在编辑器外单独维护）
  title?: string;
  // 修改文档标题的回调（"setTitle" 操作）：标题不在 Tiptap 文档内，由宿主
  // 注入统一落库链路（store/目录项/防抖落库）；缺省时该操作报错拒绝
  setTitle?: (title: string) => void;
}

export class RichTextAIController {
  // 防并发：上一轮生成/应用未落定前拒绝新一轮
  busy = false;

  constructor(
    private editor: Editor,
    private generate: RichTextAIGenerate,
  ) {}

  // 执行一次 AI 编辑：失败（适配器抛错 / 返回非法 / 目标不存在）时整体不生效
  async run(
    prompt: string,
    options: RichTextAIRunOptions = {},
  ): Promise<RichTextAIResult> {
    if (this.busy) throw new Error("AI 编辑进行中，请稍候");
    const editor = this.editor;
    if (!this.generate) throw new Error("未配置 AI 生成适配器");
    const text = prompt.trim();
    if (!text) throw new Error("请输入 AI 指令");

    const { state } = editor;
    const doc = state.doc;
    // 快照：文档与顶层块锚点列表。块锚点（"#n"）等价于快照内的临时 id，
    // 提示词与目标定位共用同一份，保证序号语义一致
    const snapshotDoc = doc;
    const snapshotBlocks = collectBlocks(doc);
    // 锚点块与选区：光标所在块作为"缺省改动位置"参考，选区文本提示"改的就是这段"
    const { from, to, empty } = state.selection;
    const anchor = snapshotBlocks.find((b) => from >= b.from && from < b.to);
    let markdown = "";
    try {
      markdown = editor.getMarkdown();
    } catch {
      markdown = doc.textBetween(0, doc.content.size, "\n\n");
    }
    const truncated = markdown.length > CONTEXT_LIMIT;
    if (truncated) markdown = markdown.slice(0, CONTEXT_LIMIT);

    const req = {
      prompt: text,
      title: options.title,
      markdown,
      truncated,
      anchorText: anchor ? anchor.text.slice(0, 200) : undefined,
      selectionText: empty
        ? undefined
        : doc.textBetween(from, to, "\n").slice(0, 2000),
      blocks: snapshotBlocks.map(
        (b) =>
          `${b.id ? `（id: ${b.id}）` : ""}「${listPreview(b.text)}」`,
      ),
      history: options.history ?? [],
    };
    this.busy = true;
    let raw: RichTextOp[] | string;
    try {
      raw = await this.generate(req);
    } finally {
      this.busy = false;
    }
    const { ops, answer } = parseAIResponse(raw);
    // undo/redo 与编辑类操作混用整体拒绝：避免"先撤销再在同一批里改新文档"
    // 的时序歧义（与导图协议一致）
    if (
      ops.some((o) => o.op === "undo" || o.op === "redo") &&
      ops.some(
        (o) =>
          o.op === "insert" ||
          o.op === "replace" ||
          o.op === "delete" ||
          o.op === "searchReplace" ||
          o.op === "setTitle",
      )
    )
      throw new Error("AI 的 undo/redo 操作不能与编辑类操作混用，请分开执行");
    // 纯控制链（undo/redo，无编辑类操作）：逐条驱动既有撤销/重做链，
    // 不产生新变更（可连用多次）
    if (ops.some((o) => o.op === "undo" || o.op === "redo")) {
      const steps: RichTextAIStep[] = [];
      let applied = 0;
      for (const op of ops) {
        if (op.op === "undo") {
          const ok = editor.commands.undo();
          if (ok) applied++;
          steps.push({
            op,
            label: ok ? "撤销最近一次变更" : "没有可撤销的变更，已跳过",
            status: ok ? "applied" : "skipped",
          });
        } else if (op.op === "redo") {
          const ok = editor.commands.redo();
          if (ok) applied++;
          steps.push({
            op,
            label: ok ? "重做最近一次被撤销的变更" : "没有可重做的变更，已跳过",
            status: ok ? "applied" : "skipped",
          });
        }
      }
      return { applied, ops, steps, answer };
    }
    const { steps, applied } = this.compile(ops, snapshotDoc, snapshotBlocks, {
      setTitle: options.setTitle,
      currentTitle: options.title,
    });
    return { applied, ops, steps, answer };
  }

  // 把操作序列编译并应用到单条事务：编译期不派发，全部成功才 dispatch
  //（任一操作非法即抛错，编译期抛错 = 本次 run 无任何副作用）；
  // 单条事务单次派发 → Tiptap UndoRedo 记为一步，整次 run 可一步撤销
  private compile(
    ops: RichTextOp[],
    snapshotDoc: PMNode,
    snapshotBlocks: BlockInfo[],
    titleCtx: { setTitle?: (title: string) => void; currentTitle?: string } = {},
  ): { steps: RichTextAIStep[]; applied: number } {
    const editor = this.editor;
    const schema = editor.schema;
    const tr = editor.state.tr;
    const steps: RichTextAIStep[] = [];
    let applied = 0;

    // 本批内已删除的块 id：后续操作引用这些 id 时报错并指向移除来源
    const deletedIds = new Map<string, string>();
    // 快照块跟踪：块锚点（"#n"）指向的块经事务映射跟踪到当前位置，跨操作稳定。
    // 生成期间用户可能编辑了文档（tr 的基线文档与快照不一致），此时锚点序号
    // 失真，退回按当前文档重建快照（文本匹配不受影响，属可接受的竞态兜底）
    const tracked: TrackedBlock[] = (
      snapshotDoc.eq(editor.state.doc) ? snapshotBlocks : collectBlocks(editor.state.doc)
    ).map((b) => ({ ...b }));

    // 文档块随事务推进而变化：每条操作都在最新 tr.doc 上重新定位目标
    const blocksOf = () => collectBlocks(tr.doc);

    // 目标定位：块序号锚点（"#3"/"[3]"，跨操作最稳）→ 块文本（归一化后
    // 全文精确匹配 → 片段匹配 → "文本[n]" 序号消歧）；多个匹配且未给序号
    // 即抛消歧错误，列出候选块预览供模型改用锚点或更长片段
    const resolveTarget = (raw: string, no: string): BlockInfo & { trackedRef?: TrackedBlock } => {
      // 形似 id 但文档中查无此块时记录，最终报错点名（模型编造 id 的常见幻觉）
      let idMiss = "";
      const trimmed = raw.trim();
      // 持久化块 id（UniqueID 注入，可带 "id:" 前缀）：每条操作在当前 tr.doc
      // 上按 id 直接重查，跨操作稳定（insert/delete 移位不影响），最可靠的定位方式。
      // 兼容 base36（12 位）与 UUID 形态（含连字符）；形似 id 但查无此块时
      // 记录并退回锚点/文本定位，最终报错时点名 id 缺失（模型可能编造 id）
      const idCandidate = trimmed.replace(/^id:/, "").trim();
      if (/^[a-z0-9][a-z0-9-]{5,}$/i.test(idCandidate)) {
        const deletedAt = deletedIds.get(idCandidate);
        if (deletedAt)
          throw new Error(`块（id: ${idCandidate}）已在${deletedAt}被移除${no}`);
        const hit = blocksOf().find((b) => b.id === idCandidate);
        if (hit) return { ...hit };
        idMiss = idCandidate;
      }
      // 块序号锚点：定位快照块并经事务映射跟踪到当前位置
      const anchor = trimmed.match(/^#(\d+)$/) ?? trimmed.match(/^\[(\d+)\]$/);
      if (anchor) {
        const n = Number(anchor[1]);
        const b = tracked[n - 1];
        if (!b)
          throw new Error(
            `块序号 [${n}] 超出范围（当前文档共 ${tracked.length} 个顶层块）${no}`,
          );
        if (b.deletedIn)
          throw new Error(
            `块 [${n}]「${preview(b.text)}」已在${b.deletedIn}被移除${no}`,
          );
        // 位置映射：块起点关联后侧内容（起点之前的插入推着块走）、
        // 块终点关联前侧内容（终点之后的插入不并入块）；任一侧落入
        // 删除区即视为此块已随前序操作移除
        const fromR = tr.mapping.mapResult(b.from, 1);
        const toR = tr.mapping.mapResult(b.to, -1);
        if (fromR.deleted || toR.deleted || fromR.pos >= toR.pos)
          throw new Error(
            `块 [${n}]「${preview(b.text)}」已在前序操作中被移除${no}`,
          );
        return { from: fromR.pos, to: toR.pos, text: b.text, trackedRef: b };
      }
      const { text, nth } = parseTargetSegment(trimmed);
      if (!text) throw new Error(`AI 操作的 target 不能为空${no}`);
      // 文本定位在最新 tr.doc 上进行（前序操作插入的块对后续操作可见）
      const blocks = blocksOf();
      const norm = normalizeTargetText(text);
      const pick = (cands: BlockInfo[], kind: string): BlockInfo => {
        if (cands.length > 1 && !/\[\d+\]$/.test(trimmed)) {
          const previews = cands
            .slice(0, 5)
            .map((b) => `「${preview(b.text)}」`);
          throw new Error(
            `目标「${text}」${kind}匹配到 ${cands.length} 个块：${previews.join("、")}；请改用块序号锚点（"#n"）或更长片段${no}`,
          );
        }
        const hit = cands[nth - 1];
        if (!hit)
          throw new Error(
            `目标「${text}」序号 [${nth}] 超出范围（共 ${cands.length} 个匹配块）${no}`,
          );
        return hit;
      };
      const exact = blocks.filter(
        (b) => b.text === text || (norm && normalizeTargetText(b.text) === norm),
      );
      if (exact.length) return pick(exact, "全文");
      const partial = blocks.filter(
        (b) =>
          b.text.includes(text) || (norm && normalizeTargetText(b.text).includes(norm)),
      );
      if (partial.length) return pick(partial, "片段");
      // 兜底提示相近块，便于诊断"目标对不上"类问题
      const near = blocks
        .filter((b) => b.text.includes(text.slice(0, 6)))
        .slice(0, 5)
        .map((b) => `「${preview(b.text)}」`);
      throw new Error(
        `无法定位 AI 操作目标块: "${raw}"${no}` +
          (idMiss
            ? `；目标块 id「${idMiss}」在当前文档中不存在（可能编造了 id 或该块已被删除），请改用块文本或块序号锚点（"#n"）`
            : "") +
          (near.length ? `；相近块：${near.join("、")}` : ""),
      );
    };

    // Markdown → 文档块节点：经编辑器 Markdown 扩展按当前 schema 解析，
    // 保证产物一定是文档可容纳的合法块（编译期即验证，非法整体拒绝）
    const parseBlocks = (markdown: string, no: string): PMNode[] => {
      if (!editor.storage.markdown)
        throw new Error("编辑器未启用 Markdown 扩展，无法应用 AI 操作");
      let json: JSONContent | undefined;
      try {
        json = editor.storage.markdown.manager.parse(markdown);
      } catch {
        throw new Error(`AI 操作的 content 不是合法 Markdown${no}`);
      }
      const list = json.type === "doc" ? (json.content ?? []) : [json];
      if (!list.length) throw new Error(`AI 操作的 content 为空${no}`);
      try {
        return list.map((j) => schema.nodeFromJSON(j));
      } catch {
        throw new Error(`AI 操作的 content 含文档 schema 不支持的节点${no}`);
      }
    };

    // setTitle 延迟应用：编译期先收集，全部操作通过后再写入宿主，
    // 保证"任一操作非法即整体无效"的原子语义不被回调副作用破坏
    let pendingTitle: { title: string; no: string } | null = null;

    for (const [i, op] of ops.entries()) {
      const no = `（第 ${i + 1} 项）`;
      // answer 已在解析期提取为 answer、undo/redo 已在 run 分流：防御性跳过
      if (op.op === "answer" || op.op === "undo" || op.op === "redo") continue;
      if (op.op === "setTitle") {
        if (!titleCtx.setTitle)
          throw new Error(`宿主未提供标题修改能力，无法应用 setTitle 操作${no}`);
        const title = op.title.trim();
        if (!title) throw new Error(`AI setTitle 操作缺少 title（新标题文本）${no}`);
        if (titleCtx.currentTitle !== undefined && title === titleCtx.currentTitle) {
          steps.push({ op, label: "标题未变化，已跳过", status: "skipped" });
          continue;
        }
        pendingTitle = { title, no };
        steps.push({
          op,
          label: `修改文档标题：${preview(op.title)}`,
          status: "applied",
        });
        applied++;
        continue;
      }
      if (op.op === "insert") {
        const nodes = parseBlocks(op.content, no);
        if (op.target) {
          const target = resolveTarget(op.target, no);
          tr.insert(op.where === "before" ? target.from : target.to, nodes);
          steps.push({
            op,
            label: `在「${preview(target.text)}」${op.where === "before" ? "前" : "后"}插入 ${nodes.length} 个块`,
            status: "applied",
          });
        } else {
          tr.insert(tr.doc.content.size, nodes);
          steps.push({
            op,
            label: `在文档末尾插入 ${nodes.length} 个块`,
            status: "applied",
          });
        }
        applied++;
        continue;
      }
      if (op.op === "replace") {
        const target = resolveTarget(op.target, no);
        const nodes = parseBlocks(op.content, no);
        tr.replaceWith(target.from, target.to, nodes);
        steps.push({
          op,
          label: `将「${preview(target.text)}」替换为新内容（${nodes.length} 个块）`,
          status: "applied",
        });
        applied++;
        continue;
      }
      if (op.op === "searchReplace") {
        // 原位局部替换：在作用范围内逐顶层块收集文本节点（位置连续的相邻
        // 片段合并，被行内标记切开的同段文本仍可整段匹配），精确纯文本匹配
        // find，自后向前 insertText 写入——替换区间外的节点与标记不受影响；
        // 匹配不跨块（跨块会破坏块结构），找不到时记 skipped 反馈而非整体拒绝
        const scope = op.target
          ? (() => {
              const t = resolveTarget(op.target, no);
              return { from: t.from, to: t.to, label: `「${preview(t.text)}」` };
            })()
          : { from: 0, to: tr.doc.content.size, label: "整个文档" };
        const matches: { start: number; end: number }[] = [];
        tr.doc.forEach((child, offset) => {
          if (offset + child.nodeSize <= scope.from || offset >= scope.to)
            return;
          const segs: { text: string; pos: number }[] = [];
          child.descendants((n, p) => {
            if (n.isText && n.text)
              segs.push({ text: n.text, pos: offset + p + 1 });
          });
          // 位置连续的相邻文本节点合并（pos 连续即中间无行内节点）
          const merged: { text: string; pos: number }[] = [];
          for (const s of segs) {
            const last = merged[merged.length - 1];
            if (last && s.pos === last.pos + last.text.length)
              last.text += s.text;
            else merged.push({ text: s.text, pos: s.pos });
          }
          for (const seg of merged) {
            let i = seg.text.indexOf(op.find);
            while (i !== -1) {
              matches.push({
                start: seg.pos + i,
                end: seg.pos + i + op.find.length,
              });
              i = seg.text.indexOf(op.find, i + op.find.length);
            }
          }
        });
        const selected = op.all ? matches : matches.slice(0, 1);
        if (!selected.length) {
          steps.push({
            op,
            label: `未在${scope.label}中找到「${preview(op.find)}」，已跳过`,
            status: "skipped",
          });
          continue;
        }
        // 自后向前替换：靠后的替换不影响靠前位置，无需坐标重映射
        for (const m of [...selected].sort((a, b) => b.start - a.start))
          tr.insertText(op.replace, m.start, m.end);
        steps.push({
          op,
          label: `在${scope.label}内将「${preview(op.find)}」替换为「${preview(op.replace)}」（${selected.length} 处）`,
          status: "applied",
        });
        applied++;
        continue;
      }
      // delete：文档内容约束为 block+，唯一块的删除退化为清空内容（保留空段落），
      // 否则会编译出非法文档；锚点目标登记移除来源，后续引用即报错
      const target = resolveTarget(op.target, no);
      // 登记移除来源：id 目标进 deletedIds 注册表；文本定位的目标拿不到锚点
      // 跟踪项（其移除由映射检测兜底）
      if (target.trackedRef) target.trackedRef.deletedIn = no;
      if (target.id) deletedIds.set(target.id, no);
      if (tr.doc.childCount === 1) {
        tr.replaceWith(target.from, target.to, schema.nodes.paragraph.create());
        steps.push({
          op,
          label: `清空「${preview(target.text)}」（文档唯一块）`,
          status: "applied",
        });
      } else {
        tr.delete(target.from, target.to);
        steps.push({
          op,
          label: `删除「${preview(target.text)}」`,
          status: "applied",
        });
      }
      applied++;
    }
    if (applied) {
      tr.scrollIntoView();
      editor.view.dispatch(tr);
      // 文档事务落定后再写标题（宿主回调走统一落库链路）
      if (pendingTitle) titleCtx.setTitle!(pendingTitle.title);
    }
    return { steps, applied };
  }
}
