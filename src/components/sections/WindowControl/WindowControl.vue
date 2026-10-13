<script setup lang="ts">
import MinimizeBtn from "./MinimizeBtn.vue";
import MaximizeBtn from "./MaximizeBtn.vue";
import CloseBtn from "./CloseBtn.vue";
</script>

<template>
  <div class="h-10 flex desktop-draggable">
    <div class="flex-1 flex items-center"></div>
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
