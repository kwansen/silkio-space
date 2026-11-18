<script setup lang="ts">
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useTemplateRef } from "vue";

defineOptions({
  inheritAttrs: false, // 关闭自动继承，手动控制
});

const osRef = useTemplateRef<InstanceType<typeof OverlayScrollbarsComponent>>("osRef");

defineExpose({
  osInstance: () => osRef.value?.osInstance() ?? null,
});
</script>

<template>
  <OverlayScrollbarsComponent
    ref="osRef"
    defer
    v-bind="$attrs"
    :class="['w-full', 'h-full', $attrs.class]"
  >
    <slot />
  </OverlayScrollbarsComponent>
</template>