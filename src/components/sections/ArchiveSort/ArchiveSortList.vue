<script setup lang="ts">
import Folder from "@/components/icons/Folder.vue";
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { storeToRefs } from "pinia";
import draggable from "vuedraggable";

const store = useArchiveSortStore();
const { archives } = storeToRefs(store);
</script>

<template>
  <div>
    <draggable :list="archives" ghost-class="ghost">
      <template #item="{ element }">
        <ArchiveItem
          :item-key="element.id"
          :name="element.name"
          :icon="Folder"
        />
      </template>
    </draggable>
  </div>
</template>
