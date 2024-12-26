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

export const enum EXPORT_DATA_FORM_FIELD {
  CONTAINER = 'container',
  LOOP = 'loop',
  CHILDREN = 'children',
}

export interface ExportDataForm {
  [EXPORT_DATA_FORM_FIELD.CONTAINER]: string
  [EXPORT_DATA_FORM_FIELD.LOOP]: boolean
  [EXPORT_DATA_FORM_FIELD.CHILDREN]: ExportDataChild[]
}
