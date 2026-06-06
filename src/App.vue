<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon"><DataAnalysis /></el-icon>
        <h1 class="app-title">在线自定义报表设计器</h1>
      </div>
      <div class="header-right">
        <el-button @click="handleSave">
          <el-icon><Upload /></el-icon>
          保存配置
        </el-button>
        <el-button @click="handleLoad">
          <el-icon><FolderOpened /></el-icon>
          读取配置
        </el-button>
        <el-button type="danger" @click="handleClear">
          <el-icon><Delete /></el-icon>
          清空配置
        </el-button>
      </div>
    </header>

    <main class="app-main">
      <aside class="sidebar left-sidebar">
        <DataSourcePanel @add-field="handleAddField" />
      </aside>

      <section class="main-content">
        <DesignerCanvas
          :report-config="reportConfig"
          :selected-block-id="selectedBlockId"
          @update-config="handleUpdateConfig"
          @add-block="handleAddBlock"
          @remove-block="handleRemoveBlock"
          @select-block="handleSelectBlock"
          @add-field="handleAddFieldToTable"
          @export-excel="handleExportExcel"
          @export-pdf="handleExportPDF"
          @preview="handlePreview"
        />
      </section>

      <aside class="sidebar right-sidebar">
        <PropertyPanel :selected-block="selectedBlock" />
      </aside>
    </main>

    <FullscreenPreview
      :visible="fullscreenPreview.visible"
      :title="fullscreenPreview.title"
      :report-config="reportConfig"
      @update:model-value="fullscreenPreview.visible = $event"
      @close="handleClosePreview"
      @export-excel="handleExportExcel"
      @export-pdf="handleExportFullscreenPDF"
    />

    <el-dialog
      v-model="configDialogVisible"
      :title="dialogTitle"
      width="400px"
      @close="configDialogVisible = false"
    >
      <el-alert
        v-if="dialogType === 'save'"
        title="配置已保存到本地存储"
        type="success"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="dialogType === 'load'"
        title="配置已从本地存储加载"
        type="success"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="dialogType === 'clear'"
        title="配置已从本地存储清空"
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="dialogType === 'no-config'"
        title="本地存储中没有找到配置"
        type="warning"
        :closable="false"
        show-icon
      />
      <template #footer>
        <el-button type="primary" @click="configDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Upload, FolderOpened, Delete } from '@element-plus/icons-vue'
import DataSourcePanel from '@/components/DataSourcePanel.vue'
import DesignerCanvas from '@/components/DesignerCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import FullscreenPreview from '@/components/FullscreenPreview.vue'
import { useReportDesigner } from '@/composables/useReportDesigner'
import type { 
  DataField, 
  ReportConfig, 
  ChartType
} from '@/types'

const {
  dataFields,
  reportConfig,
  selectedBlockId,
  selectedBlock,
  fullscreenPreview,
  addBlock,
  removeBlock,
  addColumnToTable,
  selectBlock,
  updateReportConfig,
  saveConfig,
  loadConfig,
  clearConfig,
  exportExcel,
  exportPDF,
  openFullscreenPreview,
  closeFullscreenPreview
} = useReportDesigner()

const configDialogVisible = ref(false)
const dialogType = ref('')
const dialogTitle = ref('')

onMounted(() => {
  const hasConfig = loadConfig()
  if (!hasConfig) {
    console.log('没有找到已保存的配置，使用默认设置')
  }
})

function handleAddField(field: DataField) {
  if (reportConfig.value.tableConfigs.length === 0) {
    addBlock('table', 0, reportConfig.value.blocks.length)
    setTimeout(() => {
      if (reportConfig.value.tableConfigs.length > 0) {
        const lastTableConfig = reportConfig.value.tableConfigs[reportConfig.value.tableConfigs.length - 1]
        addColumnToTable(lastTableConfig.id, field)
        ElMessage.success(`已添加字段: ${field.name}`)
      }
    }, 0)
  } else {
    const lastTableConfig = reportConfig.value.tableConfigs[reportConfig.value.tableConfigs.length - 1]
    addColumnToTable(lastTableConfig.id, field)
    ElMessage.success(`已添加字段: ${field.name}`)
  }
}

function handleAddFieldToTable(tableConfigId: string, field: DataField) {
  addColumnToTable(tableConfigId, field)
  ElMessage.success(`已添加字段: ${field.name}`)
}

function handleAddBlock(type: 'table' | ChartType | 'filter', x: number, y: number) {
  addBlock(type, x, y)
  ElMessage.success('已添加组件')
}

function handleRemoveBlock(blockId: string) {
  removeBlock(blockId)
  ElMessage.info('已删除该区块')
}

function handleSelectBlock(blockId: string) {
  selectBlock(blockId)
}



function handleUpdateConfig(config: Partial<ReportConfig>) {
  updateReportConfig(config)
}

function handleSave() {
  saveConfig()
  dialogType.value = 'save'
  dialogTitle.value = '保存成功'
  configDialogVisible.value = true
}

function handleLoad() {
  const success = loadConfig()
  dialogType.value = success ? 'load' : 'no-config'
  dialogTitle.value = success ? '加载成功' : '加载失败'
  configDialogVisible.value = true
}

function handleClear() {
  clearConfig()
  dialogType.value = 'clear'
  dialogTitle.value = '清空成功'
  configDialogVisible.value = true
}

function handleExportExcel() {
  exportExcel()
  ElMessage.success('Excel导出成功')
}

function handleExportPDF() {
  exportPDF('report-content')
  ElMessage.success('PDF导出成功')
}

function handleExportFullscreenPDF() {
  exportPDF('fullscreen-preview-content')
  ElMessage.success('PDF导出成功')
}

function handlePreview() {
  openFullscreenPreview()
}

function handleClosePreview() {
  closeFullscreenPreview()
}
</script>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: #fff;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.left-sidebar {
  border-right: 1px solid #e4e7ed;
}

.right-sidebar {
  border-left: 1px solid #e4e7ed;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.fullscreen-preview-dialog) {
  --el-dialog-margin: 0;
  --el-dialog-border-radius: 0;
}

:deep(.fullscreen-preview-dialog .el-dialog__header) {
  padding: 0;
  margin-right: 0;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.fullscreen-preview-dialog .el-dialog__body) {
  padding: 0;
}
</style>
