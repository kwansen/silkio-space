<script setup lang="ts">
import { ref, watch } from "vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import { useFolderSvc } from "@/services/folder.ts";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import NavTree from "./NavTree.vue";
import NavEmpty from "./NavEmpty.vue";
import DocRemoveDialog from "@/components/shared/DocRemoveDialog.vue";
import FolderRemoveDialog from "./FolderRemoveDialog.vue";
import ArchiveRenameDialog from "@/components/shared/ArchiveRenameDialog.vue";

const store = useEditorViewStore();
const navTreeStore = useNavTreeStore();

// 归档切换时重置导航选中/展开状态与弹窗目标（reset 内自增 version，触发根容器重载）
watch(
  () => store.folder?.id,
  () => navTreeStore.reset(),
);

// 根容器是否为空（文件夹与文档均为空时展示空状态）
const rootEmpty = ref(true);

// 元函数：删除文档：默认仅从归档子树移除，勾选后永久删除文档并通知 main 刷新列表；
// 当前展示文档被移除时切换为归档子树内第一篇文档
const handleRemoveDoc = async (deleteDoc: boolean) => {
  const doc = navTreeStore.removeDocTarget;
  navTreeStore.removeDocTarget = null;
  if (!doc || !store.folder) return;
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.removeDocFromSubtree(store.folder.id, doc.id);
    if (deleteDoc) {
      const svc = await useDocSvc();
      await svc.remove(doc.id);
      await notifyMainRefresh();
    }
    if (store.doc?.id === doc.id) {
      store.setDoc(await folderSvc.getFirstDocInSubtree(store.folder.id));
      store.setKey(Date.now());
    }
    navTreeStore.bump();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：删除文件夹：级联删除该文件夹及其全部子文件夹的关联（文档本体保留）
const handleRemoveFolder = async () => {
  const folder = navTreeStore.removeFolderTarget;
  navTreeStore.removeFolderTarget = null;
  if (!folder) return;
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.remove(folder.id);
    if (navTreeStore.selectedFolderId === folder.id) {
      navTreeStore.setSelectedFolder(null);
    }
    navTreeStore.bump();
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：重命名文件夹并刷新树
const handleRenameFolder = async (name: string) => {
  const folder = navTreeStore.renameTarget;
  navTreeStore.renameTarget = null;
  if (!folder) return;
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.rename(folder.id, name);
    navTreeStore.bump();
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <!-- 导航树：以当前归档为根容器，递归展示子文件夹与文档，支持拖拽移动与排序 -->
  <div class="pb-2 px-1">
    <!-- 空状态与树独立渲染：树始终挂载以完成加载与空状态上报，为空时叠加展示空提示 -->
    <NavEmpty v-if="!store.folder || rootEmpty" />
    <NavTree
      v-if="store.folder"
      :container-id="store.folder.id"
      @on-empty-change="(empty) => (rootEmpty = empty)"
    />
    <!-- 文档删除弹窗：默认仅从归档子树移除，可勾选同时永久删除文档 -->
    <DocRemoveDialog
      :doc="navTreeStore.removeDocTarget"
      @on-close="navTreeStore.removeDocTarget = null"
      @on-confirm="handleRemoveDoc"
    />
    <!-- 文件夹删除确认弹窗：级联删除，文档本体保留 -->
    <FolderRemoveDialog
      :folder="navTreeStore.removeFolderTarget"
      @on-close="navTreeStore.removeFolderTarget = null"
      @on-confirm="handleRemoveFolder"
    />
    <!-- 文件夹重命名弹窗 -->
    <ArchiveRenameDialog
      :folder="navTreeStore.renameTarget"
      @on-close="navTreeStore.renameTarget = null"
      @on-confirm="handleRenameFolder"
    />
  </div>
</template>
