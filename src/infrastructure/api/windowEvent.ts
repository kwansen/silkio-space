// windowEvent.ts: 窗口事件通信封装，提供跨窗口事件通知接口
import { emitTo } from "@tauri-apps/api/event";

// 元函数：通知 editor 窗口打开指定类型与 id 的文档
// [日志]
export const notifyEditorOpen = (type: string, id: string) => {
  return emitTo("editor", "open", { type, id });
};

// 元函数：通知 main 窗口刷新文档列表
export const notifyMainRefresh = () => emitTo("main", "refresh");

// 元函数：通知 editor 窗口同步指定归档的展示（归档改名/删除或归档内文档增删时调用）
export const notifyEditorFolderChange = (folderId: string) =>
  emitTo("editor", "folderChange", { folderId });
