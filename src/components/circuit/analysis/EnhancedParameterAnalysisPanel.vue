<template>
  <div class="properties-panel">
    <!-- Enhanced Analysis Control Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <BarChart3 class="w-4 h-4" />
        Enhanced Parameter Analysis
      </div>
      <button
        class="btn w-full"
        :class="isAnalysisActive ? 'btn-secondary' : 'btn-primary'"
        @click="toggleAnalysis"
        :disabled="!primaryParameter || selectedOutputs.length === 0"
      >
        <Pause v-if="isAnalysisActive" class="w-4 h-4 mr-2" />
        <Play v-else class="w-4 h-4 mr-2" />
        {{ isAnalysisActive ? 'Pause' : 'Start' }} Enhanced Analysis
      </button>
    </div>

    <!-- Parameter Selection Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Sliders class="w-4 h-4" />
        Sweep Parameters
      </div>

      <!-- Primary Parameter -->
      <div class="property-field">
        <label class="property-label">Primary Parameter</label>
        <select v-model="primaryParameter" class="property-input" @change="onParameterChange">
          <option value="">Select component...</option>
          <option v-for="param in availableParameters" :key="param.id" :value="param.id">
            {{ param.label }}
          </option>
        </select>
      </div>

      <!-- Enhanced Parameter Range Controls -->
      <div v-if="primaryParameter" class="space-y-3 mt-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="property-field">
            <label class="property-label">Min Value</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="primaryRange.min"
                type="number"
                class="property-input"
                :step="primaryRange.step"
                @input="onRangeChange"
              />
              <span class="text-sm text-slate-500 font-medium">{{ primaryParameterUnit }}</span>
            </div>
          </div>
          <div class="property-field">
            <label class="property-label">Max Value</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="primaryRange.max"
                type="number"
                class="property-input"
                :step="primaryRange.step"
                @input="onRangeChange"
              />
              <span class="text-sm text-slate-500 font-medium">{{ primaryParameterUnit }}</span>
            </div>
          </div>
        </div>
        <div class="property-field">
          <label class="property-label">Analysis Steps</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="primaryRange.steps"
              type="number"
              class="property-input flex-1"
              min="5"
              max="200"
              @input="onRangeChange"
            />
            <button @click="primaryRange.steps = 50" class="btn btn-ghost btn-sm">50</button>
            <button @click="primaryRange.steps = 100" class="btn btn-ghost btn-sm">100</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Output Selection Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <TrendingUp class="w-4 h-4" />
        Analysis Outputs
      </div>
      <div class="space-y-2">
        <label
          v-for="output in availableOutputs"
          :key="output.id"
          class="flex items-center gap-3 cursor-pointer"
        >
          <input
            v-model="selectedOutputs"
            :value="output.id"
            type="checkbox"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            @change="onOutputChange"
          />
          <span class="text-sm text-slate-700">{{ output.label }} ({{ output.unit }})</span>
        </label>
      </div>

      <!-- Plot Visibility Controls -->
      <div v-if="selectedOutputs.length > 0" class="mt-4">
        <label class="property-label">Visible Plots</label>
        <div class="flex flex-wrap gap-2 mt-2">
          <button
            v-for="output in selectedOutputs"
            :key="output"
            @click="togglePlotVisibility(output)"
            :class="['btn btn-sm', visiblePlots.includes(output) ? 'btn-primary' : 'btn-ghost']"
          >
            {{ getOutputLabel(output) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Real-time Current Values Section -->
    <div v-if="isAnalysisActive" class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Search class="w-4 h-4" />
        Current Analysis Point
      </div>
      <div class="space-y-2">
        <div v-if="primaryParameter" class="property-field">
          <label class="property-label">{{ primaryParameterLabel }}</label>
          <div class="property-value">
            {{ formatValue(currentPrimaryValue, primaryParameterUnit) }}
          </div>
        </div>
        <div v-for="output in selectedOutputs" :key="output" class="property-field">
          <label class="property-label">{{ getOutputLabel(output) }}</label>
          <div
            class="property-value"
            :class="{
              'voltage-display': output.includes('voltage'),
              'current-display': output.includes('current'),
              'power-display': output.includes('power'),
              'resistance-display': output.includes('resistance'),
            }"
          >
            {{ formatValue(currentOutputValues[output], getOutputUnit(output)) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Analysis Status Section -->
    <div class="property-section">
      <div class="property-section-title">Enhanced Analysis Status</div>
      <div class="analysis-status-card">
        <div v-if="isAnalysisRunning" class="simulation-status running">
          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Enhanced sweep... {{ analysisProgress }}%
        </div>
        <div v-else-if="analysisResults.length > 0" class="simulation-status success">
          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Enhanced analysis complete ({{ analysisResults.length }} points)
        </div>
        <div v-else class="simulation-status idle">
          <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
          Configure enhanced parameters and click Start Enhanced Analysis
        </div>

        <!-- Enhanced Progress Bar -->
        <div v-if="isAnalysisRunning" class="mt-3">
          <div class="w-full bg-slate-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${analysisProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Analysis Chart Section -->
    <div class="property-section">
      <div class="property-section-title">Enhanced Analysis Results</div>
      <div class="chart-container">
        <analysis-chart
          v-if="chartDatasets.length > 0"
          ref="analysisChart"
          :datasets="chartDatasets"
          :x-label="primaryParameterLabel"
          :y-label="'Multiple Outputs'"
          :title="`Enhanced ${primaryParameterLabel} vs Circuit Response`"
        />
        <div v-else class="info-panel">
          <div class="flex flex-col items-center justify-center text-center py-8">
            <BarChart3 class="w-8 h-8 text-slate-400 mb-3" />
            <h4 class="text-lg font-semibold text-slate-900 mb-2">No Enhanced Analysis Data</h4>
            <p class="text-slate-600">
              Configure enhanced parameters and run analysis to see results
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Export Controls Section -->
    <div v-if="analysisResults.length > 0" class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Download class="w-4 h-4" />
        Enhanced Export Results
      </div>
      <div class="space-y-2">
        <div class="flex gap-2">
          <button
            @click="exportCSV"
            class="btn btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <BarChart3 class="w-4 h-4" />
            Export CSV
          </button>
          <button
            @click="exportImage"
            class="btn btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Image class="w-4 h-4" />
            Export Plot
          </button>
        </div>
        <button
          @click="copyToClipboard"
          class="btn btn-ghost w-full flex items-center justify-center gap-2"
        >
          <Copy class="w-4 h-4" />
          Copy Data to Clipboard
        </button>
      </div>
    </div>

    <!-- Clear Results -->
    <div v-if="analysisResults.length > 0" class="property-section">
      <button
        @click="clearResults"
        class="btn btn-secondary w-full flex items-center justify-center gap-2"
      >
        <RotateCcw class="w-4 h-4" />
        Clear Enhanced Results
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AnalysisChart from './AnalysisChart.vue'
import {
  BarChart3,
  Play,
  Pause,
  Sliders,
  TrendingUp,
  Search,
  Download,
  Image,
  Copy,
  RotateCcw,
} from 'lucide-vue-next'

// Enhanced state management
const isAnalysisActive = ref(false)
const isAnalysisRunning = ref(false)
const analysisProgress = ref(0)

// Parameter selection
const primaryParameter = ref('')
const selectedOutputs = ref<string[]>(['voltage', 'current'])
const visiblePlots = ref<string[]>(['voltage', 'current'])

// Enhanced parameter ranges with higher resolution
const primaryRange = ref({
  min: 100,
  max: 10000,
  steps: 100, // Default to higher resolution
  step: 10, // Finer step control
})

// Analysis results
const analysisResults = ref<
  Array<{
    primaryValue: number
    outputs: Record<string, number>
  }>
>([])

// Current analysis point
const currentPrimaryValue = ref(0)
const currentOutputValues = ref<Record<string, number>>({})

// Professional chart integration
const analysisChart = ref()

// Store access
const circuitStore = useCircuitStore()

// Available parameters (components that can be swept)
const availableParameters = computed(() => {
  const params: Array<{ id: string; label: string; unit: string; type: string }> = []

  circuitStore.currentCircuit.components.forEach((component) => {
    if (component.type === 'resistor') {
      params.push({
        id: `${component.id}:resistance`,
        label: `${component.label || component.id} Resistance`,
        unit: 'Ω',
        type: 'resistance',
      })
    } else if (component.type === 'variable_resistor') {
      params.push({
        id: `${component.id}:resistance`,
        label: `${component.label || component.id} Resistance`,
        unit: 'Ω',
        type: 'resistance',
      })
    } else if (component.type === 'potentiometer') {
      params.push({
        id: `${component.id}:wiperPosition`,
        label: `${component.label || component.id} Wiper Position`,
        unit: '%',
        type: 'percentage',
      })
    } else if (component.type === 'voltage_source') {
      params.push({
        id: `${component.id}:voltage`,
        label: `${component.label || component.id} Voltage`,
        unit: 'V',
        type: 'voltage',
      })
    }
  })

  return params
})

// Available outputs (measurements to plot)
const availableOutputs = computed(() => {
  const outputs = [
    { id: 'voltage', label: 'Node Voltages', unit: 'V' },
    { id: 'current', label: 'Component Currents', unit: 'A' },
    { id: 'power', label: 'Component Power', unit: 'W' },
    { id: 'resistance', label: 'Effective Resistance', unit: 'Ω' },
  ]

  // Add specific component measurements for enhanced analysis
  circuitStore.currentCircuit.components.forEach((component) => {
    if (component.type === 'diode' || component.type === 'led') {
      outputs.push({
        id: `${component.id}:current`,
        label: `${component.label || component.id} Current`,
        unit: 'A',
      })
      outputs.push({
        id: `${component.id}:power`,
        label: `${component.label || component.id} Power`,
        unit: 'W',
      })
    }
  })

  return outputs
})

// Computed parameter info
const primaryParameterLabel = computed(() => {
  const param = availableParameters.value.find((p) => p.id === primaryParameter.value)
  return param?.label || ''
})

const primaryParameterUnit = computed(() => {
  const param = availableParameters.value.find((p) => p.id === primaryParameter.value)
  return param?.unit || ''
})

// Professional chart datasets following AnalysisChart.vue patterns
const chartDatasets = computed(() => {
  if (analysisResults.value.length === 0) return []

  const datasets = []
  const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#06b6d4', '#ef4444'] // Design system colors

  let colorIndex = 0
  for (const output of visiblePlots.value) {
    if (selectedOutputs.value.includes(output)) {
      const data = analysisResults.value.map((result) => ({
        x: result.primaryValue,
        y: result.outputs[output] || 0,
      }))

      datasets.push({
        label: getOutputLabel(output),
        data,
        color: colors[colorIndex % colors.length],
        unit: getOutputUnit(output),
      })

      colorIndex++
    }
  }

  return datasets
})

// Enhanced methods
function toggleAnalysis() {
  if (isAnalysisActive.value) {
    isAnalysisActive.value = false
    isAnalysisRunning.value = false
  } else {
    if (!primaryParameter.value || selectedOutputs.value.length === 0) return
    startEnhancedAnalysis()
  }
}

async function startEnhancedAnalysis() {
  isAnalysisActive.value = true
  isAnalysisRunning.value = true
  analysisProgress.value = 0
  analysisResults.value = []

  try {
    const { min, max, steps } = primaryRange.value
    const stepSize = (max - min) / (steps - 1)

    for (let i = 0; i < steps; i++) {
      if (!isAnalysisActive.value) break // Allow stopping

      const paramValue = min + i * stepSize
      currentPrimaryValue.value = paramValue

      // Mock enhanced simulation - in real implementation, would call actual simulation
      const outputs: Record<string, number> = {}

      // Generate more sophisticated mock data for enhanced analysis
      selectedOutputs.value.forEach((output) => {
        let value = 0
        if (output === 'voltage') {
          value = 5 * Math.exp(-paramValue / 5000) + 0.1 * Math.sin(paramValue / 1000)
        } else if (output === 'current') {
          value = (0.005 * paramValue) / 1000 + 0.0001 * Math.cos(paramValue / 2000)
        } else if (output === 'power') {
          value = outputs.voltage * outputs.current || paramValue * 0.0001
        } else if (output === 'resistance') {
          value = paramValue
        }
        outputs[output] = value
        currentOutputValues.value[output] = value
      })

      analysisResults.value.push({
        primaryValue: paramValue,
        outputs,
      })

      analysisProgress.value = Math.round((i / (steps - 1)) * 100)

      // Enhanced processing delay with higher resolution
      if (i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
    }

    console.log('Enhanced analysis completed:', analysisResults.value.length, 'points')
  } catch (error) {
    console.error('Enhanced analysis failed:', error)
  } finally {
    isAnalysisRunning.value = false
  }
}

function clearResults() {
  analysisResults.value = []
  isAnalysisActive.value = false
  isAnalysisRunning.value = false
  analysisProgress.value = 0
  currentOutputValues.value = {}
}

function togglePlotVisibility(output: string) {
  const index = visiblePlots.value.indexOf(output)
  if (index > -1) {
    visiblePlots.value.splice(index, 1)
  } else {
    visiblePlots.value.push(output)
  }
}

function onParameterChange() {
  // Reset analysis when parameter changes
  clearResults()

  // Set appropriate defaults based on parameter type
  const param = availableParameters.value.find((p) => p.id === primaryParameter.value)
  if (param?.type === 'resistance') {
    primaryRange.value = { min: 100, max: 10000, steps: 100, step: 10 }
  } else if (param?.type === 'voltage') {
    primaryRange.value = { min: 1, max: 10, steps: 50, step: 0.1 }
  } else if (param?.type === 'percentage') {
    primaryRange.value = { min: 0, max: 100, steps: 100, step: 1 }
  }
}

function onOutputChange() {
  // Update visible plots when outputs change
  visiblePlots.value = selectedOutputs.value.slice()
}

function onRangeChange() {
  // Clear results when range changes
  if (analysisResults.value.length > 0) {
    clearResults()
  }
}

function formatValue(value: number, unit: string): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A'

  // Enhanced formatting with engineering notation
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(3)}M${unit}`
  } else if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(3)}k${unit}`
  } else if (Math.abs(value) >= 1) {
    return `${value.toFixed(4)}${unit}`
  } else if (Math.abs(value) >= 1e-3) {
    return `${(value * 1e3).toFixed(3)}m${unit}`
  } else if (Math.abs(value) >= 1e-6) {
    return `${(value * 1e6).toFixed(3)}μ${unit}`
  } else {
    return `${value.toExponential(3)}${unit}`
  }
}

function getOutputLabel(output: string): string {
  const outputDef = availableOutputs.value.find((o) => o.id === output)
  return outputDef?.label || output
}

function getOutputUnit(output: string): string {
  const outputDef = availableOutputs.value.find((o) => o.id === output)
  return outputDef?.unit || ''
}

// Enhanced export functions
function exportCSV() {
  if (analysisResults.value.length === 0) return

  const headers = [
    primaryParameterLabel.value,
    ...selectedOutputs.value.map((o) => getOutputLabel(o)),
  ]
  const csvContent = [
    headers.join(','),
    ...analysisResults.value.map((result) =>
      [
        result.primaryValue,
        ...selectedOutputs.value.map((output) => result.outputs[output] || 0),
      ].join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `enhanced_analysis_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exportImage() {
  // Use AnalysisChart's export capability
  if (analysisChart.value?.exportChart) {
    const imageData = analysisChart.value.exportChart()
    if (imageData) {
      const link = document.createElement('a')
      link.href = imageData
      link.download = `enhanced_analysis_${Date.now()}.png`
      link.click()
    }
  }
}

function copyToClipboard() {
  if (analysisResults.value.length === 0) return

  const text = analysisResults.value
    .map((result) => `${result.primaryValue}: ${JSON.stringify(result.outputs)}`)
    .join('\n')

  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log('Enhanced analysis data copied to clipboard')
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err)
    })
}

// Stop analysis when component unmounts
onUnmounted(() => {
  isAnalysisActive.value = false
  isAnalysisRunning.value = false
})
</script>

<style scoped>
/* Using design system classes only - no custom CSS */
</style>
