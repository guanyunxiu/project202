<template>
  <div class="report-chart" ref="chartRef" :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import type { ChartConfig, MockDataItem } from '@/types'
import { useReportDesigner } from '@/composables/useReportDesigner'

const props = defineProps<{
  chartConfig: ChartConfig
  height?: number
}>()

const { tableData } = useReportDesigner()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const chartData = computed(() => tableData.value)

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  chartInstance?.resize()
}

function updateChart() {
  if (!chartInstance || !props.chartConfig) return

  const data = chartData.value
  const config = props.chartConfig

  if (!config.xAxisField || (!config.yAxisField && (!config.yAxisFields || config.yAxisFields.length === 0))) {
    chartInstance.setOption({
      title: {
        text: config.title,
        left: 'center',
        textStyle: { fontSize: 16, color: '#303133' }
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '请配置 X 轴和 Y 轴字段',
          fontSize: 14,
          fill: '#909399'
        }
      }
    })
    return
  }

  const xAxisData = [...new Set(data.map((item: MockDataItem) => item[config.xAxisField]))]

  const yAxisFields = config.yAxisFields && config.yAxisFields.length > 0
    ? config.yAxisFields
    : [config.yAxisField]

  const series = yAxisFields.map((field: string) => {
    const seriesData = xAxisData.map((xValue: any) => {
      const items = data.filter((item: MockDataItem) => item[config.xAxisField] === xValue)
      const sum = items.reduce((acc: number, item: MockDataItem) => acc + (Number(item[field]) || 0), 0)
      return sum
    })

    return {
      name: field,
      type: config.type,
      data: seriesData,
      smooth: config.smooth,
      stack: config.stack ? 'total' : undefined,
      itemStyle: config.type === 'pie' ? undefined : {
        borderRadius: config.type === 'bar' ? [4, 4, 0, 0] : undefined
      },
      areaStyle: config.type === 'line' && config.stack ? {} : undefined,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  })

  if (config.type === 'pie') {
    const pieData = xAxisData.map((xValue: any) => {
      const items = data.filter((item: MockDataItem) => item[config.xAxisField] === xValue)
      const sum = items.reduce((acc: number, item: MockDataItem) => acc + (Number(item[config.yAxisField]) || 0), 0)
      return { name: xValue, value: sum }
    })

    chartInstance.setOption({
      title: {
        text: config.title,
        left: 'center',
        textStyle: { fontSize: 16, color: '#303133' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: config.showLegend ? {
        orient: 'vertical',
        left: 'left',
        top: 'center'
      } : undefined,
      color: config.colorPalette,
      series: [{
        name: config.title,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: pieData
      }]
    })
  } else {
    chartInstance.setOption({
      title: {
        text: config.title,
        left: 'center',
        textStyle: { fontSize: 16, color: '#303133' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: config.type === 'line' ? 'shadow' : 'cross'
        }
      },
      legend: config.showLegend ? {
        top: 30,
        data: yAxisFields
      } : undefined,
      grid: {
        left: '3%',
        right: '4%',
        bottom: config.showDataZoom ? '15%' : '3%',
        top: config.showLegend ? 80 : 60,
        containLabel: true
      },
      color: config.colorPalette,
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: xAxisData.length > 8 ? 30 : 0,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + 'w'
            }
            return value.toString()
          }
        }
      },
      dataZoom: config.showDataZoom ? [
        {
          type: 'slider',
          showDataShadow: false,
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ] : undefined,
      series
    })
  }
}

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(
  () => [props.chartConfig, chartData.value],
  () => {
    updateChart()
  },
  { deep: true }
)
</script>

<style scoped>
.report-chart {
  width: 100%;
  background: #fff;
  border-radius: 8px;
}
</style>
