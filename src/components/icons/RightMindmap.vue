<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 4 L8 4 C6.895 4 6 4.895 6 6 L6 18 C6 19.105 6.895 20 8 20 L9 20"
      :style="st1"
    />
    <path d="M14 4.059 L22 4.059" :style="st2" />
    <path d="M14 20 L22 20" :style="st2" />
    <path d="M14 12 L22 12" :style="st2" />
    <path d="M4 12 L9 12" :style="st1" />
    <path
      d="M2 12 C2 11.448 2.448 11 3 11 C3.552 11 4 11.448 4 12 C4 12.552 3.552 13 3 13 C2.448 13 2 12.552 2 12 Z"
      :style="st3"
    />
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
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
};
</script>
