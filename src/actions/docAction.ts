import { useDocSvc } from "@/services/document";
import {
  notifyArchiveChanged,
  notifyDocChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";

import { useDocSearchStore } from "@/stores/docSearchStore";
import { useDocSortStore } from "@/stores/docSortStore";
import type { DocType } from "@/types/doc";

export const useDocAction = () => {
  const svc = useDocSvc();
  const searchStore = useDocSearchStore();
  const sortStore = useDocSortStore();

  // 只发打开指令与落库 viewed_at，不在此广播 doc:changed：
  // main 的刷新由 editor 窗口显示后补发，避免 editor 未显示时 main 先刷新闪烁
  const openDoc = async (id: string) => {
    await notifyEditorOpen("doc", id);
    await svc.update(id, { viewed_at: Date.now() });
  };

  // 创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      notifyDocChanged();
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  // 各类型新建时的默认内容（JSON 字符串），数据模型参照 .examples demo：
  // mindMap：{ text, children } 节点树，新建仅含根节点
  // flowChart：{ nodes, edges }，新建仅含一个"开始"端点节点
  const MINDMAP_DEFAULT_CONTENT = JSON.stringify({
    text: "中心主题",
    children: [],
  });
  const FLOWCHART_DEFAULT_CONTENT = JSON.stringify({
    nodes: [{ id: "start", shape: "ellipse", x: 80, y: 200, text: "开始" }],
    edges: [],
  });

  // 新建指定类型文档的通用流程：落库（含默认内容）→ 广播 doc:changed → 打开 editor 窗口
  const createTyped = async (doc_type: DocType, content: string) => {
    try {
      const id = await svc.create({ doc_type, content });
      notifyDocChanged();
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  const createMindmap = () => createTyped("mindMap", MINDMAP_DEFAULT_CONTENT);
  const createFlowchart = () =>
    createTyped("flowChart", FLOWCHART_DEFAULT_CONTENT);

  // 删除文档动了两个域：本体删除广播 doc:changed，级联清理归档关联广播 archive:changed
  const remove = async (id: string) => {
    await svc.remove(id);
    notifyDocChanged();
    notifyArchiveChanged();
    await refreshAll();
  };

  // 元函数：按最后一次关键词重新搜索（供增删改后刷新），光标尽量停在原位，结果变少时收敛到末项
  const refreshSearched = async () => {
    if (!searchStore.query) return;
    const index = searchStore.activeIndex;
    await searchStore.searchDocs(searchStore.query);
    searchStore.setActiveIndex(
      Math.max(0, Math.min(index, searchStore.searchedDocs.length - 1)),
    );
  };

  // 元函数：按当前排序重新拉取列表，默认当前页（供增删改后刷新），只同步数据与光标、不挪页码
  const refreshSorted = async (page: number = sortStore.currentPage) => {
    await sortStore.getSortedDocs(sortStore.docSort, page);
    sortStore.activateFirst();
  };

  const refreshAll = async () => {
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  return {
    openDoc,
    createRichtext,
    createMindmap,
    createFlowchart,
    remove,
    refreshSearched,
    refreshSorted,
    refreshAll,
  };
};
