<script setup lang="ts">
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useFdSvc } from "@/services/folder";
import { useArchiveStore } from "@/stores/archiveStore";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import draggable from "vuedraggable";

const store = useArchiveStore();
const svc = useFdSvc();
const uiStore = useUiStore();
const { archiveSort: sort } = storeToRefs(uiStore);
const dragEnd = () => {
  const ids = store.sortedArchives.map((a) => a.id);
  svc.reorderFolders(ids);
};

// 正在重命名的 archive id,null 表示没有;编辑时禁用拖拽
const editingKey = ref<string>("");

const dtf = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
</script>

<template>
  <div>
    <draggable
      :list="store.sortedArchives"
      item-key="id"
      :animation="200"
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
            sort === 'viewedAt' ? dtf.format(new Date(element.viewed_at)) : ''
          "
        />
      </template>
    </draggable>
  </div>
</template>
