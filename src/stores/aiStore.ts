import {
  loadAIConfig,
  saveAIConfig,
  type AIConfig,
} from "@/infrastructure/api/ai";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export interface AIChatMessage {
  id: number;
  // user = 用户指令；assistant = AI 回答；error = 失败信息
  role: "user" | "assistant" | "error";
  text: string;
  // 思考过程（完成后保留可折叠回看）
  reasoning?: string;
}

export interface AIPendingReply {
  reasoning: string;
  content: string;
}

// AI 右侧栏会话状态（移植自 demo 的 useXxxAI 状态部分）：
// 历史消息保留在内存，不随单次对话丢失；配置变更自动落盘 localStorage
export const useAiStore = defineStore("ai", () => {
  let seq = 0;
  const messages = ref<AIChatMessage[]>([]);
  // 进行中的回复：流式增量实时更新，完成后并入 messages
  const pending = ref<AIPendingReply | null>(null);
  const busy = ref(false);
  const prompt = ref("");
  const config = ref<AIConfig>(loadAIConfig());
  const ready = computed(
    () => !!(config.value.baseURL && config.value.apiKey && config.value.model),
  );

  // 配置变更后自动落盘：侧边栏以草稿编辑，点「保存」写回 config（含初始化载入），
  // 此处统一持久化到 localStorage，组件内不直接触达存储
  watch(config, (value) => {
    saveAIConfig(value);
  });

  const setBusy = (v: boolean) => {
    busy.value = v;
  };
  const setPending = (v: AIPendingReply | null) => {
    pending.value = v;
  };
  const appendMessage = (message: Omit<AIChatMessage, "id">) => {
    messages.value.push({ ...message, id: ++seq });
  };

  return {
    messages,
    pending,
    busy,
    setBusy,
    prompt,
    config,
    ready,
    setPending,
    appendMessage,
  };
});

// 开发环境 HMR 热更新 store（否则修改 store 后热更新不会重跑 setup，新增 state 不生效）
if (import.meta.hot) {
  acceptHMRUpdate(useAiStore, import.meta.hot);
}
