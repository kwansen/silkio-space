<script setup lang="ts">
import { FocusScope } from "@zhencai/vue-focus-scope";
import { useUiStore } from "@/stores/uiStore";
const { setShow } = useUiStore();
</script>
<template>
  <FocusScope
    class="w-screen h-screen bg-black/10 fixed grid place-items-center"
  >
    <div class="w-lg px-10 pt-10 pb-4 bg-white rounded-lg">
      <div class="w-full h-9 flex items-center gap-4">
        <div>名字</div>
        <input
          type="text"
          class="flex-1 h-9 rounded-md px-4 ring ring-gray-300 focus:ring-purple-300 outline-none"
        />
      </div>

      <div class="h-6"></div>
      <div class="w-full h-9 flex items-center gap-4">
        <div>链接</div>
        <input
          type="text"
          class="flex-1 h-9 rounded-md px-4 ring ring-gray-300 focus:ring-purple-300 outline-none"
        />
      </div>
      <div class="h-6"></div>
      <div class="flex justify-end">
        <button
          class="h-9 bg-gray-100 px-4 rounded-l-md"
          @click="setShow(false)"
        >
          取消
        </button>
        <button class="h-9 bg-purple-500 px-4 text-white rounded-r-md">
          确认
        </button>
      </div>
    </div>
  </FocusScope>
</template>
