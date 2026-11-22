<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path
      d="M21 10 L21 9 C21 7.895 20.105 7 19 7 L5 7 C3.895 7 3 7.895 3 9 L3 10"
      :style="st1"
    />
    <path d="M12 5 L12 10" :style="st1" />
    <path
      d="M12 3 C12.552 3 13 3.448 13 4 C13 4.552 12.552 5 12 5 C11.448 5 11 4.552 11 4 C11 3.448 11.448 3 12 3 Z"
      :style="st2"
    />
    <path d="M20 15.5 L22 15.5" :style="st3" />
    <path d="M11 15.5 L13 15.5" :style="st3" />
    <path d="M2 15.5 L4 15.5" :style="st3" />
    <path d="M20 21 L22 21" :style="st3" />
    <path d="M11 21 L13 21" :style="st3" />
    <path d="M2 21 L4 21" :style="st3" />
  </svg>
</template>

<script setup>
// st1：折线主体 + 短竖线，1.5 描边
const st1 = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
};

// st2：顶部小圆点，实心填充，2 描边
const st2 = {
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
};

// st3：底部 6 条短横线，半透明描边
const st3 = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  opacity: 0.5,
};
</script>
