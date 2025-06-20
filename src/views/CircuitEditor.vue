<template>
  <div class="circuit-editor">
    <div class="editor-layout">
      <component-palette class="sidebar" />

      <!-- Main canvas area -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h2>{{ circuitStore.currentCircuit.name }}</h2>
          <div class="canvas-actions">
            <!-- Undo/Redo buttons -->
            <div class="history-controls">
              <button
                class="history-button"
                :disabled="!historyActions.canUndo"
                @click="historyActions.undo()"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 class="icon" />
              </button>
              <button
                class="history-button"
                :disabled="!historyActions.canRedo"
                @click="historyActions.redo()"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 class="icon" />
              </button>
            </div>
            <button
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import { useHistoryStore } from '@/stores/history'
import { getComponentDefinition } from '@/registry/components'
import { useCircuitHistory } from '@/composables/useCircuitHistory'
import { Play, CheckCircle, Loader2, AlertTriangle, Undo2, Redo2 } from 'lucide-vue-next'

import CircuitCanvas from '@/components/circuit/CircuitCanvas.vue'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ComponentPalette from '@/components/circuit/ComponentPalette.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import type { CircuitComponent, Probe } from '@/types/components'

const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()
const historyStore = useHistoryStore()
const historyActions = useCircuitHistory()

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
    }
  }
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
  overflow: visible;
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
</style>
