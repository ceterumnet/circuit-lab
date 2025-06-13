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
            <span v-if="circuitStore.isSimulating" class="simulation-status">
              🔄 Simulating...
            </span>
          </div>
        </div>

        <div class="canvas-container" @click="handleCanvasClick">
          <!-- For now, we'll create a simple placeholder canvas -->
          <div class="canvas-placeholder" ref="canvasRef">
            <div class="placeholder-content">
              <h3>Circuit Canvas</h3>
              <p>Selected Tool: {{ selectedTool || 'None' }}</p>
              <p>Click to add components when a tool is selected</p>

              <!-- Show existing components -->
              <div v-if="circuitStore.componentCount > 0" class="component-list">
                <h4>Components:</h4>
                <div
                  v-for="component in circuitStore.currentCircuit.components"
                  :key="component.id"
                  :class="['component-item', { selected: component.selected }]"
                  @click.stop="selectComponent(component.id)"
                >
                  {{ component.id }} ({{ component.type }})
                  <button @click.stop="removeComponent(component.id)">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { ComponentType } from '@/types/circuit'
import type { Resistor, VoltageSource, Ground } from '@/types/circuit'
import ComponentToolbar from '@/components/circuit/ComponentToolbar.vue'

const circuitStore = useCircuitStore()
const selectedTool = ref<ComponentType | null>(null)
const canvasRef = ref<HTMLElement>()

function handleToolSelected(tool: ComponentType) {
  selectedTool.value = tool
}

function handleCanvasClick(event: MouseEvent) {
  if (!selectedTool.value) return

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  addComponentAtPosition(selectedTool.value, { x, y })
  selectedTool.value = null // Clear selection after adding
}

function addComponentAtPosition(type: ComponentType, position: { x: number; y: number }) {
  const id = circuitStore.generateComponentId(type)

  const baseComponent = {
    id,
    type,
    position,
    rotation: 0,
    selected: false,
  }

  let component

  switch (type) {
    case ComponentType.RESISTOR:
      component = {
        ...baseComponent,
        type: ComponentType.RESISTOR,
        resistance: { value: 1000, unit: 'Ω' },
        terminals: [`${id}_1`, `${id}_2`],
      } as Resistor
      break

    case ComponentType.VOLTAGE_SOURCE:
      component = {
        ...baseComponent,
        type: ComponentType.VOLTAGE_SOURCE,
        voltage: { value: 5, unit: 'V' },
        sourceType: 'dc' as const,
        terminals: [`${id}_pos`, `${id}_neg`],
      } as VoltageSource
      break

    case ComponentType.GROUND:
      component = {
        ...baseComponent,
        type: ComponentType.GROUND,
        terminal: `${id}_gnd`,
      } as Ground
      break

    default:
      return
  }

  circuitStore.addComponent(component)
}

function selectComponent(componentId: string) {
  circuitStore.selectComponent(componentId)
}

function removeComponent(componentId: string) {
  circuitStore.removeComponent(componentId)
}
</script>

<style scoped>
.circuit-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
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

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
  max-width: 500px;
  padding: 2rem;
}

.placeholder-content h3 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.placeholder-content p {
  margin: 0.5rem 0;
}

.component-list {
  margin-top: 2rem;
  text-align: left;
}

.component-list h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.component-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.component-item:hover {
  background: #e9ecef;
}

.component-item.selected {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.component-item button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-item button:hover {
  background: #c82333;
}
</style>
