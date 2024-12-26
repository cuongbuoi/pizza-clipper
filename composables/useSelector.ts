import { MAIN_CONTENT_SCRIPT_TAG } from '@/constants/config'
import { getAbsoluteQuerySelector } from '@/utils/helpers'
import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

export function useSelector() {
  const selectorMode = ref(false)
  const selectorOverlay = ref<HTMLDivElement | null>(null)
  const selectorElement = ref<HTMLElement | null>(null)
  const customSelectorFunc = ref<((element: HTMLElement) => string) | null>(null)
  const onElementClickCallback = ref<((querySelector: string) => void) | null>(null)

  const toggleSelectorMode = (value: boolean) => {
    selectorMode.value = value
    document.body.style.cursor = value ? 'crosshair' : 'default'
    if (!value) {
      clearSelector()
    }
  }

  const clearSelector = () => {
    if (selectorOverlay.value) {
      selectorOverlay.value.style.display = 'none'
      selectorElement.value = null
    }
  }

  const setupSelectorOverlay = () => {
    if (!selectorOverlay.value) {
      selectorOverlay.value = document.createElement('div')
      document.body.appendChild(selectorOverlay.value)
      Object.assign(selectorOverlay.value.style, {
        position: 'absolute',
        border: '2px dashed rgba(255, 165, 0, 0.7)',
        pointerEvents: 'none',
        zIndex: '9999'
      })
    }
    toggleSelectorMode(true)
  }

  const onElementHover = (event: MouseEvent) => {
    if (!selectorMode.value) return

    const target = event.target as HTMLElement
    if (
      !target ||
      target === document.body ||
      target === document.documentElement ||
      selectorElement.value === target
    ) {
      return
    }

    selectorElement.value = target

    const rect = target.getBoundingClientRect()
    if (!selectorOverlay.value) {
      return
    }
    
    Object.assign(selectorOverlay.value.style, {
      display: 'block',
      top: `${rect.top + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    })
  }

  const onElementClick = async (event: MouseEvent) => {
    if (!selectorMode.value) {
      return
    }

    const target = event.target as HTMLElement
    if (!target || target === document.body || target.tagName === MAIN_CONTENT_SCRIPT_TAG) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const querySelector = customSelectorFunc.value ? customSelectorFunc.value(target) : getAbsoluteQuerySelector(target)
    if (querySelector) {
      await navigator.clipboard.writeText(querySelector)
      toggleSelectorMode(false)
      if (onElementClickCallback.value) {
        onElementClickCallback.value(querySelector)
      }
    }
  }

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && selectorMode.value) {
      toggleSelectorMode(false)
    }
  }

  useEventListener(document.body, 'mousemove', onElementHover, {
    capture: true,
    passive: false
  })
  useEventListener(document.body, 'click', onElementClick, {
    capture: true,
    passive: false
  })
  useEventListener(window, 'keydown', onKeyPress, {
    capture: true,
    passive: true
  })

  return {
    selectorMode,
    selectorOverlay,
    selectorElement,
    toggleSelectorMode,
    setupSelectorOverlay,
    clearSelector,
    onElementClick,
    setOnElementClickCallback: (callback: (querySelector: string) => void) => {
      onElementClickCallback.value = callback
    },
    setCustomSelectorFunc: (func: (element: HTMLElement) => string) => {
      customSelectorFunc.value = func
    }
  }
}
