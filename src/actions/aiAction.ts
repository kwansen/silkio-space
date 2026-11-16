import {
  fetchAIStream,
  type AIMessage,
} from "@/infrastructure/api/ai";
import { useAiStore } from "@/stores/aiStore";
import { useEditorStore } from "@/stores/editorStore";

// 单次请求上下文长度上限：避免超长文档打爆 token 预算
const CONTEXT_LIMIT = 12000;

// 中止控制器与生成序号为模块级单例：aiAction 可能在多处实例化，
// 会话归属必须全局一致
let abort: AbortController | null = null;
let generation = 0;

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
      ? "你是 keyflow 桌面笔记应用的 AI 助手。以下是用户当前打开的文档，回答时优先基于文档内容；用户提问与文档无关时按通用助手回答。用简体中文回答，输出 Markdown。\n\n" +
        context
      : "你是 keyflow 桌面笔记应用的 AI 助手。用简体中文回答，输出 Markdown。";
    // 对话历史（不含 error 轮）
    const history: AIMessage[] = aiStore.messages
      .filter((m) => m.role !== "error")
      .map((m): AIMessage => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }))
      .filter((m) => m.content);
    return [{ role: "system", content: system }, ...history];
  };

  // 发送：流式增量实时写入 pending，完成后并入 messages
  const send = async () => {
    if (aiStore.busy) return;
    const text = aiStore.prompt.trim();
    if (!text) return;
    // 未配置 AI 服务：直接打开设置面板引导配置
    if (!aiStore.ready) {
      aiStore.setSettingsOpen(true);
      return;
    }
    // 标记本次生成：切换文档会递增 generation，迟到的结果被丢弃
    const gen = ++generation;
    aiStore.prompt = "";
    aiStore.appendMessage({ role: "user", text });
    aiStore.setBusy(true);
    aiStore.setPending({ reasoning: "", content: "" });
    const ac = new AbortController();
    abort = ac;
    try {
      const content = await fetchAIStream(
        aiStore.config,
        buildMessages(),
        (d) => {
          const p = aiStore.pending;
          if (!p) return;
          if (d.reasoning) p.reasoning += d.reasoning;
          if (d.content) p.content += d.content;
        },
        ac.signal,
      );
      if (gen !== generation) return;
      const reasoning = aiStore.pending?.reasoning || undefined;
      aiStore.setPending(null);
      aiStore.appendMessage({ role: "assistant", text: content, reasoning });
    } catch (e) {
      if (gen !== generation) return;
      const partial = aiStore.pending?.content ?? "";
      const reasoning = aiStore.pending?.reasoning || undefined;
      aiStore.setPending(null);
      // 用户主动停止：不算错误，保留已流式产生的部分回答
      if (ac.signal.aborted) {
        aiStore.appendMessage({
          role: "assistant",
          text: partial || "（已停止生成）",
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
