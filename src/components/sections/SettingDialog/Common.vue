<script setup lang="ts">
import Switch from "@/components/shared/Switch.vue";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { onMounted, ref } from "vue";

const open = ref<boolean>(false);

onMounted(async () => {
  try {
    open.value = await isEnabled();
  } catch (e) {
    console.error(e);
  }
});

const toggle = async () => {
  const next = !open.value;
  try {
    if (next) {
      await enable();
    } else {
      await disable();
    }
    open.value = next;
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div class="flex items-center justify-between">
    <span>开机时自动启动</span>
    <Switch v-model="open" @on-click="toggle" />
  </div>
</template>
