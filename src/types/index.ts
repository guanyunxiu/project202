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
  summaryType?: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none'
  frozen?: boolean
}

export interface TableStyle {
  headerBgColor: string
  headerTextColor: string
  zebraStripe: boolean
  zebraStripeColor: string
  border: boolean
  borderColor: string
  rowHeight: number
}

export interface PaginationConfig {
  enabled: boolean
  pageSize: number
  currentPage: number
  showTotal: boolean
  showSizeChanger: boolean
  showQuickJumper: boolean
}

export type ChartType = 'bar' | 'line' | 'pie'

export interface ChartConfig {
  id: string
  type: ChartType
  title: string
  xAxisField: string
  yAxisField: string
  yAxisFields?: string[]
  legendField?: string
  showLegend: boolean
  showDataZoom: boolean
  smooth: boolean
  stack: boolean
  colorPalette: string[]
}

export type FilterType = 'date' | 'select' | 'text' | 'dateRange'

export interface FilterOption {
  label: string
  value: string | number
}

export interface FilterConfig {
  id: string
  type: FilterType
  fieldName: string
  label: string
  placeholder: string
  options: FilterOption[]
  value: any
  enabled: boolean
}

export interface DataSourceConfig {
  id: string
  name: string
  type: 'mock' | 'api'
  url?: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: Record<string, any>
  dataPath?: string
  enabled: boolean
}

export type BlockType = 'table' | 'chart' | 'filter'

export interface LayoutBlock {
  id: string
  type: BlockType
  x: number
  y: number
  width: number
  height: number
  configId: string
  title: string
  visible: boolean
}

export interface TableBlockConfig {
  id: string
  columns: TableColumn[]
  style: TableStyle
  pagination: PaginationConfig
  showSummary: boolean
}

export interface ChartBlockConfig {
  id: string
  chartConfig: ChartConfig
}

export interface FilterBlockConfig {
  id: string
  filters: FilterConfig[]
}

export interface ReportConfig {
  title: string
  titleAlign: 'left' | 'center' | 'right'
  titleFontSize: number
  blocks: LayoutBlock[]
  tableConfigs: TableBlockConfig[]
  chartConfigs: ChartBlockConfig[]
  filterConfigs: FilterBlockConfig[]
  dataSources: DataSourceConfig[]
}

export interface MockDataItem {
  [key: string]: any
}

export interface DraggableComponent {
  id: string
  type: 'field' | 'component'
  componentType?: 'table' | 'bar' | 'line' | 'pie' | 'filter'
  field?: DataField
  name: string
  icon: string
}

export interface FullscreenPreviewState {
  visible: boolean
  title: string
}
