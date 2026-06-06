<template>
  <div class="report-filter">
    <div class="filter-container">
      <div 
        v-for="filter in filterBlockConfig.filters" 
        :key="filter.id" 
        class="filter-item"
        :class="{ disabled: !filter.enabled }"
      >
        <label class="filter-label">{{ filter.label }}</label>
        
        <el-input
          v-if="filter.type === 'text'"
          v-model="filterValueMap[filter.id]"
          :placeholder="filter.placeholder"
          clearable
          size="small"
          @input="handleFilterChange(filter.id)"
          @clear="handleFilterChange(filter.id)"
        />
        
        <el-date-picker
          v-else-if="filter.type === 'date'"
          v-model="filterValueMap[filter.id]"
          type="date"
          :placeholder="filter.placeholder"
          value-format="YYYY-MM-DD"
          size="small"
          clearable
          @change="handleFilterChange(filter.id)"
        />
        
        <el-date-picker
          v-else-if="filter.type === 'dateRange'"
          v-model="filterValueMap[filter.id]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          size="small"
          clearable
          @change="handleFilterChange(filter.id)"
        />
        
        <el-select
          v-else-if="filter.type === 'select'"
          v-model="filterValueMap[filter.id]"
          :placeholder="filter.placeholder"
          clearable
          size="small"
          @change="handleFilterChange(filter.id)"
        >
          <el-option
            v-for="opt in filter.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      
      <div class="filter-actions">
        <el-button size="small" type="primary" @click="handleApply">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button size="small" @click="handleReset">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import type { FilterConfig, FilterBlockConfig } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const props = defineProps<{
  filterBlockConfig: FilterBlockConfig
}>()

const { updateFilter, resetFilterValues } = useReportDesigner()

const filterValueMap = reactive<Record<string, any>>({})

onMounted(() => {
  props.filterBlockConfig.filters.forEach((filter: FilterConfig) => {
    filterValueMap[filter.id] = filter.value
  })
})

watch(
  () => props.filterBlockConfig.filters,
  (newFilters) => {
    newFilters.forEach((filter: FilterConfig) => {
      if (!(filter.id in filterValueMap)) {
        filterValueMap[filter.id] = filter.value
      }
    })
  },
  { deep: true }
)

function handleFilterChange(filterId: string) {
  updateFilter(props.filterBlockConfig.id, filterId, {
    value: filterValueMap[filterId]
  })
}

function handleApply() {
  props.filterBlockConfig.filters.forEach((filter: FilterConfig) => {
    updateFilter(props.filterBlockConfig.id, filter.id, {
      value: filterValueMap[filter.id]
    })
  })
}

function handleReset() {
  Object.keys(filterValueMap).forEach((key) => {
    filterValueMap[key] = null
  })
  resetFilterValues()
}
</script>

<style scoped>
.report-filter {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
}

.filter-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
