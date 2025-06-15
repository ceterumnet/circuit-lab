<template>
  <div class="component-toolbar">
    <h3 class="toolbar-title">Circuit Lab</h3>

    <!-- Interaction Modes -->
    <div class="toolbar-section">
      <h4>Tools</h4>
      <button
        v-for="mode in interactionModes"
        :key="mode.mode"
        :class="['toolbar-button', { active: circuitStore.currentMode === mode.mode }]"
        @click="setMode(mode.mode)"
      >
        <div class="button-icon">{{ mode.icon }}</div>
        <span class="button-label">{{ mode.label }}</span>
      </button>
    </div>

    <!-- Component Categories -->
    <div v-for="category in componentCategories" :key="category.name" class="toolbar-section">
      <h4>{{ category.name }}</h4>
      <button
        v-for="component in category.components"
        :key="component.type"
        :class="['toolbar-button', {
          active: circuitStore.currentMode === 'place_component' && selectedComponentType === component.type
        }]"
        @click="selectComponent(component.type)"
      >
        <div class="button-icon">{{ component.icon }}</div>
        <span class="button-label">{{ component.name }}</span>
      </button>
    </div>

    <!-- Actions -->
    <div class="toolbar-section">
      <h4>Actions</h4>
      <button
        :class="['toolbar-button', 'action-button']"
        :disabled="circuitStore.isSimulating"
        @click="runSimulation"
      >
        <div class="button-icon">⚡</div>
        <span class="button-label">
          {{ circuitStore.isSimulating ? 'Running...' : 'Simulate' }}
        </span>
      </button>

      <button :class="['toolbar-button', 'action-button']" @click="clearCircuit">
        <div class="button-icon">🗑️</div>
        <span class="button-label">Clear</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { InteractionMode } from '@/types/components'
import { getAllComponents } from '@/registry/components'
import type { ComponentDefinition } from '@/types/components'

const circuitStore = useCircuitStore()
const selectedComponentType = ref<string | null>(null)

// Define interaction modes
const interactionModes = [
  { mode: InteractionMode.SELECT_MOVE, label: 'Select', icon: '👆' },
  { mode: InteractionMode.WIRE, label: 'Wire', icon: '🔌' },
  { mode: InteractionMode.ROTATE, label: 'Rotate', icon: '🔄' },
  { mode: InteractionMode.DELETE, label: 'Delete', icon: '🗑️' },
  { mode: InteractionMode.PAN_ZOOM, label: 'Pan', icon: '🖐️' },
]

// Organize components by category
interface ComponentCategory {
  name: string
  components: ComponentDefinition[]
}

const componentCategories = computed(() => {
  const categories = new Map<string, ComponentCategory>()

  getAllComponents().forEach(component => {
    if (component.type === 'wire') return // Skip wire as it's not placeable

    if (!categories.has(component.category)) {
      categories.set(component.category, {
        name: component.category.charAt(0).toUpperCase() + component.category.slice(1),
        components: []
      })
    }
    categories.get(component.category)!.components.push(component)
  })

  return Array.from(categories.values())
})

// Functions
function setMode(mode: InteractionMode) {
  circuitStore.setMode(mode)
  selectedComponentType.value = null
}

function selectComponent(componentType: string) {
  selectedComponentType.value = componentType
  circuitStore.setComponentPlacementMode(componentType)
}

function runSimulation() {
  circuitStore.startSimulation()
}

function clearCircuit() {
  if (confirm('Are you sure you want to clear the circuit?')) {
    circuitStore.clearCircuit()
    selectedComponentType.value = null
    circuitStore.setMode(InteractionMode.SELECT_MOVE)
  }
}
</script>

<style scoped>
.component-toolbar {
  width: 180px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 0.75rem;
  overflow-y: auto;
}

.toolbar-title {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}

.toolbar-section {
  margin-bottom: 1.5rem;
}

.toolbar-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbar-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.toolbar-button.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.toolbar-button:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.button-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
  min-width: 24px;
  text-align: center;
}

.button-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.action-button {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.action-button:hover {
  background: #218838;
  border-color: #1e7e34;
}
</style>
