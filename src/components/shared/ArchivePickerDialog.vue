<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveSortStore } from "@/stores/archiveSort";
import ScrollArea from "./ScrollArea.vue";

interface Props {
  // 待归档文档 id：null 表示弹窗关闭
  docId: string | null;
}

const props = defineProps<Props>();

interface Emits {
  onClose: [];
}

const emit = defineEmits<Emits>();

const archiveSortStore = useArchiveSortStore();

// 元函数：组装归档组合式函数（归档列表与关联读写）
const {
  refreshFolders,
  getFolderIdsByDoc,
  addDocToFolder,
  removeDocFromFolder,
} = useArchiveSort();

// 勾选的归档 id 集合与打开时的初始集合（用于确定时计算增删差异）
const checkedIds = ref<Set<string>>(new Set());
const originalIds = ref<Set<string>>(new Set());

// 元函数：弹窗打开时加载归档列表与文档当前所属归档，初始化勾选状态
watch(
  () => props.docId,
  async (docId) => {
    if (!docId) return;
    try {
      const [ids] = await Promise.all([
        getFolderIdsByDoc(docId),
        refreshFolders(),
      ]);
      checkedIds.value = new Set(ids);
      originalIds.value = new Set(ids);
    } catch (e) {
      console.error(e);
    }
  },
);

// 元函数：切换勾选状态
const toggle = (folderId: string) => {
  const next = new Set(checkedIds.value);
  if (next.has(folderId)) {
    next.delete(folderId);
  } else {
    next.add(folderId);
  }
  checkedIds.value = next;
};

// 元函数：确定应用勾选结果（新勾选的写入关联、取消勾选的移出关联）并关闭弹窗
const handleConfirm = async () => {
  const docId = props.docId;
  if (!docId) return;
  try {
    const added = [...checkedIds.value].filter(
      (id) => !originalIds.value.has(id),
    );
    const removed = [...originalIds.value].filter(
      (id) => !checkedIds.value.has(id),
    );
    await Promise.all([
      ...added.map((folderId) => addDocToFolder(folderId, docId)),
      ...removed.map((folderId) => removeDocFromFolder(folderId, docId)),
    ]);
  } catch (e) {
    console.error(e);
  }
  emit("onClose");
};

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.docId) emit("onClose");
});
</script>

<template>
  <!-- 独立归档选择弹窗：多选勾选，遮罩点击关闭 -->
  <div
    v-if="docId"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="emit('onClose')"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">归档到</div>
      <div
        v-if="archiveSortStore.folders.length === 0"
        class="h-20 flex items-center justify-center text-xs text-neutral-400"
      >
        暂无归档，先在归档页创建一个吧
      </div>
      <ScrollArea v-else>
        <div
          v-for="folder in archiveSortStore.folders"
          :key="folder.id"
          class="h-9 flex items-center gap-2 px-2 rounded-md text-xs cursor-pointer hover:bg-gray-100"
          @click="toggle(folder.id)"
        >
          <Icon
            :icon="
              checkedIds.has(folder.id)
                ? 'mdi:checkbox-marked'
                : 'mdi:checkbox-blank-outline'
            "
            class="w-5 h-5"
            :class="
              checkedIds.has(folder.id) ? 'text-purple-600' : 'text-neutral-300'
            "
          />
          <Icon icon="mdi:folder-outline" class="w-5 h-5 text-neutral-500" />
          <div class="truncate">{{ folder.name }}</div>
        </div>
      </ScrollArea>
      <div class="flex justify-end gap-2 mt-3">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="emit('onClose')"
        >
          取消
        </TextButton>
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
          @click="handleConfirm"
        >
          确定
        </TextButton>
      </div>
    </div>
  </div>
</template>
