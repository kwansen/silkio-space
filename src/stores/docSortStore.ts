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
  const currentPage = ref<number>(0);
  const setPage = (v: number) => {
    currentPage.value = v;
  };

  const prevDoc = () => {
    const prevIndex = activeIndex.value - 1;
    if (prevIndex >= 0) {
      setActiveId(sortedDocs.value[prevIndex].id);
    }
  };

  const nextDoc = () => {
    const nextIndex = activeIndex.value + 1;
    if (nextIndex < total.value) {
      setActiveId(sortedDocs.value[nextIndex].id);
    }
  };

  const prevPage = () => {
    const targetIndex =
      Math.floor(activeIndex.value / PAGE_SIZE) * PAGE_SIZE - 1;

    if (targetIndex >= 0) {
      setActiveId(sortedDocs.value[targetIndex].id);
    }
  };

  const nextPage = () => {
    const targetIndex =
      (Math.floor(activeIndex.value / PAGE_SIZE) + 1) * PAGE_SIZE;

    if (targetIndex < sortedDocs.value.length) {
      setActiveId(sortedDocs.value[targetIndex].id);
    }
  };

  const activateFirst = () => {
    setActiveId(sortedDocs.value[0].id);
  };

  return {
    activeId,
    setActiveId,
    sortedDocs,
    setDocs,
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
