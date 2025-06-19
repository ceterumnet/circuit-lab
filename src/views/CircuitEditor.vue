<template>
  <div class="circuit-editor">
    <div class="editor-layout">
      <component-palette class="sidebar" />

      <!-- Main canvas area -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h2>{{ circuitStore.currentCircuit.name }}</h2>
          <div class="canvas-actions">
            <div class="live-simulation-indicator">
              <div class="simulation-dot"></div>
              <span>Live Simulation</span>
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
import { computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import { getComponentDefinition } from '@/registry/components'

import CircuitCanvas from '@/components/circuit/CircuitCanvas.vue'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ComponentPalette from '@/components/circuit/ComponentPalette.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import type { CircuitComponent, Probe } from '@/types/components'

const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()

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

.live-simulation-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #28a745;
  font-weight: 500;
}

.simulation-dot {
  width: 8px;
  height: 8px;
  background-color: #28a745;
  border-radius: 50%;
  animation: pulse 2s infinite;
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
