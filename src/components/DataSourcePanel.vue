<template>
  <div class="data-source-panel">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="组件库" name="components">
        <div class="panel-content">
          <div class="section-title">基础组件</div>
          <div class="component-list">
            <div 
              v-for="comp in draggableComponents" 
              :key="comp.id"
              class="component-item"
              :class="`component-type-${comp.componentType}`"
              draggable="true"
              @dragstart="handleDragStart($event, { ...comp, __isComponent: true })"
              @dragend="handleDragEnd"
            >
              <el-icon class="component-icon">
                <component :is="getComponentIcon(comp.componentType!)" />
              </el-icon>
              <span class="component-name">{{ comp.name }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="数据字段" name="fields">
        <div class="panel-content">
          <div class="section-title">可用字段</div>
          <div class="field-list">
            <div 
              v-for="field in localFields" 
              :key="field.id"
              class="field-item" 
              :class="`field-type-${field.type}`"
              draggable="true"
              @dragstart="handleDragStart($event, { ...field, __isField: true })"
              @dragend="handleDragEnd"
              @dblclick="handleDoubleClick(field)"
            >
              <el-icon class="field-icon">
                <component :is="getTypeIcon(field.type)" />
              </el-icon>
              <span class="field-name">{{ field.name }}</span>
              <span class="field-type-tag">{{ getTypeLabel(field.type) }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="数据源" name="datasource">
        <DataSourceConfig />
      </el-tab-pane>
    </el-tabs>
    
    <div class="panel-footer">
      <el-text type="info" size="small">拖拽组件到画布开始设计</el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { 
  Document, Money, Calendar, Select, 
  Grid, Histogram, DataLine, PieChart, Filter 
} from '@element-plus/icons-vue'
import type { DataField, DraggableComponent } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'
import DataSourceConfig from './DataSourceConfig.vue'

const emit = defineEmits<{
  (e: 'add-field', field: DataField): void
  (e: 'add-block', type: string): void
}>()

const { dataFields, selectedBlock, selectedBlockConfig, addColumnToTable, addFilter } = useReportDesigner()

const activeTab = ref('components')

const localFields = ref<DataField[]>([...dataFields.value])

watch(() => dataFields.value, (newFields) => {
  localFields.value = [...newFields]
}, { deep: true })

const draggableComponents = computed<DraggableComponent[]>(() => [
  {
    id: 'comp-table',
    type: 'component',
    componentType: 'table',
    name: '数据表格',
    icon: 'Grid'
  },
  {
    id: 'comp-bar',
    type: 'component',
    componentType: 'bar',
    name: '柱状图',
    icon: 'Histogram'
  },
  {
    id: 'comp-line',
    type: 'component',
    componentType: 'line',
    name: '折线图',
    icon: 'DataLine'
  },
  {
    id: 'comp-pie',
    type: 'component',
    componentType: 'pie',
    name: '饼图',
    icon: 'PieChart'
  },
  {
    id: 'comp-filter',
    type: 'component',
    componentType: 'filter',
    name: '筛选条件',
    icon: 'Filter'
  }
])

function getTypeIcon(type: string) {
  const icons: { [key: string]: any } = {
    string: Document,
    number: Money,
    date: Calendar,
    boolean: Select
  }
  return icons[type] || Document
}

function getTypeLabel(type: string) {
  const labels: { [key: string]: string } = {
    string: '文本',
    number: '数字',
    date: '日期',
    boolean: '布尔'
  }
  return labels[type] || '文本'
}

function getComponentIcon(type: string) {
  const icons: { [key: string]: any } = {
    table: Grid,
    bar: Histogram,
    line: DataLine,
    pie: PieChart,
    filter: Filter
  }
  return icons[type] || Grid
}

function handleDragStart(event: DragEvent, data: any) {
  console.log('Drag start:', data)
  const jsonData = JSON.stringify(data)
  console.log('Drag data (JSON):', jsonData)
  event.dataTransfer!.setData('text/plain', jsonData)
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.dropEffect = 'copy'
}

function handleDragEnd(event: DragEvent) {
  console.log('Drag end:', event)
}

function handleDoubleClick(field: DataField) {
  if (selectedBlock.value?.type === 'table' && selectedBlockConfig.value) {
    addColumnToTable(selectedBlockConfig.value.id, field)
    emit('add-field', field)
  } else {
    emit('add-field', field)
  }
}
</script>

<style scoped>
.data-source-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

:deep(.el-tabs__header) {
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.component-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 8px;
  background: #f5f7fa;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
}

.component-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.component-item.component-type-table {
  border-left: 4px solid #409eff;
}

.component-item.component-type-bar {
  border-left: 4px solid #67c23a;
}

.component-item.component-type-line {
  border-left: 4px solid #e6a23c;
}

.component-item.component-type-pie {
  border-left: 4px solid #f56c6c;
}

.component-item.component-type-filter {
  border-left: 4px solid #909399;
}

.component-icon {
  font-size: 28px;
  color: #606266;
}

.component-name {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.field-list {
  min-height: 100px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s;
}

.field-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
  transform: translateX(4px);
}

.field-item.field-type-number {
  border-left: 4px solid #67c23a;
}

.field-item.field-type-date {
  border-left: 4px solid #e6a23c;
}

.field-item.field-type-boolean {
  border-left: 4px solid #909399;
}

.field-item.field-type-string {
  border-left: 4px solid #409eff;
}

.field-icon {
  font-size: 16px;
  color: #909399;
}

.field-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.field-type-tag {
  font-size: 12px;
  padding: 2px 6px;
  background: #e4e7ed;
  border-radius: 4px;
  color: #606266;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb !important;
}

.chosen {
  background: #ecf5ff !important;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
  text-align: center;
}
</style>
