<template>
  <div class="data-source-config">
    <div class="config-header">
      <span class="header-title">数据源配置</span>
      <el-button size="small" type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增数据源
      </el-button>
    </div>
    
    <div class="config-list">
      <div 
        v-for="ds in dataSources" 
        :key="ds.id" 
        class="data-source-item"
        :class="{ active: ds.enabled }"
      >
        <div class="item-header">
          <div class="item-info">
            <el-icon class="item-icon" :class="`type-${ds.type}`">
              <component :is="ds.type === 'mock' ? DataLine : Link" />
            </el-icon>
            <div class="item-meta">
              <div class="item-name">{{ ds.name }}</div>
              <div class="item-type">
                <el-tag size="small" :type="ds.type === 'mock' ? 'success' : 'primary'">
                  {{ ds.type === 'mock' ? '模拟数据' : 'API接口' }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="item-actions">
            <el-switch 
              v-model="ds.enabled" 
              size="small"
              @change="handleEnable(ds)"
            />
            <el-button 
              size="small" 
              text 
              type="primary"
              @click="handleEdit(ds)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              v-if="ds.type !== 'mock'"
              size="small" 
              text 
              type="danger"
              @click="handleDelete(ds.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div v-if="ds.type === 'api' && editingId === ds.id" class="item-config">
          <el-form label-width="80px" size="small">
            <el-form-item label="接口地址">
              <el-input v-model="editingConfig.url" placeholder="请输入接口URL" />
            </el-form-item>
            <el-form-item label="请求方式">
              <el-select v-model="editingConfig.method">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求头">
              <el-input 
                v-model="headersJson" 
                type="textarea" 
                :rows="2" 
                placeholder='{"Authorization": "Bearer xxx"}'
              />
            </el-form-item>
            <el-form-item label="请求体">
              <el-input 
                v-model="bodyJson" 
                type="textarea" 
                :rows="2" 
                placeholder='{"page": 1, "size": 10}'
              />
            </el-form-item>
            <el-form-item label="数据路径">
              <el-input 
                v-model="editingConfig.dataPath" 
                placeholder="data.list 或 data.records"
              />
            </el-form-item>
            <el-form-item>
              <el-button size="small" type="primary" @click="handleTest">
                <el-icon><Loading v-if="testing" class="is-loading" /><Refresh v-else /></el-icon>
                {{ testing ? '测试中...' : '测试连接' }}
              </el-button>
              <el-button size="small" @click="handleLoadData(ds.id)" :disabled="!testSuccess">
                <el-icon><Download /></el-icon>
                加载数据
              </el-button>
              <el-button size="small" @click="handleSave">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
              <el-button size="small" @click="editingId = null">
                取消
              </el-button>
            </el-form-item>
            <el-alert 
              v-if="testResult" 
              :title="testSuccess ? '测试成功' : '测试失败'" 
              :type="testSuccess ? 'success' : 'error'"
              :closable="false"
              show-icon
            />
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, DataLine, Link, Loading, Refresh, Check, Download } from '@element-plus/icons-vue'
import type { DataSourceConfig } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const {
  reportConfig,
  addDataSource,
  removeDataSource,
  updateDataSource,
  loadDataSource
} = useReportDesigner()

const dataSources = computed(() => reportConfig.value.dataSources)

const editingId = ref<string | null>(null)
const editingConfig = ref<Partial<DataSourceConfig>>({})
const testing = ref(false)
const testSuccess = ref(false)
const testResult = ref<string | null>(null)

const headersJson = computed({
  get: () => JSON.stringify(editingConfig.value.headers || {}, null, 2),
  set: (val: string) => {
    try {
      editingConfig.value.headers = JSON.parse(val)
    } catch (e) {
      // ignore parse error
    }
  }
})

const bodyJson = computed({
  get: () => JSON.stringify(editingConfig.value.body || {}, null, 2),
  set: (val: string) => {
    try {
      editingConfig.value.body = JSON.parse(val)
    } catch (e) {
      // ignore parse error
    }
  }
})

function handleAdd() {
  const newDs = addDataSource({ name: '新API数据源', type: 'api' })
  editingId.value = newDs.id
  editingConfig.value = { ...newDs }
  testSuccess.value = false
  testResult.value = null
}

function handleEdit(ds: DataSourceConfig) {
  editingId.value = ds.id
  editingConfig.value = { ...ds }
  testSuccess.value = false
  testResult.value = null
}

function handleDelete(id: string) {
  removeDataSource(id)
  if (editingId.value === id) {
    editingId.value = null
  }
}

async function handleEnable(ds: DataSourceConfig) {
  if (ds.enabled) {
    reportConfig.value.dataSources.forEach((d: DataSourceConfig) => {
      if (d.id !== ds.id) {
        d.enabled = false
      }
    })
    await loadDataSource(ds.id)
  }
}

async function handleTest() {
  if (!editingConfig.value.url) {
    testResult.value = '请输入接口地址'
    testSuccess.value = false
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const success = await loadDataSource(editingConfig.value.id!)
    testSuccess.value = success
    testResult.value = success ? `成功加载 ${reportConfig.value.dataSources[0] ? '数据' : '数据'}` : '数据格式不正确，应为数组'
  } catch (e: any) {
    testSuccess.value = false
    testResult.value = e.message || '请求失败'
  } finally {
    testing.value = false
  }
}

function handleLoadData(id: string) {
  loadDataSource(id)
}

function handleSave() {
  if (editingId.value && editingConfig.value) {
    updateDataSource(editingId.value, {
      url: editingConfig.value.url,
      method: editingConfig.value.method,
      headers: editingConfig.value.headers,
      body: editingConfig.value.body,
      dataPath: editingConfig.value.dataPath,
      name: editingConfig.value.name
    })
    editingId.value = null
  }
}
</script>

<style scoped>
.data-source-config {
  padding: 12px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-source-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.data-source-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 24px;
  padding: 8px;
  border-radius: 8px;
  background: #ecf5ff;
  color: #409eff;
}

.item-icon.type-mock {
  background: #f0f9eb;
  color: #67c23a;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-config {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

.is-loading {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
