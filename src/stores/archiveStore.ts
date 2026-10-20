import { Archive } from "@/types/archive";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useArchiveStore = defineStore("archiveSort", () => {
  const sortedArchives = ref<Archive[]>([]);
  const setSortedArchives = (v: Archive[]) => {
    sortedArchives.value = v;
  };

  const query = ref("");
  const setQuery = (v: string) => {
    query.value = v;
  };

  //   按名称检索归档：多个关键词用空白分隔，全部命中才保留（AND 语义），结果写入 searchedArchives
  const searchedArchives = computed(() => {
    if (!query.value.trim()) {
      return [];
    }
    const lower = query.value.toLowerCase();
    const textList = lower.trim().split(/\s+/).filter(Boolean);
    const data = sortedArchives.value.filter((a) => {
      const name = a.name.toLowerCase();
      return textList.every((t) => name.includes(t));
    });
    return data;
  });

  const show = ref<boolean>(false);
  const setShow = (v: boolean) => {
    show.value = v;
  };
  return {
    sortedArchives,
    setSortedArchives,
    searchedArchives,
    query,
    setQuery,
    show,
    setShow,
  };
});
