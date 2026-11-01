<script setup lang="ts">
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useFdSvc } from "@/services/folder";
import { useArchiveStore } from "@/stores/archiveStore";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import draggable from "vuedraggable";

const store = useArchiveStore();
const svc = useFdSvc();
const { archiveSort: sort } = storeToRefs(store);
const dragEnd = () => {
  locked.value = true;
  const ids = store.sortedArchives.map((a) => a.id);
  svc.reorderFolders(ids);
};

// 正在重命名的 archive id,null 表示没有;编辑时禁用拖拽
const editingKey = ref<string>("");

// 悬浮高亮与拖拽锁提升到列表级，item 保持纯展示。
// 拖拽锁：vuedraggable 拖拽结束会重排 DOM，鼠标未动却会对换位后的元素触发虚假
// mouseenter，误激活相邻项的悬浮高亮。dragend 时加锁，锁住期间的第一次
// mouseenter 仅解锁不激活，吞掉这次虚假事件
const locked = ref(false);
const hoverId = ref<string>("");

const handleEnter = (id: string) => {
  if (locked.value) {
    locked.value = false;
    return;
  }
  hoverId.value = id;
};

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
      class="space-y-1"
      ghost-class="ghost"
      :disabled="sort !== 'manual' || editingKey"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <ArchiveItem
          :item-key="element.id"
          :name="element.name"
          :hovered="hoverId === element.id"
          :editing="editingKey === element.id"
          @mouseenter="handleEnter(element.id)"
          @mouseleave="hoverId = ''"
          @update:editing="(v) => (editingKey = v ? element.id : '')"
          :meta="
            sort === 'viewedAt' ? dtf.format(new Date(element.viewed_at)) : ''
          "
        />
      </template>
    </draggable>
  </div>
</template>
