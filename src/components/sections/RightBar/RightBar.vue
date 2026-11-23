<script setup lang="ts">
// AI 助手右侧栏（移植自 .examples demo 的 AISidebar，适配本应用栅格与
// 图标体系）：对话历史 / 流式思考 / Markdown 回答。
// 状态与网络逻辑在 aiStore + aiAction；服务配置在设置对话框的「AI 服务」页签。
import { getCurrentWindow } from "@tauri-apps/api/window";
import AIMarkdown from "./AIMarkdown.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { isOpsStream } from "@/infrastructure/api/ai";
import { useAiAction } from "@/actions/aiAction";
import { useAiStore } from "@/stores/aiStore";
import { useUiStore } from "@/stores/uiStore";
import { notifyOpenSetting } from "@/infrastructure/api/windowEvent";
import { storeToRefs } from "pinia";
import { computed, nextTick, useTemplateRef, watch } from "vue";
import Sparkles from "@/components/icons/Sparkles.vue";
import Stop from "@/components/icons/Stop.vue";
import ChevronUp from "@/components/icons/ChevronUp.vue";
import Broom from "@/components/icons/Broom.vue";

const aiStore = useAiStore();
const { messages, pending, busy, prompt, ready } = storeToRefs(aiStore);
const { send, stop, clear } = useAiAction();
const uiStore = useUiStore();

const pendingStatus = computed(() => {
  const p = pending.value;
  if (!p) return "";
  // 编辑类指令模型输出的是操作 JSON（由包内控制器解析执行），不实时渲染
  if (isOpsStream(p.content)) return "正在应用 AI 操作…";
  if (p.content) return "回答中…";
  return p.reasoning ? "思考中…" : "等待响应…";
});

// 新消息或流式增量后，消息流自动跟随到底部
const chatBox = useTemplateRef<InstanceType<typeof ScrollArea>>("chatBox");
watch(
  () => [messages.value, pending.value] as const,
  async () => {
    await nextTick();
    const viewport = chatBox.value?.osInstance()?.elements().viewport;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  },
  { deep: true, flush: "post" },
);

// 输入法组合期间不发送（与原生 Enter 行为一致）
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.isComposing) send();
};

// 未配置提示可点击：直达设置对话框「AI 服务」页签。
// 设置对话框仅 main 窗口渲染，其他窗口发指令让 main 显示并打开
const openAiSetting = () => {
  if (getCurrentWindow().label === "main") {
    uiStore.setSettingNav("ai");
    uiStore.setSettingDialogShow(true);
  } else {
    notifyOpenSetting("ai");
  }
};
</script>

<template>
  <div class="w-75 h-full flex">
    <div
      class="flex-1 min-h-0 bg-white rounded-lg overflow-hidden flex flex-col"
    >
      <!-- 头部 -->
      <div
        class="h-11 shrink-0 flex items-center px-3 gap-1.5 border-b border-gray-50"
      >
        <Sparkles class="size-5 text-violet-500" />
        <div class="font-medium">AI 助手</div>
        <div class="flex-1"></div>
        <button
          title="清空"
          class="text-xs text-gray-400 enabled:hover:text-gray-600 cursor-pointer disabled:cursor-default disabled:opacity-50"
          :disabled="busy || !messages.length"
          @click="clear"
        >
          <Broom class="size-4" />
        </button>
      </div>

      <!-- 消息流 -->
      <ScrollArea ref="chatBox" class="flex-1 min-h-0 px-2.5">
        <div class="flex flex-col gap-3 py-2">
          <div
            v-if="!messages.length && !pending"
            class="mt-8 text-center text-xs leading-[1.9] text-gray-400"
          >
            与AI对话
            <template v-if="!ready">
              <br />尚未配置 AI 服务，点此<button
                class="cursor-pointer text-violet-500 enabled:hover:text-violet-600"
                @click="openAiSetting"
              >
                去配置
              </button>
            </template>
          </div>

          <div v-for="m in messages" :key="m.id">
            <!-- 用户指令 -->
            <div v-if="m.role === 'user'" class="flex justify-end">
              <div
                class="max-w-[85%] rounded-xl rounded-br-sm bg-violet-100 px-3 py-2 text-xs leading-5 text-gray-700 whitespace-pre-wrap wrap-break-word"
              >
                {{ m.text }}
              </div>
            </div>
            <!-- 错误 -->
            <div
              v-else-if="m.role === 'error'"
              class="text-xs leading-5 text-red-500 whitespace-pre-wrap wrap-break-word"
            >
              {{ m.text }}
            </div>
            <!-- AI 回复：思考过程（可折叠）+ 回答 + 执行反馈链 -->
            <div v-else class="flex flex-col gap-2">
              <details
                v-if="m.reasoning"
                class="rounded-lg bg-gray-50 px-2.5 py-1.5"
              >
                <summary
                  class="cursor-pointer text-xs text-gray-400 select-none"
                >
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
              <!-- 执行反馈链（参照 .examples AISidebar）：AI 改图指令逐步应用的结果 -->
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
              v-if="pending.content && !isOpsStream(pending.content)"
              :value="pending.content"
              class="text-xs leading-5 text-gray-600"
            />
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles class="size-5 animate-pulse text-violet-400" />
              <span>{{ pendingStatus }}</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- 输入区 -->
      <div class="shrink-0 p-2 pt-1 flex items-center gap-1.5">
        <input
          v-model="prompt"
          placeholder="输入问题…"
          autocomplete="off"
          class="h-9 min-w-0 flex-1 rounded-lg bg-gray-50 px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ddd6fe]"
          @keydown="onKeydown"
        />
        <button
          class="size-9 shrink-0 grid place-items-center rounded-lg text-white enabled:hover:bg-violet-600 disabled:cursor-default disabled:opacity-50"
          :class="
            busy ? 'bg-gray-900 enabled:hover:bg-gray-700' : 'bg-violet-500'
          "
          :disabled="!busy && !prompt.trim()"
          :title="busy ? '停止生成' : '发送'"
          @click="busy ? stop() : send()"
        >
          <Stop v-if="busy" class="size-5" />
          <ChevronUp v-else class="size-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<!-- v-html 内容不能用 scoped 选择器命中，此处用 :deep 穿透 -->
<style scoped>
/* 折叠块去掉浏览器默认的黑色三角标记，换成细线条小箭头 */
:deep(summary) {
  list-style: none;
}
:deep(summary::-webkit-details-marker) {
  display: none;
}
:deep(summary)::after {
  content: "";
  width: 5px;
  height: 5px;
  margin-left: auto;
  border-right: 1.2px solid currentColor;
  border-bottom: 1.2px solid currentColor;
  transform: rotate(-45deg) translateY(-1px);
  transition: transform 0.15s;
}
:deep(details[open] summary)::after {
  transform: rotate(45deg) translateY(-1px);
}
:deep(summary) {
  display: flex;
  align-items: center;
}

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
