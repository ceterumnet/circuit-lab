<template>
  <div class="component-palette">
    <div class="category-group">
      <h4>Analysis</h4>
      <div class="component-buttons">
        <button
          :class="['component-btn', { active: probingType === 'voltage' }]"
          @click="toggleProbeType('voltage')"
          title="Voltage Probe"
        >
          <ProbeSymbol type="voltage" class="component-icon" />
          <span class="component-label">Voltage Probe</span>
        </button>
        <button
          :class="['component-btn', { active: probingType === 'current' }]"
          @click="toggleProbeType('current')"
          title="Current Probe"
        >
          <ProbeSymbol type="current" class="component-icon" />
          <span class="component-label">Current Probe</span>
        </button>
      </div>
    </div>

    <div class="category-group">
      <h4>Components</h4>
      <div class="component-buttons">
        <button
          v-for="componentDef in availableComponents"
          :key="componentDef.type"
          :class="['component-btn', { active: selectedComponent === componentDef.type }]"
          @click="selectComponent(componentDef.type)"
          :title="getComponentTooltip(componentDef)"
        >
          <component :is="getIconComponent(componentDef.icon)" class="component-icon" />
          <span class="component-label">{{ componentDef.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getAllComponents } from '@/registry/components'
import { useInteractionStore } from '@/stores/interaction'
import type { ComponentDefinition } from '@/types/components'

// Import our professional schematic symbols
import ResistorSymbol from './symbols/ResistorSymbol.vue'
import VoltageSourceSymbol from './symbols/VoltageSourceSymbol.vue'
import CurrentSourceSymbol from './symbols/CurrentSourceSymbol.vue'
import SwitchSymbol from './symbols/SwitchSymbol.vue'
import GroundSymbol from './symbols/GroundSymbol.vue'
import NodeSymbol from './symbols/NodeSymbol.vue'
import WireSymbol from './symbols/WireSymbol.vue'
import ProbeSymbol from './symbols/ProbeSymbol.vue'

const interactionStore = useInteractionStore()

// Reactive state - sync with store
const selectedComponent = computed(() => interactionStore.componentToPlace)
const probingType = computed(() => interactionStore.probingType)

// Get all available components (excluding non-placeable components)
const availableComponents = computed(() => {
  return getAllComponents().filter((component) => {
    // Filter out components that aren't directly placeable
    const nonPlaceableTypes = ['wire']
    return !nonPlaceableTypes.includes(component.type)
  })
})

function selectComponent(type: string) {
  const newSelection = selectedComponent.value === type ? null : type
  interactionStore.setComponentToPlace(newSelection)
  // Clear probe mode when selecting components
  if (newSelection) {
    interactionStore.setProbeType(null)
  }
}

function toggleProbeType(type: 'voltage' | 'current') {
  const newProbeType = probingType.value === type ? null : type
  interactionStore.setProbeType(newProbeType)
  // Clear component selection when probing
  if (newProbeType) {
    interactionStore.exitComponentPlacement()
  }
}

function getIconComponent(iconName?: string) {
  const iconMap = {
    ResistorSymbol: ResistorSymbol,
    VoltageSourceSymbol: VoltageSourceSymbol,
    CurrentSourceSymbol: CurrentSourceSymbol,
    SwitchSymbol: SwitchSymbol,
    GroundSymbol: GroundSymbol,
    NodeSymbol: NodeSymbol,
    WireSymbol: WireSymbol,
  }

  return iconMap[iconName as keyof typeof iconMap] || NodeSymbol
}

function getComponentTooltip(componentDef: ComponentDefinition) {
  if (
    selectedComponent.value === componentDef.type &&
    interactionStore.isComponentPlacementPersistent
  ) {
    return `${componentDef.name} - Click to place multiple. Press ESC to exit placement mode.`
  }
  return componentDef.name
}
</script>

<style scoped>
.component-palette {
  width: 200px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
  overflow-y: auto;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-group h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.component-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.component-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
  color: #212529;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.component-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.component-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.component-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.component-label {
  font-weight: 500;
}
</style>
