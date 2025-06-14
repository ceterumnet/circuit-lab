<template>
  <div class="component-toolbar">
    <h3 class="toolbar-title">Components</h3>

    <div class="toolbar-section">
      <h4>Basic</h4>
      <button
        v-for="component in basicComponents"
        :key="component.type"
        :class="['toolbar-button', { active: selectedTool === component.type }]"
        @click="selectTool(component.type)"
      >
        <div class="button-icon">{{ component.icon }}</div>
        <span class="button-label">{{ component.label }}</span>
      </button>
    </div>

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
import { ref } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { ComponentType } from '@/types/circuit'

const circuitStore = useCircuitStore()

const selectedTool = ref<ComponentType | null>(null)

const basicComponents = [
  {
    type: ComponentType.RESISTOR,
    label: 'Resistor',
    icon: '〰️',
  },
  {
    type: ComponentType.VOLTAGE_SOURCE,
    label: 'Voltage Source',
    icon: '⊕',
  },
  {
    type: ComponentType.GROUND,
    label: 'Ground',
    icon: '⏚',
  },
  {
    type: ComponentType.NODE,
    label: 'Node',
    icon: '⚫',
  },
]

interface Emits {
  (e: 'tool-selected', tool: ComponentType): void
}

const emit = defineEmits<Emits>()

function selectTool(componentType: ComponentType) {
  selectedTool.value = componentType
  emit('tool-selected', componentType)
}

function runSimulation() {
  circuitStore.startSimulation()
}

function clearCircuit() {
  if (confirm('Are you sure you want to clear the circuit?')) {
    circuitStore.clearCircuit()
    selectedTool.value = null
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
