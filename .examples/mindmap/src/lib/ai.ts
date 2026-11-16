// AI 侧边栏共享的数据模型与小工具（纯 TS，无 DOM 事件绑定）
import type { AIEditStep } from "silkio-mindmap";

// API 格式：openai = OpenAI Chat Completions 兼容接口（DeepSeek/通义/Kimi 等
// 均适用）；anthropic = Anthropic Messages 原生格式
export type AIFormat = "openai" | "anthropic";

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  format: AIFormat;
}

export interface ChatMessage {
  id: number;
  // user = 用户指令；assistant = AI 回复（回答/反馈）；error = 失败信息
  role: "user" | "assistant" | "error";
  text: string;
  steps?: AIEditStep[]; // 本次执行的反馈链
  reasoning?: string; // 思考过程（完成后保留可折叠回看）
}

export interface PendingReply {
  reasoning: string;
  content: string;
}

export const AI_CONFIG_KEY = "mindmap-ai-config";

export function loadAIConfig(): AIConfig {
  const empty: AIConfig = { baseURL: "", apiKey: "", model: "", format: "openai" };
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

// 操作 JSON 形态的输出（编辑类指令）不实时渲染，等控制器解析完成后以反馈链
// 展示；纯文本回答（提问类指令）才走 Markdown 流式渲染
export function isOpsStream(text: string): boolean {
  const s = text.trimStart();
  return s.startsWith("{") || s.startsWith("[") || s.startsWith("```");
}
