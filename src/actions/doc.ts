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
  };

  // 元函数：创建富文本后刷新列表（排序保持当前页，搜索按最后关键词重查）
  const createRichtext = async () => {
    try {
      await svc.create({ doc_type: "richText" });
      await Promise.all([refreshSorted(), refreshSearched()]);
    } catch (e) {
      console.error(e);
    }
  };

  return { openDoc, createRichtext };
};
