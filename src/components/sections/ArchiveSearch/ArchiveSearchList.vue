<script setup lang="ts">
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useArchiveStore } from "@/stores/archiveStore";
import { ref } from "vue";

const store = useArchiveStore();

// 正在重命名的 archive id,null 表示没有;编辑时禁用拖拽
const editingKey = ref<string>("");

// 悬浮高亮提升到列表级（无拖拽，无需加锁）
const hoverId = ref<string>("");
</script>

<template>
  <div>
    <ArchiveItem
      v-for="a in store.searchedArchives"
      :key="a.id"
      :item-key="a.id"
      :name="a.name"
      :hovered="hoverId === a.id"
      :editing="editingKey === a.id"
      @mouseenter="hoverId = a.id"
      @mouseleave="hoverId = ''"
      @update:editing="(v) => (editingKey = v ? a.id : '')"
    />
  </div>
</template>
