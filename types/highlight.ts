export interface HighlightData {
  outerHTML: string
  content: string
  id: string
  type: string
  xpath: string
}

export type StorageHighlight = Record<string, HighlightData[]>
