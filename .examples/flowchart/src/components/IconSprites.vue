<template>
  <!-- 图标精灵：工具条 / 菜单 / 侧边栏共用同一套线性图标 -->
  <svg class="absolute h-0 w-0 overflow-hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <symbol id="i-flow" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M10 6.5h4a3 3 0 0 1 3 3v4.5" />
    </symbol>
    <!-- 文档切换器：列表 / 新建 / 展开 / 关闭 -->
    <symbol id="i-file" viewBox="0 0 24 24">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
    </symbol>
    <symbol id="i-plus" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </symbol>
    <symbol id="i-pen" viewBox="0 0 24 24">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </symbol>
    <symbol id="i-chevron-down" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </symbol>
    <symbol id="i-close" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </symbol>
    <symbol id="i-undo" viewBox="0 0 24 24">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </symbol>
    <symbol id="i-redo" viewBox="0 0 24 24">
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </symbol>
    <symbol id="i-plus-box" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </symbol>
    <symbol id="i-swap" viewBox="0 0 24 24">
      <polyline points="16 3 20 7 16 11" />
      <line x1="20" y1="7" x2="5" y2="7" />
      <polyline points="8 13 4 17 8 21" />
      <line x1="4" y1="17" x2="19" y2="17" />
    </symbol>
    <symbol id="i-copy" viewBox="0 0 24 24">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </symbol>
    <symbol id="i-paste" viewBox="0 0 24 24">
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </symbol>
    <symbol id="i-trash" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </symbol>
    <symbol id="i-fit" viewBox="0 0 24 24">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </symbol>
    <symbol id="i-center" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </symbol>
    <symbol id="i-export" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </symbol>
    <symbol id="i-sparkles" viewBox="0 0 24 24">
      <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
      <path d="M18.5 15.5l0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8z" />
      <path d="M5 15l0.6 1.7L7.3 17.3l-1.7 0.6L5 19.6l-0.6-1.7-1.7-0.6 1.7-0.6z" />
    </symbol>
    <symbol id="i-settings" viewBox="0 0 24 24">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </symbol>
    <symbol id="i-chevron-right" viewBox="0 0 24 24">
      <polyline points="9 6 15 12 9 18" />
    </symbol>
    <symbol id="i-arrow-up" viewBox="0 0 24 24">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </symbol>
    <symbol id="i-stop" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
    </symbol>

    <!-- 形状预览：添加节点 / 替换形状菜单共用。
         按节点真实默认尺寸 160×99（radius 8、斜切 30%/15% 等几何参数）等比绘制，
         与画布上的实际形状保持同一长宽比例与轮廓；描边用 non-scaling-stroke 锁定 1px -->
    <symbol id="s-rect" viewBox="0 0 160 99">
      <rect x="3" y="3" width="154" height="93" rx="8" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-diamond" viewBox="0 0 160 99">
      <path d="M80 3 157 49.5 80 96 3 49.5Z" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-ellipse" viewBox="0 0 160 99">
      <ellipse cx="80" cy="49.5" rx="77" ry="46.5" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-parallelogram" viewBox="0 0 160 99">
      <path d="M31 3h126l-28 93H3z" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-hexagon" viewBox="0 0 160 99">
      <path d="M26 3h105l26 46.5-26 46.5H26L3 49.5z" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-database" viewBox="0 0 160 99">
      <ellipse cx="80" cy="17" rx="77" ry="14" vector-effect="non-scaling-stroke" />
      <path d="M3 17v62c0 7.7 34.5 14 77 14s77-6.3 77-14V17" vector-effect="non-scaling-stroke" />
      <path d="M3 48.5c0 7.7 34.5 14 77 14s77-6.3 77-14" vector-effect="non-scaling-stroke" />
    </symbol>
    <symbol id="s-note" viewBox="0 0 160 99">
      <path d="M3 3h137l17 17v76H3z" vector-effect="non-scaling-stroke" />
      <path d="M140 3v17h17" vector-effect="non-scaling-stroke" />
    </symbol>
  </svg>
</template>
