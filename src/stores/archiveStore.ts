import { useFdSvc } from "@/services/folder";
import { Archive } from "@/types/archive";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useArchiveStore = defineStore("archiveSort", () => {
  const svc = useFdSvc();

  const archiveSort = ref<ArchiveSortOption>("manual");
  const setArchiveSort = (v: ArchiveSortOption) => {
    archiveSort.value = v;
  };

  const sortedArchives = ref<Archive[]>([]);

  // 元函数：按排序选项拉取归档列表并落状态（manual 不排序，viewedAt 按最近打开，其余按名称）
  const getSortedArchives = async (v: ArchiveSortOption) => {
    const results = await svc.getArchives();
    if (v === "viewedAt") {
      results.sort((a, b) => {
        if (a.viewed_at === null && b.viewed_at === null) return 0;
        if (a.viewed_at === null) return 1;
        if (b.viewed_at === null) return -1;
        return b.viewed_at - a.viewed_at;
      });
    } else if (v !== "manual") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    sortedArchives.value = results;
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
    archiveSort,
    setArchiveSort,
    sortedArchives,
    getSortedArchives,
    searchedArchives,
    query,
    setQuery,
    show,
    setShow,
  };
});
