<script lang="ts" setup>
import { EVENTS } from '@/constants/event'
import { STORAGE_KEY } from '@/constants/storage'
import { type Message, type PageInfo } from '@/types/global'
import { type HighlightData, type StorageHighlight } from '@/types/highlight'
import { ArrowTopRightOnSquareIcon, CursorArrowRaysIcon, PencilIcon } from '@heroicons/vue/16/solid'
import { storage } from '@wxt-dev/storage'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const enableClipHighlight = () => {
  browser.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) => {
      if (tabs[0].id) {
        browser.tabs.sendMessage<Message>(tabs[0].id, {
          action: EVENTS.ENABLE_CLIP_HIGHLIGHT,
        })
      }
    })
  window.close()
}

const enableAutomation = () => {
  browser.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) => {
      if (tabs[0].id) {
        browser.tabs.sendMessage<Message>(tabs[0].id, {
          action: EVENTS.ENABLE_AUTOMATION,
        })
      }
    })
  window.close()
}

const enableExportData = () => {
  browser.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) => {
      if (tabs[0].id) {
        browser.tabs.sendMessage<Message>(tabs[0].id, {
          action: EVENTS.ENABLE_EXPORT_DATA,
        })
      }
    })
  window.close()
}

const pageInfo = ref<PageInfo | null>(null)

const fetchPageInfo = async () => {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  if (tab?.id) {
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || null
        return {
          title: document.title,
          url: window.location.href,
          description: metaDescription,
        }
      },
    })
    pageInfo.value = result?.result || null
  }
}
const pageData = computed(() => {
  return [
    {
      title: 'Title',
      value: pageInfo.value?.title || '',
    },
    {
      title: 'URL',
      value: pageInfo.value?.url || '',
    },
    {
      title: 'Description',
      value: pageInfo.value?.description || '',
    },
  ]
})

const highlighted = ref<HighlightData[]>([])
const fetchHighlightData = async () => {
  const allHighlights: StorageHighlight = (await storage.getItem(STORAGE_KEY.HIGHLIGHTS)) || {}
  if (pageInfo.value?.url) {
    const highlights = allHighlights[pageInfo.value?.url]
    if (highlights) {
      highlighted.value = highlights
    }
  }
}

onMounted(async () => {
  await nextTick()
  await fetchPageInfo()
  await fetchHighlightData()
})

const unwatch = storage.watch<StorageHighlight>(STORAGE_KEY.HIGHLIGHTS, () => {
  fetchHighlightData()
})
onUnmounted(() => {
  unwatch()
})
</script>

<template>
  <div class="w-[500px] p-4 pb-[50px]">
    <template v-if="pageInfo">
      <h1 class="text-md font-bold mb-3">{{ pageInfo.title }}</h1>
      <div
        class="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border mb-3"
      >
        <table class="w-full text-left table-auto min-w-max">
          <tbody>
            <tr v-for="(item, index) in pageData" :key="index">
              <td class="text-xs px-3 py-1 border-b border-blue-gray-50">{{ item.title }}</td>
              <td class="text-xs px-3 py-1 border-b border-blue-gray-50 break-all">{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <template v-if="highlighted.length">
      <p class="text-md font-bold mb-3">Highlighted</p>
      <div class="border border-solid border-gray-300 rounded p-3 mb-3">
        <div v-for="(item, index) in highlighted" :key="index" class="mb-2">
          {{ item.content }}
        </div>
      </div>
    </template>
    <div
      class="flex items-center justify-between gap-3 bg-white border border-t border-gray-300 fixed left-0 right-0 bottom-0 p-2"
    >
      <button
        class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-orange-500 hover:bg-orange-400 transition px-4 py-2 text-nowrap cursor-pointer"
        @click="enableClipHighlight"
      >
        <PencilIcon class="size-4 mr-1" />
        Highlight
      </button>
      <button
        class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-red-500 hover:bg-red-400 transition px-4 py-2 text-nowrap cursor-pointer"
        @click="enableAutomation"
      >
        <CursorArrowRaysIcon class="size-4 mr-1" />
        Automation
      </button>
      <button
        class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-blue-500 hover:bg-blue-400 transition px-4 py-2 text-nowrap cursor-pointer"
        @click="enableExportData"
      >
        <ArrowTopRightOnSquareIcon class="size-4 mr-1" />
        Export data
      </button>
    </div>
  </div>
</template>

<style scoped></style>
