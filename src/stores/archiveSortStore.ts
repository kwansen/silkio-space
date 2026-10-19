import { Archive } from "@/types/archive";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useArchiveSortStore = defineStore("archiveSort", () => {
  const archives = ref<Archive[]>([]);
  const setArchives = (v: Archive[]) => {
    archives.value = v;
  };

  const show = ref<boolean>(false);
  const setShow = (v: boolean) => {
    show.value = v;
  };
  return { archives, setArchives, show, setShow };
});
