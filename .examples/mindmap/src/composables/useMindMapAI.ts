// AI 助手的组合式状态：对话历史、流式思考/回答、OpenAI 兼容与 Anthropic 双格式
// 流式适配器。画布实例由宿主在 onMounted 创建，故用 getter 延迟取用；适配器经
// MindMap 的 ai 选项注入，返回文本交给包内 AIEditingController 解析。
// 浏览器直连要求服务端允许 CORS，否则需经本地代理转发
import { computed, ref, watch } from "vue";
import { defaultAIEditPrompt } from "silkio-mindmap";
import type { AIEditGenerate, AIEditTurn, MindMap } from "silkio-mindmap";
import { AI_CONFIG_KEY, isOpsStream, loadAIConfig } from "../lib/ai";
import type { AIConfig, ChatMessage, PendingReply } from "../lib/ai";

export function useMindMapAI(
  getMindMap: () => MindMap | null,
  getDocId: () => string,
) {
  // 历史消息保留在内存，不随单次对话丢失
  const messages = ref<ChatMessage[]>([]);
  // 进行中的回复：流式思考与回答文本实时更新，完成后并入 messages。
  // content 为 SSE 累积的回答原文，经 comark 流式渲染；编辑类指令输出的是
  // 操作 JSON（isOpsStream 命中），不实时渲染，等控制器解析后以反馈链展示
  const pending = ref<PendingReply | null>(null);
  const busy = ref(false);
  const sidebarOpen = ref(true);
  const settingsOpen = ref(false);
  const prompt = ref("");
  const config = ref<AIConfig>(loadAIConfig());
  // 三项齐全才可调用
  const ready = computed(
    () => !!(config.value.baseURL && config.value.apiKey && config.value.model),
  );

  // 配置变更后自动落盘到 localStorage（不入代码仓库），组件内不直接触达存储
  watch(config, (value) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(value));
    }
  });

  // 当前请求的中止控制器：停止按钮 abort 它以取消进行中的生成（fetch 与流式读取一并中断）
  let abort: AbortController | null = null;
  let seq = 0;

  // 真实 AI 适配器：按配置的 API 格式分流。提示词用包内缺省模板（含操作 schema
  // 与当前导图数据），返回文本交给 AIEditingController 解析（自动容错 markdown
  // 代码块包裹，target 缺省锚点/支持节点文本定位）
  const generate: AIEditGenerate = async (req) => {
    const { baseURL, apiKey, model, format } = config.value;
    if (!baseURL || !apiKey || !model)
      throw new Error("请先点击右上角齿轮配置 AI 服务");
    const text = defaultAIEditPrompt(req);
    return format === "anthropic"
      ? anthropicGenerate({ baseURL, apiKey, model }, text)
      : openaiGenerate({ baseURL, apiKey, model }, text);
  };

  // OpenAI Chat Completions 兼容格式（默认）：请求 baseURL + /chat/completions（流式）。
  // 思考过程：delta 上的 reasoning_content / reasoning 字段（DeepSeek-R1、通义、
  // Kimi 等推理模型）逐段收集到进行中消息实时展示；非流式响应退回一次性读取
  async function openaiGenerate(
    cfg: { baseURL: string; apiKey: string; model: string },
    prompt: string,
  ): Promise<string> {
    if (pending.value) {
      pending.value.reasoning = "";
      pending.value.content = "";
    }
    const ac = new AbortController();
    abort = ac;
    const res = await fetch(cfg.baseURL.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      signal: ac.signal,
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `AI 服务请求失败（HTTP ${res.status}）${text ? `：${text.slice(0, 160)}` : ""}`,
      );
    }
    // 服务端不支持流式：一次性读取，思考过程取完整 message 字段
    if (!res.body) {
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      if (pending.value)
        pending.value.reasoning = msg?.reasoning_content ?? msg?.reasoning ?? "";
      if (!msg?.content) throw new Error("AI 服务返回内容为空");
      return msg.content;
    }
    // SSE 流式解析：逐 delta 分离思考（reasoning）与答案（content）
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let content = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta;
          if (!delta) continue;
          const think = delta.reasoning_content ?? delta.reasoning;
          if (typeof think === "string" && think && pending.value)
            pending.value.reasoning += think;
          if (typeof delta.content === "string" && delta.content) {
            content += delta.content;
            // 流式回答实时并入进行中消息，由 comark 流式渲染
            if (pending.value) pending.value.content = content;
          }
        } catch {
          // 忽略无法解析的行（心跳/注释等）
        }
      }
    }
    if (!content) throw new Error("AI 服务返回内容为空");
    return content;
  }

  // Anthropic Messages 原生格式：baseURL 需含 /v1（如 https://api.anthropic.com/v1），
  // 端点为 baseURL + /messages；鉴权用 x-api-key + anthropic-version 头。
  // 浏览器直连官方 API 必须显式声明 anthropic-dangerous-direct-browser-access 才允许
  // CORS。扩展思考（thinking）要求固定 temperature=1 且按模型逐个开启，此处不默认
  // 发送——Anthropic 模式下思考过程为空，仅答案文本流式展示
  async function anthropicGenerate(
    cfg: { baseURL: string; apiKey: string; model: string },
    prompt: string,
  ): Promise<string> {
    if (pending.value) {
      pending.value.reasoning = "";
      pending.value.content = "";
    }
    const ac = new AbortController();
    abort = ac;
    const res = await fetch(cfg.baseURL.replace(/\/+$/, "") + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      signal: ac.signal,
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 8192,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `AI 服务请求失败（HTTP ${res.status}）${text ? `：${text.slice(0, 160)}` : ""}`,
      );
    }
    // 非流式兜底：content 数组按块类型分离思考与答案
    if (!res.body) {
      const json = await res.json();
      const blocks: Array<{ type: string; text?: string; thinking?: string }> =
        json?.content ?? [];
      if (pending.value) {
        pending.value.reasoning = blocks
          .filter((b) => b.type === "thinking")
          .map((b) => b.thinking ?? "")
          .join("");
      }
      const content = blocks
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");
      if (!content) throw new Error("AI 服务返回内容为空");
      if (pending.value) pending.value.content = content;
      return content;
    }
    // SSE 流式解析：content_block_delta 事件按 delta.type 分离
    // 思考（thinking_delta）与答案（text_delta）
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let content = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event?.type !== "content_block_delta" || !event.delta) continue;
          const delta = event.delta;
          if (delta.type === "thinking_delta" && delta.thinking && pending.value) {
            pending.value.reasoning += delta.thinking;
          } else if (delta.type === "text_delta" && delta.text) {
            content += delta.text;
            if (pending.value) pending.value.content = content;
          }
        } catch {
          // 忽略无法解析的行（ping/心跳等）
        }
      }
    }
    if (!content) throw new Error("AI 服务返回内容为空");
    return content;
  }

  // 发送消息：编辑类指令产出一个原子变更（可整体撤销），提问类返回回答；
  // 全部对话（指令/回答/反馈/思考）保留在消息流中
  async function send() {
    const mindmap = getMindMap();
    if (!mindmap || busy.value) return;
    const text = prompt.value.trim();
    if (!text) return;
    // 未配置 AI 服务：直接展开设置面板
    if (!ready.value) {
      sidebarOpen.value = true;
      settingsOpen.value = true;
      return;
    }
    // 对话历史（不含本次指令）：从消息流收集用户/助手轮次，随请求传给生成适配器
    // ——助手轮无回答文本时以反馈链步骤摘要代之，让模型知道上一轮实际做了什么
    const history: AIEditTurn[] = messages.value
      .filter((m) => m.role !== "error")
      .map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        text:
          m.text ||
          (m.steps && m.steps.length
            ? m.steps.map((s) => s.label).join("；")
            : ""),
      }))
      .filter((t) => t.text);
    messages.value.push({ id: ++seq, role: "user", text });
    prompt.value = "";
    const replyId = ++seq;
    const sentDocId = getDocId();
    busy.value = true;
    pending.value = { reasoning: "", content: "" };
    try {
      const r = await mindmap.ai.run(text, { history });
      // 等待期间切换/新建了导图：旧文档的回复不落入新对话流
      if (getDocId() !== sentDocId) return;
      messages.value.push({
        id: replyId,
        role: "assistant",
        text: r.answer ?? (r.applied ? "" : "（未产生任何操作）"),
        steps: r.steps.length ? r.steps : undefined,
        reasoning: pending.value?.reasoning || undefined,
      });
    } catch (e) {
      if (getDocId() !== sentDocId) return;
      // 用户主动停止：不算错误，保留已流式产生的部分回答（无内容则给提示）
      if (e instanceof DOMException && e.name === "AbortError") {
        const partial = pending.value?.content ?? "";
        messages.value.push({
          id: replyId,
          role: "assistant",
          text: partial && !isOpsStream(partial) ? partial : "（已停止生成）",
          reasoning: pending.value?.reasoning || undefined,
        });
        return;
      }
      messages.value.push({
        id: replyId,
        role: "error",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      busy.value = false;
      pending.value = null;
      abort = null;
    }
  }

  // 停止正在进行的 AI 生成：中断请求与流式读取，回到可继续输入状态
  function stop() {
    abort?.abort();
  }

  // 清空 AI 对话流：新建/切换导图时调用，避免旧文档的指令与回答污染新文档的对话
  function clear() {
    messages.value = [];
    pending.value = null;
  }

  return {
    messages,
    pending,
    busy,
    sidebarOpen,
    settingsOpen,
    prompt,
    config,
    ready,
    generate,
    send,
    stop,
    clear,
  };
}
