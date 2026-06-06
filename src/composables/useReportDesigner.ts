import { ref, computed, watch } from 'vue'
import type {
  TableColumn,
  ReportConfig,
  DataField,
  MockDataItem,
  ChartType,
  ChartConfig,
  FilterConfig,
  FilterType,
  TableStyle,
  PaginationConfig,
  LayoutBlock,
  TableBlockConfig,
  ChartBlockConfig,
  FilterBlockConfig,
  DataSourceConfig,
  FullscreenPreviewState
} from '@/types'
import { mockDataFields, mockTableData } from '@/data/mockData'
import axios from 'axios'

const STORAGE_KEY = 'report_designer_config'

// 单例状态 - 确保所有组件共享同一个状态
let singletonState: ReturnType<typeof createState> | null = null

function createState() {
  const dataFields = ref<DataField[]>([...mockDataFields])
  const tableData = ref<MockDataItem[]>([...mockTableData])
  const originalTableData = ref<MockDataItem[]>([...mockTableData])
  const selectedBlockId = ref<string | null>(null)
  const fullscreenPreview = ref<FullscreenPreviewState>({ visible: false, title: '' })
  const loading = ref(false)

  const reportConfig = ref<ReportConfig>({
    ...defaultConfig,
    dataSources: [{ ...defaultDataSource }]
  })

  return {
    dataFields,
    tableData,
    originalTableData,
    selectedBlockId,
    fullscreenPreview,
    loading,
    reportConfig
  }
}

const defaultTableStyle: TableStyle = {
  headerBgColor: '#409eff',
  headerTextColor: '#ffffff',
  zebraStripe: true,
  zebraStripeColor: '#f5f7fa',
  border: true,
  borderColor: '#dcdfe6',
  rowHeight: 40
}

const defaultPagination: PaginationConfig = {
  enabled: false,
  pageSize: 10,
  currentPage: 1,
  showTotal: true,
  showSizeChanger: true,
  showQuickJumper: true
}

const defaultChartColors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#8e44ad', '#16a085', '#d35400']

const defaultDataSource: DataSourceConfig = {
  id: 'default-mock',
  name: '模拟数据',
  type: 'mock',
  enabled: true
}

const defaultConfig: ReportConfig = {
  title: '销售订单报表',
  titleAlign: 'center',
  titleFontSize: 20,
  blocks: [],
  tableConfigs: [],
  chartConfigs: [],
  filterConfigs: [],
  dataSources: [defaultDataSource]
}

export function useReportDesigner() {
  // 使用单例状态，确保所有组件共享同一个状态
  if (!singletonState) {
    singletonState = createState()
  }

  const {
    dataFields,
    tableData,
    originalTableData,
    selectedBlockId,
    fullscreenPreview,
    loading,
    reportConfig
  } = singletonState

  const selectedBlock = computed(() => {
    if (!selectedBlockId.value) return null
    return reportConfig.value.blocks.find((b: LayoutBlock) => b.id === selectedBlockId.value) || null
  })

  const selectedBlockConfig = computed(() => {
    const block = selectedBlock.value
    if (!block) return null

    if (block.type === 'table') {
      return reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === block.configId) || null
    }
    if (block.type === 'chart') {
      return reportConfig.value.chartConfigs.find((c: ChartBlockConfig) => c.id === block.configId) || null
    }
    if (block.type === 'filter') {
      return reportConfig.value.filterConfigs.find((c: FilterBlockConfig) => c.id === block.configId) || null
    }
    return null
  })

  const activeFilters = computed(() => {
    const allFilters: FilterConfig[] = []
    reportConfig.value.filterConfigs.forEach((fc: FilterBlockConfig) => {
      fc.filters.forEach((f: FilterConfig) => {
        if (f.enabled && f.value) {
          allFilters.push(f)
        }
      })
    })
    return allFilters
  })

  const filteredTableData = computed(() => {
    let data = [...originalTableData.value]

    activeFilters.value.forEach((filter: FilterConfig) => {
      if (!filter.value) return

      if (filter.type === 'text') {
        const keyword = String(filter.value).toLowerCase()
        data = data.filter((row: MockDataItem) => {
          const val = row[filter.fieldName]
          return val !== undefined && val !== null && String(val).toLowerCase().includes(keyword)
        })
      } else if (filter.type === 'date') {
        const filterDate = new Date(filter.value)
        data = data.filter((row: MockDataItem) => {
          const rowDate = new Date(row[filter.fieldName])
          return rowDate.toDateString() === filterDate.toDateString()
        })
      } else if (filter.type === 'dateRange' && Array.isArray(filter.value) && filter.value.length === 2) {
        const startDate = new Date(filter.value[0])
        const endDate = new Date(filter.value[1])
        endDate.setHours(23, 59, 59, 999)
        data = data.filter((row: MockDataItem) => {
          const rowDate = new Date(row[filter.fieldName])
          return rowDate >= startDate && rowDate <= endDate
        })
      } else if (filter.type === 'select') {
        data = data.filter((row: MockDataItem) => row[filter.fieldName] === filter.value)
      }
    })

    tableData.value = data
    return data
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function createTableBlock(x: number, y: number): { block: LayoutBlock; config: TableBlockConfig } {
    const configId = generateId()
    const blockId = generateId()

    const config: TableBlockConfig = {
      id: configId,
      columns: [],
      style: { ...defaultTableStyle },
      pagination: { ...defaultPagination },
      showSummary: false
    }

    const block: LayoutBlock = {
      id: blockId,
      type: 'table',
      x,
      y,
      width: 12,
      height: 8,
      configId,
      title: '数据表格',
      visible: true
    }

    return { block, config }
  }

  function createChartBlock(type: ChartType, x: number, y: number): { block: LayoutBlock; config: ChartBlockConfig } {
    const configId = generateId()
    const blockId = generateId()
    const typeNames: Record<ChartType, string> = { bar: '柱状图', line: '折线图', pie: '饼图' }

    const chartConfig: ChartConfig = {
      id: configId,
      type,
      title: typeNames[type],
      xAxisField: '',
      yAxisField: '',
      yAxisFields: [],
      legendField: '',
      showLegend: true,
      showDataZoom: false,
      smooth: type === 'line',
      stack: false,
      colorPalette: [...defaultChartColors]
    }

    const config: ChartBlockConfig = {
      id: configId,
      chartConfig
    }

    const block: LayoutBlock = {
      id: blockId,
      type: 'chart',
      x,
      y,
      width: 6,
      height: 6,
      configId,
      title: typeNames[type],
      visible: true
    }

    return { block, config }
  }

  function createFilterBlock(x: number, y: number): { block: LayoutBlock; config: FilterBlockConfig } {
    const configId = generateId()
    const blockId = generateId()

    const config: FilterBlockConfig = {
      id: configId,
      filters: []
    }

    const block: LayoutBlock = {
      id: blockId,
      type: 'filter',
      x,
      y,
      width: 12,
      height: 2,
      configId,
      title: '筛选条件',
      visible: true
    }

    return { block, config }
  }

  function addBlock(type: 'table' | ChartType | 'filter', x: number, y: number) {
    let result
    if (type === 'table') {
      result = createTableBlock(x, y)
      reportConfig.value.tableConfigs.push(result.config)
    } else if (type === 'filter') {
      result = createFilterBlock(x, y)
      reportConfig.value.filterConfigs.push(result.config)
    } else {
      result = createChartBlock(type, x, y)
      reportConfig.value.chartConfigs.push(result.config)
    }

    reportConfig.value.blocks.push(result.block)
    selectedBlockId.value = result.block.id
    return result.block
  }

  function removeBlock(blockId: string) {
    const blockIndex = reportConfig.value.blocks.findIndex((b: LayoutBlock) => b.id === blockId)
    if (blockIndex === -1) return

    const block = reportConfig.value.blocks[blockIndex]

    if (block.type === 'table') {
      const configIndex = reportConfig.value.tableConfigs.findIndex((c: TableBlockConfig) => c.id === block.configId)
      if (configIndex > -1) reportConfig.value.tableConfigs.splice(configIndex, 1)
    } else if (block.type === 'chart') {
      const configIndex = reportConfig.value.chartConfigs.findIndex((c: ChartBlockConfig) => c.id === block.configId)
      if (configIndex > -1) reportConfig.value.chartConfigs.splice(configIndex, 1)
    } else if (block.type === 'filter') {
      const configIndex = reportConfig.value.filterConfigs.findIndex((c: FilterBlockConfig) => c.id === block.configId)
      if (configIndex > -1) reportConfig.value.filterConfigs.splice(configIndex, 1)
    }

    reportConfig.value.blocks.splice(blockIndex, 1)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
    }
  }

  function updateBlock(blockId: string, updates: Partial<LayoutBlock>) {
    const block = reportConfig.value.blocks.find((b: LayoutBlock) => b.id === blockId)
    if (block) {
      Object.assign(block, updates)
    }
  }

  function addColumnToTable(tableConfigId: string, field: DataField) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (!tableConfig) return

    const exists = tableConfig.columns.find((col: TableColumn) => col.fieldId === field.id)
    if (exists) return

    const defaultWidth = field.type === 'string' ? 150 : field.type === 'number' ? 120 : 130
    const defaultAlign = field.type === 'number' ? 'right' : 'left'
    const defaultFormat = field.type === 'date' ? 'YYYY-MM-DD' :
                         field.type === 'number' ? '#,##0.00' : ''

    const newColumn: TableColumn = {
      id: generateId(),
      fieldId: field.id,
      fieldName: field.fieldName,
      columnName: field.name,
      type: field.type,
      width: defaultWidth,
      align: defaultAlign,
      format: defaultFormat,
      visible: true,
      order: tableConfig.columns.length,
      summaryType: 'none',
      frozen: false
    }

    tableConfig.columns.push(newColumn)
  }

  function removeColumnFromTable(tableConfigId: string, columnId: string) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (!tableConfig) return

    const index = tableConfig.columns.findIndex((col: TableColumn) => col.id === columnId)
    if (index > -1) {
      tableConfig.columns.splice(index, 1)
      updateColumnOrder(tableConfig)
    }
  }

  function updateColumn(tableConfigId: string, columnId: string, updates: Partial<TableColumn>) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (!tableConfig) return

    const column = tableConfig.columns.find((col: TableColumn) => col.id === columnId)
    if (column) {
      Object.assign(column, updates)
    }
  }

  function updateColumnOrder(tableConfig: TableBlockConfig) {
    tableConfig.columns.forEach((col: TableColumn, index: number) => {
      col.order = index
    })
  }

  function updateTableConfig(tableConfigId: string, updates: Partial<TableBlockConfig>) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (tableConfig) {
      Object.assign(tableConfig, updates)
    }
  }

  function updateTableStyle(tableConfigId: string, style: Partial<TableStyle>) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (tableConfig) {
      Object.assign(tableConfig.style, style)
    }
  }

  function updatePagination(tableConfigId: string, pagination: Partial<PaginationConfig>) {
    const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
    if (tableConfig) {
      Object.assign(tableConfig.pagination, pagination)
    }
  }

  function updateChartConfig(chartConfigId: string, updates: Partial<ChartConfig>) {
    const chartBlockConfig = reportConfig.value.chartConfigs.find((c: ChartBlockConfig) => c.id === chartConfigId)
    if (chartBlockConfig) {
      Object.assign(chartBlockConfig.chartConfig, updates)
    }
  }

  function addFilter(filterBlockConfigId: string, type: FilterType) {
    const filterBlockConfig = reportConfig.value.filterConfigs.find((c: FilterBlockConfig) => c.id === filterBlockConfigId)
    if (!filterBlockConfig) return

    const typeLabels: Record<FilterType, string> = {
      date: '日期筛选',
      dateRange: '日期范围',
      select: '下拉筛选',
      text: '文本搜索'
    }

    const newFilter: FilterConfig = {
      id: generateId(),
      type,
      fieldName: '',
      label: typeLabels[type],
      placeholder: `请选择${typeLabels[type]}`,
      options: [],
      value: null,
      enabled: true
    }

    filterBlockConfig.filters.push(newFilter)
    return newFilter
  }

  function removeFilter(filterBlockConfigId: string, filterId: string) {
    const filterBlockConfig = reportConfig.value.filterConfigs.find((c: FilterBlockConfig) => c.id === filterBlockConfigId)
    if (!filterBlockConfig) return

    const index = filterBlockConfig.filters.findIndex((f: FilterConfig) => f.id === filterId)
    if (index > -1) {
      filterBlockConfig.filters.splice(index, 1)
    }
  }

  function updateFilter(filterBlockConfigId: string, filterId: string, updates: Partial<FilterConfig>) {
    const filterBlockConfig = reportConfig.value.filterConfigs.find((c: FilterBlockConfig) => c.id === filterBlockConfigId)
    if (!filterBlockConfig) return

    const filter = filterBlockConfig.filters.find((f: FilterConfig) => f.id === filterId)
    if (filter) {
      Object.assign(filter, updates)
    }
  }

  function addDataSource(config: Partial<DataSourceConfig>) {
    const newDataSource: DataSourceConfig = {
      id: generateId(),
      name: config.name || '新数据源',
      type: config.type || 'api',
      url: config.url || '',
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body || {},
      dataPath: config.dataPath || '',
      enabled: false
    }
    reportConfig.value.dataSources.push(newDataSource)
    return newDataSource
  }

  function removeDataSource(dataSourceId: string) {
    const index = reportConfig.value.dataSources.findIndex((d: DataSourceConfig) => d.id === dataSourceId)
    if (index > -1) {
      reportConfig.value.dataSources.splice(index, 1)
    }
  }

  function updateDataSource(dataSourceId: string, updates: Partial<DataSourceConfig>) {
    const dataSource = reportConfig.value.dataSources.find((d: DataSourceConfig) => d.id === dataSourceId)
    if (dataSource) {
      Object.assign(dataSource, updates)
    }
  }

  async function loadDataSource(dataSourceId: string) {
    const dataSource = reportConfig.value.dataSources.find((d: DataSourceConfig) => d.id === dataSourceId)
    if (!dataSource) return false

    if (dataSource.type === 'mock') {
      originalTableData.value = [...mockTableData]
      return true
    }

    if (!dataSource.url) return false

    loading.value = true
    try {
      const response = await axios({
        url: dataSource.url,
        method: dataSource.method || 'GET',
        headers: dataSource.headers,
        data: dataSource.method === 'POST' ? dataSource.body : undefined
      })

      let data = response.data
      if (dataSource.dataPath) {
        const paths = dataSource.dataPath.split('.')
        for (const path of paths) {
          data = data?.[path]
        }
      }

      if (Array.isArray(data)) {
        originalTableData.value = data
        updateFieldsFromData(data)
        return true
      }
      return false
    } catch (error) {
      console.error('加载数据源失败:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  function updateFieldsFromData(data: MockDataItem[]) {
    if (data.length === 0) return

    const firstRow = data[0]
    const newFields: DataField[] = []

    Object.keys(firstRow).forEach((key: string) => {
      const value = firstRow[key]
      let type: DataField['type'] = 'string'

      if (typeof value === 'number') type = 'number'
      else if (typeof value === 'boolean') type = 'boolean'
      else if (typeof value === 'string' && !isNaN(Date.parse(value))) type = 'date'

      newFields.push({
        id: `field-${key}`,
        name: key,
        fieldName: key,
        type
      })
    })

    dataFields.value = newFields
  }

  function selectBlock(blockId: string | null) {
    selectedBlockId.value = blockId
  }

  function updateReportConfig(updates: Partial<ReportConfig>) {
    Object.assign(reportConfig.value, updates)
  }

  function formatValue(value: any, format: string, type: string): string {
    if (value === null || value === undefined) return ''

    if (type === 'date' && format) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return formatDate(date, format)
      }
    }

    if (type === 'number' && format && typeof value === 'number') {
      return formatNumber(value, format)
    }

    if (type === 'boolean') {
      return value ? '是' : '否'
    }

    return String(value)
  }

  function formatDate(date: Date, format: string): string {
    const map: { [key: string]: string } = {
      'YYYY': date.getFullYear().toString(),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'DD': date.getDate().toString().padStart(2, '0'),
      'HH': date.getHours().toString().padStart(2, '0'),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'ss': date.getSeconds().toString().padStart(2, '0')
    }
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match])
  }

  function formatNumber(num: number, format: string): string {
    if (format === '#,##0.00') {
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    if (format === '#,##0') {
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }
    if (format === '0.00%') {
      return (num * 100).toFixed(2) + '%'
    }
    if (format === '0.0%') {
      return (num * 100).toFixed(1) + '%'
    }
    return num.toString()
  }

  function calculateSummary(data: MockDataItem[], fieldName: string, summaryType: string): string {
    if (!data || data.length === 0) return '-'

    const values = data
      .map((row: MockDataItem) => row[fieldName])
      .filter((v: any) => v !== null && v !== undefined && !isNaN(Number(v)))
      .map((v: any) => Number(v))

    if (values.length === 0) return '-'

    switch (summaryType) {
      case 'sum':
        return formatNumber(values.reduce((a: number, b: number) => a + b, 0), '#,##0.00')
      case 'avg':
        return formatNumber(values.reduce((a: number, b: number) => a + b, 0) / values.length, '#,##0.00')
      case 'count':
        return String(values.length)
      case 'max':
        return formatNumber(Math.max(...values), '#,##0.00')
      case 'min':
        return formatNumber(Math.min(...values), '#,##0.00')
      default:
        return ''
    }
  }

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reportConfig.value))
  }

  function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const config: ReportConfig = JSON.parse(saved)
        reportConfig.value = {
          ...defaultConfig,
          ...config,
          dataSources: config.dataSources?.length ? config.dataSources : [{ ...defaultDataSource }]
        }
        selectedBlockId.value = null
        return true
      } catch (e) {
        console.error('加载配置失败:', e)
        return false
      }
    }
    return false
  }

  function clearConfig() {
    localStorage.removeItem(STORAGE_KEY)
    reportConfig.value = {
      ...defaultConfig,
      dataSources: [{ ...defaultDataSource }]
    }
    selectedBlockId.value = null
    originalTableData.value = [...mockTableData]
    tableData.value = [...mockTableData]
  }

  function exportExcel(tableConfigId?: string) {
    import('xlsx').then((XLSX: any) => {
      let columns: TableColumn[] = []
      if (tableConfigId) {
        const tableConfig = reportConfig.value.tableConfigs.find((c: TableBlockConfig) => c.id === tableConfigId)
        if (tableConfig) {
          columns = tableConfig.columns.filter((c: TableColumn) => c.visible).sort((a: TableColumn, b: TableColumn) => a.order - b.order)
        }
      } else if (reportConfig.value.tableConfigs.length > 0) {
        columns = reportConfig.value.tableConfigs[0].columns.filter((c: TableColumn) => c.visible).sort((a: TableColumn, b: TableColumn) => a.order - b.order)
      }

      const headers = columns.map((col: TableColumn) => col.columnName)
      const data = tableData.value.map((row: MockDataItem) => {
        return columns.map((col: TableColumn) => formatValue(row[col.fieldName], col.format, col.type))
      })
      const wsData = [headers, ...data]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '报表数据')
      XLSX.writeFile(wb, `${reportConfig.value.title || '报表'}.xlsx`)
    })
  }

  async function exportPDF(elementId: string) {
    const element = document.getElementById(elementId)
    if (!element) return

    loading.value = true
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${reportConfig.value.title || '报表'}.pdf`)
    } catch (error) {
      console.error('导出PDF失败:', error)
    } finally {
      loading.value = false
    }
  }

  function openFullscreenPreview() {
    fullscreenPreview.value = {
      visible: true,
      title: reportConfig.value.title
    }
  }

  function closeFullscreenPreview() {
    fullscreenPreview.value = {
      visible: false,
      title: ''
    }
  }

  function resetFilterValues() {
    reportConfig.value.filterConfigs.forEach((fc: FilterBlockConfig) => {
      fc.filters.forEach((f: FilterConfig) => {
        f.value = null
      })
    })
  }

  watch(activeFilters, () => {
    filteredTableData.value
  }, { deep: true })

  const blocks = computed(() => reportConfig.value.blocks)
  const tableConfigs = computed(() => reportConfig.value.tableConfigs)
  const chartConfigs = computed(() => reportConfig.value.chartConfigs)
  const filterConfigs = computed(() => reportConfig.value.filterConfigs)
  const dataSources = computed(() => reportConfig.value.dataSources)

  return {
    dataFields,
    tableData,
    originalTableData,
    filteredTableData,
    selectedBlockId,
    selectedBlock,
    selectedBlockConfig,
    reportConfig,
    fullscreenPreview,
    loading,
    activeFilters,
    blocks,
    tableConfigs,
    chartConfigs,
    filterConfigs,
    dataSources,
    addBlock,
    removeBlock,
    updateBlock,
    addColumnToTable,
    removeColumnFromTable,
    updateColumn,
    updateTableConfig,
    updateTableStyle,
    updatePagination,
    updateChartConfig,
    addFilter,
    removeFilter,
    updateFilter,
    addDataSource,
    removeDataSource,
    updateDataSource,
    loadDataSource,
    selectBlock,
    updateReportConfig,
    formatValue,
    calculateSummary,
    saveConfig,
    loadConfig,
    clearConfig,
    exportExcel,
    exportPDF,
    openFullscreenPreview,
    closeFullscreenPreview,
    resetFilterValues
  }
}
