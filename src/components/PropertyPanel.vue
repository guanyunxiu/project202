<template>
  <div class="property-panel">
    <div class="panel-header">
      <span class="header-title">属性配置</span>
    </div>
    
    <div class="panel-content">
      <div v-if="!selectedBlock" class="empty-state">
        <el-icon class="empty-icon"><Pointer /></el-icon>
        <p>请选择一个区块进行配置</p>
      </div>
      
      <div v-else-if="selectedBlock.type === 'table' && tableConfig" class="property-form">
        <div class="form-section">
          <div class="section-title">基本属性</div>
          <el-form label-width="80px" :model="tableConfig">
            <el-form-item label="标题">
              <el-input v-model="selectedBlock.title" @input="handleBlockUpdate" />
            </el-form-item>
            <el-form-item label="显示">
              <el-switch v-model="selectedBlock.visible" @change="handleBlockUpdate" />
            </el-form-item>
            <el-form-item label="尾行汇总">
              <el-switch v-model="tableConfig.showSummary" @change="handleTableConfigUpdate" />
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">表格样式</div>
          <el-form label-width="80px" :model="tableConfig.style">
            <el-form-item label="表头底色">
              <el-color-picker v-model="tableConfig.style.headerBgColor" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item label="表头文字">
              <el-color-picker v-model="tableConfig.style.headerTextColor" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item label="斑马行">
              <el-switch v-model="tableConfig.style.zebraStripe" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item v-if="tableConfig.style.zebraStripe" label="斑马行色">
              <el-color-picker v-model="tableConfig.style.zebraStripeColor" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item label="边框">
              <el-switch v-model="tableConfig.style.border" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item v-if="tableConfig.style.border" label="边框颜色">
              <el-color-picker v-model="tableConfig.style.borderColor" @change="handleTableStyleUpdate" />
            </el-form-item>
            <el-form-item label="行高">
              <el-input-number v-model="tableConfig.style.rowHeight" :min="30" :max="80" @change="handleTableStyleUpdate" />
              <span class="unit">px</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">分页配置</div>
          <el-form label-width="80px" :model="tableConfig.pagination">
            <el-form-item label="启用分页">
              <el-switch v-model="tableConfig.pagination.enabled" @change="handlePaginationUpdate" />
            </el-form-item>
            <template v-if="tableConfig.pagination.enabled">
              <el-form-item label="每页条数">
                <el-input-number v-model="tableConfig.pagination.pageSize" :min="5" :max="200" @change="handlePaginationUpdate" />
              </el-form-item>
              <el-form-item label="显示总数">
                <el-switch v-model="tableConfig.pagination.showTotal" @change="handlePaginationUpdate" />
              </el-form-item>
              <el-form-item label="切换条数">
                <el-switch v-model="tableConfig.pagination.showSizeChanger" @change="handlePaginationUpdate" />
              </el-form-item>
              <el-form-item label="快速跳转">
                <el-switch v-model="tableConfig.pagination.showQuickJumper" @change="handlePaginationUpdate" />
              </el-form-item>
            </template>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">列配置</div>
          <div v-if="tableConfig.columns.length === 0" class="no-columns">
            <el-text type="info">暂无列，请从左侧拖拽字段添加</el-text>
          </div>
          <div v-else class="columns-list">
            <div 
              v-for="col in sortedColumns" 
              :key="col.id" 
              class="column-item"
              :class="{ active: selectedColumnId === col.id }"
              @click="selectColumn(col.id)"
            >
              <div class="column-header">
                <span class="column-name">{{ col.columnName }}</span>
                <el-button 
                  size="small" 
                  text 
                  type="danger"
                  @click.stop="removeColumn(col.id)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <div class="column-config">
                <el-form label-width="60px" size="small" :model="col">
                  <el-form-item label="列宽">
                    <el-input-number v-model="col.width" :min="60" :max="500" @change="handleUpdateColumn(col.id)" />
                  </el-form-item>
                  <el-form-item label="对齐">
                    <el-radio-group v-model="col.align" @change="handleUpdateColumn(col.id)">
                      <el-radio-button label="left">左</el-radio-button>
                      <el-radio-button label="center">中</el-radio-button>
                      <el-radio-button label="right">右</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="显示">
                    <el-switch v-model="col.visible" @change="handleUpdateColumn(col.id)" />
                  </el-form-item>
                  <el-form-item label="冻结">
                    <el-switch v-model="col.frozen" @change="handleUpdateColumn(col.id)" />
                  </el-form-item>
                  <el-form-item label="汇总">
                    <el-select v-model="col.summaryType" @change="handleUpdateColumn(col.id)">
                      <el-option label="无" value="none" />
                      <el-option label="求和" value="sum" />
                      <el-option label="平均" value="avg" />
                      <el-option label="计数" value="count" />
                      <el-option label="最大" value="max" />
                      <el-option label="最小" value="min" />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="hasFormat(col.type)" label="格式">
                    <el-select v-model="col.format" @change="handleUpdateColumn(col.id)">
                      <el-option v-for="opt in getFormatOptions(col.type)" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section delete-section">
          <el-button type="danger" style="width: 100%" @click="handleDeleteBlock">
            <el-icon><Delete /></el-icon>
            删除此区块
          </el-button>
        </div>
      </div>
      
      <div v-else-if="selectedBlock.type === 'chart' && chartConfig" class="property-form">
        <div class="form-section">
          <div class="section-title">图表属性</div>
          <el-form label-width="80px" :model="selectedBlock">
            <el-form-item label="标题">
              <el-input v-model="selectedBlock.title" @input="handleBlockUpdate" />
            </el-form-item>
            <el-form-item label="显示">
              <el-switch v-model="selectedBlock.visible" @change="handleBlockUpdate" />
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">图表配置</div>
          <el-form label-width="80px" :model="chartConfig.chartConfig">
            <el-form-item label="图表类型">
              <el-tag :type="getChartTypeTag(chartConfig.chartConfig.type)">
                {{ getChartTypeName(chartConfig.chartConfig.type) }}
              </el-tag>
            </el-form-item>
            <el-form-item label="X轴字段">
              <el-select v-model="chartConfig.chartConfig.xAxisField" placeholder="请选择X轴字段" @change="handleChartConfigUpdate">
                <el-option 
                  v-for="field in dataFields" 
                  :key="field.id" 
                  :label="field.name" 
                  :value="field.fieldName" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Y轴字段">
              <el-select v-model="chartConfig.chartConfig.yAxisField" placeholder="请选择Y轴字段" @change="handleChartConfigUpdate">
                <el-option 
                  v-for="field in numberFields" 
                  :key="field.id" 
                  :label="field.name" 
                  :value="field.fieldName" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="显示图例">
              <el-switch v-model="chartConfig.chartConfig.showLegend" @change="handleChartConfigUpdate" />
            </el-form-item>
            <el-form-item label="数据缩放">
              <el-switch v-model="chartConfig.chartConfig.showDataZoom" @change="handleChartConfigUpdate" />
            </el-form-item>
            <el-form-item v-if="chartConfig.chartConfig.type === 'line'" label="平滑曲线">
              <el-switch v-model="chartConfig.chartConfig.smooth" @change="handleChartConfigUpdate" />
            </el-form-item>
            <el-form-item v-if="chartConfig.chartConfig.type !== 'pie'" label="堆叠显示">
              <el-switch v-model="chartConfig.chartConfig.stack" @change="handleChartConfigUpdate" />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="form-section">
          <div class="section-title">配色方案</div>
          <div class="color-palette">
            <div 
              v-for="(color, index) in chartConfig.chartConfig.colorPalette" 
              :key="index"
              class="color-item"
              :style="{ backgroundColor: color }"
              @click="handleColorChange(index)"
            >
              <el-icon v-if="chartConfig.chartConfig.colorPalette.length > 2" class="remove-color" @click.stop="removeColor(index)">
                <Close />
              </el-icon>
            </div>
            <el-button class="add-color" size="small" @click="addColor">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="form-section delete-section">
          <el-button type="danger" style="width: 100%" @click="handleDeleteBlock">
            <el-icon><Delete /></el-icon>
            删除此区块
          </el-button>
        </div>
      </div>
      
      <div v-else-if="selectedBlock.type === 'filter' && filterConfig" class="property-form">
        <div class="form-section">
          <div class="section-title">筛选器属性</div>
          <el-form label-width="80px" :model="selectedBlock">
            <el-form-item label="标题">
              <el-input v-model="selectedBlock.title" @input="handleBlockUpdate" />
            </el-form-item>
            <el-form-item label="显示">
              <el-switch v-model="selectedBlock.visible" @change="handleBlockUpdate" />
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">筛选条件</div>
          <div class="filter-actions">
            <el-button size="small" type="primary" @click="addNewFilter('text')">
              <el-icon><Plus /></el-icon>
              文本筛选
            </el-button>
            <el-button size="small" type="success" @click="addNewFilter('date')">
              <el-icon><Plus /></el-icon>
              日期筛选
            </el-button>
            <el-button size="small" type="warning" @click="addNewFilter('dateRange')">
              <el-icon><Plus /></el-icon>
              日期范围
            </el-button>
            <el-button size="small" type="info" @click="addNewFilter('select')">
              <el-icon><Plus /></el-icon>
              下拉筛选
            </el-button>
          </div>
          
          <div v-if="filterConfig.filters.length === 0" class="no-filters">
            <el-text type="info">暂无筛选条件，请添加</el-text>
          </div>
          
          <div v-else class="filters-list">
            <div 
              v-for="filter in filterConfig.filters" 
              :key="filter.id" 
              class="filter-item"
            >
              <div class="filter-header">
                <span class="filter-name">{{ filter.label }}</span>
                <div class="filter-actions-mini">
                  <el-switch v-model="filter.enabled" size="small" @change="handleUpdateFilter(filter.id)" />
                  <el-button size="small" text type="danger" @click="handleRemoveFilter(filter.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="filter-config">
                <el-form label-width="60px" size="small" :model="filter">
                  <el-form-item label="标签">
                    <el-input v-model="filter.label" @input="handleUpdateFilter(filter.id)" />
                  </el-form-item>
                  <el-form-item label="字段">
                    <el-select v-model="filter.fieldName" @change="handleUpdateFilter(filter.id)">
                      <el-option 
                        v-for="field in dataFields" 
                        :key="field.id" 
                        :label="field.name" 
                        :value="field.fieldName" 
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="占位符">
                    <el-input v-model="filter.placeholder" @input="handleUpdateFilter(filter.id)" />
                  </el-form-item>
                  <el-form-item v-if="filter.type === 'select'" label="选项">
                    <div class="options-editor">
                      <div v-for="(opt, idx) in filter.options" :key="idx" class="option-item">
                        <el-input v-model="opt.label" placeholder="标签" size="small" @input="handleUpdateFilter(filter.id)" />
                        <el-input v-model="opt.value" placeholder="值" size="small" @input="handleUpdateFilter(filter.id)" />
                        <el-button size="small" text type="danger" @click="removeOption(filter.id, idx)">
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                      <el-button size="small" @click="addOption(filter.id)">
                        <el-icon><Plus /></el-icon>
                        添加选项
                      </el-button>
                    </div>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section delete-section">
          <el-button type="danger" style="width: 100%" @click="handleDeleteBlock">
            <el-icon><Delete /></el-icon>
            删除此区块
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Pointer, Delete, Close, Plus } from '@element-plus/icons-vue'
import type { 
  LayoutBlock,
  TableBlockConfig,
  ChartBlockConfig,
  FilterBlockConfig,
  TableColumn,
  FilterType,
  FilterConfig,
  ChartType
} from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const props = defineProps<{
  selectedBlock: LayoutBlock | null
}>()

const {
  selectedBlockConfig,
  dataFields,
  updateBlock,
  removeBlock,
  updateColumn: updateColumnInTable,
  removeColumnFromTable,
  updateTableConfig,
  updateTableStyle,
  updatePagination,
  updateChartConfig,
  addFilter,
  removeFilter: removeFilterFromBlock,
  updateFilter: updateFilterInBlock
} = useReportDesigner()

const activeTab = ref('table')
const selectedColumnId = ref<string | null>(null)

const tableConfig = computed<TableBlockConfig | null>(() => {
  return selectedBlockConfig.value as TableBlockConfig | null
})

const chartConfig = computed<ChartBlockConfig | null>(() => {
  return selectedBlockConfig.value as ChartBlockConfig | null
})

const filterConfig = computed<FilterBlockConfig | null>(() => {
  return selectedBlockConfig.value as FilterBlockConfig | null
})

const sortedColumns = computed(() => {
  if (!tableConfig.value) return []
  return [...tableConfig.value.columns].sort((a: TableColumn, b: TableColumn) => a.order - b.order)
})

const numberFields = computed(() => {
  return dataFields.value.filter((f: any) => f.type === 'number')
})

function handleBlockUpdate() {
  if (props.selectedBlock) {
    updateBlock(props.selectedBlock.id, { ...props.selectedBlock })
  }
}

function handleTableConfigUpdate() {
  if (tableConfig.value) {
    updateTableConfig(tableConfig.value.id, { ...tableConfig.value })
  }
}

function handleTableStyleUpdate() {
  if (tableConfig.value) {
    updateTableStyle(tableConfig.value.id, { ...tableConfig.value.style })
  }
}

function handlePaginationUpdate() {
  if (tableConfig.value) {
    updatePagination(tableConfig.value.id, { ...tableConfig.value.pagination })
  }
}

function handleChartConfigUpdate() {
  if (chartConfig.value) {
    updateChartConfig(chartConfig.value.id, { ...chartConfig.value.chartConfig })
  }
}

function selectColumn(columnId: string) {
  selectedColumnId.value = columnId
}

function removeColumn(columnId: string) {
  if (tableConfig.value) {
    removeColumnFromTable(tableConfig.value.id, columnId)
    if (selectedColumnId.value === columnId) {
      selectedColumnId.value = null
    }
  }
}

function hasFormat(type: string) {
  return type === 'number' || type === 'date'
}

function getFormatOptions(type: string) {
  if (type === 'number') {
    return [
      { label: '默认', value: '' },
      { label: '千分位两位 #,##0.00', value: '#,##0.00' },
      { label: '千分位整数 #,##0', value: '#,##0' },
      { label: '百分比两位 0.00%', value: '0.00%' },
      { label: '百分比一位 0.0%', value: '0.0%' }
    ]
  }
  if (type === 'date') {
    return [
      { label: '默认', value: '' },
      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
      { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
      { label: 'YYYY-MM-DD HH:mm', value: 'YYYY-MM-DD HH:mm' },
      { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' }
    ]
  }
  return []
}

function getChartTypeName(type: ChartType) {
  const names: Record<ChartType, string> = { bar: '柱状图', line: '折线图', pie: '饼图' }
  return names[type] || '图表'
}

function getChartTypeTag(type: ChartType) {
  const tags: Record<ChartType, string> = { bar: 'success', line: 'warning', pie: 'danger' }
  return tags[type] || 'primary'
}

function handleColorChange(index: number) {
  const input = document.createElement('input')
  input.type = 'color'
  input.value = chartConfig.value!.chartConfig.colorPalette[index]
  input.onchange = () => {
    if (chartConfig.value) {
      const newPalette = [...chartConfig.value.chartConfig.colorPalette]
      newPalette[index] = input.value
      updateChartConfig(chartConfig.value.id, { colorPalette: newPalette })
    }
  }
  input.click()
}

function addColor() {
  if (chartConfig.value) {
    const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#8e44ad', '#16a085', '#d35400']
    const currentColors = chartConfig.value.chartConfig.colorPalette
    const nextColor = colors[currentColors.length % colors.length]
    const newPalette = [...currentColors, nextColor]
    updateChartConfig(chartConfig.value.id, { colorPalette: newPalette })
  }
}

function removeColor(index: number) {
  if (chartConfig.value && chartConfig.value.chartConfig.colorPalette.length > 2) {
    const newPalette = chartConfig.value.chartConfig.colorPalette.filter((_, i) => i !== index)
    updateChartConfig(chartConfig.value.id, { colorPalette: newPalette })
  }
}

function addNewFilter(type: FilterType) {
  if (filterConfig.value) {
    addFilter(filterConfig.value.id, type)
  }
}

function handleUpdateColumn(columnId: string) {
  if (tableConfig.value) {
    const column = tableConfig.value.columns.find((c: TableColumn) => c.id === columnId)
    if (column) {
      updateColumnInTable(tableConfig.value.id, columnId, { ...column })
    }
  }
}

function handleUpdateFilter(filterId: string) {
  if (filterConfig.value) {
    const filter = filterConfig.value.filters.find((f: FilterConfig) => f.id === filterId)
    if (filter) {
      updateFilterInBlock(filterConfig.value.id, filterId, { ...filter })
    }
  }
}

function handleRemoveFilter(filterId: string) {
  if (filterConfig.value) {
    removeFilterFromBlock(filterConfig.value.id, filterId)
  }
}

function addOption(filterId: string) {
  if (filterConfig.value) {
    const filter = filterConfig.value.filters.find((f: FilterConfig) => f.id === filterId)
    if (filter) {
      filter.options.push({ label: '新选项', value: '' })
      updateFilterInBlock(filterConfig.value.id, filterId, { options: [...filter.options] })
    }
  }
}

function removeOption(filterId: string, optionIndex: number) {
  if (filterConfig.value) {
    const filter = filterConfig.value.filters.find((f: FilterConfig) => f.id === filterId)
    if (filter) {
      filter.options.splice(optionIndex, 1)
      updateFilterInBlock(filterConfig.value.id, filterId, { options: [...filter.options] })
    }
  }
}

function handleDeleteBlock() {
  if (props.selectedBlock) {
    removeBlock(props.selectedBlock.id)
  }
}

watch(() => props.selectedBlock, () => {
  selectedColumnId.value = null
  activeTab.value = 'table'
})
</script>

<style scoped>
.property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e4e7ed;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

.columns-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.column-item.active {
  border-color: #409eff;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  cursor: pointer;
}

.column-name {
  font-weight: 500;
  color: #303133;
}

.column-config {
  padding: 12px;
  border-top: 1px solid #e4e7ed;
}

.no-columns, .no-filters {
  padding: 20px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 6px;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filters-list {
  max-height: 500px;
  overflow-y: auto;
}

.filter-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
}

.filter-name {
  font-weight: 500;
  color: #303133;
}

.filter-actions-mini {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-config {
  padding: 12px;
  border-top: 1px solid #e4e7ed;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-item .el-input {
  flex: 1;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.color-item {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
}

.remove-color {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 12px;
  color: #fff;
  background: #f56c6c;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-color {
  width: 32px;
  height: 32px;
  padding: 0;
  min-width: 32px;
}

.delete-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>
