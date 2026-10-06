<script setup lang="ts">
import SquareButton from "@/components/shared/SquareButton.vue";
</script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <div v-for="value in 10" class="w-10 h-10 hover:bg-gray-100"></div>
  </div>
</template>
