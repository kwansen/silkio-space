<script setup lang="ts"></script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <div v-for="i in 10" class="w-9 h-9 rounded-md hover:bg-gray-100 cursor-pointer grid place-items-center">{{ i }}</div>
  </div>
</template>
