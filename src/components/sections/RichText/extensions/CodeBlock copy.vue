<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";

import ScrollArea from "@/components/common/ScrollArea.vue";

const props = defineProps(nodeViewProps);

/** 从 localStorage 读取缓存的 shiki 语言列表 */
const LANG_CACHE_KEY = "shiki-languages";
const languages = ref<string[]>([]);

onMounted(() => {
  const start = performance.now();
  const cached = localStorage.getItem(LANG_CACHE_KEY);
  if (cached) languages.value = JSON.parse(cached);
  console.log(`语言列表读取耗时：${performance.now() - start}ms`);
});

const copySuccess = ref(false);

/** 语言搜索关键词 */
const searchQuery = ref("");

/** 根据搜索关键词过滤语言列表 */
const filteredLanguages = computed(() =>
  languages.value.filter((l) => l.includes(searchQuery.value.toLowerCase())),
);

const { isOpen, triggerEvents, close } = useDropdown();

/** 下拉关闭时清空搜索 */
watch(isOpen, (v) => {
  if (!v) searchQuery.value = "";
});

/** 复制代码到剪贴板 */
const copyCode = async () => {
  const text = props.node.textContent;
  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch {
    /* 剪贴板写入失败时静默处理 */
  }
};

/** 切换代码块语言 */
const changeLanguage = (lang: string) => {
  props.updateAttributes({ language: lang || null });
  close();
};
</script>

<template>
  <NodeViewWrapper class="relative my-6 rounded-lg overflow-hidden">
    <div
      class="flex items-center justify-between bg-gray-100 select-none py-0.5 pr-0.5 pl-4"
      contenteditable="false"
    >
      <Floating v-model="isOpen" align="start" side="bottom">
        <button
          @click="triggerEvents.click"
          class="text-xs bg-transparent text-neutral-400 outline-none cursor-pointer font-['SFMono-Regular',Menlo,Consolas,monospace] hover:border-[#565f89]"
        >
          {{ props.node.attrs.language || "plaintext" }}
        </button>
        <template #content>
          <div class="min-w-28 rounded-lg bg-white select-none shadow-lg">
            <div class="p-2 border-b border-neutral-200">
              <input
                v-model="searchQuery"
                placeholder="搜索语言..."
                class="w-full px-2 py-1 text-xs border border-neutral-300 rounded outline-none focus:border-purple-400"
              />
            </div>
            <ScrollArea class="w-full max-h-60">
              <div
                @click="changeLanguage('')"
                class="px-3 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer"
                :class="
                  !props.node.attrs.language
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-neutral-600'
                "
              >
                plaintext
              </div>
              <div
                v-for="l in filteredLanguages"
                :key="l"
                @click="changeLanguage(l)"
                class="px-3 py-1.5 text-sm hover:bg-neutral-100 cursor-pointer"
                :class="
                  props.node.attrs.language === l
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-neutral-600'
                "
              >
                {{ l }}
              </div>
            </ScrollArea>
          </div>
        </template>
      </Floating>
      <button
        class="flex items-center justify-center w-7 h-7 bg-transparent rounded-full text-[#565f89] cursor-pointer transition-all duration-150 ease-in-out hover:text-neutral-700 hover:border-[#565f89] hover:bg-gray-200"
        :title="copySuccess ? '已复制' : '复制代码'"
        @click="copyCode"
      >
        <Icon v-if="!copySuccess" icon="lucide:copy" class="w-4 h-4" />
        <Icon v-else icon="lucide:check" class="w-4 h-4 text-green-400" />
      </button>
    </div>
    <!-- prettier-ignore -->
    <pre
      class="bg-gray-100 whitespace-pre! px-4 py-2 m-0 overflow-x-auto text-sm font-['SFMono-Regular',Menlo,Consolas,monospace] scrollbar-thin "><NodeViewContent as="code" class="whitespace-pre! inline-block" /></pre>
  </NodeViewWrapper>
</template>
