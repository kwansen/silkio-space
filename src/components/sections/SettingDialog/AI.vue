<script setup lang="ts">
// AI 服务配置：直接绑定 aiStore.config（store 内 watch 统一落盘 localStorage）
import { useAiStore } from "@/stores/aiStore";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import ChevronDown from "@/components/icons/ChevronDown.vue";

const aiStore = useAiStore();
const { config, ready } = storeToRefs(aiStore);

const fieldClass =
  "h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-800 outline-none focus:border-violet-400";

// 接口格式下拉：桌面端原生 select 样式不可控，改用自定义下拉
const formats = [
  { value: "openai", label: "OpenAI", hint: "chat/completions" },
  { value: "anthropic", label: "Anthropic", hint: "messages" },
] as const;

const formatOpen = ref(false);
const formatRef = ref<HTMLElement | null>(null);
onClickOutside(formatRef, () => (formatOpen.value = false));

const pickFormat = (value: "openai" | "anthropic") => {
  config.value.format = value;
  formatOpen.value = false;
};
</script>

<template>
  <div class="flex flex-col gap-3 max-w-md">
    <div class="flex items-center gap-2">
      <span class="font-medium">AI 服务</span>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        :class="
          ready ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200 text-gray-500'
        "
      >
        {{ ready ? "已配置" : "未配置" }}
      </span>
    </div>

    <div class="flex items-center">
      <label class="w-20 shrink-0 text-sm text-gray-500">接口格式</label>
      <div ref="formatRef" class="relative flex-1">
        <button
          type="button"
          :class="[fieldClass, 'flex items-center justify-between text-left']"
          @click="formatOpen = !formatOpen"
        >
          <span>
            {{ formats.find((f) => f.value === config.format)?.label }}
          </span>
          <ChevronDown
            class="size-4 text-gray-400 transition-transform"
            :class="formatOpen ? 'rotate-180' : ''"
          />
        </button>
        <div
          v-if="formatOpen"
          class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          <div
            v-for="f in formats"
            :key="f.value"
            class="px-2.5 py-1.5 text-sm cursor-pointer"
            :class="
              f.value === config.format
                ? 'bg-purple-50 text-violet-600'
                : 'text-gray-700 hover:bg-gray-100'
            "
            @click="pickFormat(f.value)"
          >
            {{ f.label }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center">
      <label class="w-20 shrink-0 text-sm text-gray-500">接口地址</label>
      <input
        v-model="config.baseURL"
        :placeholder="
          config.format === 'anthropic'
            ? '如 https://api.deepseek.com/anthropic'
            : '如 https://api.deepseek.com'
        "
        :class="fieldClass"
      />
    </div>

    <div class="flex items-center">
      <label class="w-20 shrink-0 text-sm text-gray-500">API Key</label>
      <input
        v-model="config.apiKey"
        type="password"
        placeholder="如 sk-..."
        :class="fieldClass"
      />
    </div>

    <div class="flex items-center">
      <label class="w-20 shrink-0 text-sm text-gray-500">模型名</label>
      <input
        v-model="config.model"
        placeholder="如 deepseek-flash"
        :class="fieldClass"
      />
    </div>
  </div>
</template>
