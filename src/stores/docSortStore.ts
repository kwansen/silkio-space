import { Doc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSortStore = defineStore("docSort", () => {
  const activeIndex = ref<number>(0);
  const setActiveIndex = (v: number) => {
    activeIndex.value = v;
  };
  const sortedDocs = ref<Doc[]>([]);
  const setDocs = (v: Doc[]) => {
    sortedDocs.value = v;
  };
  const total = ref<number>(0);
  const setTotal = (v: number) => {
    total.value = v;
  };
  const totalPages = computed(() => Math.ceil(total.value / 10));
  const currentPage = computed(() => {
    return Math.floor(activeIndex.value / 10) + 1;
  });
  return {
    activeIndex,
    setActiveIndex,
    sortedDocs,
    setDocs,
    total,
    setTotal,
    totalPages,
    currentPage,
  };
});
