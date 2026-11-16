<script setup lang="ts">
// AI 助手右侧栏（移植自 .examples demo 的 AISidebar，适配本应用栅格与
// 图标体系）：对话历史 / 流式思考 / Markdown 回答。
// 状态与网络逻辑在 aiStore + aiAction；服务配置在设置对话框的「AI 服务」页签。
import AIMarkdown from "./AIMarkdown.vue";
import { useAiAction } from "@/actions/aiAction";
import { useAiStore } from "@/stores/aiStore";
import { storeToRefs } from "pinia";
import { computed, nextTick, useTemplateRef, watch } from "vue";
import Sparkles from "@/components/icons/Sparkles.vue";
import Stop from "@/components/icons/Stop.vue";
import ArrowUp from "@/components/icons/ArrowUp.vue";

const aiStore = useAiStore();
const { messages, pending, busy, prompt } = storeToRefs(aiStore);
const { send, stop, clear } = useAiAction();

const pendingStatus = computed(() => {
  const p = pending.value;
  if (!p) return "";
  if (p.content) return "回答中…";
  return p.reasoning ? "思考中…" : "等待响应…";
});

// 新消息或流式增量后，消息流自动跟随到底部
const chatBox = useTemplateRef<HTMLDivElement>("chatBox");
watch(
  () => [messages.value, pending.value] as const,
  async () => {
    await nextTick();
    const el = chatBox.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
  { deep: true, flush: "post" },
);

// 输入法组合期间不发送（与原生 Enter 行为一致）
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.isComposing) send();
};
</script>

<template>
  <div class="w-65 h-full px-2 pb-2 flex flex-col gap-1">
    <!-- 头部 -->
    <div class="h-9 flex items-center px-2 rounded-md hover:bg-gray-100">
      <Sparkles class="size-4 text-violet-500" />
      <div class="ml-1.5">AI 助手</div>
      <div class="flex-1"></div>
      <button
        class="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="busy || !messages.length"
        @click="clear"
      >
        清空
      </button>
    </div>

    <!-- 消息流 -->
    <div ref="chatBox" class="flex-1 min-h-0 overflow-y-auto pr-0.5">
      <div class="flex flex-col gap-3 p-1">
        <div
          v-if="!messages.length && !pending"
          class="mt-8 text-center text-xs leading-[1.9] text-gray-400"
        >
          询问当前文档内容，或输入任意问题
          <br />尚未配置 AI 服务，请在主页窗口的设置中配置
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
          <!-- AI 回复：思考过程（可折叠）+ 回答 -->
          <div v-else class="flex flex-col gap-2">
            <details v-if="m.reasoning" class="rounded-lg bg-gray-50 px-2.5 py-1.5">
              <summary class="cursor-pointer text-xs text-gray-400 select-none">
                思考过程
              </summary>
              <div
                class="mt-1 text-[11px] leading-5 text-gray-400 whitespace-pre-wrap"
              >
                {{ m.reasoning }}
              </div>
            </details>
            <AIMarkdown
              v-if="m.text"
              :value="m.text"
              class="text-xs leading-5 text-gray-600"
            />
          </div>
        </div>

        <!-- 进行中：流式思考实时展示，回答文本流式渲染 -->
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
              class="mt-1 text-[11px] leading-5 text-gray-400 whitespace-pre-wrap"
            >
              {{ pending.reasoning }}
            </div>
          </details>
          <AIMarkdown
            v-if="pending.content"
            :value="pending.content"
            class="text-xs leading-5 text-gray-600"
          />
          <div class="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles class="size-3.5 animate-pulse text-violet-400" />
            <span>{{ pendingStatus }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="flex items-center gap-1.5">
      <input
        v-model="prompt"
        placeholder="输入问题…"
        autocomplete="off"
        class="h-9 min-w-0 flex-1 rounded-lg bg-gray-50 px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ddd6fe]"
        @keydown="onKeydown"
      />
      <button
        class="size-9 shrink-0 grid place-items-center rounded-lg text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        :class="busy ? 'bg-gray-900 hover:bg-gray-700' : 'bg-violet-500'"
        :disabled="!busy && !prompt.trim()"
        :title="busy ? '停止生成' : '发送'"
        @click="busy ? stop() : send()"
      >
        <Stop v-if="busy" class="size-5" />
        <ArrowUp v-else class="size-5" />
      </button>
    </div>
  </div>
</template>

<!-- v-html 内容不能用 scoped 选择器命中，此处用 :deep 穿透 -->
<style scoped>
:deep(.ai-p) {
  margin: 0.25rem 0;
  white-space: pre-wrap;
  word-break: break-word;
}
:deep(.ai-h) {
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
}
:deep(.ai-h:first-child) {
  margin-top: 0;
}
:deep(.ai-list) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
  list-style: revert;
}
:deep(.ai-quote) {
  margin: 0.25rem 0;
  padding: 0.25rem 0.5rem;
  border-left: 3px solid #ddd;
  color: rgb(107 114 128);
}
:deep(.ai-code-block) {
  margin: 0.375rem 0;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgb(249 250 251);
  border: 1px solid rgb(243 244 246);
  overflow-x: auto;
  font-size: 11px;
  line-height: 1.5;
}
:deep(.ai-inline-code) {
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  background: rgb(243 244 246);
  font-size: 11px;
}
:deep(.ai-p a) {
  color: rgb(139 92 246);
  text-decoration: underline;
}
</style>
