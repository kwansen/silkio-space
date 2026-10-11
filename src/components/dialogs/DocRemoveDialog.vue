<script setup lang="ts">
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import CheckBoxMian from "@/components/icons/CheckBoxMian.vue";
import CheckBoxEmpty from "@/components/icons/CheckBoxEmpty.vue";
import { useNavTreeStore } from "@/stores/navTree";
import { useEditorViewStore } from "@/stores/editorView";
import { useFdSvc } from "@/services/folder.ts";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

// 文档删除弹窗：状态自持（读取全局 navTree store，不经由父级传参），实例由 App.vue 挂载
const navTreeStore = useNavTreeStore();
const editorViewStore = useEditorViewStore();

// 勾选"同时删除文档（不可恢复）"
const deleteDoc = ref(false);

// 元函数：弹窗打开时重置勾选状态
watch(
  () => navTreeStore.removeDocTarget,
  (doc) => {
    if (doc) deleteDoc.value = false;
  },
);

// 元函数：关闭弹窗
const close = () => {
  navTreeStore.removeDocTarget = null;
};

// 元函数：确认删除：默认仅从归档子树移除，勾选后永久删除文档并通知 main 刷新列表；
// 当前展示文档被移除时切换为归档子树内第一篇文档
const handleConfirm = async () => {
  const doc = navTreeStore.removeDocTarget;
  if (!doc || !editorViewStore.folder) {
    close();
    return;
  }
  try {
    const folderSvc = useFdSvc();
    await folderSvc.removeDocFromSubtree({
      folderId: editorViewStore.folder.id,
      docId: doc.id,
    });
    if (deleteDoc.value) {
      const docSvc = await useDocSvc();
      await docSvc.remove(doc.id);
      await notifyMainRefresh();
    }
    if (editorViewStore.doc?.id === doc.id) {
      editorViewStore.setDoc(
        await folderSvc.getFirstDocInSubtree({
          folderId: editorViewStore.folder.id,
        }),
      );
      editorViewStore.setKey(Date.now());
    }
    navTreeStore.bump();
  } catch (e) {
    console.error(e);
  }
  close();
};

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && navTreeStore.removeDocTarget) close();
});
</script>

<template>
  <!-- 文档删除弹窗：默认仅移出归档，可勾选同时永久删除文档 -->
  <div
    v-if="navTreeStore.removeDocTarget"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="close"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">删除</div>
      <div class="text-xs text-neutral-500 mb-3 truncate">
        将「{{
          navTreeStore.removeDocTarget.title || "未命名标题"
        }}」移出当前归档
      </div>
      <div
        class="h-8 flex items-center gap-2 px-2 rounded-md text-xs cursor-pointer hover:bg-gray-100 mb-3"
        @click="deleteDoc = !deleteDoc"
      >
        <CheckBoxMian v-if="deleteDoc" class="w-5 h-5 text-purple-600" />
        <CheckBoxEmpty v-else class="w-5 h-5 text-neutral-300" />
        <div>同时删除文档（不可恢复）</div>
      </div>
      <div class="flex justify-end gap-2">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="close"
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
