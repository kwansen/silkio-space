import {
  AI_CONFIG_KEY,
  loadAIConfig,
  saveAIConfig,
  type AIConfig,
} from "@/infrastructure/api/ai";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, watch } from "vue";

// AI 编辑执行反馈链的单步结果（来自 silkio 包 AI 控制器：改图指令逐步应用）
export interface AIChatStep {
  label: string;
  status: "applied" | "skipped";
}

export interface AIChatMessage {
  id: number;
  // user = 用户指令；assistant = AI 回答；error = 失败信息
  role: "user" | "assistant" | "error";
  text: string;
  // 思考过程（完成后保留可折叠回看）
  reasoning?: string;
  // 执行反馈链：AI 改图类回复没有回答文本，以此展示实际执行了什么
  steps?: AIChatStep[];
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

  // 配置变更后自动落盘：设置页直接 v-model 修改 config 的内部属性（不整体
  // 重新赋值），必须开启 deep 才能监听到，否则从未落盘、刷新即丢失
  watch(
    config,
    (value) => {
      saveAIConfig(value);
    },
    { deep: true },
  );

  // 跨窗口同步：editor 等窗口的 store 在应用启动时就已初始化，之后主页窗口
  // 修改的配置需经 storage 事件（同源其他窗口触发）重新载入，否则一直显示未配置
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === AI_CONFIG_KEY) config.value = loadAIConfig();
    });
  }

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
