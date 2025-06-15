<template>
  <div class="modal-toolbar">
    <!-- Interaction Modes -->
    <div class="mode-section">
      <h3>Modes</h3>
      <div class="mode-buttons">
        <button
          v-for="mode in interactionModes"
          :key="mode.id"
          :class="['mode-btn', { active: currentMode === mode.id }]"
          @click="selectMode(mode.id)"
          :title="mode.description"
        >
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-label">{{ mode.label }}</span>
        </button>
      </div>
    </div>

    <!-- Component Placement -->
    <div class="component-section">
      <h3>Components</h3>
      <div class="component-categories">
        <div
          v-for="category in componentCategories"
          :key="category.name"
          class="category-group"
        >
          <h4>{{ category.label }}</h4>
          <div class="component-buttons">
            <button
              v-for="component in category.components"
              :key="component.type"
              :class="['component-btn', {
                active: currentMode === InteractionMode.PLACE_COMPONENT && selectedComponentType === component.type
              }]"
              @click="selectComponent(component.type)"
              :title="component.name"
            >
              <span class="component-icon">{{ component.icon }}</span>
              <span class="component-label">{{ component.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode Status -->
    <div class="status-section">
      <div class="current-mode">
        <strong>Mode:</strong> {{ getCurrentModeLabel() }}
      </div>
      <div v-if="currentMode === InteractionMode.PLACE_COMPONENT && selectedComponentType" class="selected-component">
        <strong>Component:</strong> {{ getComponentName(selectedComponentType) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { InteractionMode } from '@/types/components'
import { getAllComponents, getComponentsByCategory } from '@/registry/components'

const circuitStore = useCircuitStore()

// Interaction modes configuration
const interactionModes = [
  {
    id: InteractionMode.SELECT_MOVE,
    label: 'Select',
    icon: '👆',
    description: 'Select and move components'
  },
  {
    id: InteractionMode.WIRE,
    label: 'Wire',
    icon: '🔌',
    description: 'Connect components with wires'
  },
  {
    id: InteractionMode.ROTATE,
    label: 'Rotate',
    icon: '🔄',
    description: 'Rotate components'
  },
  {
    id: InteractionMode.DELETE,
    label: 'Delete',
    icon: '🗑️',
    description: 'Delete components'
  },
  {
    id: InteractionMode.PAN_ZOOM,
    label: 'Pan',
    icon: '🖐️',
    description: 'Pan and zoom canvas'
  }
]

// Component categories for organized display
const componentCategories = computed(() => [
  {
    name: 'passive',
    label: 'Passive',
    components: getComponentsByCategory('passive')
  },
  {
    name: 'power',
    label: 'Power',
    components: getComponentsByCategory('power')
  },
  {
    name: 'connection',
    label: 'Connections',
    components: getComponentsByCategory('connection').filter(c => c.type !== 'wire') // Hide wire from toolbar
  }
])

const currentMode = computed(() => circuitStore.currentMode)
const selectedComponentType = computed(() => {
  const componentType = circuitStore.modeData?.componentType
  return typeof componentType === 'string' ? componentType : undefined
})

function selectMode(mode: InteractionMode) {
  circuitStore.setMode(mode)
}

function selectComponent(componentType: string) {
  circuitStore.setMode(InteractionMode.PLACE_COMPONENT, { componentType: componentType })
}

function getCurrentModeLabel(): string {
  const mode = interactionModes.find(m => m.id === currentMode.value)
  if (currentMode.value === InteractionMode.PLACE_COMPONENT) {
    return 'Place Component'
  }
  return mode?.label || 'Unknown'
}

function getComponentName(componentType: string): string {
  const allComponents = getAllComponents()
  const component = allComponents.find(c => c.type === componentType)
  return component?.name || componentType
}
</script>

<style scoped>
.modal-toolbar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
  overflow-y: auto;
  height: 100vh;
}

.mode-section, .component-section {
  margin-bottom: 2rem;
}

.mode-section h3, .component-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #495057;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.mode-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.mode-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.mode-icon {
  font-size: 1.25rem;
}

.mode-label {
  font-weight: 500;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-group h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.component-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.component-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8125rem;
}

.component-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.component-btn.active {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.component-icon {
  font-size: 1rem;
}

.component-label {
  font-weight: 500;
}

.status-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  font-size: 0.8125rem;
  color: #6c757d;
}

.current-mode, .selected-component {
  margin-bottom: 0.5rem;
}

.current-mode strong, .selected-component strong {
  color: #495057;
}
</style>
