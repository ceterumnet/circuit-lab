<template>
  <div class="circuit-editor">
    <div class="editor-layout">
      <component-palette class="sidebar" />

      <!-- Main canvas area -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h2>{{ circuitStore.currentCircuit.name }}</h2>
          <div class="canvas-actions">
            <!-- Save/Load toggle -->
            <button
              class="save-load-toggle"
              :class="{ active: showSaveLoad }"
              @click="showSaveLoad = !showSaveLoad"
              title="Save/Load circuits"
            >
              <Save class="icon" />
              Save/Load
            </button>

            <!-- Undo/Redo buttons -->
            <div class="history-controls">
              <button
                class="history-button"
                :disabled="!historyActions.canUndo.value"
                @click="historyActions.undo()"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 class="icon" />
              </button>
              <button
                class="history-button"
                :disabled="!historyActions.canRedo.value"
                @click="historyActions.redo()"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 class="icon" />
              </button>
            </div>

            <!-- Real-time simulation toggle -->
            <button
              class="realtime-toggle"
              :class="{
                active: circuitStore.isRealTimeSimulation,
                disabled: circuitStore.isSimulating,
              }"
              :disabled="circuitStore.isSimulating"
              @click="circuitStore.toggleRealTimeSimulation()"
              :title="
                circuitStore.isRealTimeSimulation
                  ? 'Disable real-time simulation'
                  : 'Enable real-time simulation'
              "
            >
              <Zap v-if="circuitStore.isRealTimeSimulation" class="icon" />
              <ZapOff v-else class="icon" />
              <span>{{ circuitStore.isRealTimeSimulation ? 'Live' : 'Manual' }}</span>
            </button>

            <!-- Explicit simulate button (only shown when real-time is disabled) -->
            <button
              v-if="!circuitStore.isRealTimeSimulation"
              class="simulate-button"
              :class="{
                simulating: circuitStore.isSimulating,
                'has-errors': circuitStore.simulationErrors.length > 0,
                'has-results': circuitStore.hasValidSimulation,
              }"
              :disabled="circuitStore.isSimulating"
              @click="runSimulation"
            >
              <Loader2 v-if="circuitStore.isSimulating" class="icon spinning" />
              <CheckCircle v-else-if="circuitStore.hasValidSimulation" class="icon" />
              <Play v-else class="icon" />
              <span v-if="circuitStore.isSimulating">Simulating...</span>
              <span v-else-if="circuitStore.hasValidSimulation">Re-simulate</span>
              <span v-else>Simulate</span>
            </button>

            <!-- Real-time simulation indicator (only shown when real-time is enabled) -->
            <div
              v-if="circuitStore.isRealTimeSimulation"
              class="realtime-indicator"
              :class="{
                simulating: circuitStore.isSimulating,
                'has-errors': circuitStore.simulationErrors.length > 0,
                'has-results': circuitStore.hasValidSimulation,
              }"
            >
              <Loader2 v-if="circuitStore.isSimulating" class="icon spinning" />
              <CheckCircle v-else-if="circuitStore.hasValidSimulation" class="icon" />
              <Zap v-else class="icon" />
              <span v-if="circuitStore.isSimulating">Auto-simulating...</span>
              <span v-else-if="circuitStore.hasValidSimulation">Live simulation</span>
              <span v-else>Live simulation</span>
            </div>

            <div v-if="circuitStore.simulationErrors.length > 0" class="simulation-errors">
              <AlertTriangle class="error-icon" />
              <div class="error-tooltip">
                <ul>
                  <li v-for="error in circuitStore.simulationErrors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
            <span class="component-count">Components: {{ circuitStore.componentCount }}</span>
            <span v-if="interactionStore.wireCreationState.isActive" class="wiring-mode">
              🔌 Click to complete wire
            </span>
            <span v-else-if="interactionStore.componentToPlace" class="placement-mode">
              📍 Click to place {{ getComponentName(interactionStore.componentToPlace) }}
            </span>
          </div>
        </div>

        <!-- Save/Load Panel -->
        <div v-if="showSaveLoad" class="save-load-overlay">
          <circuit-save-load />
        </div>

        <div class="canvas-container">
          <circuit-canvas class="circuit-canvas" />
        </div>
      </div>

      <!-- Component properties panel -->
      <div class="properties-panel">
        <component-properties
          v-if="itemIsComponent(singleSelectedItem)"
          :component="singleSelectedItem"
        />
        <probe-properties v-else-if="itemIsProbe(singleSelectedItem)" :probe="singleSelectedItem" />
        <div v-else-if="interactionStore.selectedComponentIds.length > 1" class="no-selection">
          <p>{{ interactionStore.selectedComponentIds.length }} items selected</p>
          <p>Editing multiple items at once is not yet supported.</p>
        </div>
        <div v-else class="no-selection">
          <p>Select a component to edit its properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
  Zap,
  ZapOff,
} from 'lucide-vue-next'

import CircuitCanvas from '@/components/circuit/CircuitCanvas.vue'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ComponentPalette from '@/components/circuit/ComponentPalette.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import CircuitSaveLoad from '@/components/circuit/CircuitSaveLoad.vue'
import type { CircuitComponent, Probe } from '@/types/components'

const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()
const historyStore = useHistoryStore()
const historyActions = useCircuitHistory()

// Local component state
const showSaveLoad = ref(false)

// Initialize history only once in the main editor
onMounted(() => {
  historyStore.initializeHistory(circuitStore.currentCircuit)

  // Set up keyboard shortcuts only in the main editor
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
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
</script>

<style scoped>
.circuit-editor {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-layout {
  display: flex;
  flex: 1;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

.sidebar {
  flex-shrink: 0;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
}

.canvas-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #343a40;
}

.canvas-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-load-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.save-load-toggle:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.save-load-toggle.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.save-load-overlay {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
  margin: 16px;
}

.simulate-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #007bff;
  border-radius: 6px;
  background: white;
  color: #007bff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.simulate-button .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.simulate-button .spinning {
  animation: spin 1s linear infinite;
}

.simulate-button:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.simulate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.simulate-button.simulating {
  border-color: #ffc107;
  color: #ffc107;
  animation: pulse 1.5s infinite;
}

.simulate-button.has-errors {
  border-color: #dc3545;
  color: #dc3545;
}

.simulate-button.has-results {
  border-color: #28a745;
  color: #28a745;
}

.history-controls {
  display: flex;
  gap: 0.25rem;
  margin-right: 0.5rem;
}

.history-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-button .icon {
  width: 16px;
  height: 16px;
}

.history-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #343a40;
}

.history-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8f9fa;
  color: #adb5bd;
}

.simulation-errors {
  position: relative;
  display: flex;
  align-items: center;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #dc3545;
  cursor: pointer;
}

.error-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  background: #fff;
  border: 2px solid #dc3545;
  border-radius: 6px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  z-index: 1000;
  display: none;
}

.simulation-errors:hover .error-tooltip {
  display: block;
}

.error-tooltip ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.875rem;
  color: #dc3545;
  line-height: 1.4;
}

.error-tooltip li {
  margin-bottom: 0.25rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.component-count {
  font-size: 0.875rem;
  color: #6c757d;
}

.wiring-mode {
  font-size: 0.875rem;
  color: #dc3545;
  font-weight: 500;
  background: #ffe6e6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.placement-mode {
  font-size: 0.875rem;
  color: #007bff;
  font-weight: 500;
  background: #e6f3ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.circuit-canvas {
  width: 100%;
  height: 100%;
}

.properties-panel {
  width: 320px;
  flex-shrink: 0;
  background: #f8f9fa;
  border-left: 1px solid #dee2e6;
  padding: 1rem;
  overflow: auto;
  position: relative;
  z-index: 10;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6c757d;
  text-align: center;
}

.realtime-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #6c757d;
  border-radius: 6px;
  background: white;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.5rem;
}

.realtime-toggle .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.realtime-toggle:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.realtime-toggle.active {
  border-color: #28a745;
  color: #28a745;
  background: #f8fff9;
}

.realtime-toggle.active:hover:not(:disabled) {
  background: #28a745;
  color: white;
}

.realtime-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #28a745;
  border-radius: 6px;
  background: #f8fff9;
  color: #28a745;
  margin-right: 0.5rem;
}

.realtime-indicator .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.realtime-indicator .spinning {
  animation: spin 1s linear infinite;
}

.realtime-indicator.simulating {
  border-color: #ffc107;
  color: #ffc107;
  background: #fffbf0;
  animation: pulse 1.5s infinite;
}

.realtime-indicator.has-errors {
  border-color: #dc3545;
  color: #dc3545;
  background: #fff5f5;
}

.realtime-indicator.has-results {
  border-color: #28a745;
  color: #28a745;
  background: #f8fff9;
}
</style>
