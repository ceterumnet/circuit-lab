<template>
  <div class="component-palette">
    <div class="component-group">
      <div class="component-group-title">Analysis</div>
      <div class="component-list">
        <div
          :class="['component-item', { active: probingType === 'voltage' }]"
          @click="toggleProbeType('voltage')"
          title="Voltage Probe"
        >
          <div class="component-icon">
            <ProbeSymbol type="voltage" class="w-5 h-5" />
          </div>
          <span class="component-label">Voltage Probe</span>
        </div>
        <div
          :class="['component-item', { active: probingType === 'current' }]"
          @click="toggleProbeType('current')"
          title="Current Probe"
        >
          <div class="component-icon">
            <ProbeSymbol type="current" class="w-5 h-5" />
          </div>
          <span class="component-label">Current Probe</span>
        </div>
      </div>
    </div>

    <div class="component-group">
      <div class="component-group-title">Components</div>
      <div class="component-list">
        <div
          v-for="componentDef in availableComponents"
          :key="componentDef.type"
          :class="['component-item', { active: selectedComponent === componentDef.type }]"
          @click="selectComponent(componentDef.type)"
          :title="getComponentTooltip(componentDef)"
        >
          <div class="component-icon" :class="getComponentIconColor(componentDef.type)">
            <component :is="getIconComponent(componentDef.icon)" class="w-5 h-5" />
          </div>
          <span class="component-label">{{ componentDef.name }}</span>
        </div>
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
import VariableResistorSymbol from './symbols/VariableResistorSymbol.vue'
import PotentiometerSymbol from './symbols/PotentiometerSymbol.vue'
import DiodeSymbol from './symbols/DiodeSymbol.vue'
import LEDSymbol from './symbols/LEDSymbol.vue'
import GroundSymbol from './symbols/GroundSymbol.vue'
import NodeSymbol from './symbols/NodeSymbol.vue'
import WireSymbol from './symbols/WireSymbol.vue'
import CapacitorSymbol from './symbols/CapacitorSymbol.vue'
import InductorSymbol from './symbols/InductorSymbol.vue'
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
    VariableResistorSymbol: VariableResistorSymbol,
    PotentiometerSymbol: PotentiometerSymbol,
    DiodeSymbol: DiodeSymbol,
    LEDSymbol: LEDSymbol,
    GroundSymbol: GroundSymbol,
    NodeSymbol: NodeSymbol,
    WireSymbol: WireSymbol,
    CapacitorSymbol: CapacitorSymbol,
    InductorSymbol: InductorSymbol,
  }

  return iconMap[iconName as keyof typeof iconMap] || NodeSymbol
}

function getComponentIconColor(componentType: string) {
  // Use circuit semantic colors from design system
  const colorMap: Record<string, string> = {
    resistor: 'text-purple-600',
    'variable-resistor': 'text-purple-600',
    potentiometer: 'text-purple-600',
    capacitor: 'text-purple-600',
    inductor: 'text-purple-600',
    'voltage-source': 'text-red-600',
    'current-source': 'text-blue-600',
    diode: 'text-orange-600',
    led: 'text-orange-600',
    switch: 'text-slate-600',
    ground: 'text-green-600',
    node: 'text-slate-600',
  }

  return colorMap[componentType] || 'text-slate-600'
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
/* Component Palette - Professional Design System */
.component-palette {
  height: 100%;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.component-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.component-group-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.375rem;
  background: transparent;
  color: #334155;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.component-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.component-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.component-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-label {
  font-weight: 500;
  flex: 1;
}

/* Scrollbar styling */
.component-palette::-webkit-scrollbar {
  width: 4px;
}

.component-palette::-webkit-scrollbar-track {
  background: transparent;
}

.component-palette::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.component-palette::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
