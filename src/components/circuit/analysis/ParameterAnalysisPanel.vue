<template>
  <div class="properties-panel">
    <!-- Analysis Control Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <BarChart3 class="w-4 h-4" />
        Parameter Analysis
      </div>
      <button
        class="btn w-full"
        :class="isAnalysisActive ? 'btn-secondary' : 'btn-primary'"
        @click="toggleAnalysis"
      >
        <Pause v-if="isAnalysisActive" class="w-4 h-4 mr-2" />
        <Play v-else class="w-4 h-4 mr-2" />
        {{ isAnalysisActive ? 'Pause' : 'Start' }} Analysis
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

      <!-- Primary Parameter Range -->
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
          <input
            v-model.number="primaryRange.steps"
            type="number"
            class="property-input"
            min="5"
            max="100"
            @input="onRangeChange"
          />
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

    <!-- Analysis Status Section -->
    <div class="property-section">
      <div class="property-section-title">Analysis Status</div>
      <div class="analysis-status-card">
        <div v-if="isAnalysisRunning" class="simulation-status running">
          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Running sweep... {{ analysisProgress }}%
        </div>
        <div v-else-if="analysisResults.length > 0" class="simulation-status success">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          Analysis complete ({{ analysisResults.length }} points)
        </div>
        <div v-else class="simulation-status idle">
          <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
          Configure parameters and click Start Analysis
        </div>
      </div>
    </div>

    <!-- Plot Container Section -->
    <div class="property-section">
      <div class="property-section-title">Analysis Results</div>
      <div class="plot-container">
        <analysis-chart
          v-if="chartDatasets.length > 0"
          ref="analysisChart"
          :datasets="chartDatasets"
          :x-label="primaryParameterLabel"
          :y-label="'Multiple Outputs'"
          :title="`${primaryParameterLabel} vs Circuit Response`"
        />
        <div v-else class="info-panel">
          <div class="info-icon">
            <BarChart3 class="w-8 h-8 text-slate-400" />
          </div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">No Analysis Data</h4>
          <p class="text-slate-600">Configure parameters and run analysis to see results</p>
        </div>
      </div>
    </div>

    <!-- Export Controls Section -->
    <div v-if="analysisResults.length > 0" class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Download class="w-4 h-4" />
        Export Results
      </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import {
  BarChart3,
  Play,
  Pause,
  Sliders,
  TrendingUp,
  Search,
  Download,
  Image,
} from 'lucide-vue-next'

// Component state
const isAnalysisActive = ref(false)
const isAnalysisRunning = ref(false)
const analysisProgress = ref(0)

// Parameter selection
const primaryParameter = ref('')
const selectedOutputs = ref<string[]>(['voltage', 'current'])

// Parameter ranges
const primaryRange = ref({
  min: 100,
  max: 10000,
  steps: 50,
  step: 100,
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

// Plot configuration
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
  ]

  // Add specific component measurements
  circuitStore.currentCircuit.components.forEach((component) => {
    if (component.type === 'diode' || component.type === 'led') {
      outputs.push({
        id: `${component.id}:current`,
        label: `${component.label || component.id} Current`,
        unit: 'A',
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

// Chart datasets for the new Chart.js component
const chartDatasets = computed(() => {
  if (analysisResults.value.length === 0 || selectedOutputs.value.length === 0) {
    return []
  }

  return selectedOutputs.value.map((outputId, index) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
    const outputDef = availableOutputs.value.find((o) => o.id === outputId)

    return {
      label: outputDef?.label || outputId,
      unit: outputDef?.unit || '',
      color: colors[index % colors.length],
      data: analysisResults.value.map((result) => ({
        x: result.primaryValue,
        y: result.outputs[outputId] || 0,
      })),
    }
  })
})

// Analysis control functions
function toggleAnalysis() {
  if (isAnalysisActive.value) {
    stopAnalysis()
  } else {
    startAnalysis()
  }
}

async function startAnalysis() {
  if (!primaryParameter.value || selectedOutputs.value.length === 0) {
    alert('Please select parameters and outputs for analysis')
    return
  }

  isAnalysisActive.value = true
  isAnalysisRunning.value = true
  analysisProgress.value = 0
  analysisResults.value = []

  console.log('Starting parameter sweep analysis...')

  try {
    await runParameterSweep()
    console.log('Parameter sweep completed')
  } catch (error) {
    console.error('Parameter sweep failed:', error)
  } finally {
    isAnalysisRunning.value = false
  }
}

function stopAnalysis() {
  isAnalysisActive.value = false
  isAnalysisRunning.value = false
  console.log('Parameter analysis stopped')
}

async function runParameterSweep() {
  const steps = primaryRange.value.steps

  for (let i = 0; i < steps; i++) {
    const primaryValue =
      primaryRange.value.min + (i / (steps - 1)) * (primaryRange.value.max - primaryRange.value.min)

    await sweepPoint(primaryValue)
    analysisProgress.value = Math.round(((i + 1) / steps) * 100)

    // Allow UI updates
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

async function sweepPoint(primaryValue: number) {
  // Set parameter value
  setParameterValue(primaryParameter.value, primaryValue)

  // Update current display
  currentPrimaryValue.value = primaryValue

  // Run simulation
  const success = await circuitStore.startSimulation()

  if (success && circuitStore.dcSolution) {
    const result = circuitStore.dcSolution

    // Extract output values
    const outputs: Record<string, number> = {}

    selectedOutputs.value.forEach((outputId) => {
      if (outputId === 'voltage') {
        // Average node voltages
        const voltages = Object.values(result.voltages)
        outputs[outputId] =
          voltages.reduce((sum: number, v: number) => sum + Math.abs(v), 0) / voltages.length
      } else if (outputId === 'current') {
        // Average component currents
        const currents = Object.values(result.currents)
        outputs[outputId] =
          currents.reduce((sum: number, i: number) => sum + Math.abs(i), 0) / currents.length
      } else if (outputId === 'power') {
        // Calculate total power
        let totalPower = 0
        Object.entries(result.currents).forEach(
          ([_componentId, current]) => {
          const voltage = Object.values(result.voltages)[0] || 0 // Simplified - use first node voltage
          totalPower += Math.abs(current * voltage)
        })
        outputs[outputId] = totalPower
      } else if (outputId.includes(':')) {
        // Specific component measurement
        const [componentId] = outputId.split(':')
        outputs[outputId] = result.currents[componentId] || 0
      }
    })

    // Update current output display
    currentOutputValues.value = { ...outputs }

    // Store result
    analysisResults.value.push({
      primaryValue,
      outputs,
    })
  }
}

function setParameterValue(parameterId: string, value: number) {
  const [componentId, propertyKey] = parameterId.split(':')
  const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)

  if (component) {
    const newProperties = {
      ...component.properties,
      [propertyKey]: value,
    }
    circuitStore.updateComponent(componentId, { properties: newProperties })
  }
}

// Event handlers
function onParameterChange() {
  analysisResults.value = []
  updateParameterRanges()
}

function onRangeChange() {
  analysisResults.value = []
}

function onOutputChange() {
  analysisResults.value = []
}

function updateParameterRanges() {
  const primaryParam = availableParameters.value.find((p) => p.id === primaryParameter.value)
  if (primaryParam) {
    if (primaryParam.type === 'resistance') {
      primaryRange.value = { min: 100, max: 10000, steps: 50, step: 100 }
    } else if (primaryParam.type === 'percentage') {
      primaryRange.value = { min: 0, max: 100, steps: 21, step: 5 }
    } else if (primaryParam.type === 'voltage') {
      primaryRange.value = { min: 1, max: 12, steps: 12, step: 1 }
    }
  }
}

// Utility functions
function getOutputLabel(outputId: string) {
  const output = availableOutputs.value.find((o) => o.id === outputId)
  return output?.label || outputId
}

function getOutputUnit(outputId: string) {
  const output = availableOutputs.value.find((o) => o.id === outputId)
  return output?.unit || ''
}

function formatValue(value: number, unit: string): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A'

  if (unit === 'A') {
    if (Math.abs(value) >= 1) return `${value.toFixed(3)}A`
    if (Math.abs(value) >= 0.001) return `${(value * 1000).toFixed(1)}mA`
    return `${(value * 1000000).toFixed(1)}μA`
  } else if (unit === 'V') {
    return `${value.toFixed(3)}V`
  } else if (unit === 'Ω') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}MΩ`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}kΩ`
    return `${value.toFixed(0)}Ω`
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`
  } else if (unit === 'W') {
    if (Math.abs(value) >= 1) return `${value.toFixed(3)}W`
    if (Math.abs(value) >= 0.001) return `${(value * 1000).toFixed(1)}mW`
    return `${(value * 1000000).toFixed(1)}μW`
  }

  return `${value.toFixed(3)}${unit}`
}

// Export functions
function exportCSV() {
  if (analysisResults.value.length === 0) return

  const headers = ['Primary Parameter']
  selectedOutputs.value.forEach((output) => {
    headers.push(getOutputLabel(output))
  })

  const rows = [headers.join(',')]

  analysisResults.value.forEach((result) => {
    const row = [result.primaryValue.toString()]
    selectedOutputs.value.forEach((output) => {
      row.push((result.outputs[output] || 0).toString())
    })
    rows.push(row.join(','))
  })

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'parameter_analysis.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportImage() {
  if (!analysisChart.value) return

  const imageData = analysisChart.value.exportChart()
  if (imageData) {
    const link = document.createElement('a')
    link.download = 'parameter_analysis.png'
    link.href = imageData
    link.click()
  }
}

// Chart rendering is now handled by the AnalysisChart component automatically

// Lifecycle
onMounted(() => {
  if (availableParameters.value.length > 0) {
    primaryParameter.value = availableParameters.value[0].id
    updateParameterRanges()
  }
})

onUnmounted(() => {
  stopAnalysis()
})
</script>

<style scoped>
/* Properties Panel - Design System Styling */
.properties-panel {
  padding: 0;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  container-type: inline-size;
}

.analysis-status-card {
  padding: 0;
  background: transparent;
}

.plot-container {
  margin: 1rem 0;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fefefe;
}

/* Info panel for empty states */
.info-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.info-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

/* Responsive grid adjustments */
@container (max-width: 450px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
