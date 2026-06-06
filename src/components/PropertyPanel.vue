<template>
  <div class="property-panel">
    <div class="panel-header">
      <span class="header-title">属性配置</span>
    </div>
    
    <div class="panel-content">
      <div v-if="!selectedColumn" class="empty-state">
        <el-icon class="empty-icon"><Pointer /></el-icon>
        <p>请选择一个表格列进行配置</p>
      </div>
      
      <div v-else class="property-form">
        <div class="form-section">
          <div class="section-title">基本属性</div>
          <el-form label-width="80px" :model="formData">
            <el-form-item label="列名">
              <el-input 
                v-model="formData.columnName" 
                placeholder="请输入列名"
                @input="handleUpdate"
              />
            </el-form-item>
            <el-form-item label="字段名">
              <el-input 
                v-model="formData.fieldName" 
                disabled
                placeholder="字段名"
              />
            </el-form-item>
            <el-form-item label="字段类型">
              <el-tag :type="getTypeTagType(formData.type || 'string')">
                {{ getTypeLabel(formData.type || 'string') }}
              </el-tag>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">显示配置</div>
          <el-form label-width="80px" :model="formData">
            <el-form-item label="列宽">
              <el-input-number 
                v-model="formData.width" 
                :min="60" 
                :max="500"
                @change="handleUpdate"
              />
              <span class="unit">px</span>
            </el-form-item>
            <el-form-item label="对齐方式">
              <el-radio-group v-model="formData.align" @change="handleUpdate">
                <el-radio-button label="left">左</el-radio-button>
                <el-radio-button label="center">中</el-radio-button>
                <el-radio-button label="right">右</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否显示">
              <el-switch 
                v-model="formData.visible" 
                active-text="显示"
                inactive-text="隐藏"
                @change="handleUpdate"
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">格式化</div>
          <el-form label-width="80px" :model="formData">
            <el-form-item label="格式">
              <el-select 
                v-model="formData.format" 
                placeholder="请选择格式"
                @change="handleUpdate"
                :disabled="!hasFormatOptions"
              >
                <el-option 
                  v-for="opt in formatOptions" 
                  :key="opt.value" 
                  :label="opt.label" 
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="hasFormatOptions" label="自定义">
              <el-input 
                v-model="formData.format" 
                placeholder="输入自定义格式"
                @input="handleUpdate"
              />
            </el-form-item>
            <el-form-item v-if="formData.format" label="预览">
              <div class="format-preview">
                {{ getFormatPreview() }}
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-title">操作</div>
          <el-button 
            type="danger" 
            @click="handleDelete"
            style="width: 100%"
          >
            <el-icon><Delete /></el-icon>
            删除此列
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Pointer, Delete } from '@element-plus/icons-vue'
import type { TableColumn } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const props = defineProps<{
  selectedColumn: TableColumn | null
}>()

const emit = defineEmits<{
  (e: 'update-column', columnId: string, updates: Partial<TableColumn>): void
  (e: 'remove-column', columnId: string): void
}>()

const { formatValue } = useReportDesigner()

const formData = ref<Partial<TableColumn>>({})

watch(() => props.selectedColumn, (col) => {
  if (col) {
    formData.value = { ...col }
  }
}, { immediate: true, deep: true })

const hasFormatOptions = computed(() => {
  return props.selectedColumn?.type === 'number' || props.selectedColumn?.type === 'date'
})

const formatOptions = computed(() => {
  const type = props.selectedColumn?.type
  if (type === 'number') {
    return [
      { label: '默认', value: '' },
      { label: '千分位两位小数 #,##0.00', value: '#,##0.00' },
      { label: '千分位整数 #,##0', value: '#,##0' },
      { label: '百分比两位 0.00%', value: '0.00%' },
      { label: '百分比一位 0.0%', value: '0.0%' }
    ]
  }
  if (type === 'date') {
    return [
      { label: '默认', value: '' },
      { label: '年-月-日 YYYY-MM-DD', value: 'YYYY-MM-DD' },
      { label: '年/月/日 YYYY/MM/DD', value: 'YYYY/MM/DD' },
      { label: '年-月-日 时:分 YYYY-MM-DD HH:mm', value: 'YYYY-MM-DD HH:mm' },
      { label: '中文年月日 YYYY年MM月DD日', value: 'YYYY年MM月DD日' }
    ]
  }
  return []
})

function handleUpdate() {
  if (props.selectedColumn) {
    emit('update-column', props.selectedColumn.id, { ...formData.value })
  }
}

function handleDelete() {
  if (props.selectedColumn) {
    emit('remove-column', props.selectedColumn.id)
  }
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

function getTypeTagType(type: string) {
  const types: { [key: string]: string } = {
    string: 'primary',
    number: 'success',
    date: 'warning',
    boolean: 'info'
  }
  return types[type] || 'primary'
}

function getFormatPreview() {
  if (!props.selectedColumn) return ''
  
  const type = props.selectedColumn.type
  const format = formData.value.format || ''
  
  if (type === 'number') {
    return formatValue(12345.6789, format, type)
  }
  if (type === 'date') {
    return formatValue('2024-01-15', format, type)
  }
  if (type === 'boolean') {
    return formatValue(true, format, type)
  }
  return formatValue('示例文本', format, type)
}
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
  margin-bottom: 24px;
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

.format-preview {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #606266;
  min-height: 36px;
  display: flex;
  align-items: center;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
