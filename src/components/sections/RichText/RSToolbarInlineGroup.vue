<script setup lang="ts">
import RSToolbarInlineGroupItem from "./RSToolbarInlineGroupItem.vue";
import { Group } from "./type";

interface Prop {
  group: Group;
}

defineProps<Prop>();
</script>
<template>
  <RSToolbarInlineGroupItem v-for="b in group.button" :b="b" />
</template>
