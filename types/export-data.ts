export interface ExportDataChild {
  id: string
  type: ExportDataType
  selector: string
  fieldName: string
}

export enum ExportDataType {
  TEXT_CONTENT = 'TEXT_CONTENT',
  HTML = 'HTML',
}

export interface ExportData {
  container: string
  loop: boolean
  children: ExportDataChild[]
}

export type ExportDataCsv = Record<string, string>;

export type StorageExportData = Record<string, ExportData>
