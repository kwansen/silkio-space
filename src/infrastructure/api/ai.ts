// AI 服务适配层（移植自 .examples demo 的 lib/ai.ts + 流式适配器）：
// 配置持久化 + OpenAI 兼容 / Anthropic 两种格式的 SSE 流式解析。
// 网络经 tauri-plugin-http 发出（绕过 webview CORS 限制，支持流式），
// 权限范围见 src-tauri/capabilities/default.json 的 http:default url 白名单。
import { fetch } from "@tauri-apps/plugin-http";

// API 格式：openai = OpenAI Chat Completions 兼容接口（含各兼容网关），
// anthropic = Anthropic Messages 原生格式
export type AIFormat = "openai" | "anthropic";

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  format: AIFormat;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 流式增量：reasoning = 思考过程，content = 回答正文
export interface AIDelta {
  reasoning?: string;
  content?: string;
}

export const AI_CONFIG_KEY = "silkio-space-ai-config";

export function loadAIConfig(): AIConfig {
  const empty: AIConfig = {
    baseURL: "",
    apiKey: "",
    model: "",
    format: "openai",
  };
  if (typeof localStorage === "undefined") return empty;
  try {
    return {
      ...empty,
      ...JSON.parse(localStorage.getItem(AI_CONFIG_KEY) ?? "{}"),
    };
  } catch {
    return empty;
  }
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

const joinURL = (baseURL: string, path: string) =>
  baseURL.replace(/\/+$/, "") + path;

// 判断一段流式输出是否为 AI 编辑协议的操作 JSON（silkio 包控制器解析）：
// 编辑类指令模型直接输出 ops JSON/代码块，不应作为 Markdown 实时渲染
export function isOpsStream(text: string): boolean {
  const s = text.trimStart();
  return s.startsWith("{") || s.startsWith("[") || s.startsWith("```");
}

// OpenAI Chat Completions 兼容格式：SSE 解析 choices[0].delta，
// 思考过程取 reasoning_content / reasoning（DeepSeek 等兼容字段）
async function fetchOpenAIStream(
  cfg: AIConfig,
  messages: AIMessage[],
  onDelta: (d: AIDelta) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(joinURL(cfg.baseURL, "/chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: cfg.model,
      messages,
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
  // 服务端不支持流式（一次性 JSON）：读取完整 message
  if (!res.body) {
    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    const think = msg?.reasoning_content ?? msg?.reasoning;
    if (typeof think === "string" && think) onDelta({ reasoning: think });
    if (typeof msg?.content !== "string" || !msg.content) {
      throw new Error("AI 服务返回内容为空");
    }
    return msg.content;
  }

  // SSE 流式解析：逐 delta 分离思考与答案；保留一份原文用于
  // 「服务端忽略 stream 参数」的兜底解析（长度上限保护）
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let raw = "";
  let content = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buf += chunk;
    if (raw.length < 200_000) raw += chunk;
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
        if (typeof think === "string" && think) onDelta({ reasoning: think });
        if (typeof delta.content === "string" && delta.content) {
          content += delta.content;
          onDelta({ content: delta.content });
        }
      } catch {
        // 忽略无法解析的行（心跳/注释等）
      }
    }
  }
  if (!content) {
    // 部分网关会忽略 stream 参数直接返回完整 chat/completions JSON
    try {
      const msg = JSON.parse(raw.trim())?.choices?.[0]?.message;
      if (typeof msg?.content === "string" && msg.content) {
        const think = msg.reasoning_content ?? msg.reasoning;
        if (typeof think === "string" && think) onDelta({ reasoning: think });
        return msg.content;
      }
    } catch {
      // 落到统一报错
    }
    throw new Error("AI 服务返回内容为空");
  }
  return content;
}

// Anthropic Messages 原生格式：baseURL 需含 /v1（如 https://api.anthropic.com/v1），
// 端点为 baseURL + /messages；鉴权用 x-api-key + anthropic-version 头。
// 经 tauri-plugin-http 发出不受 CORS 限制，无需危险直连声明。
// 扩展思考（thinking）要求固定 temperature=1 且按模型逐个开启，此处不默认
// 发送——Anthropic 模式下思考过程为空，仅答案文本流式展示
async function fetchAnthropicStream(
  cfg: AIConfig,
  messages: AIMessage[],
  onDelta: (d: AIDelta) => void,
  signal: AbortSignal,
): Promise<string> {
  // Anthropic 原生格式不支持 system 角色混在 messages：拆到顶层 system 字段
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const rest = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(joinURL(cfg.baseURL, "/messages"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 8192,
      temperature: 0.3,
      ...(system ? { system } : {}),
      messages: rest,
      stream: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `AI 服务请求失败（HTTP ${res.status}）${text ? `：${text.slice(0, 160)}` : ""}`,
    );
  }
  // 服务端不支持流式（一次性 JSON）：content 数组按块类型分离思考与答案
  if (!res.body) {
    const json = await res.json();
    const blocks: Array<{ type: string; text?: string; thinking?: string }> =
      json?.content ?? [];
    const reasoning = blocks
      .filter((b) => b.type === "thinking")
      .map((b) => b.thinking ?? "")
      .join("");
    if (reasoning) onDelta({ reasoning });
    const content = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    if (!content) throw new Error("AI 服务返回内容为空");
    return content;
  }

  // SSE 流式解析：content_block_delta 事件按 delta.type 分离
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
        if (delta.type === "thinking_delta" && delta.thinking) {
          onDelta({ reasoning: delta.thinking });
        } else if (delta.type === "text_delta" && delta.text) {
          content += delta.text;
          onDelta({ content: delta.text });
        }
      } catch {
        // 忽略无法解析的行（ping/心跳等）
      }
    }
  }
  if (!content) throw new Error("AI 服务返回内容为空");
  return content;
}

// 统一入口：按配置格式分发，流式增量经 onDelta 回调，返回完整回答文本。
// 网络层瞬时失败（如连接池旧连接被服务端关闭后 POST 不会被 reqwest 自动重试，
// 表现为「第一次成功、第二次发送失败」）在尚未收到任何流式增量时自动重试一次；
// 已有增量则不重试，避免内容重复。
const RETRYABLE =
  /error sending request|error trying to connect|timed out|connection/i;

export async function fetchAIStream(
  cfg: AIConfig,
  messages: AIMessage[],
  onDelta: (d: AIDelta) => void,
  signal: AbortSignal,
): Promise<string> {
  let received = false;
  const track = (d: AIDelta) => {
    received = true;
    onDelta(d);
  };
  const doFetch = () =>
    cfg.format === "anthropic"
      ? fetchAnthropicStream(cfg, messages, track, signal)
      : fetchOpenAIStream(cfg, messages, track, signal);
  try {
    return await doFetch();
  } catch (e) {
    if (received || signal.aborted || !RETRYABLE.test(String(e))) throw e;
    received = false;
    return doFetch();
  }
}
