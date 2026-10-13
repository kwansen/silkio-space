<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocSortEmpty from "@/components/sections/DocSort/DocSortEmpty.vue";
import DocSortList from "@/components/sections/DocSort/DocSortList.vue";
import DocSortOption from "@/components/sections/DocSort/DocSortOption.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import DocList from "@/components/shared/DocList.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-10 h-full">
      <DocTabs />
    </div>
    <div class="flex-1 pr-2 pb-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="py-14 w-full max-w-176 mx-auto h-1000">
          <div class="p-10 bg-white rounded-lg">
            <DocSort />
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
