import { getCurrentWindow } from "@tauri-apps/api/window";
import { defaultAIFlowPrompt, type AIFlowGenerate } from "silkio-flowchart";
import { defaultAIEditPrompt, type AIEditGenerate } from "silkio-mindmap";
import { defaultRichTextPrompt } from "@/components/sections/RichText/ai/prompt";
import type { RichTextAIGenerate } from "@/components/sections/RichText/ai/protocol";
import {
  fetchAIStream,
  isOpsStream,
  type AIMessage,
} from "@/infrastructure/api/ai";
import {
  getFlowChartInstance,
  getMindMapInstance,
  getRichTextInstance,
} from "@/actions/canvasRegistry";
import { useEditorAction } from "@/actions/editorAction";
import { useAiStore } from "@/stores/aiStore";
import { useEditorStore } from "@/stores/editorStore";
import { useUiStore } from "@/stores/uiStore";

// 单次请求上下文长度上限：避免超长文档打爆 token 预算
const CONTEXT_LIMIT = 12000;

// 中止控制器与生成序号为模块级单例：aiAction 可能在多处实例化，
// 会话归属必须全局一致。聊天与 AI 编辑适配器共用同一个 abort，
// 停止按钮对两类请求一视同仁
let abort: AbortController | null = null;
let generation = 0;

// 流式增量统一写入 aiStore.pending（聊天与 AI 编辑共用量示通道）
const onDeltaFactory = () => {
  const store = useAiStore();
  return (d: { reasoning?: string; content?: string }) => {
    const p = store.pending;
    if (!p) return;
    if (d.reasoning) p.reasoning += d.reasoning;
    if (d.content) p.content += d.content;
  };
};

// ---- AI 编辑适配器：注入 MindMap / FlowChart，模型输出交给包内控制器解析 ----
// 提示词用包内缺省模板（含操作 schema 与当前图数据），返回文本由控制器容错
// 解析（markdown 代码块包裹、target 锚点定位等）

// 追加到包内缺省编辑提示词之后的应用侧约定：树数据本身已随请求发送（模型
// 知道全部结构），此处只澄清术语与执行倾向，减少不必要的澄清反问
const MINDMAP_PROMPT_EXTRA = `

应用侧补充约定：
- 根节点文本即当前文档的标题。用户说「标题」时通常指根节点；仅当关键信息缺失（如重命名未给出新名字、删除未指明目标、排序方向不明）时才用 answer 请求澄清，并用一句话给出你理解的最可能意图供确认。`;

export const mindMapAIGenerate: AIEditGenerate = async (req) => {
  const store = useAiStore();
  const { baseURL, apiKey, model, format } = store.config;
  if (!(baseURL && apiKey && model)) throw new Error("AI 服务未配置");
  const ac = new AbortController();
  abort = ac;
  try {
    return await fetchAIStream(
      { baseURL, apiKey, model, format },
      [
        {
          role: "user",
          content: defaultAIEditPrompt(req) + MINDMAP_PROMPT_EXTRA,
        },
      ],
      onDeltaFactory(),
      ac.signal,
    );
  } finally {
    if (abort === ac) abort = null;
  }
};

export const flowChartAIGenerate: AIFlowGenerate = async (req) => {
  const store = useAiStore();
  const { baseURL, apiKey, model, format } = store.config;
  if (!(baseURL && apiKey && model)) throw new Error("AI 服务未配置");
  const ac = new AbortController();
  abort = ac;
  try {
    return await fetchAIStream(
      { baseURL, apiKey, model, format },
      [{ role: "user", content: defaultAIFlowPrompt(req) }],
      onDeltaFactory(),
      ac.signal,
    );
  } finally {
    if (abort === ac) abort = null;
  }
};

// 富文本 AI 编辑适配器：注入 RichTextAIController，模型输出交给控制器
// 容错解析为 ops（块级 insert/replace/delete + undo/redo），Markdown 载荷
// 经编辑器 Markdown 扩展转成文档块，单条事务原子应用
export const richTextAIGenerate: RichTextAIGenerate = async (req) => {
  const store = useAiStore();
  const { baseURL, apiKey, model, format } = store.config;
  if (!(baseURL && apiKey && model)) throw new Error("AI 服务未配置");
  const ac = new AbortController();
  abort = ac;
  try {
    return await fetchAIStream(
      { baseURL, apiKey, model, format },
      [{ role: "user", content: defaultRichTextPrompt(req) }],
      onDeltaFactory(),
      ac.signal,
    );
  } finally {
    if (abort === ac) abort = null;
  }
};

export const useAiAction = () => {
  const aiStore = useAiStore();
  const editorStore = useEditorStore();

  // 当前文档上下文：富文本用最近一次落库的纯文本快照；
  // 思维导图/流程图内容本身是语义 JSON，直接原文携带让模型理解结构
  const buildContext = (): string => {
    if (!editorStore.id) return "";
    const title = editorStore.title || "（无标题）";
    let body = "";
    if (editorStore.docType === "richText") body = editorStore.plainText;
    else if (editorStore.docType) body = editorStore.content;
    body = (body || "").slice(0, CONTEXT_LIMIT);
    return `# 当前文档：${title}\n\n${body}`;
  };

  const buildMessages = (): AIMessage[] => {
    const context = buildContext();
    const system = context
      ? "你是 silkio-space 桌面笔记应用的 AI 助手。以下是用户当前打开的文档，回答时优先基于文档内容；用户提问与文档无关时按通用助手回答。用简体中文回答，输出 Markdown。\n\n" +
        context
      : "你是 silkio-space 桌面笔记应用的 AI 助手。用简体中文回答，输出 Markdown。";
    // 对话历史（不含 error 轮）
    const history: AIMessage[] = aiStore.messages
      .filter((m) => m.role !== "error")
      .map(
        (m): AIMessage => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }),
      )
      .filter((m) => m.content);
    return [{ role: "system", content: system }, ...history];
  };

  // AI 编辑对话历史（不含本次指令与 error 轮，发送前于追加 user 消息时构建）：
  // 助手轮无回答文本时以反馈链步骤摘要代之，让模型知道上一轮实际做了什么。
  // AIEditTurn/AIFlowTurn 同构
  const buildEditHistory = () =>
    aiStore.messages
      .filter((m) => m.role !== "error")
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        text: m.text || (m.steps ?? []).map((s) => s.label).join("；"),
      }))
      .filter((t) => t.text);

  // 发送：按当前文档类型分流——思维导图/流程图走包内 AI 编辑协议（指令直接
  // 改图，原子变更可撤销；提问由 answer op 返回普通回答），其余文档走聊天；
  // 流式增量实时写入 pending，完成后并入 messages
  const send = async () => {
    if (aiStore.busy) return;
    const text = aiStore.prompt.trim();
    if (!text) return;
    // 未配置 AI 服务：main 窗口打开设置对话框并直达 AI 服务页签；
    // editor 窗口不渲染设置对话框，改为在聊天流中提示（保留输入便于配置后重发）
    if (!aiStore.ready) {
      if (getCurrentWindow().label === "main") {
        const uiStore = useUiStore();
        uiStore.setSettingNav("ai");
        uiStore.setSettingDialogShow(true);
      } else {
        aiStore.appendMessage({
          role: "error",
          text: "尚未配置 AI 服务，请在主页窗口的设置对话框「AI 服务」页签中配置",
        });
      }
      return;
    }
    // 标记本次生成：切换文档会递增 generation，迟到的结果被丢弃
    const gen = ++generation;
    aiStore.prompt = "";
    const history = buildEditHistory();
    aiStore.appendMessage({ role: "user", text });
    aiStore.setBusy(true);
    aiStore.setPending({ reasoning: "", content: "" });
    let chatSignal: AbortSignal | null = null;
    try {
      // 图文档：交给包内 AI 编辑控制器（适配器经组件注入并共享 abort）
      if (editorStore.docType === "mindMap") {
        const mindmap = getMindMapInstance();
        if (mindmap) {
          const result = await mindmap.ai.run(text, { history });
          if (gen !== generation) return;
          const reasoning = aiStore.pending?.reasoning || undefined;
          aiStore.setPending(null);
          // 有回答展示回答；改图/撤销/重做无回答时以反馈链说明执行结果
          aiStore.appendMessage({
            role: "assistant",
            text: result.answer ?? (result.applied ? "" : "（未产生任何操作）"),
            steps: result.steps.length ? result.steps : undefined,
            reasoning,
          });
          return;
        }
      } else if (editorStore.docType === "flowChart") {
        const flowchart = getFlowChartInstance();
        if (flowchart) {
          const result = await flowchart.generate(text, { history });
          if (gen !== generation) return;
          const reasoning = aiStore.pending?.reasoning || undefined;
          aiStore.setPending(null);
          aiStore.appendMessage({
            role: "assistant",
            text: result.answer ?? (result.applied ? "" : "（未产生任何操作）"),
            steps: result.steps.length ? result.steps : undefined,
            reasoning,
          });
          return;
        }
      } else if (editorStore.docType === "richText") {
        // 富文本：交给 RichTextAIController（块级 ops 协议，Markdown 载荷原子应用）；
        // 编辑器未挂载（极小概率竞态）时退回聊天
        const richtext = getRichTextInstance();
        if (richtext) {
          const result = await richtext.run(text, {
            history,
            title: editorStore.title,
            // setTitle 走统一落库链路（store/左侧目录/防抖落库三处同步）
            setTitle: (v) => useEditorAction().setDocTitle(v),
          });
          if (gen !== generation) return;
          const reasoning = aiStore.pending?.reasoning || undefined;
          aiStore.setPending(null);
          // 有回答展示回答；改图/撤销/重做无回答时以反馈链说明执行结果
          aiStore.appendMessage({
            role: "assistant",
            text: result.answer ?? (result.applied ? "" : "（未产生任何操作）"),
            steps: result.steps.length ? result.steps : undefined,
            reasoning,
          });
          return;
        }
      }
      // 其余文档：聊天（携带文档上下文）
      const ac = new AbortController();
      abort = ac;
      chatSignal = ac.signal;
      const content = await fetchAIStream(
        aiStore.config,
        buildMessages(),
        onDeltaFactory(),
        ac.signal,
      );
      if (gen !== generation) return;
      const reasoning = aiStore.pending?.reasoning || undefined;
      aiStore.setPending(null);
      aiStore.appendMessage({ role: "assistant", text: content, reasoning });
    } catch (e) {
      // 完整错误链输出到控制台：插件网络错误的 message 常只有一行摘要，
      // cause 里才有关键细节（DNS/TLS/连接复用等）
      console.error("[aiAction] 请求失败：", e);
      if (gen !== generation) return;
      const partial = aiStore.pending?.content ?? "";
      const reasoning = aiStore.pending?.reasoning || undefined;
      aiStore.setPending(null);
      // 用户主动停止：不算错误；聊天保留已流式产生的部分回答，
      // 编辑类（ops JSON）不展示半截协议文，给提示
      if (chatSignal?.aborted || abort?.signal.aborted) {
        aiStore.appendMessage({
          role: "assistant",
          text: partial && !isOpsStream(partial) ? partial : "（已停止生成）",
          reasoning,
        });
      } else {
        aiStore.appendMessage({
          role: "error",
          text: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      // 旧文档的异步收尾不能重置新文档的会话状态
      if (gen === generation) {
        aiStore.setBusy(false);
        aiStore.setPending(null);
        abort = null;
      }
    }
  };

  const stop = () => {
    abort?.abort();
  };

  const clear = () => {
    if (aiStore.busy) return;
    aiStore.messages = [];
  };

  // 切换文档：中止进行中的生成并清空对话，避免旧文档回复污染新文档会话
  const resetConversation = () => {
    generation++;
    abort?.abort();
    abort = null;
    aiStore.setBusy(false);
    aiStore.setPending(null);
    aiStore.messages = [];
    aiStore.prompt = "";
  };

  return { send, stop, clear, resetConversation };
};
