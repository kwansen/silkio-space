<script setup lang="ts">
// AI 助手侧边栏：对话历史 / 流式思考 / 执行反馈 / 服务配置。
// 只负责展示与交互事件，状态与网络逻辑由 useMindMapAI 提供。
import { ref, watch } from "vue";
import { isOpsStream } from "../lib/ai";
import type { AIConfig, ChatMessage, PendingReply } from "../lib/ai";
import Icon from "./Icon.vue";
import { Markdown } from "@comark/vue";
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
  <!-- AI 助手侧边栏：布局内并列面板（非悬浮层），历史消息保留（用户指令 / AI 回答 / 执行反馈 / 思考过程） -->
  <aside
    class="flex h-full w-90 shrink-0 flex-col border-l border-gray-100 bg-white"
  >
    <!-- 头部 -->
    <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
      <Icon name="i-sparkles" class="h-4 w-4 text-violet-500" />
      <span class="flex-1 text-sm font-medium text-gray-800">AI 助手</span>
      <button
        class="cursor-pointer text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="busy || !messages.length"
        @click="emit('clear')"
      >
        清空
      </button>
      <button
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-600"
        :class="settingsOpen || ready ? 'text-violet-500' : 'text-gray-400'"
        title="AI 服务配置"
        @click="emit('toggle-settings')"
      >
        <Icon name="i-settings" class="h-4 w-4" />
      </button>
      <button
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
        title="收起"
        aria-label="收起"
        @click="emit('collapse')"
      >
        <Icon name="i-chevron-right" class="h-4 w-4" />
      </button>
    </div>

    <!-- 服务配置（localStorage 持久化，写入由 composable 的 watch 统一处理） -->
    <div
      v-if="settingsOpen"
      class="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3"
    >
      <select
        v-model="config.format"
        class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 outline-none focus:border-violet-400"
      >
        <option value="openai">OpenAI 兼容格式（chat/completions）</option>
        <option value="anthropic">Anthropic 格式（messages）</option>
      </select>
      <input
        v-model="config.baseURL"
        class="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-violet-400"
        :placeholder="
          config.format === 'anthropic'
            ? '接口地址（含 /v1），如 https://api.anthropic.com/v1'
            : '接口地址（含 /v1），如 https://api.deepseek.com/v1'
        "
      />
      <input
        v-model="config.apiKey"
        class="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-violet-400"
        type="password"
        placeholder="API Key"
      />
      <input
        v-model="config.model"
        class="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-violet-400"
        :placeholder="
          config.format === 'anthropic'
            ? '模型名，如 claude-sonnet-4-5'
            : '模型名，如 deepseek-chat'
        "
      />
      <div class="flex items-center justify-between">
        <span class="text-[10px] text-gray-400"
          >保存在浏览器本地；服务端需允许跨域或走本地代理</span
        >
        <button
          class="h-7 shrink-0 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-white hover:bg-gray-700"
          @click="emit('toggle-settings')"
        >
          保存
        </button>
      </div>
    </div>

    <!-- 消息流：OverlayScrollbars 自定义滚动条，内部包装层承载原布局 -->
    <OverlayScrollbarsComponent
      ref="chatBox"
      element="div"
      class="flex min-h-0 flex-1"
      :options="osOptions"
    >
      <div class="flex flex-col gap-3 p-3">
        <div
          v-if="!messages.length && !pending"
          class="mt-10 text-center text-xs leading-5 text-gray-400"
        >
          输入指令，如：绘制一本书的要点 / 撤销上一步
        </div>

        <div v-for="m in messages" :key="m.id">
          <!-- 用户指令：右侧气泡 -->
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div
              class="max-w-[85%] rounded-xl rounded-br-sm bg-violet-500 px-3 py-2 text-xs leading-5 text-white"
            >
              {{ m.text }}
            </div>
          </div>
          <!-- 错误 -->
          <div
            v-else-if="m.role === 'error'"
            class="text-xs leading-5 text-red-500"
          >
            {{ m.text }}
          </div>
          <!-- AI 回复：思考过程（可折叠）+ 回答 + 执行反馈链 -->
          <div v-else class="flex flex-col gap-2">
            <details
              v-if="m.reasoning"
              class="rounded-lg bg-gray-50 px-2.5 py-1.5"
            >
              <summary class="cursor-pointer text-xs text-gray-400 select-none">
                思考过程
              </summary>
              <div
                class="mt-1 text-[11px] leading-5 whitespace-pre-wrap text-gray-400"
              >
                {{ m.reasoning }}
              </div>
            </details>
            <!-- Markdown 为 async setup 组件，须置于 Suspense 内；操作 JSON 形态的
                 原文（模型坏 JSON 时控制器整体作为回答返回）退回纯文本展示 -->
            <Suspense v-if="m.text && !isOpsStream(m.text)">
              <Markdown
                :value="m.text"
                class="ai-md text-xs leading-5 text-gray-600"
              />
            </Suspense>
            <div
              v-else-if="m.text"
              class="text-xs leading-5 whitespace-pre-wrap text-gray-600"
            >
              {{ m.text }}
            </div>
            <div v-if="m.steps?.length" class="flex flex-col gap-1">
              <div
                v-for="(s, i) in m.steps"
                :key="i"
                class="flex items-start gap-1.5 text-xs leading-5"
              >
                <span
                  :class="
                    s.status === 'applied'
                      ? 'text-emerald-500'
                      : 'text-gray-300'
                  "
                  >{{ s.status === "applied" ? "✓" : "–" }}</span
                >
                <span
                  :class="
                    s.status === 'applied' ? 'text-gray-600' : 'text-gray-400'
                  "
                  >{{ s.label }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 进行中：流式思考实时展示；回答文本经 comark 流式渲染（编辑类 JSON
             输出只显示占位，等解析完成后以反馈链展示） -->
        <div v-if="pending" class="flex flex-col gap-2">
          <details
            v-if="pending.reasoning"
            open
            class="rounded-lg bg-gray-50 px-2.5 py-1.5"
          >
            <summary class="cursor-pointer text-xs text-gray-400 select-none">
              思考中…
            </summary>
            <div
              class="mt-1 text-[11px] leading-5 whitespace-pre-wrap text-gray-400"
            >
              {{ pending.reasoning }}
            </div>
          </details>
          <Suspense
            v-if="pending.content && !isOpsStream(pending.content)"
          >
            <Markdown
              :value="pending.content"
              streaming
              :caret="{ class: 'comark-caret' }"
              class="ai-md text-xs leading-5 text-gray-600"
            />
          </Suspense>
          <div
            v-else-if="!pending.reasoning"
            class="flex items-center gap-1.5 text-xs text-gray-400"
          >
            <Icon name="i-sparkles" class="h-3.5 w-3.5 animate-pulse text-violet-400" />
            {{ isOpsStream(pending.content) ? "执行操作中…" : "思考中…" }}
          </div>
        </div>
      </div>
    </OverlayScrollbarsComponent>

    <!-- 输入区 -->
    <div class="flex items-center gap-2 border-t border-gray-100 p-2.5">
      <input
        v-model="prompt"
        class="h-9 min-w-0 flex-1 rounded-lg bg-gray-50 px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        placeholder="输入指令或提问…"
        @keydown="onKeydown"
      />
      <!-- 空闲时发送（向上箭头）；生成中变停止按钮，点击中止本次 AI 请求 -->
      <button
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          busy ? 'bg-gray-900 hover:bg-gray-700' : 'bg-violet-500 hover:bg-violet-600'
        "
        :disabled="!busy && !prompt.trim()"
        :title="busy ? '停止生成' : '发送'"
        :aria-label="busy ? '停止生成' : '发送'"
        @click="busy ? emit('stop') : emit('send')"
      >
        <Icon v-if="busy" name="i-stop" class="h-3.5 w-3.5" />
        <Icon v-else name="i-arrow-up" class="h-4 w-4" />
      </button>
    </div>
  </aside>
</template>
