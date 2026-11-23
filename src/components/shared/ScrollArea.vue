<script setup lang="ts">
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useTemplateRef, onMounted } from "vue";
import { info, debug } from "@tauri-apps/plugin-log";

defineOptions({
  inheritAttrs: false, // 关闭自动继承，手动控制
});

const osRef = useTemplateRef<InstanceType<typeof OverlayScrollbarsComponent>>("osRef");

defineExpose({
  osInstance: () => osRef.value?.osInstance() ?? null,
});

// 诊断日志：安装版滚动条失效排查（dev 正常、安装版不生效）
onMounted(async () => {
  debug(
    `[ScrollArea] mounted | readyState=${document.readyState} | idleCallback=${typeof window.requestIdleCallback}`,
  );
  // 初始化后 1.5s 检查实例状态（defer 移除后应为同步初始化，正常应非 null）
  await new Promise((r) => setTimeout(r, 1500));
  const os = osRef.value?.osInstance() ?? null;
  const el = osRef.value?.getElement?.() ?? undefined;
  const state = el?.getAttribute("data-overlayscrollbars");
  const rect = el?.getBoundingClientRect();
  if (os) {
    info(`[ScrollArea] initialized OK | os-state=${state} | size=${rect?.width}x${rect?.height}`);
  } else {
    info(`[ScrollArea] NOT initialized | os-state=${state} | size=${rect?.width}x${rect?.height}`);
  }
});
</script>

<template>
  <OverlayScrollbarsComponent
    ref="osRef"
    v-bind="$attrs"
    :class="['w-full', 'h-full', $attrs.class]"
    @os-initialized="debug('[ScrollArea] os-initialized event fired')"
    @os-updated="debug('[ScrollArea] os-updated event fired')"
  >
    <slot />
  </OverlayScrollbarsComponent>
</template>
