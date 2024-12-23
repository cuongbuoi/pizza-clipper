<script lang="ts" setup>
import { useSelector } from '@/composables/useSelector'
import { EVENTS } from '@/constants/event'
import { EXPORT_DATA_TYPES } from '@/constants/export-data'
import { STORAGE_KEY } from '@/constants/storage'
import { type ExportDataChild, type ExportDataCsv, type StorageExportData } from '@/types/export-data'
import type { Message } from '@/types/global'
import { exportCsvFile, getAbsoluteQuerySelector, getQuerySelector, uuid } from '@/utils/helpers'
import {
  ArrowTopRightOnSquareIcon,
  CursorArrowRippleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/16/solid'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const exportDataMode = ref<boolean>(false)
const loop = ref<boolean>(false)
const container = ref<string | null>(null)
const children = ref<ExportDataChild[]>([])
const currentChildIndex = ref<number | null>(null)

const {
  setupSelectorOverlay,
  setCustomSelectorFunc,
  setOnElementClickCallback
} = useSelector()

const {
  setupSelectorOverlay: setupSelectorOverlayChild,
  setCustomSelectorFunc: setCustomSelectorFuncChild,
  setOnElementClickCallback: setOnElementClickCallbackChild
} = useSelector()

setOnElementClickCallback((querySelector: string) => {
  container.value = querySelector
})

setOnElementClickCallbackChild((querySelector: string) => {
  if (currentChildIndex.value !== null) {
    children.value[currentChildIndex.value].selector = querySelector
  }
})

setCustomSelectorFunc((element: HTMLElement) => {
  return loop.value ? getQuerySelector(element) : getAbsoluteQuerySelector(element)
})

setCustomSelectorFuncChild((element: HTMLElement) => {
  return loop.value ? getQuerySelector(element) : getAbsoluteQuerySelector(element)
})

const toggleExportData = (value: boolean) => {
  exportDataMode.value = value
}

const enableExportDataListener = (message: Message) => {
  if (message.action === EVENTS.ENABLE_EXPORT_DATA) {
    toggleExportData(true)
  }
}

const addChild = async () => {
  children.value.push({
    id: uuid(),
    type: EXPORT_DATA_TYPES.TEXT_CONTENT,
    selector: '',
    fieldName: ''
  })
}

const removeChild = async (index: number) => {
  children.value.splice(index, 1)
}

const enableSelectContainer = () => {
  setupSelectorOverlay()
}

const selectChild = async (index: number) => {
  await nextTick()
  currentChildIndex.value = index
  setupSelectorOverlayChild()
}

const exportCsv = () => {
  if (!container.value) {
    return
  }

  const getData = (el: Element): ExportDataCsv =>
    children.value.reduce((acc, {
      selector,
      fieldName,
      type
    }) => {
      const childEl = el.querySelector(selector)
      return {
        ...acc,
        [fieldName]: childEl ? (type === EXPORT_DATA_TYPES.TEXT_CONTENT ? childEl.textContent : childEl.outerHTML) : ''
      }
    }, {})

  let data: ExportDataCsv[] = []

  if (loop.value) {
    data = Array.from(document.querySelectorAll(container.value)).map(getData)
  } else {
    const containerEl = document.querySelector(container.value)
    if (containerEl) {
      data = [getData(containerEl)]
    }
  }
  console.log(data)
  exportCsvFile<ExportDataCsv>(data)
}

const fetchExportData = async () => {
  const allExportData: StorageExportData = (await storage.getItem(STORAGE_KEY.EXPORT_DATA)) || {}
  const url = window.location.href
  const exportData = allExportData[url]
  if (exportData) {
    container.value = exportData.container
    loop.value = exportData.loop
    Object.values(exportData.children).forEach((child) => {
      children.value.push(child)
    })
  }
}

watch(
  () => [container, loop, children],
  async () => {
    const allExportData: StorageExportData = (await storage.getItem(STORAGE_KEY.EXPORT_DATA)) || {}
    const url = window.location.href
    const updatedExportData = {
      ...allExportData,
      [url]: {
        container: container.value,
        loop: loop.value,
        children: children.value
      }
    }
    await storage.setItem(STORAGE_KEY.EXPORT_DATA, updatedExportData)
  },
  {
    deep: true
  }
)

onMounted(() => {
  fetchExportData()
  browser.runtime.onMessage.addListener(enableExportDataListener)
})

onUnmounted(() => {
  browser.runtime.onMessage.removeListener(enableExportDataListener)
})
</script>

<template>
  <div v-if="exportDataMode" class="fixed top-6 right-6 z-[9999999999]">
    <div class="relative p-2 pb-[42px] rounded bg-white w-[600px] shadow">
      <div class="flex justify-end mb-3">
        <button
          class="flex items-center justify-center text-gray-600 w-[20px] h-[20px] p-0"
          @click="toggleExportData(false)"
        >
          <XMarkIcon class="size-4" />
        </button>
      </div>
      <div class="mb-3">
        <div class="text-lg font-bold">Select elements to export data</div>
      </div>
      <div class="pb-3">
        <div class="mb-2">
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="font-semibold">Select container</div>
            <label class="flex items-center gap-1" for="loop">
              <input id="loop" v-model="loop" class="cursor-pointer" type="checkbox">
              <span class="text-xs">Loop</span>
            </label>
          </div>
          <div class="flex items-center gap-1 border border-solid border-gray-300 rounded overflow-hidden">
            <input v-model="container" class="px-2 py-1 flex-grow" type="text">
            <button class="flex-shrink-0 w-[20px]" @click="enableSelectContainer">
              <CursorArrowRippleIcon class="size-4" />
            </button>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between">
            <div class="font-semibold">Select children elements</div>
            <button
              class="flex items-center justify-center text-white w-[20px] h-[20px] p-0 rounded bg-green-600 hover:bg-green-500 transition"
              @click="addChild"
            >
              <PlusIcon class="size-4" />
            </button>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div v-for="(item, index) in children" :key="item.id" class="flex items-center gap-2">
              <input
                v-model="item.fieldName"
                class="flex-grow border border-solid border-gray-300 rounded px-2 py-1"
                placeholder="Field name"
                type="text"
              >
              <select
                v-model="item.type"
                class="flex-grow border border-solid border-gray-300 rounded px-2 py-1"
                name="type"
              >
                <option v-for="(option, key) in EXPORT_DATA_TYPES" :key="key" :value="option">
                  {{ option }}
                </option>
              </select>
              <div
                class="flex-grow flex items-center gap-1 border border-solid border-gray-300 rounded overflow-hidden"
              >
                <input v-model="item.selector" class="px-2 py-1 flex-grow" type="text">
                <button class="flex-shrink-0 w-[20px]" @click="selectChild(index)">
                  <CursorArrowRippleIcon class="size-4" />
                </button>
              </div>
              <button class="flex-shrink-0 w-[20px] text-red-500" @click="removeChild(index)">
                <TrashIcon class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute left-0 right-0 bottom-0 z-[99] flex items-center gap-2 bg-white p-2">
        <button
          class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-blue-600 hover:bg-blue-500 transition px-2 py-1 text-nowrap cursor-pointer disabled:bg-gray-400 disabled:cursor-default disabled:opacity-85"
          @click="exportCsv"
        >
          <ArrowTopRightOnSquareIcon class="size-4 mr-1" />
          Export .CSV
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
