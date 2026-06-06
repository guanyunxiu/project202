<template>
  <div class="designer-canvas">
    <div class="canvas-header">
      <div class="header-left">
        <span class="header-title">报表画布</span>
        <el-tag size="small" type="info">已添加 {{ columns.length }} 个字段</el-tag>
      </div>
      <div class="header-right">
        <el-button size="small" @click="$emit('clear-columns')">清空列</el-button>
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

      <div class="columns-area">
        <div class="columns-header">
          <span class="columns-title">表格列配置</span>
          <el-text type="info" size="small">拖拽排序，点击选中编辑，点击×删除</el-text>
        </div>
        
        <div 
          class="columns-drop-zone"
          @dragover.prevent
          @drop="handleDrop"
        >
          <draggable
            v-model="columnsModel"
            group="fields"
            item-key="id"
            class="columns-list"
            ghost-class="ghost"
            chosen-class="chosen"
            drag-class="drag"
            @change="handleDragChange"
          >
            <template #item="{ element }">
              <div 
                class="column-item" 
                :class="{ 
                  active: selectedColumnId === element.id,
                  invisible: !element.visible 
                }"
                @click="handleSelectColumn(element.id)"
              >
                <div class="column-drag-handle">
                  <el-icon><Rank /></el-icon>
                </div>
                <div class="column-info">
                  <div class="column-name">{{ element.columnName }}</div>
                  <div class="column-field">{{ element.fieldName }}</div>
                </div>
                <div class="column-props">
                  <el-tag size="small" :type="getAlignType(element.align)">
                    {{ getAlignLabel(element.align) }}
                  </el-tag>
                  <el-tag size="small" type="info">
                    {{ element.width }}px
                  </el-tag>
                  <el-tag 
                    v-if="!element.visible" 
                    size="small" 
                    type="danger"
                  >
                    隐藏
                  </el-tag>
                </div>
                <button 
                  class="column-delete"
                  @click.stop="handleRemoveColumn(element.id)"
                >
                  <el-icon><Close /></el-icon>
                </button>
              </div>
            </template>
          </draggable>
          
          <div v-if="columns.length === 0" class="empty-tip">
            <el-icon class="empty-icon"><DocumentAdd /></el-icon>
            <p>请从左侧拖拽字段到此处</p>
            <p class="empty-sub">或双击左侧字段添加</p>
          </div>
        </div>
      </div>

      <div class="preview-area">
        <div class="preview-header">
          <span class="preview-title">实时预览</span>
          <el-button size="small" type="primary" @click="$emit('export-excel')">
            <el-icon><Download /></el-icon>
            导出Excel
          </el-button>
        </div>
        <div class="preview-content">
          <h2 
            class="report-title" 
            :style="{
              textAlign: reportConfig.titleAlign,
              fontSize: reportConfig.titleFontSize + 'px'
            }"
          >
            {{ reportConfig.title || '未命名报表' }}
          </h2>
          <el-table 
            :data="tableData" 
            border 
            stripe
            style="width: 100%"
            size="small"
          >
            <el-table-column
              v-for="col in visibleColumns"
              :key="col.id"
              :prop="col.fieldName"
              :label="col.columnName"
              :width="col.width"
              :align="col.align"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { Rank, Close, DocumentAdd, Download } from '@element-plus/icons-vue'
import type { TableColumn, ReportConfig, DataField, MockDataItem } from '@/types'
import { mockTableData } from '@/data/mockData'

const props = defineProps<{
  columns: TableColumn[]
  selectedColumnId: string | null
  reportConfig: ReportConfig
  formatValue: (value: any, format: string, type: string) => string
}>()

const emit = defineEmits<{
  (e: 'add-field', field: DataField): void
  (e: 'remove-column', columnId: string): void
  (e: 'select-column', columnId: string): void
  (e: 'update-config', config: Partial<ReportConfig>): void
  (e: 'clear-columns'): void
  (e: 'export-excel'): void
  (e: 'update-columns', columns: TableColumn[]): void
}>()

const tableData = ref<MockDataItem[]>([...mockTableData])

const columnsModel = computed({
  get: () => [...props.columns],
  set: (value: TableColumn[]) => {
    const updatedColumns = value.map((col, index) => ({
      ...col,
      order: index
    }))
    emit('update-columns', updatedColumns)
  }
})

const visibleColumns = computed(() => {
  return [...props.columns]
    .filter((col: TableColumn) => col.visible)
    .sort((a: TableColumn, b: TableColumn) => a.order - b.order)
})

function handleDrop(event: DragEvent) {
  event.preventDefault()
}

function handleDragChange(event: any) {
  if (event.added) {
    const newField = event.added.element
    if (newField && !newField.columnName) {
      const tempId = newField.id
      const currentColumns = columnsModel.value.filter(
        (col: TableColumn) => col.id !== tempId || col.columnName
      )
      emit('update-columns', currentColumns)
      emit('add-field', newField)
    }
  }
}

function handleDragEnd() {
  const updatedColumns = props.columns.map((col: TableColumn, index: number) => ({
    ...col,
    order: index
  }))
  emit('update-columns', updatedColumns)
}

function handleSelectColumn(columnId: string) {
  emit('select-column', columnId)
}

function handleRemoveColumn(columnId: string) {
  emit('remove-column', columnId)
}

function handleTitleUpdate(key: keyof ReportConfig, value: any) {
  emit('update-config', { [key]: value })
}

function getAlignLabel(align: string) {
  const labels: { [key: string]: string } = {
    left: '左对齐',
    center: '居中',
    right: '右对齐'
  }
  return labels[align] || '左对齐'
}

function getAlignType(align: string) {
  const types: { [key: string]: string } = {
    left: 'primary',
    center: 'success',
    right: 'warning'
  }
  return types[align] || 'primary'
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

.columns-area {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.columns-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.columns-drop-zone {
  min-height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.columns-drop-zone:hover {
  border-color: #409eff;
  background: #f5faff;
}

.columns-list {
  min-height: 80px;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.column-item:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.column-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.column-item.invisible {
  opacity: 0.5;
}

.column-drag-handle {
  color: #c0c4cc;
  cursor: move;
  padding: 4px;
}

.column-drag-handle:hover {
  color: #409eff;
}

.column-info {
  flex: 1;
  min-width: 0;
}

.column-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.column-field {
  font-size: 12px;
  color: #909399;
}

.column-props {
  display: flex;
  gap: 6px;
}

.column-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: #c0c4cc;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.column-delete:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb !important;
}

.chosen {
  background: #ecf5ff !important;
}

.drag {
  opacity: 0.8;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
  margin-bottom: 12px;
}

.empty-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.preview-area {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.preview-content {
  flex: 1;
  overflow: auto;
}

.report-title {
  margin-bottom: 16px;
  color: #303133;
  font-weight: 600;
}
</style>
