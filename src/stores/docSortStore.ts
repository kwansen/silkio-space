import { useDocSvc } from "@/services/document";
import { Doc, SortField } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

const PAGE_SIZE = 10;

const SORT_MAP: Record<DocSortOption, SortField> = {
  viewedAt: "viewed_at",
  updatedAt: "updated_at",
  createdAt: "created_at",
  wordCount: "word_count",
};

function toBackendSort(sort: DocSortOption): SortField {
  return SORT_MAP[sort];
}

export const useDocSortStore = defineStore("docSort", () => {
  const svc = useDocSvc();

  const docSort = ref<DocSortOption>("viewedAt");
  const setDocSort = (v: DocSortOption) => {
    docSort.value = v;
  };

  const activeId = ref<string>();
  const setActiveId = (v: string | undefined) => {
    activeId.value = v;
  };
  const sortedDocs = ref<Doc[]>([]);
  const loaded = ref(false); // 首次拉取完成前不渲染空态，避免初始化闪烁
  const activeIndex = computed(() =>
    sortedDocs.value.findIndex((item) => item.id === activeId.value),
  );
  const total = ref<number>(0);
  const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE));
  const currentPage = ref<number>(1);

  // 元函数：激活首条（空页时保持现状）
  const activateFirst = () => {
    const first = sortedDocs.value[0];
    if (first) setActiveId(first.id);
  };

  // 元函数：按排序选项与页码拉取列表并落状态（页码与光标由调用方决定如何同步）
  const getSortedDocs = async (option: DocSortOption, page: number) => {
    const result = await svc.getSortedInPage(toBackendSort(option), page);
    sortedDocs.value = result.list;
    total.value = result.total;
    loaded.value = true;
  };

  // 元函数：跳转页码（拉数据 + 同步页码 + 激活首条）
  const goToSortedPage = async (page: number) => {
    await getSortedDocs(docSort.value, page);
    currentPage.value = page;
    activateFirst();
  };

  const goSortedPrev = async () => {
    if (currentPage.value <= 1) return; // 首页无上一页
    await goToSortedPage(currentPage.value - 1);
  };

  const goSortedNext = async () => {
    if (currentPage.value >= totalPages.value) return; // 末页无下一页
    await goToSortedPage(currentPage.value + 1);
  };

  // 元函数：光标上移；页首且非第一页时跨页（先拉上一页数据，再回退页码并激活末条）
  const activateSortedPrev = async () => {
    const index = activeIndex.value;
    if (index > 0) {
      setActiveId(sortedDocs.value[index - 1].id);
      return;
    }
    if (currentPage.value <= 1) return; // 首页无上一页
    await getSortedDocs(docSort.value, currentPage.value - 1);
    currentPage.value -= 1;
    const last = sortedDocs.value[sortedDocs.value.length - 1];
    if (last) setActiveId(last.id);
  };

  // 元函数：光标下移；页尾且非末页时跨页（先拉下一页数据，再前进页码并激活首条）
  const activateSortedNext = async () => {
    const index = activeIndex.value;
    if (index < sortedDocs.value.length - 1) {
      setActiveId(sortedDocs.value[index + 1].id);
      return;
    }
    if (currentPage.value >= totalPages.value) return; // 末页无下一页
    await getSortedDocs(docSort.value, currentPage.value + 1);
    currentPage.value += 1;
    activateFirst();
  };

  return {
    docSort,
    setDocSort,
    activeId,
    setActiveId,
    sortedDocs,
    loaded,
    activeIndex,
    total,
    totalPages,
    currentPage,
    activateFirst,
    getSortedDocs,
    goToSortedPage,
    goSortedPrev,
    goSortedNext,
    activateSortedPrev,
    activateSortedNext,
  };
});
