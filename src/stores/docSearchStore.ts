import { useDocSvc } from "@/services/document";
import { ScoredDoc } from "@/types/doc";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useDocSearchStore = defineStore("docSearch", () => {
  const svc = useDocSvc();

  // ---- 权威状态：以 id 为唯一数据源 ----
  const activeId = ref<string | null>(null);
  const pageSize = ref(10);
  const query = ref<string>();
  const searchedDocs = ref<ScoredDoc[]>([]);

  // ---- 派生状态 ----
  // activeId 在列表中的位置（找不到为 -1）
  const activeIndex = computed(() => {
    if (activeId.value == null) return -1;
    return searchedDocs.value.findIndex((d) => d.id === activeId.value);
  });

  const totalPages = computed(() =>
    Math.ceil(searchedDocs.value.length / pageSize.value),
  );

  const currentPage = computed(() => {
    if (activeIndex.value < 0) return 1;
    return Math.floor(activeIndex.value / pageSize.value) + 1;
  });

  const docsThisPage = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return searchedDocs.value.slice(start, end);
  });

  // ---- 写操作 ----
  const setActiveId = (id: string | null) => {
    activeId.value = id;
  };

  // 基于下标的写入接口：内部转换为 id，保证落库的是稳定标识
  const setActiveIndex = (idx: number) => {
    const doc = searchedDocs.value[idx];
    activeId.value = doc?.id ?? null;
  };

  // 键盘相对移动：用 index 计算中间结果，落库写 id
  const moveActive = (delta: number) => {
    if (searchedDocs.value.length === 0) return;
    const base = activeIndex.value < 0 ? 0 : activeIndex.value;
    const next = Math.min(
      Math.max(base + delta, 0),
      searchedDocs.value.length - 1,
    );
    activeId.value = searchedDocs.value[next].id;
  };

  const setPageSize = (v: number) => {
    if (v <= 0) return;
    pageSize.value = v;
    // 页大小变化后，保持当前选中项所在的页，activeId 不变即可
  };

  const setQuery = (v: string) => {
    query.value = v;
  };

  // 设置列表并对账：若当前 activeId 已不在新列表中，则重定位
  const setDocs = (v: ScoredDoc[]) => {
    searchedDocs.value = v;
    if (activeId.value != null && !v.some((d) => d.id === activeId.value)) {
      activeId.value = v[0]?.id ?? null;
    }
  };

  const goToPage = (v: number) => {
    if (pageSize.value <= 0) return;
    const total = totalPages.value;
    if (total <= 0) return;
    const page = Math.min(Math.max(v, 1), total);
    const start = (page - 1) * pageSize.value;
    activeId.value = searchedDocs.value[start]?.id ?? null;
  };

  const searchDocs = async (q: string) => {
    setQuery(q);
    const results = await svc.search(q);
    setDocs(results);
    goToPage(1);
  };

  const removeDoc = (id: string) => {
    const idx = searchedDocs.value.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const wasActive = activeId.value === id;
    searchedDocs.value.splice(idx, 1);
    if (wasActive) {
      // 优先选中原位置的后一项，其次前一项
      activeId.value =
        searchedDocs.value[idx]?.id ?? searchedDocs.value[idx - 1]?.id ?? null;
    }
  };

  const prevPage = async () => {
    const page = currentPage.value;
    if (page > 1) {
      goToPage(page - 1);
    }
  };

  const nextPage = async () => {
    const c = currentPage.value;
    if (c < totalPages.value) {
      goToPage(c + 1);
    }
  };

  const activatePrev = () => {
    const i = activeIndex.value;
    if (i > 0) {
      setActiveIndex(i - 1);
    }
  };

  const activateNext = () => {
    const count = activeIndex.value + 1;
    if (count < searchedDocs.value.length) {
      setActiveIndex(count);
    }
  };

  return {
    // 状态
    activeId,
    pageSize,
    query,
    searchedDocs,
    // 派生
    activeIndex,
    totalPages,
    currentPage,
    docsThisPage,
    // 写操作
    setActiveId,
    setActiveIndex,
    moveActive,
    setPageSize,
    setQuery,
    setDocs,
    goToPage,
    searchDocs,
    removeDoc,
    prevPage,
    nextPage,
    activatePrev,
    activateNext,
  };
});
