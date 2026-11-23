<script setup lang="ts">
// 注意：本组件依赖 tauri.conf.json 中的 CSP 配置，改动 CSP 前必读！
//
// OverlayScrollbars 初始化时会动态注入一个内联 <style> 探针，
// 检测"当前浏览器能否隐藏原生滚动条"（scrollbar-width: none 是否生效）。
// 如果 CSP 没有放行 style-src 'unsafe-inline'，该探针会被拦截，
// OS 会误判为"无法隐藏原生滚动条"，把自定义滚动条降级为 os-theme-none
// （display:none 隐藏），滚动条退化为系统原生样式。
// 症状：dev 模式正常（Tauri 默认只在 release 构建注入 CSP），
//       安装版滚动条变回原生样式。修复见 tauri.conf.json 的 csp 字段。
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useTemplateRef } from "vue";
defineOptions({
  inheritAttrs: false, // 关闭自动继承，手动控制
});

const osRef =
  useTemplateRef<InstanceType<typeof OverlayScrollbarsComponent>>("osRef");

defineExpose({
  osInstance: () => osRef.value?.osInstance() ?? null,
});
</script>

<template>
  <OverlayScrollbarsComponent
    ref="osRef"
    v-bind="$attrs"
    :class="['w-full', 'h-full', $attrs.class]"
  >
    <slot />
  </OverlayScrollbarsComponent>
</template>
