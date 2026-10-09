/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// simple-mind-map 未提供类型声明，暂以 any 引入
declare module "simple-mind-map";
