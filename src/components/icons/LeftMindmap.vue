<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path
      d="M15 4 L16 4 C17.105 4 18 4.895 18 6 L18 18 C18 19.105 17.105 20 16 20 L15 20"
      :style="st1"
    />
    <path d="M10 4.059 L2 4.059" :style="st2" />
    <path d="M10 20 L2 20" :style="st2" />
    <path d="M10 12 L2 12" :style="st2" />
    <path d="M20 12 L15 12" :style="st1" />
    <path
      d="M22 12 C22 11.448 21.552 11 21 11 C20.448 11 20 11.448 20 12 C20 12.552 20.448 13 21 13 C21.552 13 22 12.552 22 12 Z"
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
