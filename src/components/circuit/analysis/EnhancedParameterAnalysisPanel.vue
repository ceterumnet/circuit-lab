<template>
  <div class="enhanced-parameter-analysis">
    <!-- Analysis Configuration -->
    <div class="config-section">
      <div class="config-grid">
        <!-- Parameter Selection -->
        <div class="config-card">
          <h4>🎛️ Sweep Parameter</h4>
          <div class="parameter-control">
            <select v-model="primaryParameter" @change="onParameterChange">
              <option value="">Select component...</option>
              <option v-for="param in availableParameters" :key="param.id" :value="param.id">
                {{ param.label }}
              </option>
            </select>
          </div>

          <!-- Parameter Range -->
          <div v-if="primaryParameter" class="range-controls">
            <div class="range-row">
              <label>Range:</label>
              <input
                v-model.number="primaryRange.min"
                type="number"
                :step="primaryRange.step"
                placeholder="Min"
              />
              <span>to</span>
              <input
                v-model.number="primaryRange.max"
                type="number"
                :step="primaryRange.step"
                placeholder="Max"
              />
              <span class="unit">{{ primaryParameterUnit }}</span>
            </div>
            <div class="range-row">
              <label>Steps:</label>
              <input
                v-model.number="primaryRange.steps"
                type="number"
                min="5"
                max="200"
                placeholder="Steps"
              />
              <button class="quick-steps" @click="primaryRange.steps = 50">50</button>
              <button class="quick-steps" @click="primaryRange.steps = 100">100</button>
            </div>
          </div>
        </div>

        <!-- Output Selection -->
        <div class="config-card">
          <h4>📈 Analysis Outputs</h4>
          <div class="output-grid">
            <label v-for="output in availableOutputs" :key="output.id" class="output-checkbox">
              <input
                v-model="selectedOutputs"
                :value="output.id"
                type="checkbox"
                @change="onOutputChange"
              />
              <span class="output-label">{{ output.label }}</span>
              <span class="output-unit">({{ output.unit }})</span>
            </label>
          </div>
        </div>

        <!-- Analysis Control -->
        <div class="config-card">
          <h4>⚡ Analysis Control</h4>
          <div class="control-buttons">
            <button
              class="analysis-btn primary"
              :class="{ active: isAnalysisActive }"
              @click="toggleAnalysis"
              :disabled="!primaryParameter || selectedOutputs.length === 0"
            >
              {{ isAnalysisActive ? '⏸️ Pause' : '▶️ Start' }} Analysis
            </button>
            <button
              class="analysis-btn secondary"
              @click="clearResults"
              :disabled="analysisResults.length === 0"
            >
              🗑️ Clear
            </button>
          </div>

          <!-- Analysis Status -->
          <div class="status-display">
            <div v-if="isAnalysisRunning" class="status running">
              <div class="spinner"></div>
              <span>Running sweep... {{ analysisProgress }}%</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${analysisProgress}%` }"></div>
              </div>
            </div>
            <div v-else-if="analysisResults.length > 0" class="status completed">
              <span>✅ Complete ({{ analysisResults.length }} points)</span>
            </div>
            <div v-else class="status idle">
              <span>Configure parameters and click Start</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Visualization -->
    <div class="results-section">
      <!-- Current Values Display -->
      <div v-if="isAnalysisActive" class="current-values-card">
        <h4>🔍 Current Analysis Point</h4>
        <div class="current-values-grid">
          <div v-if="primaryParameter" class="current-value">
            <span class="value-label">{{ primaryParameterLabel }}:</span>
            <span class="value-data">{{
              formatValue(currentPrimaryValue, primaryParameterUnit)
            }}</span>
          </div>
          <div v-for="output in selectedOutputs" :key="output" class="current-value">
            <span class="value-label">{{ getOutputLabel(output) }}:</span>
            <span class="value-data">{{
              formatValue(currentOutputValues[output], getOutputUnit(output))
            }}</span>
          </div>
        </div>
      </div>

      <!-- Plot Area -->
      <div class="plot-section">
        <div class="plot-header">
          <h4>📊 Analysis Results</h4>
          <div class="plot-controls">
            <button
              v-for="output in selectedOutputs"
              :key="output"
              class="plot-toggle"
              :class="{ active: visiblePlots.includes(output) }"
              @click="togglePlotVisibility(output)"
            >
              {{ getOutputLabel(output) }}
            </button>
          </div>
        </div>

        <div class="plot-container">
          <canvas
            ref="plotCanvas"
            class="analysis-plot"
            :width="plotWidth"
            :height="plotHeight"
            @mousemove="handlePlotMouseMove"
            @mouseleave="clearPlotTooltip"
          ></canvas>

          <!-- Plot Tooltip -->
          <div v-if="plotTooltip.visible" class="plot-tooltip" :style="plotTooltip.style">
            <div class="tooltip-content">
              <div class="tooltip-param">
                {{ primaryParameterLabel }}: {{ formatValue(plotTooltip.x, primaryParameterUnit) }}
              </div>
              <div
                v-for="(value, output) in plotTooltip.values"
                :key="output"
                class="tooltip-value"
              >
                {{ getOutputLabel(output) }}: {{ formatValue(value, getOutputUnit(output)) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Export -->
      <div v-if="analysisResults.length > 0" class="export-section">
        <h4>💾 Export Results</h4>
        <div class="export-controls">
          <button @click="exportCSV" class="export-btn">📊 Export CSV</button>
          <button @click="exportImage" class="export-btn">🖼️ Export Plot</button>
          <button @click="copyToClipboard" class="export-btn">📋 Copy Data</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'

// All the existing logic from ParameterAnalysisPanel but with enhanced UI structure
const circuitStore = useCircuitStore()

// Enhanced state management
const isAnalysisActive = ref(false)
const isAnalysisRunning = ref(false)
const analysisProgress = ref(0)
const primaryParameter = ref('')
const selectedOutputs = ref<string[]>(['voltage'])
const visiblePlots = ref<string[]>(['voltage'])
const analysisResults = ref<
  Array<{
    primaryValue: number
    outputs: Record<string, number>
  }>
>([])
const currentPrimaryValue = ref(0)
const currentOutputValues = ref<Record<string, number>>({})

// Enhanced plot configuration
const plotCanvas = ref<HTMLCanvasElement>()
const plotWidth = ref(800) // Larger plot size
const plotHeight = ref(400)

// Plot tooltip
const plotTooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  style: {},
  values: {} as Record<string, number>,
})

const primaryRange = ref({
  min: 100,
  max: 10000,
  steps: 50,
  step: 100,
})

// Mock computed properties (implement based on existing logic)
const availableParameters = computed(() => [
  { id: 'R1:resistance', label: 'R1 Resistance', unit: 'Ω', type: 'resistance' },
])

const availableOutputs = computed(() => [
  { id: 'voltage', label: 'Node Voltage', unit: 'V' },
  { id: 'current', label: 'Branch Current', unit: 'A' },
  { id: 'power', label: 'Power', unit: 'W' },
])

const primaryParameterLabel = computed(() => 'Parameter')
const primaryParameterUnit = computed(() => 'Ω')

// Enhanced methods
function toggleAnalysis() {
  isAnalysisActive.value = !isAnalysisActive.value
}

function clearResults() {
  analysisResults.value = []
  isAnalysisActive.value = false
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
  // Implementation
}

function onOutputChange() {
  // Update visible plots when outputs change
  visiblePlots.value = selectedOutputs.value.slice()
}

function formatValue(value: number, unit: string): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A'
  return `${value.toFixed(3)} ${unit}`
}

function getOutputLabel(output: string): string {
  const outputDef = availableOutputs.value.find((o) => o.id === output)
  return outputDef?.label || output
}

function getOutputUnit(output: string): string {
  const outputDef = availableOutputs.value.find((o) => o.id === output)
  return outputDef?.unit || ''
}

function handlePlotMouseMove(event: MouseEvent) {
  // Enhanced plot interaction
  const rect = plotCanvas.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // Show tooltip with data point information
  plotTooltip.value = {
    visible: true,
    x: x,
    y: y,
    style: {
      left: `${x + 10}px`,
      top: `${y - 10}px`,
    },
    values: { voltage: 3.3, current: 0.001 }, // Mock data
  }
}

function clearPlotTooltip() {
  plotTooltip.value.visible = false
}

function exportCSV() {
  // CSV export implementation
}

function exportImage() {
  // Image export implementation
}

function copyToClipboard() {
  // Clipboard copy implementation
}
</script>

<style scoped>
.enhanced-parameter-analysis {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.config-section {
  flex-shrink: 0;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.config-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
}

.config-card h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 0.95rem;
}

.parameter-control select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.range-controls {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.range-row label {
  min-width: 4rem;
  font-weight: 500;
}

.range-row input {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  padding: 0.25rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.8rem;
  box-sizing: border-box;
}

.range-row .unit {
  color: #6c757d;
  font-weight: 500;
}

.quick-steps {
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
}

.quick-steps:hover {
  background: #f8f9fa;
}

.output-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.output-label {
  font-weight: 500;
}

.output-unit {
  color: #6c757d;
  font-size: 0.8rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.analysis-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.analysis-btn.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.analysis-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.analysis-btn.secondary {
  background: white;
  color: #6c757d;
}

.analysis-btn.secondary:hover:not(:disabled) {
  background: #f8f9fa;
}

.analysis-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-display {
  font-size: 0.875rem;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.status.running {
  background: #fff3cd;
  color: #856404;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.idle {
  background: #f8f9fa;
  color: #6c757d;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #f8f9fa;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #856404;
  transition: width 0.3s ease;
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.current-values-card {
  background: #f8fff9;
  border: 1px solid #d4edda;
  border-radius: 8px;
  padding: 1rem;
}

.current-values-card h4 {
  margin: 0 0 0.75rem 0;
  color: #155724;
}

.current-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.current-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.875rem;
}

.value-label {
  font-weight: 500;
}

.value-data {
  font-family: monospace;
  color: #495057;
}

.plot-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.plot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.plot-header h4 {
  margin: 0;
  color: #495057;
}

.plot-controls {
  display: flex;
  gap: 0.25rem;
}

.plot-toggle {
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plot-toggle:hover {
  background: #f8f9fa;
}

.plot-toggle.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.plot-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.analysis-plot {
  border: none;
  cursor: crosshair;
}

.plot-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 10;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-param {
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 0.25rem;
}

.export-section {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
}

.export-section h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
}

.export-controls {
  display: flex;
  gap: 0.75rem;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .config-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 800px) {
  .config-grid {
    grid-template-columns: 1fr;
  }

  .current-values-grid {
    grid-template-columns: 1fr;
  }
}

/* Narrow panel adjustments */
@media (max-width: 500px) {
  .range-row {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .range-row label {
    min-width: 3rem;
    font-size: 0.75rem;
  }

  .range-row input {
    padding: 0.2rem;
    font-size: 0.75rem;
    min-width: 60px;
  }

  .range-row .unit {
    font-size: 0.7rem;
  }
}
</style>
