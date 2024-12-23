<script lang="ts" setup>
import { MAIN_CONTENT_SCRIPT_TAG } from '@/constants/config'
import { EVENTS } from '@/constants/event'
import { STORAGE_KEY } from '@/constants/storage'
import { type Message } from '@/types/global'
import { type HighlightData, type StorageHighlight } from '@/types/highlight'
import { getElementXPath, uuid, validateXPath } from '@/utils/helpers'
import { TrashIcon, XCircleIcon } from '@heroicons/vue/16/solid'
import { useEventListener } from '@vueuse/core'
import { storage } from '@wxt-dev/storage'
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'

const loading = ref<boolean>(false)
const highlightMode = ref<boolean>(false)
const highlightElement = ref<HTMLElement | null>(null)
const highlightOverlay = ref<HTMLDivElement | null>(null)
const highlightedElements = reactive<Set<string>>(new Set())

const toggleClipHighlight = (value: boolean) => {
  highlightMode.value = value
  document.body.style.cursor = value ? 'crosshair' : 'default'
  if (!value) {
    clearHighlight()
  }
}

const clearHighlight = () => {
  if (highlightOverlay.value) {
    highlightOverlay.value.style.display = 'none'
    highlightElement.value = null
  }
}

const setupHighlightOverlay = () => {
  if (!highlightOverlay.value) {
    highlightOverlay.value = document.createElement('div')
    document.body.appendChild(highlightOverlay.value)
    Object.assign(highlightOverlay.value.style, {
      position: 'absolute',
      border: '2px dashed rgba(255, 165, 0, 0.7)',
      pointerEvents: 'none',
      zIndex: '9999',
    })
  }
}

const onElementHover = (event: MouseEvent) => {
  if (!highlightMode.value) {
    return
  }
  const target = event.target as HTMLElement
  if (!target || target === document.body || target === document.documentElement || highlightElement.value === target) {
    return
  }

  highlightElement.value = target

  const rect = target.getBoundingClientRect()
  if (!highlightOverlay.value) {
    return
  }
  Object.assign(highlightOverlay.value.style, {
    display: 'block',
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  })
}

const highlightElementByXPath = (xpath: string) => {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
  const element = result.singleNodeValue as HTMLElement
  if (element) element.style.backgroundColor = 'yellow'
}

const loadHighlightedElements = async () => {
  const allHighlights: StorageHighlight = (await storage.getItem(STORAGE_KEY.HIGHLIGHTS)) || {}
  const url = window.location.href
  const storedElements = allHighlights[url]
  if (storedElements && Array.isArray(storedElements)) {
    storedElements.forEach((item) => {
      const xpath = item.xpath
      if (validateXPath(xpath)) {
        highlightedElements.add(xpath)
        highlightElementByXPath(xpath)
      }
    })
  }
  loading.value = false
}

const onElementClick = async (event: MouseEvent) => {
  if (!highlightMode.value) {
    return
  }

  const target = event.target as HTMLElement
  if (!target || target === document.body || target.tagName === MAIN_CONTENT_SCRIPT_TAG) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const xpath = getElementXPath(target)
  const url = window.location.href

  const allHighlights: StorageHighlight = (await storage.getItem(STORAGE_KEY.HIGHLIGHTS)) || {}

  const highlight: HighlightData = {
    outerHTML: target.outerHTML,
    content: target.textContent || '',
    id: uuid(),
    type: target.tagName.toLowerCase(),
    xpath,
  }

  if (!highlightedElements.has(xpath)) {
    highlightedElements.add(xpath)
    target.style.backgroundColor = 'yellow'

    const updatedHighlights = {
      ...allHighlights,
      [url]: [...(allHighlights[url] || []), highlight],
    }

    await storage.setItem(STORAGE_KEY.HIGHLIGHTS, updatedHighlights)
  }
}

const clearAllHighlights = async () => {
  const url = window.location.href
  const allHighlights: StorageHighlight = (await storage.getItem(STORAGE_KEY.HIGHLIGHTS)) || {}

  if (allHighlights[url]) {
    allHighlights[url].forEach((item) => {
      const xpath = item.xpath
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue as HTMLElement
      if (element) {
        element.style.backgroundColor = ''
      }
    })
    delete allHighlights[url]
    await storage.setItem(STORAGE_KEY.HIGHLIGHTS, allHighlights)
    highlightedElements.clear()
  }
}

const openPopup = () => {
  browser.runtime.sendMessage({ action: EVENTS.OPEN_POPUP })
}

const enableClipHighlightListener = (message: Message) => {
  if (message.action === EVENTS.ENABLE_CLIP_HIGHLIGHT) {
    toggleClipHighlight(true)
  }
}

onMounted(async () => {
  loading.value = true
  await nextTick()
  setupHighlightOverlay()
  const onDocumentReady = () => {
    if (document.readyState === 'complete') {
      loadHighlightedElements()
      document.removeEventListener('readystatechange', onDocumentReady)
    }
  }

  if (document.readyState === 'complete') {
    loadHighlightedElements()
  } else {
    document.addEventListener('readystatechange', onDocumentReady)
  }

  browser.runtime.onMessage.addListener(enableClipHighlightListener)
})

onUnmounted(() => {
  browser.runtime.onMessage.removeListener(enableClipHighlightListener)
  clearHighlight()
})

useEventListener(document.body, 'mousemove', onElementHover, {
  capture: true,
  passive: false,
})
useEventListener(document.body, 'click', onElementClick, {
  capture: true,
  passive: false,
})
</script>

<template>
  <div v-if="highlightMode" class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999999999]">
    <div v-if="loading" class="flex items-center justify-between gap-1 text-white px-4 py-2 rounded-full bg-gray-400">
      Loading...
    </div>
    <div v-else class="flex items-center justify-between gap-1 p-1 rounded-full bg-gray-400">
      <div v-if="!highlightedElements.size" class="text-white px-3">Select elements to highlight</div>
      <template v-else>
        <button
          class="bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-full px-3 py-1 transition"
          @click="openPopup"
        >
          Clip highlight
        </button>
        <button
          class="flex items-center justify-center text-white min-w-[26px] h-[26px] py-0 px-1 rounded-full hover:bg-gray-300 transition"
          @click="clearAllHighlights"
        >
          {{ highlightedElements.size }}&nbsp;
          <TrashIcon class="size-4" />
        </button>
      </template>
      <button
        class="flex items-center justify-center text-white w-[26px] h-[26px] p-0 rounded-full hover:bg-gray-300 transition"
        @click="toggleClipHighlight(false)"
      >
        <XCircleIcon class="size-4" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
