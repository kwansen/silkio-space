<script setup lang="ts">
import Plus from "@/components/icons/Plus.vue";
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
      class="size-8 cursor-pointer grid place-items-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    >
      <Plus class="size-5" />
    </div>
  </div>
</template>
