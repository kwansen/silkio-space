<!-- 流程图文档标题：左上角浮动 chip，样式与工具条一致（同为 44px 高：h-11）。
默认只读展示，点铅笔进入编辑态；回车/失焦保存，Esc 取消。
输入过程中实时同步 store.title 与左侧目录条目（与 RichText/MindMap 行为一致） -->
<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";
import { useEditorAction } from "@/actions/editorAction";
import { useEditorStore } from "@/stores/editorStore";
import Pencil from "@/components/icons/Pencil.vue";

const editorStore = useEditorStore();
const { setDocTitle } = useEditorAction();
const titleEditing = ref(false);
const titleDraft = ref("");
const titleBeforeEdit = ref("");
const titleInputRef = useTemplateRef<HTMLInputElement>("titleInputRef");

const startTitleEdit = () => {
  titleBeforeEdit.value = editorStore.title;
  titleDraft.value = editorStore.title;
  titleEditing.value = true;
  nextTick(() => titleInputRef.value?.select());
};
const onTitleInput = () => {
  setDocTitle(titleDraft.value);
};
const commitTitleEdit = () => {
  if (!titleEditing.value) return;
  titleEditing.value = false;
  setDocTitle(titleDraft.value);
};
const cancelTitleEdit = () => {
  if (titleDraft.value !== titleBeforeEdit.value) {
    setDocTitle(titleBeforeEdit.value);
  }
  titleEditing.value = false;
};
const onTitleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    commitTitleEdit();
  } else if (e.key === "Escape") {
    cancelTitleEdit();
  }
};
</script>

<template>
  <div
    class="absolute top-2 left-2 z-10 flex items-center h-11 px-1.5 gap-1.5 bg-white rounded-xl shadow-md ring-1 ring-neutral-50"
  >
    <input
      v-if="titleEditing"
      ref="titleInputRef"
      class="w-36 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"
      v-model="titleDraft"
      placeholder="未命名标题"
      title="文档标题"
      @input="onTitleInput"
      @keydown="onTitleKeydown"
      @blur="commitTitleEdit"
    />
    <template v-else>
      <span
        class="max-w-36 truncate text-sm"
        :class="editorStore.title ? 'text-gray-700' : 'text-gray-300'"
        :title="editorStore.title || '未命名标题'"
      >
        {{ editorStore.title || "未命名标题" }}
      </span>
      <button
        class="size-8 grid place-items-center rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title="编辑标题"
        @click="startTitleEdit"
      >
        <Pencil class="size-5" />
      </button>
    </template>
  </div>
</template>
