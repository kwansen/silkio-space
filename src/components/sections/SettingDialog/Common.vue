<script setup lang="ts">
import Switch from "@/components/shared/Switch.vue";
import { ref } from "vue";
const open = ref<boolean>(false);
</script>

<template>
  <div class="flex items-center justify-between">
    <span>开机时自动启动</span>
    <Switch v-model="open" @on-click="open = !open" />
  </div>
</template>
