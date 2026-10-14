<script setup lang="ts">
import { Group } from "./type";

interface Prop {
  group: Group;
}

defineProps<Prop>();
</script>
<template>
  <div
    v-for="b in group.button"
    class="w-6.5 h-6.5 rounded-md grid place-items-center mx-0.5"
    :class="[
      b.active() ? 'bg-purple-200 text-purple-700' : 'hover:bg-gray-200',
      b.disabled() ? 'opacity-30' : '',
    ]"
    @click="b.action()"
  >
    <component :is="b.icon" class="w-5 h-5" />
  </div>
</template>
