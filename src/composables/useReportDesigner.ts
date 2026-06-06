import { ref, computed, watch } from 'vue'
import type { TableColumn, ReportConfig, DataField, MockDataItem } from '@/types'
import { mockDataFields, mockTableData } from '@/data/mockData'

const STORAGE_KEY = 'report_designer_config'

const defaultConfig: ReportConfig = {
  title: '销售订单报表',
  titleAlign: 'center',
  titleFontSize: 20,
  columns: []
}

export function useReportDesigner() {
  const dataFields = ref<DataField[]>([...mockDataFields])
  const tableColumns = ref<TableColumn[]>([])
  const selectedColumnId = ref<string | null>(null)
  const reportConfig = ref<ReportConfig>({ ...defaultConfig })
  const tableData = ref<MockDataItem[]>([...mockTableData])

  const selectedColumn = computed(() => {
    if (!selectedColumnId.value) return null
    return tableColumns.value.find((col: TableColumn) => col.id === selectedColumnId.value) || null
  })

  const visibleColumns = computed(() => {
    return tableColumns.value
      .filter((col: TableColumn) => col.visible)
      .sort((a: TableColumn, b: TableColumn) => a.order - b.order)
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function addColumn(field: DataField) {
    const exists = tableColumns.value.find((col: TableColumn) => col.fieldId === field.id)
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
      order: tableColumns.value.length
    }

    tableColumns.value.push(newColumn)
    selectedColumnId.value = newColumn.id
  }

  function removeColumn(columnId: string) {
    const index = tableColumns.value.findIndex((col: TableColumn) => col.id === columnId)
    if (index > -1) {
      tableColumns.value.splice(index, 1)
      if (selectedColumnId.value === columnId) {
        selectedColumnId.value = null
      }
      updateColumnOrder()
    }
  }

  function updateColumnOrder() {
    tableColumns.value.forEach((col: TableColumn, index: number) => {
      col.order = index
    })
  }

  function selectColumn(columnId: string) {
    selectedColumnId.value = columnId
  }

  function updateColumn(columnId: string, updates: Partial<TableColumn>) {
    const column = tableColumns.value.find((col: TableColumn) => col.id === columnId)
    if (column) {
      Object.assign(column, updates)
    }
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

  function saveConfig() {
    const configToSave: ReportConfig = {
      ...reportConfig.value,
      columns: [...tableColumns.value]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave))
  }

  function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const config: ReportConfig = JSON.parse(saved)
        reportConfig.value = {
          title: config.title || defaultConfig.title,
          titleAlign: config.titleAlign || defaultConfig.titleAlign,
          titleFontSize: config.titleFontSize || defaultConfig.titleFontSize,
          columns: []
        }
        tableColumns.value = config.columns || []
        selectedColumnId.value = null
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
    reportConfig.value = { ...defaultConfig }
    tableColumns.value = []
    selectedColumnId.value = null
  }

  function exportExcel() {
    import('xlsx').then((XLSX: any) => {
      const headers = visibleColumns.value.map((col: TableColumn) => col.columnName)
      const data = tableData.value.map((row: MockDataItem) => {
        return visibleColumns.value.map((col: TableColumn) => {
          return formatValue(row[col.fieldName], col.format, col.type)
        })
      })
      const wsData = [headers, ...data]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '报表数据')
      XLSX.writeFile(wb, `${reportConfig.value.title || '报表'}.xlsx`)
    })
  }

  watch([tableColumns, reportConfig], () => {
    updateColumnOrder()
  }, { deep: true })

  return {
    dataFields,
    tableColumns,
    selectedColumnId,
    selectedColumn,
    visibleColumns,
    reportConfig,
    tableData,
    addColumn,
    removeColumn,
    selectColumn,
    updateColumn,
    updateReportConfig,
    formatValue,
    saveConfig,
    loadConfig,
    clearConfig,
    exportExcel
  }
}
