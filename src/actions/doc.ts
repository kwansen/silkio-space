import { useDocSvc } from "@/services/document";
import { emitTo } from "@tauri-apps/api/event";
import { useDocSearchAction } from "./docSearch";
import { useDocSortAction } from "./docSort";

export const useDocAction = () => {
  const svc = useDocSvc();
  const { refresh: refreshSorted } = useDocSortAction();
  const { refresh: refreshSearched } = useDocSearchAction();

  const openDoc = async (id: string) => {
    await emitTo("editor", "open", { type: "doc", id });
    await svc.update(id, { viewed_at: Date.now() });
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  // 元函数：创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      const id = await svc.create({ doc_type: "richText" });
      await Promise.all([refreshSorted(), refreshSearched()]);
      await emitTo("editor", "open", { type: "doc", id });
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    await svc.remove(id);
    await Promise.all([refreshSorted(), refreshSearched()]);
  };

  return { openDoc, createRichtext, remove };
};
