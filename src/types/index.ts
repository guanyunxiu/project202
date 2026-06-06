export interface DataField {
  id: string
  name: string
  fieldName: string
  type: 'string' | 'number' | 'date' | 'boolean'
}

export interface TableColumn {
  id: string
  fieldId: string
  fieldName: string
  columnName: string
  type: 'string' | 'number' | 'date' | 'boolean'
  width: number
  align: 'left' | 'center' | 'right'
  format: string
  visible: boolean
  order: number
}

export interface ReportConfig {
  title: string
  titleAlign: 'left' | 'center' | 'right'
  titleFontSize: number
  columns: TableColumn[]
}

export interface MockDataItem {
  [key: string]: any
}
