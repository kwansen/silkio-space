import { useDocSvc } from "@/services/document.ts";
import { useSortDocStore } from "@/stores/sortDoc";

// useSortDocs.ts: 排序文档组合式函数，提供按排序方式刷新列表等业务能力
// 元函数：获取文档服务单例（模块顶层允许 await，内部已同步维护搜索索引）
const docSvc = await useDocSvc();

export const useSortDocs = () => {
  const sortDocStore = useSortDocStore();

  // 元函数：按当前排序方式刷新文档列表与总数
  // 可选传入目标页码：数据返回后将页码、列表、总数一次性更新，避免分页按钮闪烁
  const refreshDocs = async (page?: number) => {
    const targetPage = page ?? sortDocStore.currentPage;
    const { list, total } = await docSvc.getSortedInPage(
      sortDocStore.sortField,
      targetPage,
    );
    sortDocStore.setCurrentPage(targetPage);
    sortDocStore.setDocs(list);
    sortDocStore.setTotal(total);
  };

  // 元函数：更新文档浏览时间
  const touchDoc = (id: string) => docSvc.update(id, { viewed_at: Date.now() });

  return { refreshDocs, touchDoc };
};
