<template>
  <div class="ide-layout">
    <!-- IDE Toolbar -->
    <div class="ide-toolbar">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ circuitStore.currentCircuit.name }}
          </h2>
        </div>

        <div class="flex items-center gap-2">
          <!-- Save/Load toggle -->
          <button
            class="btn btn-secondary btn-sm"
            :class="{ 'btn-primary': showSaveLoad }"
            @click="showSaveLoad = !showSaveLoad"
            title="Save/Load circuits"
          >
            <Save class="w-4 h-4 mr-2" />
            Save/Load
          </button>

          <!-- Undo/Redo buttons -->
          <div class="flex items-center gap-1">
            <button
              class="btn btn-icon"
              :disabled="!historyActions.canUndo.value"
              @click="historyActions.undo()"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 class="w-4 h-4" />
            </button>
            <button
              class="btn btn-icon"
              :disabled="!historyActions.canRedo.value"
              @click="historyActions.redo()"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Real-time simulation toggle -->
          <button
            class="btn btn-secondary btn-sm"
            :class="{
              'btn-primary': circuitStore.isRealTimeSimulation,
              'opacity-50 cursor-not-allowed': circuitStore.isSimulating,
            }"
            :disabled="circuitStore.isSimulating"
            @click="circuitStore.toggleRealTimeSimulation()"
            :title="
              circuitStore.isRealTimeSimulation
                ? 'Disable real-time simulation'
                : 'Enable real-time simulation'
            "
          >
            <Zap v-if="circuitStore.isRealTimeSimulation" class="w-4 h-4 mr-2" />
            <ZapOff v-else class="w-4 h-4 mr-2" />
            <span>{{ circuitStore.isRealTimeSimulation ? 'Live' : 'Manual' }}</span>
          </button>

          <!-- Explicit simulate button (only shown when real-time is disabled) -->
          <button
            v-if="!circuitStore.isRealTimeSimulation"
            class="btn btn-primary btn-sm"
            :class="{
              'opacity-50 cursor-not-allowed': circuitStore.isSimulating,
            }"
            :disabled="circuitStore.isSimulating"
            @click="runSimulation"
          >
            <Loader2 v-if="circuitStore.isSimulating" class="w-4 h-4 mr-2 animate-spin" />
            <CheckCircle v-else-if="circuitStore.hasValidSimulation" class="w-4 h-4 mr-2" />
            <Play v-else class="w-4 h-4 mr-2" />
            <span v-if="circuitStore.isSimulating">Simulating...</span>
            <span v-else-if="circuitStore.hasValidSimulation">Re-simulate</span>
            <span v-else>Simulate</span>
          </button>
        </div>

        <!-- Status indicators -->
        <div class="flex items-center gap-3">
          <!-- Real-time simulation indicator (only shown when real-time is enabled) -->
          <div
            v-if="circuitStore.isRealTimeSimulation"
            class="simulation-status"
            :class="{
              running: circuitStore.isSimulating,
              success: circuitStore.hasValidSimulation && !circuitStore.isSimulating,
              idle: !circuitStore.isSimulating && !circuitStore.hasValidSimulation,
            }"
          >
            <Loader2 v-if="circuitStore.isSimulating" class="w-3 h-3 animate-spin" />
            <div
              v-else-if="circuitStore.hasValidSimulation"
              class="w-3 h-3 bg-emerald-500 rounded-full"
            ></div>
            <div v-else class="w-3 h-3 bg-slate-500 rounded-full"></div>
            <span v-if="circuitStore.isSimulating" class="text-sm">Auto-simulating...</span>
            <span v-else-if="circuitStore.hasValidSimulation" class="text-sm">Live simulation</span>
            <span v-else class="text-sm">Live simulation</span>
          </div>

          <!-- Error indicators -->
          <div v-if="circuitStore.simulationErrors.length > 0" class="simulation-status error">
            <AlertTriangle class="w-3 h-3" />
            <div class="error-tooltip">
              <ul>
                <li v-for="error in circuitStore.simulationErrors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>

          <!-- Warning indicators -->
          <div v-if="circuitStore.simulationWarnings.length > 0" class="simulation-status warning">
            <Info class="w-3 h-3" />
            <div class="warning-tooltip">
              <ul>
                <li v-for="warning in circuitStore.simulationWarnings" :key="warning">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Right side indicators -->
        <div class="ml-auto flex items-center gap-4">
          <span class="text-sm text-slate-500">Components: {{ circuitStore.componentCount }}</span>
          <span
            v-if="interactionStore.wireCreationState.isActive"
            class="text-sm text-blue-600 font-medium"
          >
            🔌 Click to complete wire
          </span>
          <span
            v-else-if="interactionStore.componentToPlace"
            class="text-sm text-blue-600 font-medium"
          >
            📍 Click to place {{ getComponentName(interactionStore.componentToPlace) }}
          </span>
          <div class="text-sm text-slate-500">Circuit Lab v2.1.0</div>
        </div>
      </div>
    </div>

    <!-- Save/Load Panel -->
    <div v-if="showSaveLoad" class="save-load-overlay">
      <circuit-save-load />
    </div>

    <!-- IDE Main Content -->
    <div class="ide-main">
      <!-- Component Palette (Left Sidebar) -->
      <component-palette class="component-palette" :style="{ width: `${leftPanelWidth}px` }" />

      <!-- Left Resize Handle -->
      <div
        class="resize-handle resize-handle-vertical group cursor-col-resize-hd"
        :class="{ resizing: isResizing && resizeTarget === 'left' }"
        @mousedown="startResize('left', $event)"
      >
        <div class="resize-handle-indicator"></div>
      </div>

      <!-- Circuit Canvas (Center) -->
      <div class="circuit-canvas-container">
        <circuit-canvas class="circuit-canvas" />
      </div>

      <!-- Right Resize Handle -->
      <div
        class="resize-handle resize-handle-vertical group cursor-col-resize-hd"
        :class="{ resizing: isResizing && resizeTarget === 'right' }"
        @mousedown="startResize('right', $event)"
      >
        <div class="resize-handle-indicator"></div>
      </div>

      <!-- Analysis Workspace (Right Sidebar) -->
      <analysis-workspace
        class="properties-panel"
        :style="{ width: `${rightPanelWidth}px` }"
        :selected-component="itemIsComponent(singleSelectedItem) ? singleSelectedItem : null"
        :selected-probe="itemIsProbe(singleSelectedItem) ? singleSelectedItem : null"
        :multiple-selection="interactionStore.selectedComponentIds.length > 1"
        :has-circuit="circuitStore.currentCircuit.components.length > 0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import { useHistoryStore } from '@/stores/history'
import { getComponentDefinition } from '@/registry/components'
import { useCircuitHistory } from '@/composables/useCircuitHistory'
import {
  Save,
  Undo2,
  Redo2,
  Play,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info,
  Zap,
  ZapOff,
} from 'lucide-vue-next'

import CircuitCanvas from '@/components/circuit/CircuitCanvas.vue'
import ComponentPalette from '@/components/circuit/ComponentPalette.vue'
import CircuitSaveLoad from '@/components/circuit/CircuitSaveLoad.vue'
import AnalysisWorkspace from '@/components/circuit/analysis/AnalysisWorkspace.vue'
import type { CircuitComponent, Probe } from '@/types/components'

const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()
const historyStore = useHistoryStore()
const historyActions = useCircuitHistory()

// Local component state
const showSaveLoad = ref(false)

// Resizable panels functionality
const leftPanelWidth = ref(208) // Default component-palette width (w-52 = 208px)
const rightPanelWidth = ref(320) // Default properties-panel width (w-80 = 320px)
const isResizing = ref(false)
const resizeTarget = ref<'left' | 'right' | null>(null)
const initialMouseX = ref(0)
const initialPanelWidth = ref(0)

// Initialize history only once in the main editor
onMounted(() => {
  historyStore.initializeHistory(circuitStore.currentCircuit)

  // Load panel widths from localStorage
  loadPanelWidths()

  // Set up keyboard shortcuts only in the main editor
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)

  // Cleanup resize event listeners
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// Keyboard shortcuts handler
function handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      historyActions.undo()
    } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
      event.preventDefault()
      historyActions.redo()
    } else if (event.key === 'c') {
      event.preventDefault()
      handleCopy()
    } else if (event.key === 'x') {
      event.preventDefault()
      handleCut()
    } else if (event.key === 'v') {
      event.preventDefault()
      handlePaste()
    }
  }
}

// Copy functionality
function handleCopy() {
  const success = circuitStore.copySelectedComponents()
  if (success) {
    console.log('Components copied to clipboard')
    // TODO: Show toast notification
  }
}

// Cut functionality
function handleCut() {
  const success = historyActions.cutComponentsWithHistory()
  if (success) {
    console.log('Components cut to clipboard')
    // TODO: Show toast notification
  }
}

// Paste functionality
function handlePaste() {
  // Check if there are components in clipboard
  if (!circuitStore.hasClipboardContent()) {
    console.log('No components in clipboard to paste')
    return
  }

  // Start paste placement mode
  interactionStore.startPastePlacement()
  console.log('Started paste placement mode - move mouse and click to place')
}

const singleSelectedItem = computed(() => circuitStore.singleSelectedItem)

function itemIsComponent(item: CircuitComponent | Probe | null): item is CircuitComponent {
  return !!(item && 'properties' in item)
}

function itemIsProbe(item: CircuitComponent | Probe | null): item is Probe {
  return !!(item && 'targetId' in item)
}

function getComponentName(componentType: string): string {
  const definition = getComponentDefinition(componentType)
  return definition?.name || componentType
}

async function runSimulation() {
  await circuitStore.startSimulation()
}

// Start resize operation
function startResize(target: 'left' | 'right', event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  resizeTarget.value = target
  initialMouseX.value = event.clientX
  initialPanelWidth.value = target === 'left' ? leftPanelWidth.value : rightPanelWidth.value

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor =
    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M8 3 4 7l4 4'%3e%3c/path%3e%3cpath d='M4 7h16'%3e%3c/path%3e%3cpath d='m16 21 4-4-4-4'%3e%3c/path%3e%3cpath d='M20 17H4'%3e%3c/path%3e%3c/svg%3e\") 8 8, col-resize"
  document.body.style.userSelect = 'none'
}

// Handle mouse movement during resize
function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value || !resizeTarget.value) return

  const minWidth = 150
  const maxWidth = 500
  const deltaX = event.clientX - initialMouseX.value

  if (resizeTarget.value === 'left') {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, initialPanelWidth.value + deltaX))
    leftPanelWidth.value = newWidth
  } else {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, initialPanelWidth.value - deltaX))
    rightPanelWidth.value = newWidth
  }
}

// End resize operation
function handleMouseUp() {
  isResizing.value = false
  resizeTarget.value = null

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Load panel widths from localStorage
function loadPanelWidths() {
  const saved = localStorage.getItem('circuit-lab-panel-widths')
  if (saved) {
    try {
      const { left, right } = JSON.parse(saved)
      if (left && left >= 150 && left <= 500) leftPanelWidth.value = left
      if (right && right >= 150 && right <= 500) rightPanelWidth.value = right
    } catch (e) {
      console.warn('Failed to load panel widths from localStorage:', e)
    }
  }
}

// Save panel widths to localStorage
watchEffect(() => {
  localStorage.setItem(
    'circuit-lab-panel-widths',
    JSON.stringify({
      left: leftPanelWidth.value,
      right: rightPanelWidth.value,
    }),
  )
})
</script>

<style scoped>
/* IDE Layout System - Professional Circuit Simulator */
.ide-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}

.ide-toolbar {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-height: 64px;
}

.ide-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.component-palette {
  flex-shrink: 0;
  /* Width set dynamically via inline styles for resizable panels */
}

.circuit-canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.circuit-canvas {
  width: 100%;
  height: 100%;
}

.properties-panel {
  flex-shrink: 0;
  /* Width set dynamically via inline styles for resizable panels */
}

/* Save/Load Overlay */
.save-load-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Simulation Status Indicators */
.simulation-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  position: relative;
}

.simulation-status.running {
  background: #fef3c7;
  color: #f59e0b;
}

.simulation-status.success {
  background: #d1fae5;
  color: #059669;
}

.simulation-status.idle {
  background: #f1f5f9;
  color: #64748b;
}

.simulation-status.error {
  background: #fee2e2;
  color: #dc2626;
}

.simulation-status.warning {
  background: #fef3c7;
  color: #f59e0b;
}

/* Tooltips */
.error-tooltip,
.warning-tooltip {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #1e293b;
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  display: none;
  z-index: 1000;
  min-width: 200px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.error-tooltip {
  background: #dc2626;
}

.warning-tooltip {
  background: #f59e0b;
  color: #1f2937;
}

.error-tooltip ul,
.warning-tooltip ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-tooltip li,
.warning-tooltip li {
  margin-bottom: 0.25rem;
}

.error-tooltip li:last-child,
.warning-tooltip li:last-child {
  margin-bottom: 0;
}

.simulation-status:hover .error-tooltip,
.simulation-status:hover .warning-tooltip {
  display: block;
}
</style>
