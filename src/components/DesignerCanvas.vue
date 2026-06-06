<template>
  <div class="designer-canvas">
    <div class="canvas-header">
      <div class="header-left">
        <span class="header-title">报表画布</span>
        <el-tag size="small" type="info">
          {{ blocks.length }} 个区块
        </el-tag>
      </div>
      <div class="header-right">
        <el-button size="small" @click="handlePreview">
          <el-icon><FullScreen /></el-icon>
          全屏预览
        </el-button>
        <el-button size="small" type="success" @click="$emit('export-excel')">
          <el-icon><Download /></el-icon>
          导出 Excel
        </el-button>
        <el-button size="small" type="warning" @click="$emit('export-pdf')">
          <el-icon><Picture /></el-icon>
          导出 PDF
        </el-button>
      </div>
    </div>
    
    <div class="canvas-content">
      <div class="title-config">
        <el-form :inline="true" :model="reportConfig" class="title-form">
          <el-form-item label="报表标题">
            <el-input 
              :model-value="reportConfig.title" 
              @update:model-value="handleTitleUpdate('title', $event)"
              placeholder="请输入报表标题" 
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item label="标题对齐">
            <el-radio-group 
              :model-value="reportConfig.titleAlign" 
              @update:model-value="handleTitleUpdate('titleAlign', $event)"
            >
              <el-radio-button label="left">左对齐</el-radio-button>
              <el-radio-button label="center">居中</el-radio-button>
              <el-radio-button label="right">右对齐</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="字体大小">
            <el-input-number 
              :model-value="reportConfig.titleFontSize" 
              @update:model-value="handleTitleUpdate('titleFontSize', $event)"
              :min="12" 
              :max="36" 
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="layout-canvas" id="report-content">
        <div class="report-title-section">
          <h2 
            class="report-title" 
            :style="{
              textAlign: reportConfig.titleAlign,
              fontSize: reportConfig.titleFontSize + 'px'
            }"
          >
            {{ reportConfig.title || '未命名报表' }}
          </h2>
        </div>
        
        <div 
          class="blocks-container"
          @dragover.prevent="handleDragOver"
          @drop="handleDrop"
        >
          <template v-for="block in sortedBlocks" :key="block.id">
            <div 
              v-if="block.visible"
              class="block-wrapper"
              :class="{ 'block-selected': selectedBlockId === block.id }"
              :style="getBlockStyle(block)"
              @click="handleSelectBlock(block.id)"
            >
              <div class="block-header">
                <span class="block-title">{{ block.title }}</span>
                <span class="block-type-tag">
                  <el-tag size="small" :type="getBlockTagType(block.type)">
                    {{ getBlockTypeName(block.type) }}
                  </el-tag>
                </span>
              </div>
              
              <div 
                class="block-content"
                @click.stop
              >
                <ReportFilter
                  v-if="block.type === 'filter' && getFilterConfig(block.configId)"
                  :filter-block-config="getFilterConfig(block.configId)!"
                />
                
                <div 
                  v-else-if="block.type === 'table' && getTableConfig(block.configId)"
                  class="table-block-drop-zone"
                  @dragover.prevent
                  @drop="handleDropToTable($event, block.configId)"
                >
                  <ReportTable 
                    v-if="getTableConfig(block.configId)!.columns.length > 0"
                    :table-config="getTableConfig(block.configId)!"
                  />
                  <div v-else class="empty-table-tip">
                    <el-icon><DocumentAdd /></el-icon>
                    <p>请从左侧拖拽字段到此表格</p>
                  </div>
                </div>
                
                <ReportChart
                  v-else-if="block.type === 'chart' && getChartConfig(block.configId)"
                  :chart-config="getChartConfig(block.configId)!.chartConfig"
                  :height="300"
                />
              </div>
              
              <div class="block-actions">
                <el-button 
                  size="small" 
                  text 
                  type="danger"
                  @click.stop="handleDeleteBlock(block.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          
          <div 
            v-if="blocks.length === 0" 
            class="empty-canvas"
            @dragover.prevent
            @drop="handleDrop"
          >
            <el-icon class="empty-icon"><Grid /></el-icon>
            <p class="empty-title">拖拽组件到此处开始设计</p>
            <p class="empty-sub">支持表格、柱状图、折线图、饼图、筛选器</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FullScreen, Download, Picture, DocumentAdd, Delete, Grid } from '@element-plus/icons-vue'
import type { 
  LayoutBlock, 
  ReportConfig, 
  TableBlockConfig, 
  ChartBlockConfig, 
  FilterBlockConfig,
  DataField,
  DraggableComponent,
  ChartType
} from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'
import ReportTable from './ReportTable.vue'
import ReportChart from './ReportChart.vue'
import ReportFilter from './ReportFilter.vue'

const props = defineProps<{
  reportConfig: ReportConfig
  selectedBlockId: string | null
}>()

const emit = defineEmits<{
  (e: 'update-config', config: Partial<ReportConfig>): void
  (e: 'select-block', blockId: string): void
  (e: 'add-block', type: 'table' | ChartType | 'filter', x: number, y: number): void
  (e: 'remove-block', blockId: string): void
  (e: 'add-field', tableConfigId: string, field: DataField): void
  (e: 'export-excel'): void
  (e: 'export-pdf'): void
  (e: 'preview'): void
}>()

const { blocks, tableConfigs, chartConfigs, filterConfigs, addBlock, removeBlock, addColumnToTable, selectBlock } = useReportDesigner()

const sortedBlocks = computed(() => {
  return [...props.reportConfig.blocks].sort((a: LayoutBlock, b: LayoutBlock) => a.y - b.y || a.x - b.x)
})

function getTableConfig(configId: string): TableBlockConfig | undefined {
  return props.reportConfig.tableConfigs.find((c: TableBlockConfig) => c.id === configId)
}

function getChartConfig(configId: string): ChartBlockConfig | undefined {
  return props.reportConfig.chartConfigs.find((c: ChartBlockConfig) => c.id === configId)
}

function getFilterConfig(configId: string): FilterBlockConfig | undefined {
  return props.reportConfig.filterConfigs.find((c: FilterBlockConfig) => c.id === configId)
}

function getBlockStyle(block: LayoutBlock) {
  return {
    gridColumn: `span ${block.width}`,
    gridRow: `span ${block.height}`
  }
}

function getBlockTypeName(type: string) {
  const names: Record<string, string> = {
    table: '表格',
    chart: '图表',
    filter: '筛选'
  }
  return names[type] || type
}

function getBlockTagType(type: string) {
  const types: Record<string, string> = {
    table: 'primary',
    chart: 'success',
    filter: 'warning'
  }
  return types[type] || 'info'
}

function handleTitleUpdate(key: keyof ReportConfig, value: any) {
  emit('update-config', { [key]: value })
}

function handleDragOver(event: DragEvent) {
  event.dataTransfer!.dropEffect = 'copy'
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  
  try {
    const dragData = JSON.parse(event.dataTransfer!.getData('text/plain'))
    
    if (dragData.__isComponent) {
      const compType = dragData.componentType
      let blockType: 'table' | ChartType | 'filter' = 'table'
      
      if (compType === 'table' || compType === 'filter') {
        blockType = compType
      } else if (compType === 'bar' || compType === 'line' || compType === 'pie') {
        blockType = compType as ChartType
      }
      
      emit('add-block', blockType, 0, props.reportConfig.blocks.length)
      return
    }
    
    if (dragData.__isField) {
      const field = dragData as DataField
      if (props.reportConfig.tableConfigs.length === 0) {
        emit('add-block', 'table', 0, props.reportConfig.blocks.length)
        setTimeout(() => {
          if (props.reportConfig.tableConfigs.length > 0) {
            const lastTableConfig = props.reportConfig.tableConfigs[props.reportConfig.tableConfigs.length - 1]
            addColumnToTable(lastTableConfig.id, field)
          }
        }, 0)
      } else {
        const lastTableConfig = props.reportConfig.tableConfigs[props.reportConfig.tableConfigs.length - 1]
        addColumnToTable(lastTableConfig.id, field)
      }
    }
  } catch (e) {
    console.log('Drop data parsing failed')
  }
}

function handleDropToTable(event: DragEvent, tableConfigId: string) {
  event.preventDefault()
  event.stopPropagation()
  
  try {
    const dragData = JSON.parse(event.dataTransfer!.getData('text/plain'))
    
    if (dragData.__isField) {
      const field = dragData as DataField
      addColumnToTable(tableConfigId, field)
    }
  } catch (e) {
    console.log('Drop to table failed')
  }
}

function handleSelectBlock(blockId: string) {
  emit('select-block', blockId)
}

function handleDeleteBlock(blockId: string) {
  emit('remove-block', blockId)
}

function handlePreview() {
  emit('preview')
}
</script>

<style scoped>
.designer-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 8px;
}

.canvas-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title-config {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.title-form {
  margin: 0;
}

.layout-canvas {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 500px;
}

.report-title-section {
  margin-bottom: 24px;
}

.report-title {
  margin: 0;
  color: #303133;
  font-weight: 700;
}

.blocks-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: 80px;
  gap: 16px;
  min-height: 400px;
}

.block-wrapper {
  position: relative;
  background: #fafafa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.block-wrapper:hover {
  border-color: #b3d8ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.block-selected {
  border-color: #409eff !important;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2) !important;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  cursor: move;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.block-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.table-block-drop-zone {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.empty-table-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #909399;
  border: 2px dashed #dcdfe6;
  margin: 8px;
  border-radius: 6px;
  transition: all 0.3s;
}

.empty-table-tip:hover {
  border-color: #409eff;
  background: #f5faff;
}

.empty-table-tip .el-icon {
  font-size: 48px;
  color: #dcdfe6;
  margin-bottom: 12px;
}

.block-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.empty-canvas {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px dashed #dcdfe6;
  border-radius: 12px;
  min-height: 400px;
  color: #909399;
  transition: all 0.3s;
}

.empty-canvas:hover {
  border-color: #409eff;
  background: #f5faff;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-sub {
  font-size: 14px;
  color: #c0c4cc;
}
</style>
