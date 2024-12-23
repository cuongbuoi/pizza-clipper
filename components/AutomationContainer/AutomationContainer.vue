<script lang="ts" setup>
import { useSelector } from '@/composables/useSelector'
import { COMMAND_TYPES } from '@/constants/command'
import { EVENTS } from '@/constants/event'
import { STORAGE_KEY } from '@/constants/storage'
import { type Command, type StorageCommands } from '@/types/command'
import { type Message } from '@/types/global'
import { sleep, uuid } from '@/utils/helpers'
import { CursorArrowRippleIcon, PlayIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/16/solid'
import { useCloned } from '@vueuse/core'
import { storage } from '@wxt-dev/storage'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const automationMode = ref<boolean>(false)
const commands = ref<Command[]>([])
const { cloned: cloneCommands } = useCloned(commands)
const currentCommandIndex = ref<number | null>(null)

const selectElement = async (index: number) => {
  await nextTick()
  currentCommandIndex.value = index
  setupSelectorOverlay()
}

const {
  setupSelectorOverlay,
  setOnElementClickCallback
} = useSelector()

setOnElementClickCallback((querySelector: string) => {
  if (currentCommandIndex.value !== null) {
    commands.value[currentCommandIndex.value].selector = querySelector
  }
})

const toggleAutomation = (value: boolean) => {
  automationMode.value = value
}

const enableAutomationListener = (message: Message) => {
  if (message.action === EVENTS.ENABLE_AUTOMATION) {
    toggleAutomation(true)
  }
}

const fetchCommands = async () => {
  const allCommands = (await storage.getItem<StorageCommands>(STORAGE_KEY.AUTOMATION)) || {}
  const url = window.location.href
  const storedCommands = Object.values(allCommands[url]) || []
  storedCommands.forEach((item) => {
    commands.value.push(item)
  })
}

const addCommand = async () => {
  commands.value.push({
    id: uuid(),
    action: COMMAND_TYPES.CLICK,
    selector: '',
    delay: 0
  })
}

const removeCommand = async (index: number) => {
  commands.value.splice(index, 1)
}

const runAutomation = async () => {
  try {
    const hasSelectorCommands = cloneCommands.value.filter((item) => item.selector)
    while (hasSelectorCommands.length > 0) {
      const command = hasSelectorCommands.shift()
      if (!command) {
        return
      }
      await sleep(command.delay)

      const element = document.querySelector(command.selector) as HTMLElement | null
      if (!element) {
        return
      }

      switch (command.action) {
        case COMMAND_TYPES.CLICK_ELEMENT:
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
          await sleep(500)
          element.click()
          break
        case COMMAND_TYPES.CLICK:
          element.click()
          break
        case COMMAND_TYPES.SCROLL: {
          const elementHeight = element.scrollHeight
          element.scrollTo({
            top: elementHeight,
            behavior: 'smooth'
          })
          break
        }
        case COMMAND_TYPES.SCROLL_UNTIL_END: {
          let lastHeight = element.scrollHeight
          let currentHeight = lastHeight

          while (currentHeight === lastHeight) {
            element.scrollTo({
              top: currentHeight,
              behavior: 'smooth'
            })

            await new Promise((resolve) => {
              const checkHeightChange = setInterval(() => {
                currentHeight = element.scrollHeight
                if (currentHeight !== lastHeight) {
                  lastHeight = currentHeight
                  clearInterval(checkHeightChange)
                  resolve(null)
                }
              }, 500)
            })

            if (currentHeight === lastHeight) {
              console.log('No new content loaded, stopping scroll.')
              break
            }
          }
          break
        }
      }
    }
  } catch (error) {
    console.error('Automation failed:', error)
  }
}

watch(
  commands,
  async (newCommands) => {
    const allCommands: StorageCommands = (await storage.getItem(STORAGE_KEY.AUTOMATION)) || {}
    const url = window.location.href
    const updatedCommands = {
      ...allCommands,
      [url]: newCommands
    }
    await storage.setItem(STORAGE_KEY.AUTOMATION, updatedCommands)
  },
  { deep: true }
)

onMounted(() => {
  fetchCommands()
  browser.runtime.onMessage.addListener(enableAutomationListener)
})

onUnmounted(() => {
  browser.runtime.onMessage.removeListener(enableAutomationListener)
})
</script>

<template>
  <div v-if="automationMode" class="fixed top-6 right-6 z-[9999999999]">
    <div class="relative p-2 pb-[42px] rounded bg-white w-[500px] shadow">
      <div class="flex justify-end mb-3">
        <button
          class="flex items-center justify-center text-gray-600 w-[20px] h-[20px] p-0"
          @click="toggleAutomation(false)"
        >
          <XMarkIcon class="size-4" />
        </button>
      </div>
      <div class="mb-3">
        <div class="flex items-center justify-between">
          <div class="text-lg font-bold">Command builder</div>
          <button
            class="flex items-center justify-center text-white w-[20px] h-[20px] p-0 rounded bg-green-600 hover:bg-green-500 transition"
            @click="addCommand"
          >
            <PlusIcon class="size-4" />
          </button>
        </div>
      </div>
      <div class="pb-3">
        <table class="w-full text-left table-fixed min-w-max">
          <thead>
          <tr>
            <th class="text-xs pr-3 py-1 border-b border-blue-gray-50">Action</th>
            <th class="text-xs px-3 py-1 border-b border-blue-gray-50">Selector</th>
            <th class="text-xs px-3 py-1 border-b border-blue-gray-50">Delay (ms)</th>
            <th class="text-xs pl-3 py-1 border-b border-blue-gray-50">&nbsp;</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in commands" :key="item.id">
            <td class="text-xs pr-3 py-1 border-b border-blue-gray-50">
              <select v-model="item.action" class="border border-solid border-gray-300 rounded px-2 py-1" name="type">
                <option v-for="(option, key) in COMMAND_TYPES" :key="key" :value="option">
                  {{ option }}
                </option>
              </select>
            </td>
            <td class="text-xs px-3 py-1 border-b border-blue-gray-50">
              <div class="flex items-center gap-1 border border-solid border-gray-300 rounded overflow-hidden">
                <input v-model="item.selector" class="px-2 py-1 flex-grow w-full" type="text">
                <button class="flex-shrink-0 w-[20px]" @click="selectElement(index)">
                  <CursorArrowRippleIcon class="size-4" />
                </button>
              </div>
            </td>
            <td class="text-xs px-3 py-1 border-b border-blue-gray-50">
              <input
                v-model="item.delay"
                class="border border-solid border-gray-300 rounded px-2 py-1"
                min="0"
                step="100"
                type="number"
              >
            </td>
            <td class="text-xs pl-3 py-1 border-b border-blue-gray-50 text-right">
              <button class="text-red-500" @click="removeCommand(index)">
                <TrashIcon class="size-4" />
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="absolute left-0 right-0 bottom-0 z-[99] flex items-center gap-2 bg-white p-2">
        <button
          :disabled="!commands.length"
          class="flex flex-grow items-center justify-center text-white text-xs rounded-full bg-green-600 hover:bg-green-500 transition px-2 py-1 text-nowrap cursor-pointer disabled:bg-gray-400 disabled:cursor-default disabled:opacity-85"
          @click="runAutomation"
        >
          <PlayIcon class="size-4 mr-1" />
          Run automation
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
