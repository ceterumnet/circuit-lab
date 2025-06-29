<template>
  <div class="analysis-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<style scoped>
.analysis-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  padding: 1rem;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .analysis-chart {
    min-height: 300px;
    padding: 0.5rem;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  type ChartConfiguration,
  type ChartData,
  type ChartOptions,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface DataPoint {
  x: number
  y: number
}

interface Dataset {
  label: string
  data: DataPoint[]
  color: string
  unit: string
}

interface Props {
  datasets: Dataset[]
  xLabel: string
  yLabel: string
  title?: string
  pointRadius?: number
  pointHoverRadius?: number
  pointBorderWidth?: number
  pointBorderColor?: string
  darkTheme?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Analysis Results',
  pointRadius: 4,
  pointHoverRadius: 6,
  pointBorderWidth: 2,
  pointBorderColor: '#ffffff',
  darkTheme: false,
})

const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

const chartColors = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
]

function createChart() {
  if (!chartCanvas.value || props.datasets.length === 0) return

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const datasets = props.datasets.map((dataset, index) => ({
    label: `${dataset.label} (${dataset.unit})`,
    data: dataset.data,
    borderColor: dataset.color || chartColors[index % chartColors.length],
    backgroundColor: (dataset.color || chartColors[index % chartColors.length]) + '20',
    borderWidth: 2,
    pointRadius: props.pointRadius,
    pointHoverRadius: props.pointHoverRadius,
    pointBackgroundColor: dataset.color || chartColors[index % chartColors.length],
    pointBorderColor: props.pointBorderColor,
    pointBorderWidth: props.pointBorderWidth,
    fill: false,
    tension: 0.1,
  }))

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        title: {
          display: !!props.title,
          text: props.title,
          font: {
            size: 16,
            weight: 'bold',
          },
          color: props.darkTheme ? '#ffffff' : '#374151',
        },
        legend: {
          display: props.datasets.length > 1,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
            color: props.darkTheme ? '#ffffff' : '#374151',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#6b7280',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: (tooltipItems) => {
              if (tooltipItems.length > 0) {
                const value = tooltipItems[0].parsed.x
                return `${props.xLabel}: ${formatValue(value)}`
              }
              return ''
            },
            label: (context) => {
              const dataset = props.datasets[context.datasetIndex]
              const value = context.parsed.y
              return `${dataset.label}: ${formatValue(value)} ${dataset.unit}`
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          display: true,
          title: {
            display: true,
            text: props.xLabel,
            font: {
              size: 14,
              weight: 'bold',
            },
            color: props.darkTheme ? '#ffffff' : '#374151',
          },
          grid: {
            color: props.darkTheme ? 'rgba(148, 163, 184, 0.15)' : '#e5e7eb',
            lineWidth: 1,
          },
          ticks: {
            color: props.darkTheme ? '#ffffff' : '#6b7280',
            font: {
              size: 11,
            },
            callback: function (value) {
              return formatValue(Number(value))
            },
          },
        },
        y: {
          type: 'linear',
          display: true,
          title: {
            display: true,
            text: props.yLabel,
            font: {
              size: 14,
              weight: 'bold',
            },
            color: props.darkTheme ? '#ffffff' : '#374151',
          },
          grid: {
            color: props.darkTheme ? 'rgba(148, 163, 184, 0.15)' : '#e5e7eb',
            lineWidth: 1,
          },
          ticks: {
            color: props.darkTheme ? '#ffffff' : '#6b7280',
            font: {
              size: 11,
            },
            callback: function (value) {
              return formatValue(Number(value))
            },
          },
        },
      },
      elements: {
        point: {
          hoverBorderWidth: 3,
        },
      },
    },
  }

  chartInstance = new Chart(chartCanvas.value, config)
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  } else if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(2)}k`
  } else if (Math.abs(value) >= 1) {
    return value.toFixed(3)
  } else if (Math.abs(value) >= 1e-3) {
    return `${(value * 1e3).toFixed(2)}m`
  } else if (Math.abs(value) >= 1e-6) {
    return `${(value * 1e6).toFixed(2)}μ`
  } else if (Math.abs(value) >= 1e-9) {
    return `${(value * 1e9).toFixed(2)}n`
  } else {
    return value.toExponential(2)
  }
}

function updateChart() {
  if (!chartInstance || props.datasets.length === 0) return

  const datasets = props.datasets.map((dataset, index) => ({
    label: `${dataset.label} (${dataset.unit})`,
    data: dataset.data,
    borderColor: dataset.color || chartColors[index % chartColors.length],
    backgroundColor: (dataset.color || chartColors[index % chartColors.length]) + '20',
    borderWidth: 2,
    pointRadius: props.pointRadius,
    pointHoverRadius: props.pointHoverRadius,
    pointBackgroundColor: dataset.color || chartColors[index % chartColors.length],
    pointBorderColor: props.pointBorderColor,
    pointBorderWidth: props.pointBorderWidth,
    fill: false,
    tension: 0.1,
  }))

  chartInstance.data.datasets = datasets
  chartInstance.update('none') // Fast update without animation
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// Watch for data changes
watch(
  () => props.datasets,
  (newDatasets) => {
    if (newDatasets.length === 0) {
      destroyChart()
      return
    }

    if (chartInstance) {
      updateChart()
    } else {
      nextTick(() => createChart())
    }
  },
  { deep: true },
)

// Watch for size changes
// Chart will automatically resize with container due to responsive: true

onMounted(() => {
  if (props.datasets.length > 0) {
    nextTick(() => createChart())
  }
})

onUnmounted(() => {
  destroyChart()
})

// Expose methods for parent components
defineExpose({
  exportChart: () => {
    if (chartInstance) {
      return chartInstance.toBase64Image('image/png', 1)
    }
    return null
  },
  updateChart,
  destroyChart,
})
</script>

<style scoped>
.analysis-chart {
  width: 100%;
  height: 100%;
  position: relative;
  background: v-bind('props.darkTheme ? "#000000" : "white"');
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.analysis-chart canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
