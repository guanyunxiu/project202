<template>
  <div class="data-source-panel">
    <div class="panel-header">
      <span class="header-title">数据源字段</span>
    </div>
    <div class="panel-content">
      <draggable
        v-model="localFields"
        :group="{ name: 'fields', pull: 'clone', put: false }"
        :clone="handleClone"
        :sort="false"
        item-key="id"
        class="field-list"
        ghost-class="ghost"
        chosen-class="chosen"
      >
        <template #item="{ element }">
          <div class="field-item" :class="`field-type-${element.type}`">
            <el-icon class="field-icon">
              <component :is="getTypeIcon(element.type)" />
            </el-icon>
            <span class="field-name">{{ element.name }}</span>
            <span class="field-type-tag">{{ getTypeLabel(element.type) }}</span>
          </div>
        </template>
      </draggable>
    </div>
    <div class="panel-footer">
      <el-text type="info" size="small">双击或拖拽字段到画布</el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { Document, Money, Calendar, Select } from '@element-plus/icons-vue'
import type { DataField } from '@/types'
import { mockDataFields } from '@/data/mockData'

const emit = defineEmits<{
  (e: 'add-field', field: DataField): void
}>()

const localFields = ref<DataField[]>([...mockDataFields])

watch(() => mockDataFields, (newFields) => {
  localFields.value = [...newFields]
}, { deep: true })

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

function handleClone(field: DataField) {
  return { ...field }
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
  padding: 12px;
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
}
</style>
