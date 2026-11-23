<script setup lang="ts">
import ExternalLink from "@/components/icons/ExternalLink.vue";
import SilkioSpace from "@/components/icons/SilkioSpace.vue";
import { getVersion, getTauriVersion } from "@tauri-apps/api/app";
import { onMounted, ref } from "vue";

const appVersion = ref("-");
const tauriVersion = ref("-");

onMounted(async () => {
  try {
    appVersion.value = await getVersion();
    tauriVersion.value = await getTauriVersion();
  } catch (e) {
    console.error(e);
  }
});

const list = [
  { name: "用户协议", link: "" },
  { name: "隐私条款", link: "" },
  { name: "开源软件声明", link: "" },
  { name: "帮助文档", link: "" },
  { name: "联系我们", link: "" },
  { name: "报告问题", link: "" },
];
</script>

<template>
  <div
    class="rounded-lg border border-gray-100 divide-y divide-gray-100 bg-white"
  >
    <div class="flex items-center px-4 py-2.5">
      <div class="size-10 bg-gray-200 grid place-items-center rounded-md mr-4">
        <SilkioSpace class="size-8" />
      </div>
      <div>
        <div class="text-sm mb-1">版本：{{ appVersion }}</div>
        <div class="text-xs text-neutral-400">已是最新</div>
      </div>
      <div class="flex-1"></div>
      <div class="px-4 py-2 bg-gray-100 rounded-md">检查并更新</div>
    </div>
    <div
      v-for="i in list"
      class="flex items-center justify-between px-4 py-2.5 cursor-pointer"
    >
      <span>{{ i.name }}</span>
      <ExternalLink class="size-5" />
    </div>
  </div>
</template>
