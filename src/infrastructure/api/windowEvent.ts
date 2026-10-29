// windowEvent.ts: 窗口事件通信封装
// 通道语义：界面指令（如打开文档）走 emitTo 点对点；数据同步走 emit 全局广播的
// 唯一事实 data:changed，各窗口收到后自行失效缓存、全量重查（SQLite 为唯一事实源）。
// 发出方不关心谁在听，新增窗口只需各挂一个重查处理器
import { emit, emitTo } from "@tauri-apps/api/event";

// UI 指令：通知 editor 窗口打开指定类型与 id 的文档
export const notifyEditorOpen = (type: string, id: string) => {
  return emitTo("editor", "open", { type, id });
};

// 数据事实：任何写操作后广播一次，各窗口自行刷新所展示的数据
export const notifyDataChanged = () => emit("data:changed");
