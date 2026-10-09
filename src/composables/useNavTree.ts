import { ref } from "vue";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { useNavTreeStore } from "@/stores/navTree.ts";

// useNavTree.ts: 导航树拖拽组合式函数（原生 HTML5 DnD）
// 模块级共享拖拽状态：拖拽跨越各级 NavTree 组件边界，状态必须全局唯一

// 拖拽物类型
export type DragKind = "doc" | "folder";

// 拖拽物载荷（dragstart 时快照）
export interface DragPayload {
  kind: DragKind;
  id: string;
  // 拖拽物当前所在容器 id（文档为 folder_document 的容器，文件夹为其 parent 容器）
  sourceContainerId: string;
  // 文件夹拖拽时的全部后代 id 快照，用于环检测
  descendantIds: string[];
}

// 放置命中区：行前/行后（同级排序）、行内（放入文件夹）、容器空白（追加到末尾）
export type DropZone = "before" | "after" | "into";

// 当前放置指示：id 为空字符串表示容器空白区
export interface DropIndicator {
  containerId: string;
  kind: DragKind;
  id: string;
  zone: DropZone;
}

// 拖拽中的载荷（null 表示未在拖拽）
const dragging = ref<DragPayload | null>(null);
// 当前放置指示（null 表示不在有效目标上）
const indicator = ref<DropIndicator | null>(null);

// 悬停自动展开定时器（拖拽悬停折叠文件夹 600ms 后展开）
let expandTimer: number | null = null;

// 元函数：开始拖拽（dragstart 调用）
const startDrag = (payload: DragPayload) => {
  dragging.value = payload;
};

// 元函数：取消悬停自动展开定时器
const cancelExpand = () => {
  if (expandTimer !== null) {
    clearTimeout(expandTimer);
    expandTimer = null;
  }
};

// 元函数：悬停折叠文件夹时调度自动展开
const scheduleExpand = (folderId: string) => {
  if (expandTimer !== null) return;
  expandTimer = window.setTimeout(() => {
    expandTimer = null;
    useNavTreeStore().expand(folderId);
  }, 600);
};

// 元函数：结束拖拽并清理全部拖拽状态（dragend/drop 调用）
const endDrag = () => {
  cancelExpand();
  dragging.value = null;
  indicator.value = null;
};

// 元函数：更新放置指示（各行 dragover 命中校验通过后调用）
const setIndicator = (next: DropIndicator) => {
  indicator.value = next;
};

// 元函数：清除放置指示（dragleave 到无效区域时调用）
const clearIndicator = () => {
  indicator.value = null;
};

// 元函数：判断目标文件夹是否为拖拽物自身或其后代（环检测）
const isSelfOrDescendant = (folderId: string) => {
  const d = dragging.value;
  if (!d || d.kind !== "folder") return false;
  return d.id === folderId || d.descendantIds.includes(folderId);
};

// 元函数：按 before/after 在同级数组中移动被拖拽项到目标项旁（就地修改数组并返回）
const insertBeside = (ids: string[], draggedId: string, targetId: string, zone: "before" | "after") => {
  const at = ids.indexOf(draggedId);
  if (at >= 0) ids.splice(at, 1);
  const tIdx = ids.indexOf(targetId);
  if (tIdx < 0) return false;
  ids.splice(tIdx + (zone === "after" ? 1 : 0), 0, draggedId);
  return true;
};

// 元函数：执行放置落库（drop 调用）：读取当前拖拽物与指示，按类型与命中区持久化，完成后刷新树
const handleDrop = async () => {
  const d = dragging.value;
  const t = indicator.value;
  endDrag();
  if (!d || !t) return;
  // "into" 命中文件夹行时目标容器为该行 id，命中容器空白区时目标容器为容器自身
  const targetContainerId = t.zone === "into" ? t.id || t.containerId : t.containerId;
  try {
    const svc = await useFolderSvc();
    if (d.kind === "doc") {
      if (t.zone === "into") {
        // 放入文件夹（追加到末尾）：源容器与目标相同则无需处理
        if (d.sourceContainerId === targetContainerId) return;
        await svc.removeDoc(d.sourceContainerId, d.id);
        await svc.addDoc(targetContainerId, d.id);
      } else {
        // 同级排序/跨容器插入：以目标容器现有文档顺序为基准插入目标行旁
        const ids = (await svc.getDocs(targetContainerId)).map((x) => x.id);
        if (!insertBeside(ids, d.id, t.id, t.zone)) return;
        if (d.sourceContainerId !== targetContainerId) {
          await svc.removeDoc(d.sourceContainerId, d.id);
        }
        await svc.reorderDocs(targetContainerId, ids);
      }
    } else {
      // 环检测：目标容器不得是拖拽文件夹自身或其后代
      if (isSelfOrDescendant(targetContainerId)) return;
      if (t.zone === "into") {
        // 放入文件夹（追加到末尾）：源容器与目标相同则无需处理
        if (d.sourceContainerId === targetContainerId) return;
        await svc.setParent(d.id, targetContainerId);
        const ids = (await svc.getChildren(targetContainerId)).map((f) => f.id);
        const at = ids.indexOf(d.id);
        if (at >= 0) ids.splice(at, 1);
        ids.push(d.id);
        await svc.reorder(ids);
      } else {
        // 同级排序/跨容器插入
        if (t.id === d.id) return;
        const ids = (await svc.getChildren(targetContainerId)).map((f) => f.id);
        if (!insertBeside(ids, d.id, t.id, t.zone)) return;
        if (d.sourceContainerId !== targetContainerId) {
          await svc.setParent(d.id, targetContainerId);
        }
        await svc.reorder(ids);
      }
    }
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  } finally {
    // 无论成功或部分失败都刷新树，使 UI 与数据库保持一致
    useNavTreeStore().bump();
  }
};

export const useNavTree = () => ({
  dragging,
  indicator,
  startDrag,
  endDrag,
  setIndicator,
  clearIndicator,
  scheduleExpand,
  cancelExpand,
  isSelfOrDescendant,
  handleDrop,
});
