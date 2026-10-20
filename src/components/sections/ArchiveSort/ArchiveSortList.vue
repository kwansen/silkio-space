<script setup lang="ts">
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useFdSvc } from "@/services/folder";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import draggable from "vuedraggable";

const store = useArchiveSortStore();
const svc = useFdSvc();
const uiStore = useUiStore();
const { currentArchiveSort: sort } = storeToRefs(uiStore);
const dragEnd = () => {
  const ids = store.sortedArchives.map((a) => a.id);
  svc.reorderFolders(ids);
};

// 正在重命名的 archive id,null 表示没有;编辑时禁用拖拽
const editingKey = ref<string>("");
</script>

<template>
  <div>
    <draggable
      :list="store.sortedArchives"
      item-key="id"
      ghost-class="ghost"
      :disabled="sort !== 'manual' || editingKey"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <ArchiveItem
          :item-key="element.id"
          :name="element.name"
          :editing="editingKey === element.id"
          @update:editing="(v) => (editingKey = v ? element.id : '')"
          :meta="
            sort === 'viewedAt'
              ? new Date(element.viewed_at).toLocaleString()
              : ''
          "
        />
      </template>
    </draggable>
  </div>
</template>
