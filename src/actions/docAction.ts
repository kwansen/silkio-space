import { useDocSvc } from "@/services/document";
import {
  notifyArchiveChanged,
  notifyDocChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";

import { useDocSearchStore } from "@/stores/docSearchStore";
import { useDocSortStore } from "@/stores/docSortStore";
import type { DocType } from "@/types/doc";
import { typedDocDefaults } from "@/utils/docDefaults";

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

  // 创建富文本：只落库并通知 editor 打开，不在此广播 doc:changed——
  // 与 openDoc 同一策略，main 的刷新由 editor 就绪显示后补发，避免先刷新闪烁
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  // 新建指定类型文档的通用流程：落库（含类型默认标题/内容）→ 打开 editor 窗口；
  // 不广播 doc:changed（同 openDoc），main 的刷新由 editor 就绪显示后补发
  const createTyped = async (doc_type: DocType) => {
    try {
      const id = await svc.create({
        doc_type,
        ...typedDocDefaults(doc_type),
      });
      await notifyEditorOpen("doc", id);
    } catch (e) {
      console.error(e);
    }
  };

  const createMindmap = () => createTyped("mindMap");
  const createFlowchart = () => createTyped("flowChart");

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
    createTyped,
    createRichtext,
    createMindmap,
    createFlowchart,
    remove,
    refreshSearched,
    refreshSorted,
    refreshAll,
  };
};
