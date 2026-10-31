<script setup lang="ts">
import Add from "@/components/icons/Add.vue";
import { useArchiveStore } from "@/stores/archiveStore";
import { storeToRefs } from "pinia";

const archiveSortStore = useArchiveStore();
const { archiveSort: sort } = storeToRefs(archiveSortStore);
const { setArchiveSort, setShow } = archiveSortStore;

const list: { key: ArchiveSortOption; show: string }[] = [
  { key: "manual", show: "手动排序" },
  { key: "name", show: "名称排序" },
  { key: "viewedAt", show: "最近打开" },
];

const handleClick = (option: ArchiveSortOption) => {
  setArchiveSort(option);
  archiveSortStore.getSortedArchives(option);
};
</script>

<template>
  <div
    class="flex items-center h-16 px-5 gap-4 border-b border-purple-300 sticky top-0 z-10 bg-white"
  >
    <div
      v-for="i in list"
      class="select-none relative cursor-pointer"
      @click="handleClick(i.key)"
    >
      <span :class="i.key === sort ? 'text-purple-700' : ''">
        {{ i.show }}
      </span>
      <div
        class="absolute top-full w-full h-1 rounded-full"
        :class="i.key === sort ? 'bg-purple-200' : ''"
      />
    </div>

    <div class="flex-1"></div>
    <div
      ref="target"
      id="addArchiveBtn"
      @click="setShow(true)"
      class="w-7 h-7 bg-gray-100 cursor-pointer grid place-items-center rounded-md hover:bg-gray-200"
    >
      <Add />
    </div>
  </div>
</template>
