<script setup lang="ts">
// AI 助手侧边栏：对话历史 / 流式思考 / 执行反馈 / 服务配置。
// 只负责展示与交互事件，状态与网络逻辑由 useFlowChartAI 提供。
import { computed, reactive, ref, watch } from "vue";
import { isOpsStream } from "../lib/ai";
import type { AIConfig, ChatMessage, PendingReply } from "../lib/ai";
import Icon from "./Icon.vue";
import Markdown from "./Markdown.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-vue";

const props = defineProps<{
  messages: ChatMessage[];
  pending: PendingReply | null;
  busy: boolean;
  ready: boolean;
  settingsOpen: boolean;
}>();

const emit = defineEmits<{
  send: [];
  stop: [];
  clear: [];
  collapse: [];
  "toggle-settings": [];
}>();

// 输入文本与配置经 v-model 与 composable 的 ref 双向同步
const prompt = defineModel<string>({ required: true });
const config = defineModel<AIConfig>("config", { required: true });

// 配置草稿：输入不直接落盘，点「保存」后写回 config（composable 的 watch 统一持久化）。
// 打开面板时从已保存配置同步，关闭面板丢弃未保存草稿
const draft = reactive({
  baseURL: "",
  apiKey: "",
  model: "",
  format: "openai" as AIConfig["format"],
});
watch(
  () => props.settingsOpen,
  (open) => {
    if (open) Object.assign(draft, config.value);
  },
  { immediate: true },
);

// 保存后按钮短暂显示「已保存」作为落盘反馈
const saved = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | undefined;
function saveConfig() {
  config.value = { ...draft };
  saved.value = true;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (saved.value = false), 1500);
}

const pendingStatus = computed(() => {
  const p = props.pending;
  if (!p) return "";
  if (p.content) return isOpsStream(p.content) ? "生成流程中…" : "回答中…";
  return p.reasoning ? "思考中…" : "等待响应…";
});

// 新消息或流式增量后，消息流自动跟随到底部（viewport 元素经组件实例获取）
const chatBox = ref<OverlayScrollbarsComponentRef | null>(null);
// OverlayScrollbars 统一配置：滚动/悬浮时显示、静止后自动隐藏
const osOptions = {
  scrollbars: { autoHide: "move" as const, autoHideDelay: 500 },
};
watch(
  () => [props.messages, props.pending] as const,
  () => {
    const viewport = chatBox.value?.osInstance()?.elements().viewport;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  },
  { deep: true, flush: "post" },
);

// 输入法组合期间不发送（与原生 Enter 行为一致）
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.isComposing) emit("send");
}
</script>

<template>
  <aside
    id="ai-sidebar"
    class="flex h-full w-90 shrink-0 flex-col border-l border-gray-100 bg-white"
  >
    <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
      <Icon name="i-sparkles" class="text-violet-500" />
      <span class="flex-1 text-[13px] font-medium">AI 助手</span>
      <button
        id="ai-clear"
        class="cursor-pointer text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="busy || !messages.length"
        @click="emit('clear')"
      >
        清空
      </button>
      <button
        id="ai-settings-toggle"
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-600"
        :class="settingsOpen || ready ? 'text-violet-500' : 'text-gray-400'"
        title="AI 服务配置"
        aria-label="AI 服务配置"
        @click="emit('toggle-settings')"
      >
        <Icon name="i-settings" />
      </button>
      <button
        id="ai-collapse"
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="收起"
        aria-label="收起"
        @click="emit('collapse')"
      >
        <Icon name="i-chevron-right" />
      </button>
    </div>

    <!-- 服务配置（草稿输入，点「保存」落盘 localStorage） -->
    <div
      v-if="settingsOpen"
      id="ai-settings"
      class="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3"
    >
      <select
        id="ai-format"
        v-model="draft.format"
        class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 outline-none focus:border-violet-400"
      >
        <option value="openai">OpenAI 兼容格式（chat/completions）</option>
        <option value="anthropic">Anthropic 格式（messages）</option>
      </select>
      <input
        id="ai-base-url"
        v-model="draft.baseURL"
        :placeholder="
          draft.format === 'anthropic'
            ? '接口地址（含 /v1），如 https://api.anthropic.com/v1'
            : '接口地址（含 /v1），如 https://api.deepseek.com/v1'
        "
        class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 outline-none focus:border-violet-400"
        @keydown.enter="saveConfig"
      />
      <input
        id="ai-api-key"
        v-model="draft.apiKey"
        type="password"
        placeholder="API Key"
        class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 outline-none focus:border-violet-400"
        @keydown.enter="saveConfig"
      />
      <input
        id="ai-model"
        v-model="draft.model"
        :placeholder="draft.format === 'anthropic' ? '模型名，如 claude-sonnet-4-5' : '模型名，如 deepseek-chat'"
        class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 outline-none focus:border-violet-400"
        @keydown.enter="saveConfig"
      />
      <div class="flex items-center justify-between gap-2">
        <p class="min-w-0 text-[10px] text-gray-400">
          配置保存在浏览器本地；服务端需允许跨域或走本地代理
        </p>
        <button
          id="ai-config-save"
          class="h-7 shrink-0 cursor-pointer rounded-lg px-3 text-xs text-white transition-colors"
          :class="saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-violet-500 hover:bg-violet-600'"
          @click="saveConfig"
        >
          {{ saved ? "已保存" : "保存" }}
        </button>
      </div>
    </div>

    <!-- 消息流：OverlayScrollbars 自定义滚动条，内部包装层承载原布局 -->
    <OverlayScrollbarsComponent
      id="chat-box"
      ref="chatBox"
      element="div"
      class="flex min-h-0 flex-1"
      :options="osOptions"
    >
      <div class="flex flex-col gap-3 p-3">
      <div
        v-if="!messages.length && !pending"
        id="ai-empty"
        class="mt-10 text-center text-xs leading-[1.9] text-gray-400"
      >
        输入指令，如：画一个注册流程 / 撤销上一步
      </div>

      <div v-for="m in messages" :key="m.id">
        <!-- 用户指令 -->
        <div v-if="m.role === 'user'" class="flex justify-end">
          <div
            class="max-w-[85%] rounded-xl rounded-br-sm bg-violet-500 px-3 py-2 text-xs leading-5 text-white whitespace-pre-wrap break-words"
          >
            {{ m.text }}
          </div>
        </div>
        <!-- 错误 -->
        <div
          v-else-if="m.role === 'error'"
          class="text-xs leading-5 text-red-500 whitespace-pre-wrap break-words"
        >
          {{ m.text }}
        </div>
        <!-- AI 回复：思考过程（可折叠）+ 回答 + 执行反馈 -->
        <div v-else class="flex flex-col gap-2">
          <details v-if="m.reasoning" class="rounded-lg bg-gray-50 px-2.5 py-1.5">
            <summary class="cursor-pointer text-xs text-gray-400 select-none">思考过程</summary>
            <div class="mt-1 text-[11px] leading-5 text-gray-400 whitespace-pre-wrap">
              {{ m.reasoning }}
            </div>
          </details>
          <!-- 纯文本回答走 Markdown；操作 JSON 原文退回纯文本 -->
          <Markdown
            v-if="m.text && !isOpsStream(m.text)"
            :value="m.text"
            class="ai-md text-xs leading-5 text-gray-600"
          />
          <div
            v-else-if="m.text"
            class="text-xs leading-5 text-gray-600 whitespace-pre-wrap break-words"
          >
            {{ m.text }}
          </div>
          <!-- 执行反馈链：改图 / 撤销 / 重做 / 读取历史逐条展示 -->
          <div v-if="m.steps?.length" class="flex flex-col gap-1">
            <div
              v-for="(s, i) in m.steps"
              :key="i"
              class="flex items-start gap-1.5 text-xs leading-5"
            >
              <span :class="s.status === 'applied' ? 'text-emerald-500' : 'text-gray-300'">{{
                s.status === "applied" ? "✓" : "–"
              }}</span>
              <span :class="s.status === 'applied' ? 'text-gray-600' : 'text-gray-400'">{{
                s.label
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进行中：流式思考实时展示，回答文本流式渲染；语义图 JSON 只显示状态 -->
      <div v-if="pending" class="flex flex-col gap-2">
        <details v-if="pending.reasoning" open class="rounded-lg bg-gray-50 px-2.5 py-1.5">
          <summary class="cursor-pointer text-xs text-gray-400 select-none">思考中…</summary>
          <div class="mt-1 text-[11px] leading-5 text-gray-400 whitespace-pre-wrap">
            {{ pending.reasoning }}
          </div>
        </details>
        <Markdown
          v-if="pending.content && !isOpsStream(pending.content)"
          :value="pending.content"
          streaming
          class="ai-md text-xs leading-5 text-gray-600"
        />
        <div class="flex items-center gap-1.5 text-xs text-gray-400">
          <Icon name="i-sparkles" size="h-3.5 w-3.5" class="animate-pulse text-violet-400" />
          <span>{{ pendingStatus }}</span>
        </div>
      </div>
      </div>
    </OverlayScrollbarsComponent>

    <!-- 输入区 -->
    <div class="flex items-center gap-2 border-t border-gray-100 p-2.5">
      <input
        id="ai-prompt"
        v-model="prompt"
        placeholder="输入指令或提问…"
        autocomplete="off"
        class="h-9 min-w-0 flex-1 rounded-lg bg-gray-50 px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ddd6fe]"
        @keydown="onKeydown"
      />
      <button
        id="ai-send"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        :class="busy ? 'bg-gray-900 hover:bg-gray-700' : 'bg-violet-500'"
        :disabled="!busy && !prompt.trim()"
        :title="busy ? '停止生成' : '发送'"
        :aria-label="busy ? '停止生成' : '发送'"
        @click="busy ? emit('stop') : emit('send')"
      >
        <Icon v-if="busy" id="stop-icon" name="i-stop" stroke="stroke-2" />
        <Icon v-else id="send-icon" name="i-arrow-up" stroke="stroke-2" />
      </button>
    </div>
  </aside>
</template>
