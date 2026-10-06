<script setup lang="ts">
import {
  App,
  BoundsEvent,
  PointerEvent,
  PropertyEvent,
  ResizeEvent,
  Text,
} from "leafer-ui";
import "@leafer-in/view";
import "@leafer-in/editor";
import "@leafer-in/text-editor";
import "@leafer-in/viewport";
import { onMounted, ref } from "vue";

const canvasRef = ref<HTMLElement | undefined>();

let app: App | null = null;

const createText = (x: number, y: number) => {
  const text = new Text({
    x: x,
    y: y,
    // 不设置宽度，默认跟随文字内容自动宽度
    text: "测试文本",
    // 文字颜色
    fill: "black",
    // 文字描边颜色
    // stroke: "black",
    fontSize: 14,
    padding: [10, 20],
    // 使得元素能够移动位置
    // draggable: true
    // 使得元素可以调整大小，旋转，修改文字内容和移动位置
    editable: true,
    boxStyle: {
      fill: "rgb(243, 244, 246)",
      stroke: "rgb(209, 213, 220)",
    },
    editConfig: {
      moveable: true,
      resizeable: false,
      rotateable: false,
    },
  });

  text.on(PointerEvent.TAP, () => {
    if (!app) return;
    app.editor.openInnerEditor(text, true);
  });
  return text;
};

onMounted(() => {
  app = new App({
    view: canvasRef.value,
    fill: "rgb(249, 250, 251)",
    editor: {
      moveable: true,
      rotateable: false,
      resizeable: false,
    },
  });

  const text = createText(100, 100);
  const text2 = createText(200, 100);

  app.tree.add([text, text2]);
});
</script>

<template>
  <div ref="canvasRef" class="w-full h-full"></div>
</template>
