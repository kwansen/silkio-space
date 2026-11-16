<script setup lang="ts">
// 文档切换器：标题按钮（打开列表）+ 新建按钮 + 文档列表 dialog
// （按创建/更新时间排序 / 打开 / 删除）。状态与持久化由宿主组件负责。
import { computed, ref } from "vue";
import type { MindMapDoc } from "../idb";
import Icon from "./Icon.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

const props = defineProps<{
  docs: MindMapDoc[];
  currentId: string;
  docName: string;
  // 首个文档是否已定位（宿主完成 IndexedDB 初始化）：此前标题渲染骨架占位，
  // 避免「未命名标题 → 真实标题」的读库闪变
  ready?: boolean;
}>();

const emit = defineEmits<{
  create: [];
  open: [id: string];
  remove: [id: string];
}>();

const dialogOpen = ref(false);
// OverlayScrollbars 统一配置：滚动/悬浮时显示、静止后自动隐藏
const osOptions = {
  scrollbars: { autoHide: "move" as const, autoHideDelay: 500 },
};
// 文档列表排序状态：按创建/更新时间 + 升降序
const sortKey = ref<"createdAt" | "updatedAt">("updatedAt");
const sortAsc = ref(false);
const sortedDocs = computed(() => {
  const arr = [...props.docs];
  arr.sort(
    (a, b) => (sortAsc.value ? 1 : -1) * (a[sortKey.value] - b[sortKey.value]),
  );
  return arr;
});

function selectDoc(id: string) {
  dialogOpen.value = false;
  emit("open", id);
}

function createDoc() {
  dialogOpen.value = false;
  emit("create");
}

// 相对时间显示：列表项的更新时间
function formatTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}
</script>

<template>
  <!-- 文档切换器：标题按钮 + 新建按钮共用一个悬浮底座 -->
  <div
    class="absolute top-4 left-4 z-10 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <button
      class="flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 hover:bg-gray-100"
      title="导图列表"
      @click="dialogOpen = true"
    >
      <Icon name="i-file" class="h-4 w-4 text-gray-500" />
      <!-- 读库完成前显示骨架占位：占位条与文字同高，就绪后无跳变地替换为真实标题 -->
      <span
        v-if="!props.ready"
        class="h-3 w-20 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></span>
      <span v-else class="max-w-40 truncate text-xs text-gray-800">
        {{ docName || "未命名标题" }}
      </span>
      <Icon name="i-chevron-down" class="h-3 w-3 text-gray-400" />
    </button>
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-800 hover:bg-gray-100"
      title="新建导图"
      aria-label="新建导图"
      @click="createDoc"
    >
      <Icon name="i-plus" class="h-4 w-4" />
    </button>
  </div>

  <!-- 文档 dialog：遮罩点击关闭，列表按创建/更新时间排序，点击条目打开导图 -->
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="dialogOpen"
        class="fixed inset-0 z-30 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-[2px]"
        @click.self="dialogOpen = false"
      >
        <div
          class="dialog-panel flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
          role="dialog"
          aria-label="导图列表"
        >
          <!-- 头部：排序切换 + 关闭 -->
          <div
            class="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
          >
            <div class="inline-flex items-center rounded-lg bg-gray-100 p-0.5">
              <button
                v-for="key in ['createdAt', 'updatedAt'] as const"
                :key="key"
                class="flex h-6 cursor-pointer items-center gap-1 rounded-md px-2.5 text-[11px] transition-all"
                :class="
                  sortKey === key
                    ? 'bg-white font-medium text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
                @click="sortKey === key ? (sortAsc = !sortAsc) : (sortKey = key)"
              >
                {{ key === "createdAt" ? "创建时间" : "更新时间" }}
                <span v-if="sortKey === key" class="text-[9px]">{{
                  sortAsc ? "↑" : "↓"
                }}</span>
              </button>
            </div>
            <button
              class="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="关闭"
              aria-label="关闭"
              @click="dialogOpen = false"
            >
              <Icon name="i-close" class="h-3.5 w-3.5" />
            </button>
          </div>

          <!-- 导图列表：OverlayScrollbars 自定义滚动条 -->
          <OverlayScrollbarsComponent
            element="div"
            class="flex min-h-0 flex-1"
            :options="osOptions"
          >
            <div class="flex flex-col gap-1 px-2.5 py-2.5">
              <div
                v-for="d in sortedDocs"
                :key="d.id"
                class="group/row flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                :class="
                  d.id === currentId
                    ? 'bg-violet-50 ring-1 ring-violet-100'
                    : 'hover:bg-gray-50'
                "
                @click="selectDoc(d.id)"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  :class="
                    d.id === currentId
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-gray-100 text-gray-400'
                  "
                >
                  <Icon name="i-file" class="h-4 w-4" />
                </span>
                <div class="min-w-0 flex-1">
                  <div
                    class="truncate text-[13px] font-medium"
                    :class="
                      d.id === currentId
                        ? 'text-violet-700'
                        : 'text-gray-800'
                    "
                  >
                    {{ d.name }}
                  </div>
                  <div class="text-[11px] text-gray-400">
                    更新于 {{ formatTime(d.updatedAt) }}
                  </div>
                </div>
                <button
                  class="hidden h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 group-hover/row:flex"
                  title="删除"
                  aria-label="删除"
                  @click.stop="emit('remove', d.id)"
                >
                  <Icon name="i-trash" class="h-3.5 w-3.5" />
                </button>
              </div>
              <div v-if="!sortedDocs.length" class="py-10 text-center">
                <Icon name="i-file" class="mx-auto mb-2 h-8 w-8 text-gray-200" />
                <div class="text-xs text-gray-400">还没有导图，点击左上角「+」新建</div>
              </div>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* dialog 进出场：遮罩淡入淡出，面板上浮缩放 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  transform: translateY(8px) scale(0.97);
  opacity: 0;
}
</style>
