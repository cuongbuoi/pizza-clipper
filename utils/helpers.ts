import { v4 as uuidv4 } from 'uuid'

export const uuid = () => {
  return uuidv4()
}

export const getElementXPath = (element: HTMLElement): string => {
  const segs: string[] = []
  while (element && element.nodeType === 1) {
    if (element.hasAttribute('id')) {
      segs.unshift(`//*[@id="${element.getAttribute('id')}"]`)
      break
    } else {
      let i = 1
      for (let sib = element.previousSibling; sib; sib = sib.previousSibling) {
        if (sib.nodeType === 1 && sib.nodeName === element.nodeName) i++
      }
      segs.unshift(`${element.nodeName.toLowerCase()}[${i}]`)
      element = element.parentNode as HTMLElement
    }
  }
  return segs.length ? segs.join('/') : ''
}

export const validateXPath = (xpath: string): boolean => {
  try {
    document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null)
    return true
  } catch (e) {
    console.error('Invalid XPath:', xpath, e)
    return false
  }
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getAbsoluteQuerySelector = (element: HTMLElement): string => {
  if (!element) return ''

  let selector = element.tagName.toLowerCase()

  if (element.id) {
    selector += `#${element.id}`
  }

  if (element.classList.length > 0) {
    selector += `.${Array.from(element.classList).join('.')}`
  }

  const attributes = Array.from(element.attributes)
    .filter((attr) => !['id', 'class', 'style'].includes(attr.name))
    .map((attr) => `[${attr.name}="${attr.value}"]`)
    .join('')

  selector += attributes

  if (element.parentElement) {
    const parentSelector = getAbsoluteQuerySelector(element.parentElement)
    selector = `${parentSelector} > ${selector}`
  }

  return selector
}

export const getQuerySelector = (element: HTMLElement): string => {
  if (!element) return ''

  let selector = element.tagName.toLowerCase()

  if (element.id) {
    selector += `#${element.id}`
  }

  if (element.classList.length > 0) {
    selector += `.${Array.from(element.classList).join('.')}`
  }

  return selector
}

export const exportCsvFile = <T>(data: T[]) => {
  if (!data.length) {
    alert('No data to export')
    return
  }

  const csvHeaders = Object.keys(data[0])
  const rows = data.map((item) => Object.values(item))
  const csvContent = [
    csvHeaders,
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`)
  const link = document.createElement('a')
  link.href = encodedUri
  link.download = 'Pizza exported template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
