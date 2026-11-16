<script setup lang="ts">
// 文档切换器：标题按钮（打开列表）、原位重命名、新建按钮，以及
// 文档列表 dialog（排序 / 打开 / 删除）。画布 onChange 自动保存，
// 无需保存按钮与保存状态提示；状态与持久化由宿主组件负责。
import { computed, nextTick, ref, watch } from "vue";
import { DEFAULT_DOC_NAME, type FlowChartDoc } from "../lib/idb";
import Icon from "./Icon.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

const props = defineProps<{
  docs: FlowChartDoc[];
  currentId: string;
  docName: string;
}>();

const emit = defineEmits<{
  create: [];
  open: [id: string];
  remove: [id: string];
  rename: [name: string];
}>();

const dialogOpen = ref(false);
// OverlayScrollbars 统一配置：滚动/悬浮时显示、静止后自动隐藏
const osOptions = {
  scrollbars: { autoHide: "move" as const, autoHideDelay: 500 },
};
const sortKey = ref<"createdAt" | "updatedAt">("updatedAt");
const sortAsc = ref(false);
const sortedDocs = computed(() => {
  const arr = [...props.docs];
  arr.sort(
    (a, b) => (sortAsc.value ? 1 : -1) * (a[sortKey.value] - b[sortKey.value]),
  );
  return arr;
});

function toggleSort(key: "createdAt" | "updatedAt") {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = false;
  }
}

function selectDoc(id: string) {
  dialogOpen.value = false;
  emit("open", id);
}

function createDoc() {
  dialogOpen.value = false;
  emit("create");
}

// ---- 标题原位重命名：点击铅笔图标后标题文本替换为输入框，失焦/回车提交 ----
const editingName = ref(false);
const draftName = ref("");
const nameInput = ref<HTMLInputElement | null>(null);
// blur 与编辑图标点击会先后触发提交，用守卫避免重复 emit / 重新进入编辑
let commitGuard = false;
let clickGuard = false;

watch(
  () => props.docName,
  () => {
    // 切换文档等外部改名时退出编辑态
    editingName.value = false;
  },
);

function startRename() {
  draftName.value = props.docName;
  commitGuard = false;
  editingName.value = true;
  void nextTick(() => {
    nameInput.value?.focus();
    nameInput.value?.select();
  });
}

function commitRename() {
  if (commitGuard) return;
  commitGuard = true;
  editingName.value = false;
  emit("rename", draftName.value.trim() || DEFAULT_DOC_NAME);
}

function cancelRename() {
  commitGuard = true;
  editingName.value = false;
}

// 编辑态点击铅笔图标 = 提交退出；blur 先于 click 触发，用 pointerdown 抢先处理
function onEditPointerDown() {
  if (!editingName.value) return;
  clickGuard = true;
  commitRename();
}

function onEditClick() {
  if (clickGuard) {
    clickGuard = false;
    return;
  }
  startRename();
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}
</script>

<template>
  <!-- 文档切换器：标题 + 新建，共用一个悬浮底座 -->
  <div
    class="absolute top-4 left-4 z-10 flex items-center gap-0.5 rounded-[10px] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <!-- 编辑态：标题 div 原位替换为输入框，失焦/回车提交，Esc 取消 -->
    <div v-if="editingName" class="flex h-8 items-center rounded-md px-2">
      <input
        id="doc-name-input"
        ref="nameInput"
        class="h-6 w-40 rounded-md border border-violet-300 px-1.5 text-xs text-gray-800 outline-none focus:border-violet-400"
        type="text"
        v-model="draftName"
        :placeholder="DEFAULT_DOC_NAME"
        @blur="commitRename"
        @keydown.enter.prevent="commitRename"
        @keydown.esc="cancelRename"
      />
    </div>
    <button
      v-else
      id="docs-btn"
      class="flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 hover:bg-gray-100"
      title="流程图列表"
      aria-label="流程图列表"
      @click="dialogOpen = true"
    >
      <Icon name="i-file" class="text-violet-500" />
      <span class="max-w-40 truncate text-xs text-gray-800">
        {{ docName || DEFAULT_DOC_NAME }}
      </span>
      <Icon name="i-chevron-down" size="h-3 w-3" class="text-gray-400" />
    </button>
    <button
      id="rename-btn"
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-800 hover:bg-gray-100"
      :class="{ 'text-violet-500': editingName }"
      title="重命名"
      aria-label="重命名"
      @pointerdown="onEditPointerDown"
      @click="onEditClick"
    >
      <Icon name="i-pen" />
    </button>
    <button
      id="new-doc-btn"
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-800 hover:bg-gray-100"
      title="新建流程图"
      aria-label="新建流程图"
      @click="createDoc"
    >
      <Icon name="i-plus" />
    </button>
  </div>

  <!-- 文档 dialog：遮罩点击关闭，列表按创建/更新时间排序，点击条目切换流程图 -->
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="dialogOpen"
        id="docs-dialog"
        class="fixed inset-0 z-30 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-[2px]"
        @click.self="dialogOpen = false"
      >
        <div
          class="dialog-panel flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
          role="dialog"
          aria-label="流程图列表"
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
                @click="toggleSort(key)"
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
              <Icon name="i-close" size="h-3.5 w-3.5" />
            </button>
          </div>

          <!-- 流程图列表：OverlayScrollbars 自定义滚动条 -->
          <OverlayScrollbarsComponent
            element="div"
            class="flex min-h-0 flex-1"
            :options="osOptions"
          >
            <div class="flex flex-col gap-1 px-2.5 py-2.5">
            <div
              v-for="d in sortedDocs"
              :key="d.id"
              :data-doc-id="d.id"
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
                <Icon name="i-file" />
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
                title="删除流程图"
                aria-label="删除流程图"
                @click.stop="emit('remove', d.id)"
              >
                <Icon name="i-trash" size="h-3.5 w-3.5" />
              </button>
            </div>
            <div v-if="!sortedDocs.length" class="py-10 text-center">
              <Icon
                name="i-file"
                size="h-8 w-8"
                class="mx-auto mb-2 text-gray-200"
              />
              <div class="text-xs text-gray-400">还没有流程图，点击左上角「+」新建</div>
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
