<template>
  <div class="parameter-analysis-panel">
    <div class="panel-header">
      <h3>📊 Parameter Analysis</h3>
      <button class="toggle-btn" :class="{ active: isAnalysisActive }" @click="toggleAnalysis">
        {{ isAnalysisActive ? '⏸️ Pause' : '▶️ Start' }} Analysis
      </button>
    </div>

    <!-- Parameter Selection -->
    <div class="parameter-section">
      <h4>🎛️ Sweep Parameters</h4>

      <!-- Primary Parameter -->
      <div class="parameter-control">
        <label>Primary Parameter:</label>
        <select v-model="primaryParameter" @change="onParameterChange">
          <option value="">Select component...</option>
          <option v-for="param in availableParameters" :key="param.id" :value="param.id">
            {{ param.label }}
          </option>
        </select>
      </div>

      <!-- Primary Parameter Range -->
      <div v-if="primaryParameter" class="range-controls">
        <div class="range-input">
          <label>Min:</label>
          <input
            v-model.number="primaryRange.min"
            type="number"
            :step="primaryRange.step"
            @input="onRangeChange"
          />
          <span class="unit">{{ primaryParameterUnit }}</span>
        </div>
        <div class="range-input">
          <label>Max:</label>
          <input
            v-model.number="primaryRange.max"
            type="number"
            :step="primaryRange.step"
            @input="onRangeChange"
          />
          <span class="unit">{{ primaryParameterUnit }}</span>
        </div>
        <div class="range-input">
          <label>Steps:</label>
          <input
            v-model.number="primaryRange.steps"
            type="number"
            min="5"
            max="100"
            @input="onRangeChange"
          />
        </div>
      </div>
    </div>

    <!-- Output Selection -->
    <div class="output-section">
      <h4>📈 Analysis Outputs</h4>
      <div class="output-controls">
        <label v-for="output in availableOutputs" :key="output.id" class="output-checkbox">
          <input
            v-model="selectedOutputs"
            :value="output.id"
            type="checkbox"
            @change="onOutputChange"
          />
          {{ output.label }} ({{ output.unit }})
        </label>
      </div>
    </div>

    <!-- Real-time Current Values -->
    <div v-if="isAnalysisActive" class="current-values">
      <h4>🔍 Current Analysis Point</h4>
      <div class="value-display">
        <div v-if="primaryParameter" class="current-param">
          <strong>{{ primaryParameterLabel }}:</strong>
          {{ formatValue(currentPrimaryValue, primaryParameterUnit) }}
        </div>
        <div v-for="output in selectedOutputs" :key="output" class="current-output">
          <strong>{{ getOutputLabel(output) }}:</strong>
          {{ formatValue(currentOutputValues[output], getOutputUnit(output)) }}
        </div>
      </div>
    </div>

    <!-- Analysis Status -->
    <div class="analysis-status">
      <div v-if="isAnalysisRunning" class="status running">
        <div class="spinner"></div>
        Running sweep... {{ analysisProgress }}%
      </div>
      <div v-else-if="analysisResults.length > 0" class="status completed">
        ✅ Analysis complete ({{ analysisResults.length }} points)
      </div>
      <div v-else class="status idle">Configure parameters and click Start Analysis</div>
    </div>

    <!-- Plot Container -->
    <div class="plot-container">
      <canvas
        ref="plotCanvas"
        class="analysis-plot"
        :width="plotWidth"
        :height="plotHeight"
      ></canvas>
    </div>

    <!-- Export Controls -->
    <div v-if="analysisResults.length > 0" class="export-section">
      <h4>💾 Export Results</h4>
      <div class="export-controls">
        <button @click="exportCSV" class="export-btn">📊 Export CSV</button>
        <button @click="exportImage" class="export-btn">🖼️ Export Plot</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import type { DC_Result } from '@/services/simulation'

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
const plotCanvas = ref<HTMLCanvasElement>()
const plotWidth = ref(400)
const plotHeight = ref(300)

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

  console.log('🚀 Starting parameter sweep analysis...')

  try {
    await runParameterSweep()
    console.log('✅ Parameter sweep completed')
  } catch (error) {
    console.error('❌ Parameter sweep failed:', error)
  } finally {
    isAnalysisRunning.value = false
  }
}

function stopAnalysis() {
  isAnalysisActive.value = false
  isAnalysisRunning.value = false
  console.log('⏸️ Parameter analysis stopped')
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
        Object.entries(result.currents).forEach(([componentId, current]) => {
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
  if (!plotCanvas.value) return

  const link = document.createElement('a')
  link.download = 'parameter_analysis.png'
  link.href = plotCanvas.value.toDataURL()
  link.click()
}

// Plot rendering
watch(
  analysisResults,
  () => {
    if (analysisResults.value.length > 0) {
      renderPlot()
    }
  },
  { deep: true },
)

function renderPlot() {
  if (!plotCanvas.value || analysisResults.value.length === 0) return

  const ctx = plotCanvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, plotWidth.value, plotHeight.value)

  // Simple 2D line plot for primary parameter vs first selected output
  if (selectedOutputs.value.length > 0) {
    const outputId = selectedOutputs.value[0]
    const data = analysisResults.value.map((r) => ({
      x: r.primaryValue,
      y: r.outputs[outputId] || 0,
    }))

    // Find data bounds
    const xMin = Math.min(...data.map((d) => d.x))
    const xMax = Math.max(...data.map((d) => d.x))
    const yMin = Math.min(...data.map((d) => d.y))
    const yMax = Math.max(...data.map((d) => d.y))

    const margin = 40
    const plotAreaWidth = plotWidth.value - 2 * margin
    const plotAreaHeight = plotHeight.value - 2 * margin

    // Draw axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, margin)
    ctx.lineTo(margin, plotHeight.value - margin)
    ctx.lineTo(plotWidth.value - margin, plotHeight.value - margin)
    ctx.stroke()

    // Draw data line
    ctx.strokeStyle = '#007bff'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, index) => {
      const x = margin + ((point.x - xMin) / (xMax - xMin)) * plotAreaWidth
      const y = plotHeight.value - margin - ((point.y - yMin) / (yMax - yMin)) * plotAreaHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw data points
    ctx.fillStyle = '#007bff'
    data.forEach((point) => {
      const x = margin + ((point.x - xMin) / (xMax - xMin)) * plotAreaWidth
      const y = plotHeight.value - margin - ((point.y - yMin) / (yMax - yMin)) * plotAreaHeight

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Add labels
    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(primaryParameterLabel.value, plotWidth.value / 2, plotHeight.value - 10)

    ctx.save()
    ctx.translate(15, plotHeight.value / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(getOutputLabel(outputId), 0, 0)
    ctx.restore()
  }
}

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
.parameter-analysis-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #6c757d;
  border-radius: 6px;
  background: white;
  color: #6c757d;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #6c757d;
  color: white;
}

.toggle-btn.active {
  border-color: #28a745;
  color: #28a745;
  background: #f8fff9;
}

.toggle-btn.active:hover {
  background: #28a745;
  color: white;
}

.parameter-section,
.output-section,
.current-values,
.export-section {
  margin-bottom: 1.5rem;
}

.parameter-section h4,
.output-section h4,
.current-values h4,
.export-section h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 1rem;
}

.parameter-control {
  margin-bottom: 1rem;
}

.parameter-control label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.parameter-control select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.range-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.range-input label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
}

.range-input input {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 0.25rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.8rem;
  box-sizing: border-box;
}

.range-input .unit {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.output-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
}

.output-checkbox input {
  margin: 0;
}

.current-values {
  background: #f8fff9;
  border: 1px solid #d4edda;
  border-radius: 6px;
  padding: 1rem;
}

.value-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-param,
.current-output {
  font-size: 0.875rem;
  font-family: monospace;
}

.analysis-status {
  margin-bottom: 1rem;
}

.status {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status.idle {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.status.running {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status.completed {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffeaa7;
  border-top: 2px solid #856404;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.plot-container {
  margin: 1rem 0;
  text-align: center;
}

.analysis-plot {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
}

.export-controls {
  display: flex;
  gap: 0.75rem;
}

.export-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: white;
  color: #007bff;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.export-btn:hover {
  background: #007bff;
  color: white;
}

/* Responsive adjustments for narrow panels */
@media (max-width: 500px) {
  .range-controls {
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
  }

  .range-input {
    gap: 0.1rem;
  }

  .range-input label {
    font-size: 0.7rem;
  }

  .range-input input {
    padding: 0.2rem;
    font-size: 0.75rem;
  }
}

/* For very narrow workspace (collapsed state) */
@container (max-width: 450px) {
  .range-controls {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
