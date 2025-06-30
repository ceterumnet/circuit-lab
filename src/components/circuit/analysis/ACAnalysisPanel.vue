<template>
  <div class="properties-panel">
    <!-- AC Analysis Control Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Radio class="w-4 h-4" />
        AC Analysis Configuration
      </div>

      <div class="property-field">
        <label class="property-label">Analysis Type</label>
        <select v-model="analysisType" class="property-input">
          <option value="frequency_response">Frequency Response</option>
          <option value="bode_plot">Bode Plot</option>
        </select>
      </div>

      <div class="property-field">
        <label class="property-label">Frequency Range</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model.number="startFrequency"
            type="number"
            class="property-input"
            placeholder="Start (Hz)"
            min="0.01"
            step="any"
          />
          <input
            v-model.number="stopFrequency"
            type="number"
            class="property-input"
            placeholder="Stop (Hz)"
            min="0.01"
            step="any"
          />
        </div>
      </div>

      <button
        @click="runAnalysis"
        :disabled="isAnalysisRunning || !canRunAnalysis"
        class="btn btn-primary w-full"
      >
        <Play v-if="!isAnalysisRunning" class="w-4 h-4 mr-2" />
        <div
          v-else
          class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
        ></div>
        {{ isAnalysisRunning ? 'Running...' : 'Run AC Analysis' }}
      </button>
    </div>

    <!-- Analysis Status Section -->
    <div class="property-section">
      <div class="property-section-title">Analysis Status</div>
      <div class="analysis-status-card">
        <div v-if="isAnalysisRunning" class="simulation-status running">
          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Running AC analysis...
        </div>
        <div v-else-if="analysisResults.length > 0" class="simulation-status success">
          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Analysis complete ({{ analysisResults.length }} points)
        </div>
        <div v-else class="simulation-status idle">
          <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
          Configure frequency range and click Run AC Analysis
        </div>
      </div>
    </div>

    <!-- Professional Analysis Chart -->
    <div class="property-section">
      <div class="property-section-title">AC Analysis Results</div>
      <div class="chart-container">
        <analysis-chart
          v-if="chartDatasets.length > 0"
          ref="analysisChart"
          :datasets="chartDatasets"
          :x-label="xAxisLabel"
          :y-label="yAxisLabel"
          :title="chartTitle"
        />
        <div v-else class="info-panel">
          <div class="flex flex-col items-center justify-center text-center py-8">
            <BarChart3 class="w-8 h-8 text-slate-400 mb-3" />
            <h4 class="text-lg font-semibold text-slate-900 mb-2">No AC Analysis Data</h4>
            <p class="text-slate-600">Configure frequency range and run analysis to see results</p>
          </div>
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
        <button @click="exportCSV" class="btn btn-secondary flex-1">Export CSV</button>
        <button @click="exportImage" class="btn btn-secondary flex-1">Export Plot</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Radio, Play, BarChart3, Download } from 'lucide-vue-next'
import { useCircuitStore } from '@/stores/circuit'
import AnalysisChart from './AnalysisChart.vue'

// Circuit store
const circuitStore = useCircuitStore()

// Analysis configuration
const analysisType = ref<'frequency_response' | 'bode_plot'>('frequency_response')
const startFrequency = ref(1)
const stopFrequency = ref(10000)
const isAnalysisRunning = ref(false)

// Analysis results
interface ACAnalysisResult {
  frequency: number
  magnitude: number
  phase: number
  voltage: number
  current: number
}

const analysisResults = ref<ACAnalysisResult[]>([])

// Computed properties for chart data
const chartDatasets = computed(() => {
  if (analysisResults.value.length === 0) return []

  const datasets = []

  if (analysisType.value === 'bode_plot') {
    // Magnitude plot data
    datasets.push({
      label: 'Magnitude',
      data: analysisResults.value.map((result) => ({
        x: result.frequency,
        y: 20 * Math.log10(result.magnitude), // Convert to dB
      })),
      color: '#3b82f6',
      unit: 'dB',
    })

    // Phase plot data (separate dataset)
    datasets.push({
      label: 'Phase',
      data: analysisResults.value.map((result) => ({
        x: result.frequency,
        y: (result.phase * 180) / Math.PI, // Convert to degrees
      })),
      color: '#ef4444',
      unit: '°',
    })
  } else {
    // Frequency response data
    datasets.push({
      label: 'Voltage Response',
      data: analysisResults.value.map((result) => ({
        x: result.frequency,
        y: result.voltage,
      })),
      color: '#dc2626', // voltage-red from design system
      unit: 'V',
    })

    datasets.push({
      label: 'Current Response',
      data: analysisResults.value.map((result) => ({
        x: result.frequency,
        y: result.current * 1000, // Convert to mA
      })),
      color: '#059669', // current-green from design system
      unit: 'mA',
    })
  }

  return datasets
})

const xAxisLabel = computed(() => 'Frequency (Hz)')

const yAxisLabel = computed(() => {
  if (analysisType.value === 'bode_plot') {
    return 'Magnitude (dB) / Phase (°)'
  }
  return 'Response'
})

const chartTitle = computed(() => {
  if (analysisType.value === 'bode_plot') {
    return 'Bode Plot - Frequency Response'
  }
  return 'AC Frequency Response Analysis'
})

const canRunAnalysis = computed(() => {
  return (
    startFrequency.value > 0 &&
    stopFrequency.value > startFrequency.value &&
    circuitStore.currentCircuit.components.length > 0
  )
})

// Analysis functions
async function runAnalysis() {
  if (!canRunAnalysis.value) return

  isAnalysisRunning.value = true
  analysisResults.value = []

  try {
    // Generate mock AC analysis data for demonstration
    // In real implementation, this would call the AC simulation engine
    const results: ACAnalysisResult[] = []
    const numPoints = 50
    const logStart = Math.log10(startFrequency.value)
    const logStop = Math.log10(stopFrequency.value)

    for (let i = 0; i < numPoints; i++) {
      const logFreq = logStart + (i / (numPoints - 1)) * (logStop - logStart)
      const frequency = Math.pow(10, logFreq)

      // Mock transfer function: H(jω) = 1 / (1 + jω/ωc) where ωc = 1000 Hz
      const wc = 2 * Math.PI * 1000
      const w = 2 * Math.PI * frequency
      const magnitude = 1 / Math.sqrt(1 + Math.pow(w / wc, 2))
      const phase = -Math.atan(w / wc)

      results.push({
        frequency,
        magnitude,
        phase,
        voltage: magnitude * 5, // 5V input
        current: magnitude * 0.005, // 5mA nominal
      })

      // Simulate processing delay
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    analysisResults.value = results
  } catch (error) {
    console.error('AC Analysis failed:', error)
  } finally {
    isAnalysisRunning.value = false
  }
}

// Export functions
function exportCSV() {
  if (analysisResults.value.length === 0) return

  const headers = ['Frequency (Hz)', 'Magnitude', 'Phase (rad)', 'Voltage (V)', 'Current (A)']
  const csvContent = [
    headers.join(','),
    ...analysisResults.value.map((result) =>
      [result.frequency, result.magnitude, result.phase, result.voltage, result.current].join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ac_analysis_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exportImage() {
  // This would use the AnalysisChart's export capability
  console.log('Export image functionality would be implemented here')
}
</script>

<style scoped>
/* Using design system classes only - no custom CSS */
</style>
