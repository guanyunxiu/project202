<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="100%"
    fullscreen
    class="fullscreen-preview-dialog"
    @update:model-value="$emit('update:model-value', $event)"
    @close="$emit('close')"
  >
    <template #header>
      <div class="preview-header">
        <span class="preview-title">{{ title }}</span>
        <div class="preview-actions">
          <el-button size="small" @click="$emit('export-excel')">
            <el-icon><Download /></el-icon>
            导出 Excel
          </el-button>
          <el-button size="small" @click="$emit('export-pdf')">
            <el-icon><Picture /></el-icon>
            导出 PDF
          </el-button>
          <el-button size="small" @click="$emit('close')">
            <el-icon><Close /></el-icon>
            关闭预览
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="preview-content" id="fullscreen-preview-content">
      <div class="preview-container">
        <h1 
          class="report-title" 
          :style="{
            textAlign: reportConfig.titleAlign,
            fontSize: reportConfig.titleFontSize + 'px'
          }"
        >
          {{ reportConfig.title || '未命名报表' }}
        </h1>
        
        <div class="preview-blocks">
          <template v-for="block in visibleBlocks" :key="block.id">
            <div class="preview-block" v-if="block.type === 'filter'">
              <ReportFilter 
                v-if="getFilterConfig(block.configId)"
                :filter-block-config="getFilterConfig(block.configId)!"
              />
            </div>
            
            <div class="preview-block" v-else-if="block.type === 'table'">
              <div class="block-title" v-if="block.title">{{ block.title }}</div>
              <ReportTable 
                v-if="getTableConfig(block.configId)"
                :table-config="getTableConfig(block.configId)!"
                :is-preview="true"
              />
            </div>
            
            <div class="preview-block" v-else-if="block.type === 'chart'">
              <div class="block-title" v-if="block.title">{{ block.title }}</div>
              <ReportChart 
                v-if="getChartConfig(block.configId)"
                :chart-config="getChartConfig(block.configId)!.chartConfig"
                :height="400"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download, Picture, Close } from '@element-plus/icons-vue'
import type { ReportConfig, LayoutBlock, TableBlockConfig, ChartBlockConfig, FilterBlockConfig } from '@/types'
import ReportChart from './ReportChart.vue'
import ReportTable from './ReportTable.vue'
import ReportFilter from './ReportFilter.vue'

const props = defineProps<{
  visible: boolean
  title: string
  reportConfig: ReportConfig
}>()

defineEmits<{
  (e: 'update:model-value', value: boolean): void
  (e: 'close'): void
  (e: 'export-excel'): void
  (e: 'export-pdf'): void
}>()

const visibleBlocks = computed(() => {
  return [...props.reportConfig.blocks]
    .filter((b: LayoutBlock) => b.visible)
    .sort((a: LayoutBlock, b: LayoutBlock) => a.y - b.y || a.x - b.x)
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
</script>

<style scoped>
.fullscreen-preview-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
  border-bottom: 1px solid #e4e7ed;
}

.fullscreen-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #f0f2f5;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  height: calc(100vh - 100px);
  overflow: auto;
  padding: 40px;
}

.preview-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 800px;
}

.report-title {
  margin-bottom: 32px;
  color: #303133;
  font-weight: 700;
}

.preview-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-block {
  width: 100%;
}

.block-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}
</style>
