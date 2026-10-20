<script setup lang="ts">
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { ref } from "vue";

const store = useArchiveSortStore();

// 正在重命名的 archive id,null 表示没有;编辑时禁用拖拽
const editingKey = ref<string>("");
</script>

<template>
  <div>
    <ArchiveItem
      v-for="a in store.searchedArchives"
      :item-key="a.id"
      :name="a.name"
      :editing="editingKey === a.id"
      @update:editing="(v) => (editingKey = v ? a.id : '')"
    />
  </div>
</template>
