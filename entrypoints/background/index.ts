import { EVENTS } from '@/constants/event'
import { Message } from '@/types/global'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.action === EVENTS.OPEN_POPUP) {
      browser.action.openPopup()
      sendResponse('Popup opened')
    }
  })
})
