<script lang="ts" setup>
import { useSelector } from '@/composables/useSelector'
import { EVENTS } from '@/constants/event'
import { EXPORT_DATA_TYPES } from '@/constants/export-data'
import { STORAGE_KEY } from '@/constants/storage'
import { EXPORT_DATA_FORM_FIELD, type ExportDataCsv, ExportDataForm, type StorageExportData } from '@/types/export-data'
import type { Message } from '@/types/global'
import { exportCsvFile, getAbsoluteQuerySelector, getQuerySelector, uuid } from '@/utils/helpers'
import {
  ArrowTopRightOnSquareIcon,
  CursorArrowRippleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/16/solid'
import { useFieldArray, useForm } from 'vee-validate'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as yup from 'yup'

const exportDataMode = ref<boolean>(false)
const currentChildIndex = ref<number | null>(null)

const validationSchema = yup.object({
  container: yup.string().required('Container is required'),
  loop: yup.boolean(),
  children: yup.array(
    yup.object({
      id: yup.string().required(),
      fieldName: yup.string().required('Field name is required'),
      selector: yup.string().required('Selector is required'),
      type: yup.string().oneOf(Object.values(EXPORT_DATA_TYPES), 'Invalid type').required('Type is required')
    })
  )
})

const { handleSubmit, resetForm, defineField, values, errors, setFieldValue } = useForm<ExportDataForm>({
  validationSchema,
  initialValues: {
    [EXPORT_DATA_FORM_FIELD.LOOP]: false,
    [EXPORT_DATA_FORM_FIELD.CONTAINER]: '',
    [EXPORT_DATA_FORM_FIELD.CHILDREN]: []
  }
})

const { push, update, remove } = useFieldArray(EXPORT_DATA_FORM_FIELD.CHILDREN)

const [container, containerProps] = defineField(EXPORT_DATA_FORM_FIELD.CONTAINER)
const [loop, loopProps] = defineField(EXPORT_DATA_FORM_FIELD.LOOP)
const [children] = defineField(EXPORT_DATA_FORM_FIELD.CHILDREN)

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
  setFieldValue(EXPORT_DATA_FORM_FIELD.CONTAINER, querySelector)
})

setOnElementClickCallbackChild((querySelector: string) => {
  if (currentChildIndex.value !== null && children.value[currentChildIndex.value]) {
    update(currentChildIndex.value, {
      ...children.value[currentChildIndex.value],
      selector: querySelector
    })
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
  push({
    id: uuid(),
    type: EXPORT_DATA_TYPES.TEXT_CONTENT,
    selector: '',
    fieldName: ''
  })
}

const removeChild = async (index: number) => {
  remove(index)
}

const enableSelectContainer = () => {
  setupSelectorOverlay()
}

const selectChild = async (index: number) => {
  await nextTick()
  currentChildIndex.value = index
  setupSelectorOverlayChild()
}

const exportCsv = handleSubmit((values) => {
  const getData = (el: Element): ExportDataCsv =>
    values[EXPORT_DATA_FORM_FIELD.CHILDREN].reduce((acc, {
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

  if (values[EXPORT_DATA_FORM_FIELD.LOOP]) {
    data = Array.from(document.querySelectorAll(values[EXPORT_DATA_FORM_FIELD.CONTAINER])).map(getData)
  } else {
    const containerEl = document.querySelector(values[EXPORT_DATA_FORM_FIELD.CONTAINER])
    if (containerEl) {
      data = [getData(containerEl)]
    }
  }
  exportCsvFile<ExportDataCsv>(data)
})

const fetchExportData = async () => {
  const allExportData: StorageExportData = (await storage.getItem(STORAGE_KEY.EXPORT_DATA)) || {}
  const url = window.location.href
  const exportData = allExportData[url]
  if (exportData) {
    resetForm({
      values: {
        [EXPORT_DATA_FORM_FIELD.CONTAINER]: exportData.container,
        [EXPORT_DATA_FORM_FIELD.LOOP]: exportData.loop,
        [EXPORT_DATA_FORM_FIELD.CHILDREN]: Object.values(exportData.children)
      }
    })
  }
}

watch(
  () => values,
  async (newValue) => {
    const allExportData: StorageExportData = (await storage.getItem(STORAGE_KEY.EXPORT_DATA)) || {}
    const url = window.location.href
    const updatedExportData = {
      ...allExportData,
      [url]: {
        [EXPORT_DATA_FORM_FIELD.CONTAINER]: newValue[EXPORT_DATA_FORM_FIELD.CONTAINER],
        [EXPORT_DATA_FORM_FIELD.LOOP]: newValue[EXPORT_DATA_FORM_FIELD.LOOP],
        [EXPORT_DATA_FORM_FIELD.CHILDREN]: newValue[EXPORT_DATA_FORM_FIELD.CHILDREN]
      }
    }
    await storage.setItem(STORAGE_KEY.EXPORT_DATA, updatedExportData)
  },
  {
    deep: true
  }
)

watch(() => loop.value, () => {
  setFieldValue(EXPORT_DATA_FORM_FIELD.CONTAINER, '')
})

watch(() => exportDataMode.value, (newValue) => {
  if (newValue) {
    fetchExportData()
  }
})

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
    <form @submit="exportCsv">
      <div class="relative p-3 pb-[42px] rounded bg-white w-[600px] shadow">
        <div class="flex justify-end mb-3">
          <button class="flex items-center justify-center text-gray-600 w-[16px] h-[16px] p-0"
                  type="button"
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
                <input id="loop" v-model="loop" class="cursor-pointer" type="checkbox" v-bind="loopProps">
                <span class="text-xs">Repeat</span>
              </label>
            </div>
            <div class="flex items-center gap-1 border border-solid border-gray-300 rounded overflow-hidden">
              <input v-model="container" class="px-2 py-1 flex-grow" type="text" v-bind="containerProps">
              <button class="flex-shrink-0 w-[20px]" type="button" @click="enableSelectContainer">
                <CursorArrowRippleIcon class="size-4" />
              </button>
            </div>
            <p v-if="errors[EXPORT_DATA_FORM_FIELD.CONTAINER]" class="text-red-600 mt-1">
              {{ errors[EXPORT_DATA_FORM_FIELD.CONTAINER] }}</p>
          </div>
          <div>
            <div class="flex items-center justify-between">
              <div class="font-semibold">Select children elements</div>
              <button
                class="flex items-center justify-center text-white w-[20px] h-[20px] p-0 rounded bg-green-600 hover:bg-green-500 transition"
                type="button"
                @click="addChild"
              >
                <PlusIcon class="size-4" />
              </button>
            </div>
            <template v-if="children.length">
              <div v-if="errors[EXPORT_DATA_FORM_FIELD.CHILDREN]"
                   class="border border-solid border-red-600 bg-red-100 text-red-600 rounded p-2 my-2">
                {{ errors[EXPORT_DATA_FORM_FIELD.CHILDREN] }}
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
                    <button class="flex-shrink-0 w-[20px]" type="button" @click="selectChild(index)">
                      <CursorArrowRippleIcon class="size-4" />
                    </button>
                  </div>
                  <button class="flex-shrink-0 w-[20px] text-red-500" type="button" @click="removeChild(index)">
                    <TrashIcon class="size-4" />
                  </button>
                </div>
              </div>
            </template>
            <div v-else class="border border-solid border-gray-300 text-center text-gray-600 rounded p-2 mt-2">
              Add children elements to setup children data
            </div>
          </div>
        </div>
        <div class="absolute left-0 right-0 bottom-0 z-[99] flex items-center gap-2 bg-white p-3">
          <button
            class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-blue-600 hover:bg-blue-500 transition px-2 py-1 text-nowrap cursor-pointer disabled:bg-gray-400 disabled:cursor-default disabled:opacity-85"
            type="submit"
            @click="exportCsv"
          >
            <ArrowTopRightOnSquareIcon class="size-4 mr-1" />
            Export .CSV
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
