<template>
  <div class="circuit-editor">
    <div class="editor-layout">
      <!-- Component toolbar -->
      <component-toolbar class="sidebar" @tool-selected="handleToolSelected" />

      <!-- Main canvas area -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h2>{{ circuitStore.currentCircuit.name }}</h2>
          <div class="canvas-actions">
            <span class="component-count"> Components: {{ circuitStore.componentCount }} </span>
            <span v-if="selectedTool" class="selected-tool"> Selected: {{ selectedTool }} </span>
            <span v-if="circuitStore.isWiringMode" class="wiring-mode">
              🔌 Click terminal to complete wire
            </span>
            <span v-if="circuitStore.isSimulating" class="simulation-status">
              🔄 Simulating...
            </span>
          </div>
        </div>

        <div class="canvas-container">
          <circuit-canvas
            :selected-tool="selectedTool"
            @component-placed="handleComponentPlaced"
            class="circuit-canvas"
          />
        </div>
      </div>

      <!-- Component properties panel -->
      <div class="properties-panel">
        <component-properties
          v-if="circuitStore.selectedComponent"
          :component="circuitStore.selectedComponent"
        />
        <div v-else class="no-selection">
          <p>Select a component to edit its properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { ComponentType } from '@/types/circuit'

import ComponentToolbar from '@/components/circuit/ComponentToolbar.vue'
import CircuitCanvas from '@/components/circuit/CircuitCanvas.vue'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'

const circuitStore = useCircuitStore()
const selectedTool = ref<ComponentType | null>(null)

function handleToolSelected(tool: ComponentType) {
  selectedTool.value = tool
}

function handleComponentPlaced() {
  selectedTool.value = null // Clear selection after adding
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

.component-count {
  font-size: 0.875rem;
  color: #6c757d;
}

.simulation-status {
  font-size: 0.875rem;
  color: #28a745;
  font-weight: 500;
}

.selected-tool {
  font-size: 0.875rem;
  color: #007bff;
  font-weight: 500;
  background: #e7f3ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.wiring-mode {
  font-size: 0.875rem;
  color: #dc3545;
  font-weight: 500;
  background: #ffe6e6;
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
