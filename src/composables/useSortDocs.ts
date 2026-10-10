import { useDocSvc } from "@/services/document.ts";
import { useDocSortStore } from "@/stores/docSort";
import type { SortField } from "@/infrastructure/db/document.ts";

// useSortDocs.ts: 排序文档组合式函数，提供按排序方式刷新列表等业务能力
// 元函数：获取文档服务单例（模块顶层允许 await，内部已同步维护搜索索引）
const docSvc = await useDocSvc();

export const useSortDocs = () => {
  const docSortStore = useDocSortStore();

  // 元函数：按排序方式刷新文档列表与总数
  // 可选传入目标页码/排序字段：数据返回后将排序、页码、列表、总数一次性更新，避免闪烁
  const refreshDocs = async (options?: {
    page?: number;
    sortField?: SortField;
  }) => {
    const targetPage = options?.page ?? docSortStore.currentPage;
    const targetSortField = options?.sortField ?? docSortStore.sortField;
    const { list, total } = await docSvc.getSortedInPage(
      targetSortField,
      targetPage,
    );
    docSortStore.setSortField(targetSortField);
    docSortStore.setCurrentPage(targetPage);
    docSortStore.setDocs(list);
    docSortStore.setTotal(total);
  };

  // 元函数：更新文档浏览时间
  const touchDoc = (id: string) => docSvc.update(id, { viewed_at: Date.now() });

  // 元函数：删除文档并刷新列表（当前页删空时回退到上一页）
  const removeDoc = async (id: string) => {
    await docSvc.remove(id);
    await refreshDocs();
    if (docSortStore.docs.length === 0 && docSortStore.currentPage > 1) {
      await refreshDocs({ page: docSortStore.currentPage - 1 });
    }
  };

  return { refreshDocs, touchDoc, removeDoc };
};
