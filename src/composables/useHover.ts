// useHover.ts
import { ref } from 'vue'

export const useHover = (options?: {
  onHover?: () => void
  onUnhover?: () => void
}) => {
  const isHover = ref(false)

  const hover = () => {
    isHover.value = true
    options?.onHover?.()
  }
  const unhover = () => {
    isHover.value = false
    options?.onUnhover?.()
  }

  return {
    isHover,
    hover,
    unhover,
    vHover: {
      mounted(el: HTMLElement) {
        el.addEventListener('mouseenter', hover)
        el.addEventListener('mouseleave', unhover)
      },
      unmounted(el: HTMLElement) {
        el.removeEventListener('mouseenter', hover)
        el.removeEventListener('mouseleave', unhover)
      }
    }
  }
}