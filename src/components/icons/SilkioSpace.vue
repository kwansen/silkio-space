<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path
      d="M21 0 L3 0 C1.343 0 0 1.343 0 3 L0 21 C0 22.657 1.343 24 3 24 L21 24 C22.657 24 24 22.657 24 21 L24 3 C24 1.343 22.657 0 21 0 Z"
      :fill="props.text"
    />
    <path
      d="M15.675 10.462 L13.837 7.279 L10.163 7.279 L8.325 10.462 L10.163 13.644 L11.939 16.721 L11.939 13.644 L11.939 11.379 C11.46 11.347 11.081 10.949 11.081 10.462 C11.081 9.955 11.492 9.544 11.999 9.543 L12 9.543 L12.001 9.543 C12.508 9.544 12.919 9.955 12.919 10.462 C12.919 10.949 12.54 11.347 12.061 11.379 L12.061 13.644 L12.061 16.721 L13.837 13.644 Z"
      :fill="props.bg"
    />
  </svg>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    bg?: string;
    text?: string;
  }>(),
  {
    bg: "#ffffff", // 默认白色背景
    text: "#000000", // 默认黑色文字
  },
);
</script>
