// windowEvent.ts: 窗口事件通信封装
// 通道语义：界面指令（如打开文档）走 emitTo 点对点；数据同步走 emit 全局广播，
// 事件按数据域命名（doc:changed / archive:changed），写操作只声明自己动了哪个域，
// 各窗口按展示的域自行订阅、失效缓存并全量重查（SQLite 为唯一事实源）。
// 发出方不关心谁在听，新增窗口只需按需挂重查处理器
import { emit, emitTo, listen } from "@tauri-apps/api/event";

// UI 指令：editor 窗口 "open" 事件载荷（发送与监听共用同一类型，避免两端各自声明漂移）
export type EditorOpenPayload = { type: "doc" | "archive"; id: string };

// UI 指令：通知 editor 窗口打开指定类型与 id 的文档
export const notifyEditorOpen = (type: EditorOpenPayload["type"], id: string) => {
  return emitTo("editor", "open", { type, id } satisfies EditorOpenPayload);
};

// UI 指令：订阅 editor 窗口的 "open" 指令，返回取消订阅函数
export const onEditorOpen = (
  handler: (payload: EditorOpenPayload) => void | Promise<void>,
) => {
  return listen<EditorOpenPayload>("open", (event) => handler(event.payload));
};

// 数据事实：文档本体变化（创建/删除/标题/内容/最近打开时间）
export const notifyDocChanged = () => emit("doc:changed");

// 数据事实：归档本体或成员关系变化（新建/改名/删除/文档归入移出/目录排序）
export const notifyArchiveChanged = () => emit("archive:changed");
