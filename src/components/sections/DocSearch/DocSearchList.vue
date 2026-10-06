<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { ref } from "vue";
const list = ref<Item[]>([{ key: 1, title: "测试", content: "内容" }]);
const popoverList = ref<PopoverItem[]>([
  {
    icon: "mdi:file-outline",
    name: "xxx",
    action: () => console.log("xxx"),
  },
]);
</script>

<template>
  <DocList :list="list" :popover-list="popoverList" />
</template>
