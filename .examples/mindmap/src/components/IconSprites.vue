<template>
  <!-- 图标精灵：工具条 / 文档切换器 / AI 侧边栏共用同一套线性图标。
       各 symbol 保留原独立组件的描边宽度（布局/连线示意 0.75、常规 1、发送 2），
       Stop 为填充型（fill currentColor、无描边），其余描边属性统一由 Icon 提供 -->
  <svg class="absolute h-0 w-0 overflow-hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <!-- 文档切换器：文档 / 下拉箭头 / 新建 -->
    <symbol id="i-file" viewBox="0 0 24 24" stroke-width="1">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </symbol>
    <symbol id="i-chevron-down" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="6 9 12 15 18 9" />
    </symbol>
    <symbol id="i-chevron-right" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="9 6 15 12 9 18" />
    </symbol>
    <symbol id="i-plus" viewBox="0 0 24 24" stroke-width="1">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </symbol>

    <!-- 工具条：撤销 / 重做 / 适应视图 / 居中 / 导出 -->
    <symbol id="i-undo" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </symbol>
    <symbol id="i-redo" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </symbol>
    <symbol id="i-fit" viewBox="0 0 24 24" stroke-width="1">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </symbol>
    <symbol id="i-center" viewBox="0 0 24 24" stroke-width="1">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </symbol>
    <!-- 折叠/展开菜单触发按钮：双 V 形指向中心（折叠方向的通用字形），
         只表达「折叠类操作」分组，不绑定具体动作 -->
    <symbol id="i-fold" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="7 4.5 12 9.5 17 4.5" />
      <polyline points="7 19.5 12 14.5 17 19.5" />
    </symbol>
    <!-- 折叠其他：左侧节点三条分支，中间分支保留（选中节点），上下分支折叠成点 -->
    <symbol id="i-collapse-others" viewBox="0 0 24 24" stroke-width="1">
     <polyline points="7 4.5 12 9.5 17 4.5" />
      <polyline points="7 19.5 12 14.5 17 19.5" />
    </symbol>
    <!-- 展开全部：双 V 形指向外侧，与 i-fold 的向内收形成方向对照 -->
    <symbol id="i-expand-all" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="7 9.5 12 4.5 17 9.5" />
      <polyline points="7 14.5 12 19.5 17 14.5" />
    </symbol>
    <symbol id="i-export" viewBox="0 0 24 24" stroke-width="1">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </symbol>

    <!-- 布局方向示意（描边 0.75：细线结构图） -->
    <symbol id="i-layout-right" viewBox="0 0 24 24" stroke-width="0.75">
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="18" cy="5" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
      <circle cx="18" cy="19" r="1.6" />
      <path d="M9.2 12H13M13 5v14M13 5h3.4M13 12h3.4M13 19h3.4" />
    </symbol>
    <symbol id="i-layout-left" viewBox="0 0 24 24" stroke-width="0.75">
      <circle cx="17" cy="12" r="2.2" />
      <circle cx="6" cy="5" r="1.6" />
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="6" cy="19" r="1.6" />
      <path d="M14.8 12H11M11 5v14M11 5H7.6M11 12H7.6M11 19H7.6" />
    </symbol>
    <symbol id="i-layout-both" viewBox="0 0 24 24" stroke-width="0.75">
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="5" cy="7" r="1.7" />
      <circle cx="5" cy="17" r="1.7" />
      <circle cx="19" cy="7" r="1.7" />
      <circle cx="19" cy="17" r="1.7" />
      <path d="M9.8 12H8M8 7v10M8 7H6.7M8 17H6.7M14.2 12H16M16 7v10M16 7h1.3M16 17h1.3" />
    </symbol>
    <symbol id="i-layout-down" viewBox="0 0 24 24" stroke-width="0.75">
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="15" r="1.7" />
      <circle cx="12" cy="15" r="1.7" />
      <circle cx="19" cy="15" r="1.7" />
      <path d="M12 6.5V10M5 10h14M5 10v3.3M12 10v3.3M19 10v3.3" />
    </symbol>

    <!-- 连线形状示意（描边 0.75，端点填充小圆） -->
    <symbol id="i-edge-bezier" viewBox="0 0 24 24" stroke-width="0.75">
      <path d="M5 18C11 18 13 6 19 6" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </symbol>
    <symbol id="i-edge-path" viewBox="0 0 24 24" stroke-width="0.75">
      <path d="M5 18h7V6h7" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </symbol>
    <symbol id="i-edge-rpath" viewBox="0 0 24 24" stroke-width="0.75">
      <path d="M5 18h7V9a3 3 0 0 1 3-3h4" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </symbol>

    <!-- AI 侧边栏：AI 图标 / 设置 / 发送（描边 2）/ 停止（填充） -->
    <symbol id="i-sparkles" viewBox="0 0 24 24" stroke-width="1">
      <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
      <path d="M18.5 15.5l0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8z" />
      <path d="M5 15l0.6 1.7L7.3 17.3l-1.7 0.6L5 19.6l-0.6-1.7-1.7-0.6 1.7-0.6z" />
    </symbol>
    <symbol id="i-settings" viewBox="0 0 24 24" stroke-width="1">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </symbol>
    <symbol id="i-arrow-up" viewBox="0 0 24 24" stroke-width="2">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </symbol>
    <symbol id="i-stop" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </symbol>

    <!-- 关闭 -->
    <symbol id="i-close" viewBox="0 0 24 24" stroke-width="1.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </symbol>

    <!-- 文档删除 -->
    <symbol id="i-trash" viewBox="0 0 24 24" stroke-width="1">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </symbol>
  </svg>
</template>
