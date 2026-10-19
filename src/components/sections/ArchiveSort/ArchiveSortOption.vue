<script setup lang="ts">
import { useArchiveSortAction } from "@/actions/archiveSort";
import Add from "@/components/icons/Add.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const store = useUiStore();
const { currentArchiveSort: sort } = storeToRefs(store);
const { setArchiveSort } = store;
const action = useArchiveSortAction();

const list: { key: ArchiveSortOption; show: string }[] = [
  { key: "manual", show: "手动排序" },
  { key: "name", show: "名称排序" },
  { key: "viewedAt", show: "最近打开" },
];

const handleClick = (option: ArchiveSortOption) => {
  setArchiveSort(option);
  action.getSortedArchives(option);
};

const archiveSortStore = useArchiveSortStore();
const { setShow } = archiveSortStore;
</script>

<template>
  <div
    class="flex items-center py-2 gap-4 border-b border-purple-300 sticky top-0 z-10 bg-white"
  >
    <div v-for="i in list" class="select-none" @click="handleClick(i.key)">
      <span :class="i.key === sort ? 'text-purple-700' : ''">
        {{ i.show }}
      </span>
      <div
        class="w-full h-1 rounded-full"
        :class="i.key === sort ? 'bg-purple-200' : ''"
      />
    </div>

    <div class="flex-1"></div>
    <div
      ref="target"
      id="addArchiveBtn"
      @click="setShow(true)"
      class="w-7 h-7 grid place-items-center rounded-md hover:bg-gray-200"
    >
      <Add />
    </div>
  </div>
</template>
