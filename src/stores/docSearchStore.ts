import { ScoredDoc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSearchStore = defineStore("docSearch", () => {
  const activeIndex = ref<number>(0);
  const setActiveIndex = (v: number) => {
    activeIndex.value = v;
  };
  const pageSize = ref(10);
  const setPageSize = (v: number) => {
    pageSize.value = v;
  };
  const query = ref<string>();
  const setQuery = (v: string) => {
    query.value = v;
  };
  const searchedDocs = ref<ScoredDoc[]>([]);
  const setDocs = (v: ScoredDoc[]) => {
    searchedDocs.value = v;
  };
  const activeId = computed(() => {
    return searchedDocs.value[activeIndex.value]?.id;
  });
  const totalPages = computed(() =>
    Math.ceil(searchedDocs.value.length / pageSize.value),
  );
  const currentPage = computed(() => {
    return Math.floor(activeIndex.value / pageSize.value) + 1;
  });
  const setPage = (v: number) => {
    if (v < 1) v = 1;
    if (pageSize.value <= 0) return;
    activeIndex.value = (v - 1) * pageSize.value;
  };
  const docsThisPage = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return searchedDocs.value.slice(start, end);
  });
  return {
    activeIndex,
    activeId,
    setActiveIndex,
    pageSize,
    setPageSize,
    query,
    setQuery,
    searchedDocs,
    setDocs,
    totalPages,
    currentPage,
    setPage,
    docsThisPage,
  };
});
