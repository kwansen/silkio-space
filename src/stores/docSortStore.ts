import { Doc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSortStore = defineStore("docSort", () => {
  const sortedDocs = ref<Doc[]>([]);
  const setDocs = (v: Doc[]) => {
    sortedDocs.value = v;
  };
  const total = ref<number>(0);
  const setTotal = (v: number) => {
    total.value = v;
  };
  const totalPages = computed(() => Math.ceil(total.value / 10));
  const currentPage = ref<number>(1);
  const setPage = (v: number) => {
    currentPage.value = v;
  };
  return {
    sortedDocs,
    setDocs,
    total,
    setTotal,
    totalPages,
    currentPage,
    setPage,
  };
});
