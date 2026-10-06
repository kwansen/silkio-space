<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
import { DocTabIcon, DocTabIconKey, docTabIcons } from "@/icons";
import { useDocTabStore } from "@/stores/docTab";

interface Item {
  name: DocTabIconKey;
  icon: DocTabIcon;
}

const List: Item[] = [
  { name: "docSort", icon: docTabIcons.docSort },
  { name: "docSearch", icon: docTabIcons.docSearch },
  { name: "archiveSort", icon: docTabIcons.archiveSort },
  { name: "archiveSearch", icon: docTabIcons.archiveSearch },
];

const store = useDocTabStore();
const { setTab } = store;

const getClass = (v: DocTabIconKey) => {
  return store.tab === v
    ? "bg-purple-200 text-neutral-700"
    : "hover:bg-gray-100 text-neutral-400";
};
</script>

<template>
  <div class="w-10 h-full">
    <SquareButton
      v-for="item in List"
      :class="getClass(item.name)"
      :icon="item.icon"
      icon-class="w-5 h-5"
      @click="setTab(item.name)" />
  </div>
</template>
