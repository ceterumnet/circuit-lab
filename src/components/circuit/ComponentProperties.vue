<template>
  <div class="component-properties">
    <div v-if="componentDefinition">
      <div class="property-item">
        <label>ID:</label>
        <span class="property-value">{{ component.id }}</span>
      </div>

      <div class="property-item">
        <label>Type:</label>
        <span class="property-value">{{ componentDefinition.name }}</span>
      </div>

      <div class="property-item">
        <label for="component-label">Label:</label>
        <input
          id="component-label"
          v-model="editableLabel"
          type="text"
          class="property-input"
          @blur="updateLabel"
        />
      </div>

      <!-- Dynamically generated properties -->
      <div
        v-for="propDef in componentDefinition.properties"
        :key="propDef.key"
        class="property-item"
      >
        <label :for="`prop-${propDef.key}`">{{ propDef.label }}:</label>

        <!-- Number Input with Slider for Variable Components -->
        <div v-if="propDef.type === 'number'" class="value-input-group">
          <!-- Slider for resistance on variable resistors and wiper position on potentiometers -->
          <div v-if="shouldShowSlider(propDef.key)" class="slider-container">
            <input
              :id="`slider-${propDef.key}`"
              v-model.number="editableProperties[propDef.key]"
              type="range"
              class="property-slider"
              :min="getSliderMin(propDef.key)"
              :max="getSliderMax(propDef.key)"
              :step="getSliderStep(propDef.key)"
              @input="updatePropertyRealTime(propDef.key)"
            />
            <div class="slider-labels">
              <span class="slider-label-min">{{
                formatSliderValue(getSliderMin(propDef.key), propDef.unit)
              }}</span>
              <span class="slider-label-max">{{
                formatSliderValue(getSliderMax(propDef.key), propDef.unit)
              }}</span>
            </div>
          </div>

          <!-- Number input -->
          <input
            :id="`prop-${propDef.key}`"
            v-model.number="editableProperties[propDef.key]"
            type="number"
            class="property-input"
            :class="{ 'with-slider': shouldShowSlider(propDef.key) }"
            @blur="updateProperty(propDef.key)"
            @input="updatePropertyRealTime(propDef.key)"
          />
          <span v-if="propDef.unit" class="unit-span">{{ propDef.unit }}</span>
        </div>

        <!-- Select Dropdown -->
        <select
          v-else-if="propDef.type === 'select'"
          :id="`prop-${propDef.key}`"
          v-model="editableProperties[propDef.key]"
          class="property-input"
          @change="updateProperty(propDef.key)"
        >
          <option v-for="option in propDef.options" :key="option" :value="option">
            {{ option }}
          </option>
        </select>

        <!-- String Input -->
        <input
          v-else
          :id="`prop-${propDef.key}`"
          v-model="editableProperties[propDef.key]"
          type="text"
          class="property-input"
          @blur="updateProperty(propDef.key)"
        />
      </div>

      <!-- Common properties for non-wire components -->
      <div v-if="component.type !== 'wire'" class="property-item">
        <label for="rotation">Rotation:</label>
        <input
          id="rotation"
          v-model="editableRotation"
          type="number"
          class="property-input"
          min="0"
          max="360"
          step="90"
          @blur="updateRotation"
        />
      </div>

      <!-- Component Debug Information -->
      <div class="debug-section">
        <h4 class="debug-title">🔍 Debug Information</h4>

        <!-- Basic Component Info -->
        <div class="debug-table">
          <div class="debug-row">
            <span class="debug-label">Position:</span>
            <span class="debug-value"
              >{{ component.position.x.toFixed(1) }}, {{ component.position.y.toFixed(1) }}</span
            >
          </div>
          <div class="debug-row">
            <span class="debug-label">Rotation:</span>
            <span class="debug-value">{{ component.rotation }}°</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Selected:</span>
            <span class="debug-value">{{ component.selected ? 'Yes' : 'No' }}</span>
          </div>
        </div>

        <!-- Terminal Information -->
        <div v-if="componentDefinition?.terminals" class="debug-subsection">
          <h5 class="debug-subtitle">Terminals</h5>
          <div class="debug-table">
            <div
              v-for="terminal in componentDefinition.terminals"
              :key="terminal.id"
              class="debug-row"
            >
              <span class="debug-label">{{ terminal.id }}:</span>
              <span class="debug-value"
                >{{ terminal.type }} at {{ terminal.position.x }}, {{ terminal.position.y }}</span
              >
            </div>
          </div>
        </div>

        <!-- Wire-specific Debug Info -->
        <div v-if="component.type === 'wire'" class="debug-subsection">
          <h5 class="debug-subtitle">Wire Connections</h5>
          <div class="debug-table">
            <div class="debug-row">
              <span class="debug-label">Start:</span>
              <span class="debug-value">{{ wireDebugInfo.startConnection }}</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">End:</span>
              <span class="debug-value">{{ wireDebugInfo.endConnection }}</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">Length:</span>
              <span class="debug-value">{{ wireDebugInfo.length.toFixed(2) }}px</span>
            </div>
          </div>
        </div>

        <!-- Simulation Data -->
        <div v-if="simulationDebugInfo" class="debug-subsection">
          <h5 class="debug-subtitle">Simulation Data</h5>
          <div class="debug-table">
            <div v-if="simulationDebugInfo.nodeIndex !== undefined" class="debug-row">
              <span class="debug-label">Node Index:</span>
              <span class="debug-value">{{ simulationDebugInfo.nodeIndex }}</span>
            </div>
            <div v-if="simulationDebugInfo.voltage !== undefined" class="debug-row">
              <span class="debug-label">Node Voltage:</span>
              <span class="debug-value">{{ simulationDebugInfo.voltage.toFixed(6) }}V</span>
            </div>
            <div v-if="simulationDebugInfo.current !== undefined" class="debug-row">
              <span class="debug-label">Current:</span>
              <span class="debug-value">{{ simulationDebugInfo.current.toFixed(6) }}A</span>
            </div>
            <div v-if="simulationDebugInfo.powerDissipation !== undefined" class="debug-row">
              <span class="debug-label">Power:</span>
              <span class="debug-value"
                >{{ simulationDebugInfo.powerDissipation.toFixed(6) }}W</span
              >
            </div>
          </div>
        </div>

        <!-- Connected Components -->
        <div v-if="connectedComponents.length > 0" class="debug-subsection">
          <h5 class="debug-subtitle">Connected To</h5>
          <div class="debug-table">
            <div v-for="connection in connectedComponents" :key="connection.id" class="debug-row">
              <span class="debug-label">{{ connection.id }}:</span>
              <span class="debug-value">{{ connection.type }} via {{ connection.via }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete button for all components -->
      <div class="property-item">
        <button class="delete-button" @click="deleteComponent">
          🗑️ Delete {{ componentDefinition.name }}
        </button>
      </div>
    </div>
    <div v-else class="property-item">
      <span>No definition found for component type: {{ component.type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useHistoryStore } from '@/stores/history'
import type { CircuitComponent } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

const props = defineProps<Props>()
const circuitStore = useCircuitStore()
const historyStore = useHistoryStore()

// Get the component definition from the registry
const componentDefinition = computed(() => getComponentDefinition(props.component.type))

// Create local, editable copies of the component's data
const editableLabel = ref('')
const editableRotation = ref(0)
const editableProperties = ref<Record<string, string | number | boolean>>({})

// Watch for the component prop changing and reset local state
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      editableLabel.value = newComponent.label || ''
      editableRotation.value = newComponent.rotation
      // Deep copy of properties to avoid direct mutation
      editableProperties.value = JSON.parse(JSON.stringify(newComponent.properties || {}))
    }
  },
  { immediate: true, deep: true },
)

// Update functions that commit changes to the store
function updateLabel() {
  circuitStore.updateComponent(props.component.id, {
    label: editableLabel.value || undefined,
  })
  historyStore.saveState(circuitStore.currentCircuit, 'Update label')
}

function updateRotation() {
  circuitStore.updateComponent(props.component.id, {
    rotation: editableRotation.value,
  })
  historyStore.saveState(circuitStore.currentCircuit, 'Rotate component')
}

function updateProperty(key: string) {
  // We need to update the whole properties object for reactivity
  const newProperties = {
    ...props.component.properties,
    [key]: editableProperties.value[key],
  }
  circuitStore.updateComponent(props.component.id, {
    properties: newProperties,
  })
  historyStore.saveState(circuitStore.currentCircuit, `Update ${key}`)
}

// Real-time property updates for sliders (no history saving)
function updatePropertyRealTime(key: string) {
  const newProperties = {
    ...props.component.properties,
    [key]: editableProperties.value[key],
  }
  circuitStore.updateComponent(props.component.id, {
    properties: newProperties,
  })
  // No history saving for real-time updates to avoid spam
}

// Slider helper functions
function shouldShowSlider(propertyKey: string): boolean {
  const componentType = props.component.type

  // Show slider for resistance on variable resistors
  if (componentType === 'variable_resistor' && propertyKey === 'resistance') {
    return true
  }

  // Show slider for wiper position on potentiometers
  if (componentType === 'potentiometer' && propertyKey === 'wiperPosition') {
    return true
  }

  return false
}

function getSliderMin(propertyKey: string): number {
  const componentType = props.component.type

  if (componentType === 'variable_resistor' && propertyKey === 'resistance') {
    return (props.component.properties?.minResistance as number) || 0
  }

  if (componentType === 'potentiometer' && propertyKey === 'wiperPosition') {
    return 0 // 0%
  }

  return 0
}

function getSliderMax(propertyKey: string): number {
  const componentType = props.component.type

  if (componentType === 'variable_resistor' && propertyKey === 'resistance') {
    return (props.component.properties?.maxResistance as number) || 10000
  }

  if (componentType === 'potentiometer' && propertyKey === 'wiperPosition') {
    return 100 // 100%
  }

  return 100
}

function getSliderStep(propertyKey: string): number {
  const componentType = props.component.type

  if (componentType === 'variable_resistor' && propertyKey === 'resistance') {
    const max = getSliderMax(propertyKey)
    return Math.max(1, Math.round(max / 1000)) // 1000 steps
  }

  if (componentType === 'potentiometer' && propertyKey === 'wiperPosition') {
    return 1 // 1% steps
  }

  return 1
}

function formatSliderValue(value: number, unit?: string): string {
  if (unit === '%') {
    return `${value}%`
  }

  if (unit === 'Ω') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit}`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit}`
    }
    return `${value}${unit}`
  }

  return `${value}${unit || ''}`
}

function deleteComponent() {
  circuitStore.removeComponent(props.component.id)
  historyStore.saveState(circuitStore.currentCircuit, 'Delete component')
}

// Debug information computed properties
const wireDebugInfo = computed(() => {
  if (props.component.type !== 'wire' || !props.component.properties) {
    return { startConnection: 'N/A', endConnection: 'N/A', length: 0 }
  }

  const wireProps = props.component.properties
  const startComp = circuitStore.currentCircuit.components.find(
    (c) => c.id === wireProps.startComponentId,
  )
  const endComp = circuitStore.currentCircuit.components.find(
    (c) => c.id === wireProps.endComponentId,
  )

  const startConnection = startComp
    ? `${startComp.type}(${startComp.id}):${wireProps.startTerminal}`
    : 'Disconnected'
  const endConnection = endComp
    ? `${endComp.type}(${endComp.id}):${wireProps.endTerminal}`
    : 'Disconnected'

  // Calculate wire length (rough estimate based on component positions)
  let length = 0
  if (startComp && endComp) {
    const dx = endComp.position.x - startComp.position.x
    const dy = endComp.position.y - startComp.position.y
    length = Math.sqrt(dx * dx + dy * dy)
  }

  return { startConnection, endConnection, length }
})

const simulationDebugInfo = computed(() => {
  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return null

  const { voltages, currents, termToNodeIndex } = dcSolution

  // Get node information for the component
  let nodeIndex: number | undefined
  let voltage: number | undefined
  let current: number | undefined
  let powerDissipation: number | undefined

  // For wire components, get the current directly
  if (props.component.type === 'wire') {
    current = currents[props.component.id]

    // Try to get voltage from start terminal
    if (props.component.properties) {
      const startTerminalId = `${props.component.properties.startComponentId}:${props.component.properties.startTerminal}`
      nodeIndex = termToNodeIndex.get(startTerminalId)
      if (nodeIndex !== undefined) {
        voltage = voltages[nodeIndex]
      }
    }
  } else {
    // For other components, get current and try to find voltage
    current = currents[props.component.id]

    // Try to get voltage from first terminal
    const componentDef = getComponentDefinition(props.component.type)
    if (componentDef?.terminals?.[0]) {
      const terminalId = `${props.component.id}:${componentDef.terminals[0].id}`
      nodeIndex = termToNodeIndex.get(terminalId)
      if (nodeIndex !== undefined) {
        voltage = voltages[nodeIndex]
      }
    }
  }

  // Calculate power dissipation for resistive components
  if (current !== undefined && voltage !== undefined && props.component.properties?.resistance) {
    const resistance = props.component.properties.resistance as number
    powerDissipation = current * current * resistance
  }

  return {
    nodeIndex,
    voltage,
    current,
    powerDissipation,
  }
})

const connectedComponents = computed(() => {
  const connections: Array<{ id: string; type: string; via: string }> = []

  // Find all wires connected to this component
  const wires = circuitStore.currentCircuit.components.filter((c) => c.type === 'wire')

  for (const wire of wires) {
    if (!wire.properties) continue

    const wireProps = wire.properties
    const startCompId = wireProps.startComponentId as string
    const endCompId = wireProps.endComponentId as string

    if (startCompId === props.component.id) {
      // This component is the start of the wire
      const endComp = circuitStore.currentCircuit.components.find((c) => c.id === endCompId)
      if (endComp) {
        connections.push({
          id: endComp.id,
          type: endComp.type,
          via: `${wireProps.startTerminal} → ${wire.id} → ${wireProps.endTerminal}`,
        })
      }
    } else if (endCompId === props.component.id) {
      // This component is the end of the wire
      const startComp = circuitStore.currentCircuit.components.find((c) => c.id === startCompId)
      if (startComp) {
        connections.push({
          id: startComp.id,
          type: startComp.type,
          via: `${wireProps.endTerminal} ← ${wire.id} ← ${wireProps.startTerminal}`,
        })
      }
    }
  }

  return connections
})
</script>

<style scoped>
.component-properties {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
}

.property-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.property-item:last-child {
  margin-bottom: 0;
}

.property-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
}

.property-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.property-value {
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.value-input-group {
  display: flex;
  align-items: center;
}

.unit-span {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  width: 100%;
}

.delete-button:hover {
  background: #c82333;
}

.delete-button:active {
  background: #a71e2a;
}

.property-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out;
  position: relative;
  z-index: 20;
}

/* Debug section styles */
.debug-section {
  margin-top: 1.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
}

.debug-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.debug-subtitle {
  margin: 0.75rem 0 0.5rem 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
}

.debug-subsection {
  margin-top: 0.75rem;
}

.debug-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
}

.debug-row:last-child {
  border-bottom: none;
}

.debug-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  flex-shrink: 0;
  min-width: 4rem;
}

.debug-value {
  font-size: 0.75rem;
  color: #495057;
  font-family: monospace;
  text-align: right;
  word-break: break-all;
}

/* Slider styles */
.slider-container {
  margin-bottom: 0.5rem;
}

.property-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #dee2e6;
  outline: none;
  -webkit-appearance: none;
  margin: 0.25rem 0;
}

.property-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.property-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.property-slider:focus {
  background: #adb5bd;
}

.property-slider:focus::-webkit-slider-thumb {
  background: #0056b3;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.property-slider:focus::-moz-range-thumb {
  background: #0056b3;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.slider-label-min,
.slider-label-max {
  font-family: monospace;
}

.property-input.with-slider {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
  font-weight: 500;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.property-input.with-slider:focus {
  background: white;
  border-color: #80bdff;
}
</style>
