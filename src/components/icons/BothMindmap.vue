<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path d="M7 12 L10 12" :style="st1" />
    <path d="M14 6 L14 18" :style="st1" />
    <path d="M16 4 C14.895 4 14 4.895 14 6" :style="st1" />
    <path d="M16 20 C14.895 20 14 19.105 14 18" :style="st1" />
    <path d="M2 4 L4 4" :style="st2" />
    <path d="M2 20 L4 20" :style="st2" />
    <path d="M2 12 L4 12" :style="st2" />
    <path d="M10 6 L10 18" :style="st1" />
    <path d="M8 4 C9.105 4 10 4.895 10 6" :style="st1" />
    <path d="M8 20 C9.105 20 10 19.105 10 18" :style="st1" />
    <path d="M20 4 L22 4" :style="st2" />
    <path d="M20 20 L22 20" :style="st2" />
    <path d="M20 12 L22 12" :style="st2" />
    <path d="M14 12 L17 12" :style="st1" />
    <path d="M11 12 L13 12" :style="st3" />
    <path d="M7 4 L8 4" :style="st1" />
    <path d="M7 20 L8 20" :style="st1" />
    <path d="M16 20 L17 20" :style="st1" />
    <path d="M16 4 L17 4" :style="st1" />
  </svg>
</template>

<script setup>
const st1 = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
};

const st2 = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  opacity: 0.5,
};

const st3 = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
};
</script>
