<template>
  <div class="report-table">
    <div class="table-wrapper" :style="tableWrapperStyle">
      <el-table
        ref="tableRef"
        :data="pagedData"
        :border="tableConfig.style.border"
        :stripe="tableConfig.style.zebraStripe"
        :row-style="{ height: tableConfig.style.rowHeight + 'px' }"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        style="width: 100%"
        size="small"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column
          v-for="col in visibleColumns"
          :key="col.id"
          :prop="col.fieldName"
          :label="col.columnName"
          :width="col.width"
          :align="col.align"
          :fixed="col.frozen ? 'left' : false"
        >
          <template #default="{ row }">
            {{ formatValue(row[col.fieldName], col.format, col.type) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="visibleColumns.length === 0"
          label="请添加列"
          align="center"
        >
          <template #default>
            <el-text type="info">从左侧拖拽字段开始设计报表</el-text>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div v-if="tableConfig.pagination.enabled && !isPreview" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="tableData.length"
        :show-total="tableConfig.pagination.showTotal"
        :show-size-changer="tableConfig.pagination.showSizeChanger"
        :show-quick-jumper="tableConfig.pagination.showQuickJumper"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableBlockConfig, TableColumn, MockDataItem, TableStyle } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const props = defineProps<{
  tableConfig: TableBlockConfig
  isPreview?: boolean
}>()

const { tableData, formatValue, calculateSummary } = useReportDesigner()

const tableRef = ref()
const currentPage = ref(1)
const pageSize = ref(props.tableConfig.pagination.pageSize || 10)

const visibleColumns = computed(() => {
  return [...props.tableConfig.columns]
    .filter((col: TableColumn) => col.visible)
    .sort((a: TableColumn, b: TableColumn) => a.order - b.order)
})

const pagedData = computed(() => {
  if (!props.tableConfig.pagination.enabled || props.isPreview) {
    return tableData.value
  }
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

const tableWrapperStyle = computed(() => ({
  '--zebra-color': props.tableConfig.style.zebraStripeColor
}))

const headerCellStyle = computed(() => ({
  backgroundColor: props.tableConfig.style.headerBgColor,
  color: props.tableConfig.style.headerTextColor,
  fontWeight: '600',
  borderColor: props.tableConfig.style.borderColor
}))

const cellStyle = computed(() => ({
  borderColor: props.tableConfig.style.borderColor
}))

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page
}

function getSummaries(param: { columns: any[]; data: any[] }) {
  if (!props.tableConfig.showSummary) {
    return param.columns.map(() => '')
  }

  const { columns } = param
  const result: (string | number)[] = []

  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      result.push('合计')
      return
    }

    const tableCol = visibleColumns.value.find(
      (col: TableColumn) => col.fieldName === column.property
    )

    if (tableCol && tableCol.summaryType && tableCol.summaryType !== 'none') {
      result.push(calculateSummary(tableData.value, tableCol.fieldName, tableCol.summaryType))
    } else {
      result.push('')
    }
  })

  return result
}

watch(
  () => props.tableConfig.pagination.pageSize,
  (newSize) => {
    pageSize.value = newSize
  }
)
</script>

<style scoped>
.report-table {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: var(--zebra-color, #f5f7fa);
}

:deep(.el-table__body tr:hover > td) {
  background-color: #ecf5ff !important;
}

:deep(.el-table__summary td) {
  background-color: #f0f9eb !important;
  font-weight: 600;
  color: #67c23a;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}
</style>
