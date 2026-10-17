<script setup lang="ts">
import AddImage from "@/components/icons/AddImage.vue";
import Close from "@/components/icons/Close.vue";
import { ref, shallowRef } from "vue";
import { useTemplateRef } from "vue";
import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { Editor } from "@tiptap/vue-3";
import { useUiStore } from "@/stores/uiStore";

interface Props {
  editor: Editor | undefined;
}
const props = defineProps<Props>();

const uploader = useTemplateRef("uploader");

const data = shallowRef<Uint8Array | null>(null);
const fileName = ref<string>("");
const previewUrl = ref<string | null>(null);

const { setRichtextDialog } = useUiStore();

const handleClick = () => {
  uploader.value?.click();
};

const change = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  data.value = new Uint8Array(arrayBuffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  fileName.value = hash + "." + ext;
  const reader = new FileReader();
  reader.onload = () => {
    previewUrl.value = reader.result as string;
  };
  reader.readAsDataURL(file);
};

const close = () => {
  setRichtextDialog("");
};

const handleConfirm = async () => {
  const bytes = data.value;
  if (!bytes) return;

  // 写入：用枚举作为 baseDir
  try {
    await writeFile(fileName.value, bytes, {
      baseDir: BaseDirectory.AppData,
    });
  } catch {
    console.error;
  }

  // 预览：用绝对路径字符串
  const baseDir = await appDataDir();
  const dir = await join(baseDir, fileName.value);
  console.log(dir);
  const url = convertFileSrc(dir);
  props.editor
    ?.chain()
    .setImage({ src: url, alt: "这是alt", title: "这是标题" })
    .run();

  close();
};

import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车提交
onKeyStroke("Enter", () => {
  handleConfirm();
});
</script>

<template>
  <input type="file" @change="change" accept="image/*" ref="uploader" hidden />
  <div class="relative">
    <div
      class="relative aspect-3/2 overflow-hidden bg-gray-100 text-neutral-400 hover:text-neutral-700 cursor-pointer mt-6 rounded-md flex flex-col justify-center items-center"
      @click="handleClick"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        class="w-full h-full object-contain"
      />
      <div v-else class="text-center">
        <AddImage class="w-20 h-20" />
        <div>本地上传</div>
      </div>
      <div class="absolute inset-0 top-0 left-0 hover:bg-black/10"></div>
    </div>
    <div
      v-if="previewUrl"
      @click="previewUrl = ''"
      class="absolute w-5 h-5 text-white grid place-items-center bg-gray-300 hover:bg-red-300 rounded-full top-0 right-0 translate-x-1/2 -translate-y-1/2"
    >
      <Close />
    </div>
  </div>
  <div class="h-6"></div>
  <div class="flex justify-end">
    <button class="h-9 bg-gray-100 px-4 rounded-l-md" @click="close">
      取消
    </button>
    <button
      :disabled="!previewUrl"
      class="h-9 bg-purple-500 px-4 text-white rounded-r-md disabled:bg-purple-200 disabled:cursor-not-allowed"
      @click="handleConfirm"
    >
      确认
    </button>
  </div>
</template>
