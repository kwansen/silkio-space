<script setup lang="ts">
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
</script>
<template>
  <OverlayScrollbarsComponent defer class="w-full h-full">
    <slot />
  </OverlayScrollbarsComponent>
</template>
