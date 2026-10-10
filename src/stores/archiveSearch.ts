import { defineStore } from "pinia";
import { ref } from "vue";
import type { Folder } from "@/infrastructure/db/folder.ts";

export const useArchiveSearchStore = defineStore("archiveSearch", () => {
  const query = ref("");
  const archives = ref<Folder[]>([]);
  const setQuery = (v: string) => {
    query.value = v;
  };
  const setArchives = (v: Folder[]) => {
    archives.value = v;
  };
  return {
    query,
    archives,
    setQuery,
    setArchives,
  };
});
