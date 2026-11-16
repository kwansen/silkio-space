<script setup lang="ts">
// AI 服务配置：直接绑定 aiStore.config（store 内 watch 统一落盘 localStorage）
import { useAiStore } from "@/stores/aiStore";
import { storeToRefs } from "pinia";

const aiStore = useAiStore();
const { config, ready } = storeToRefs(aiStore);

const fieldClass =
  "h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-800 outline-none focus:border-violet-400";
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <span class="font-medium">AI 服务</span>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        :class="
          ready
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-gray-200 text-gray-500'
        "
      >
        {{ ready ? "已配置" : "未配置" }}
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-xs text-gray-500">接口格式</label>
      <select v-model="config.format" :class="fieldClass">
        <option value="openai">OpenAI 兼容格式（chat/completions）</option>
        <option value="anthropic">Anthropic 格式（messages）</option>
      </select>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-xs text-gray-500">接口地址</label>
      <input
        v-model="config.baseURL"
        :placeholder="
          config.format === 'anthropic'
            ? '含 /v1，如 https://api.anthropic.com/v1'
            : '含 /v1，如 https://api.deepseek.com/v1'
        "
        :class="fieldClass"
      />
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-xs text-gray-500">API Key</label>
      <input
        v-model="config.apiKey"
        type="password"
        placeholder="sk-..."
        :class="fieldClass"
      />
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-xs text-gray-500">模型名</label>
      <input
        v-model="config.model"
        :placeholder="
          config.format === 'anthropic'
            ? '如 claude-sonnet-4-5'
            : '如 deepseek-chat'
        "
        :class="fieldClass"
      />
    </div>

    <p class="text-xs text-gray-400 leading-5">
      配置保存在本地。请求经应用内置网络层发出，无浏览器跨域限制；本地网关
      （如 Ollama 的 http://localhost:11434/v1）同样支持。
    </p>
  </div>
</template>
