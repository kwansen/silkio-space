import { ScoredDoc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSearchStore = defineStore("docSearch", () => {
  const query = ref<string>();
  const setQuery = (v: string) => {
    query.value = v;
  };
  const searchedDocs = ref<ScoredDoc[]>([]);
  const setDocs = (v: ScoredDoc[]) => {
    searchedDocs.value = v;
  };
  const totalPages = computed(() => Math.ceil(searchedDocs.value.length / 10));
  const currentPage = ref<number>(1);
  const setPage = (v: number) => {
    currentPage.value = v;
  };
  const docsThisPage = computed(() => {
    const start = (currentPage.value - 1) * 10;
    const end = start + 10;
    return searchedDocs.value.slice(start, end);
  });
  return {
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
