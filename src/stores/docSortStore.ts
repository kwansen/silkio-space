import { Doc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSortStore = defineStore("docSort", () => {
  const PAGE_SIZE = 10;
  const activeId = ref<string>();
  const setActiveId = (v: string | undefined) => {
    activeId.value = v;
  };
  const sortedDocs = ref<Doc[]>([]);
  const setDocs = (v: Doc[]) => {
    sortedDocs.value = v;
  };
  const activeIndex = computed(() =>
    sortedDocs.value.findIndex((item) => item.id === activeId.value),
  );
  const total = ref<number>(0);
  const setTotal = (v: number) => {
    total.value = v;
  };
  const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE));
  const currentPage = ref<number>(1);
  const setPage = (v: number) => {
    currentPage.value = v;
  };

  const prevDoc = () => {
    const prevIndex = activeIndex.value - 1;
    if (prevIndex >= 0) {
      // 同页内上移
      setActiveId(sortedDocs.value[prevIndex].id);
      return;
    }
    // 跨页：sortedDocs 已是上一页数据，回退页码并激活末条
    if (currentPage.value <= 1) return; // 首页无上一页
    setPage(currentPage.value - 1);
    const last = sortedDocs.value[sortedDocs.value.length - 1];
    if (last) setActiveId(last.id);
  };

  const nextDoc = () => {
    const nextIndex = activeIndex.value + 1;
    if (nextIndex < sortedDocs.value.length) {
      // 同页内下移
      setActiveId(sortedDocs.value[nextIndex].id);
      return;
    }
    // 跨页：sortedDocs 将变为下一页数据，前进页码并激活首条
    if (currentPage.value >= totalPages.value) return; // 末页无下一页
    setPage(currentPage.value + 1);
    const first = sortedDocs.value[0];
    if (first) setActiveId(first.id);
  };

  const prevPage = () => {
    if (currentPage.value <= 1) return; // 首页无上一页
    setPage(currentPage.value - 1);
    const first = sortedDocs.value[0];
    if (first) setActiveId(first.id);
  };

  const nextPage = () => {
    if (currentPage.value >= totalPages.value) return; // 末页无下一页
    setPage(currentPage.value + 1);
    const first = sortedDocs.value[0];
    if (first) setActiveId(first.id);
  };

  const activateFirst = () => {
    setActiveId(sortedDocs.value[0].id);
  };

  return {
    activeId,
    setActiveId,
    sortedDocs,
    setDocs,
    activeIndex,
    total,
    setTotal,
    totalPages,
    currentPage,
    prevDoc,
    nextDoc,
    prevPage,
    nextPage,
    activateFirst,
  };
});
