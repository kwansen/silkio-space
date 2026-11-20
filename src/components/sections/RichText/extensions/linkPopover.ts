import { reactive } from "vue";

/**
 * 链接悬浮弹层的全局单例控制器。
 *
 * 所有链接 mark view 共享同一个弹层：链接自身只负责在 hover 时"上报"自己，
 * 唯一性由构造保证——弹层状态只有一份，任意时刻最多只有一个 target。
 */

export interface LinkPopoverTarget {
  /** 链接 <a> 元素，作为 floating-ui 的锚点 */
  anchor: HTMLElement;
  /** 链接地址 */
  href: string;
  /** 编辑链接（业务回调由各链接实例闭包提供，天然绑定正确的 editor 实例） */
  edit: () => void;
  /** 取消链接 */
  remove: () => void;
}

export const linkPopoverState = reactive<{ target: LinkPopoverTarget | null }>({
  target: null,
});

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function clearTimers() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
}

/** 链接 mouseenter 时调用 */
export function linkPopoverEnter(target: LinkPopoverTarget) {
  clearTimers();
  if (linkPopoverState.target) {
    // 已有弹层在显示（从一个链接划到另一个）：立即切换锚点，无延迟
    linkPopoverState.target = target;
    return;
  }
  // 首次悬浮：延迟显示，避免划过正文时闪现
  showTimer = setTimeout(() => {
    linkPopoverState.target = target;
  }, 200);
}

/** 链接/弹层 mouseleave 时调用 */
export function linkPopoverLeave() {
  clearTimers();
  hideTimer = setTimeout(() => {
    linkPopoverState.target = null;
  }, 300);
}
