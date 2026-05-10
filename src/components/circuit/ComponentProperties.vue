<template>
  <div class="properties-panel">
    <div v-if="componentDefinition">
      <!-- Component Information Section -->
      <div class="property-section">
        <div class="property-section-title">Component Information</div>
        <div class="property-field">
          <label class="property-label">ID</label>
          <div class="property-value">{{ component.id }}</div>
        </div>
        <div class="property-field">
          <label class="property-label">Type</label>
          <div class="property-value">{{ componentDefinition.name }}</div>
        </div>
        <div class="property-field">
          <label for="component-label" class="property-label">Label</label>
          <input
            id="component-label"
            v-model="editableLabel"
            type="text"
            class="property-input"
            @blur="updateLabel"
          />
        </div>
      </div>

      <!-- Component Properties Section -->
      <div class="property-section">
        <div class="property-section-title">Properties! {{ component.type }}</div>

        <!-- Dynamically generated properties -->
        <div
          v-for="propDef in componentDefinition.properties"
          :key="propDef.key"
          class="property-field"
        >
          <label :for="`prop-${propDef.key}`" class="property-label">{{ propDef.label }}</label>

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
            <div class="flex items-center gap-2">
              <input
                :id="`prop-${propDef.key}`"
                v-model.number="editableProperties[propDef.key]"
                type="number"
                class="property-input"
                :class="{ 'text-center font-medium': shouldShowSlider(propDef.key) }"
                @blur="updateProperty(propDef.key)"
                @input="updatePropertyRealTime(propDef.key)"
              />
              <span v-if="propDef.unit" class="text-sm text-slate-500 font-medium">{{
                propDef.unit
              }}</span>
            </div>
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
        <div v-if="component.type !== 'wire'" class="property-field">
          <label for="rotation" class="property-label">Rotation</label>
          <div class="flex items-center gap-2">
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
            <span class="text-sm text-slate-500 font-medium">°</span>
          </div>
        </div>
      </div>

      <!-- Analysis Results Section (if simulation data available) -->
      <div v-if="simulationDebugInfo" class="property-section">
        <div class="property-section-title">Analysis Results</div>
        <div v-if="simulationDebugInfo.voltage !== undefined" class="property-field">
          <label class="property-label">Node Voltage</label>
          <div class="property-value voltage-display">
            {{ simulationDebugInfo.voltage.toFixed(3) }}V
          </div>
        </div>
        <div v-if="simulationDebugInfo.current !== undefined" class="property-field">
          <label class="property-label">Current</label>
          <div class="property-value current-display">
            {{ (simulationDebugInfo.current * 1000).toFixed(3) }}mA
          </div>
        </div>
        <div v-if="simulationDebugInfo.powerDissipation !== undefined" class="property-field">
          <label class="property-label">Power Dissipation</label>
          <div class="property-value power-display">
            {{ (simulationDebugInfo.powerDissipation * 1000).toFixed(3) }}mW
          </div>
        </div>

        <!-- BJT-specific analysis information -->
        <div v-if="simulationDebugInfo.operatingRegion !== undefined" class="property-field">
          <label class="property-label">Operating Region</label>
          <div
            class="property-value"
            :class="getOperatingRegionClass(simulationDebugInfo.operatingRegion)"
          >
            {{ simulationDebugInfo.operatingRegion }}
          </div>
        </div>
        <div v-if="simulationDebugInfo.baseCurrent !== undefined" class="property-field">
          <label class="property-label">Base Current (IB)</label>
          <div class="property-value current-display">
            {{ formatCurrent(simulationDebugInfo.baseCurrent) }}
          </div>
        </div>
        <div v-if="simulationDebugInfo.collectorCurrent !== undefined" class="property-field">
          <label class="property-label">Collector Current (IC)</label>
          <div class="property-value current-display">
            {{ formatCurrent(simulationDebugInfo.collectorCurrent) }}
          </div>
        </div>
        <div v-if="simulationDebugInfo.emitterCurrent !== undefined" class="property-field">
          <label class="property-label">Emitter Current (IE)</label>
          <div class="property-value current-display">
            {{ formatCurrent(simulationDebugInfo.emitterCurrent) }}
          </div>
        </div>
        <div v-if="simulationDebugInfo.vBE !== undefined" class="property-field">
          <label class="property-label">VBE Voltage</label>
          <div class="property-value voltage-display">
            {{ simulationDebugInfo.vBE.toFixed(3) }}V
          </div>
        </div>
        <div v-if="simulationDebugInfo.vCE !== undefined" class="property-field">
          <label class="property-label">VCE Voltage</label>
          <div class="property-value voltage-display">
            {{ simulationDebugInfo.vCE.toFixed(3) }}V
          </div>
        </div>
        <div v-if="simulationDebugInfo.currentGain !== undefined" class="property-field">
          <label class="property-label">Current Gain (β)</label>
          <div class="property-value">
            {{ simulationDebugInfo.currentGain.toFixed(1) }}
          </div>
        </div>

        <div v-if="simulationDebugInfo.drainCurrent !== undefined" class="property-field">
          <label class="property-label">Drain Current (Id)</label>
          <div class="property-value current-display">
            {{ formatCurrent(simulationDebugInfo.drainCurrent) }}
          </div>
        </div>
        <div v-if="simulationDebugInfo.vGS !== undefined" class="property-field">
          <label class="property-label">Gate-Source Voltage (VGS/VSG)</label>
          <div class="property-value voltage-display">
            {{ simulationDebugInfo.vGS.toFixed(3) }}V
          </div>
        </div>
        <div v-if="simulationDebugInfo.vDS !== undefined" class="property-field">
          <label class="property-label">Drain-Source Voltage (VDS/VSD)</label>
          <div class="property-value voltage-display">
            {{ simulationDebugInfo.vDS.toFixed(3) }}V
          </div>
        </div>
        <div v-if="simulationDebugInfo.transconductance !== undefined" class="property-field">
          <label class="property-label">Transconductance (gm)</label>
          <div class="property-value">
            {{ (simulationDebugInfo.transconductance * 1000).toFixed(3) }}mS
          </div>
        </div>
      </div>

      <!-- Debug Information Section -->
      <div class="property-section">
        <div class="property-section-title flex items-center gap-2">
          <Search class="w-4 h-4" />
          Debug Information
        </div>

        <!-- Basic Component Info -->
        <div class="property-field">
          <label class="property-label">Position</label>
          <div class="property-value">
            {{ component.position.x.toFixed(1) }}, {{ component.position.y.toFixed(1) }}
          </div>
        </div>
        <div class="property-field">
          <label class="property-label">Rotation</label>
          <div class="property-value">{{ component.rotation }}°</div>
        </div>
        <div class="property-field">
          <label class="property-label">Selected</label>
          <div class="property-value">{{ component.selected ? 'Yes' : 'No' }}</div>
        </div>

        <!-- Terminal Information -->
        <div v-if="componentDefinition?.terminals" class="mt-4">
          <h5 class="text-xs font-semibold text-slate-700 mb-2">Terminals</h5>
          <div class="space-y-1">
            <div
              v-for="terminal in componentDefinition.terminals"
              :key="terminal.id"
              class="flex justify-between items-center py-1 px-2 bg-slate-50 rounded text-xs"
            >
              <span class="font-medium text-slate-600">{{ terminal.id }}:</span>
              <span class="font-mono text-slate-500"
                >{{ terminal.type }} at {{ terminal.position.x }}, {{ terminal.position.y }}</span
              >
            </div>
          </div>
        </div>

        <!-- Wire-specific Debug Info -->
        <div v-if="component.type === 'wire'" class="mt-4">
          <h5 class="text-xs font-semibold text-slate-700 mb-2">Wire Connections</h5>
          <div class="property-field">
            <label class="property-label">Start Connection</label>
            <div class="property-value">{{ wireDebugInfo.startConnection }}</div>
          </div>
          <div class="property-field">
            <label class="property-label">End Connection</label>
            <div class="property-value">{{ wireDebugInfo.endConnection }}</div>
          </div>
          <div class="property-field">
            <label class="property-label">Length</label>
            <div class="property-value">{{ wireDebugInfo.length.toFixed(2) }}px</div>
          </div>
        </div>

        <!-- Connected Components -->
        <div v-if="connectedComponents.length > 0" class="mt-4">
          <h5 class="text-xs font-semibold text-slate-700 mb-2">Connected To</h5>
          <div class="space-y-1">
            <div
              v-for="connection in connectedComponents"
              :key="connection.id"
              class="flex justify-between items-center py-1 px-2 bg-slate-50 rounded text-xs"
            >
              <span class="font-medium text-slate-600">{{ connection.id }}:</span>
              <span class="font-mono text-slate-500"
                >{{ connection.type }} via {{ connection.via }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="property-section">
        <div class="property-section-title">Actions</div>
        <button
          class="btn btn-secondary w-full text-red-600 hover:bg-red-50 hover:border-red-200"
          @click="deleteComponent"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          Delete {{ componentDefinition.name }}
        </button>
      </div>
    </div>
    <div v-else class="property-section">
      <div class="text-center text-slate-500 py-4">
        No definition found for component type: {{ component.type }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Search, Trash2 } from 'lucide-vue-next'
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
  console.log('🔍 Simulation Debug Info:', {
    componentType: props.component.type,
    componentId: props.component.id,
    allProperties: props.component.properties,
  })

  // Get node information for the component
  let nodeIndex: number | undefined
  let voltage: number | undefined
  let current: number | undefined
  let powerDissipation: number | undefined

  try {
    const dcSolution = circuitStore.dcSolution
    console.log('🔍 Circuit Store State:', {
      dcSolution: dcSolution,
      isRealTimeSimulation: circuitStore.isRealTimeSimulation,
      isSimulating: circuitStore.isSimulating,
      hasValidSimulation: circuitStore.hasValidSimulation,
      simulationErrors: circuitStore.simulationErrors,
    })

    if (!dcSolution) {
      console.log('🔍 No DC solution available - triggering manual simulation...')
      // Try to trigger a manual simulation
      circuitStore.startSimulation()
      return null
    }

    console.log('🔍 DC Solution available, extracting data...')
    const { voltages, currents, termToNodeIndex } = dcSolution

    console.log('🔍 Processing component type:', props.component.type)

    // For wire components, get the current directly
    if (props.component.type === 'wire') {
      console.log('🔍 Processing wire component...')
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
      console.log('🔍 Processing non-wire component...')
      // For other components, get current and try to find voltage
      current = currents[props.component.id]
      console.log('🔍 Component current:', current)

      // Try to get voltage from first terminal
      const componentDef = getComponentDefinition(props.component.type)
      console.log('🔍 Component definition:', componentDef)

      if (componentDef?.terminals?.[0]) {
        const terminalId = `${props.component.id}:${componentDef.terminals[0].id}`
        console.log('🔍 Looking for terminal:', terminalId)
        nodeIndex = termToNodeIndex.get(terminalId)
        if (nodeIndex !== undefined) {
          voltage = voltages[nodeIndex]
          console.log('🔍 Found voltage:', voltage)
        }
      }
    }

    // Calculate power dissipation for resistive components
    if (current !== undefined && voltage !== undefined && props.component.properties?.resistance) {
      const resistance = props.component.properties.resistance as number
      powerDissipation = current * current * resistance
    }

    console.log('🔍 Basic values extracted:', { nodeIndex, voltage, current, powerDissipation })
  } catch (error) {
    console.error('🔍 Exception in simulationDebugInfo basic processing:', error)
    return null
  }

  // BJT-specific analysis information
  let operatingRegion: string | undefined
  let baseCurrent: number | undefined
  let collectorCurrent: number | undefined
  let emitterCurrent: number | undefined
  let vBE: number | undefined
  let vCE: number | undefined
  let currentGain: number | undefined

  try {
    console.log('🔍 Starting BJT processing...')
    if (props.component.type === 'bjt_npn' || props.component.type === 'bjt_pnp') {
      console.log('✅ BJT detected, extracting properties:', props.component.properties)
      operatingRegion = props.component.properties?.operatingRegion as string
      baseCurrent = props.component.properties?.baseCurrent as number
      collectorCurrent = props.component.properties?.collectorCurrent as number
      emitterCurrent = props.component.properties?.emitterCurrent as number
      vBE = props.component.properties?.vBE as number
      vCE = props.component.properties?.vCE as number
      currentGain = props.component.properties?.currentGain as number
      console.log('🎯 BJT Properties extracted:', {
        operatingRegion,
        baseCurrent,
        collectorCurrent,
        emitterCurrent,
        vBE,
        vCE,
        currentGain,
      })
    } else {
      console.log('🔍 No BJT detected, properties:', props.component.properties)
    }
  } catch (error) {
    console.error('🔍 Exception in BJT processing:', error)
  }

  // MOSFET-specific analysis information
  let drainCurrent: number | undefined
  let vGS: number | undefined
  let vDS: number | undefined
  let transconductance: number | undefined

  try {
    if (props.component.type === 'mosfet_n' || props.component.type === 'mosfet_p') {
      drainCurrent = props.component.properties?.drainCurrent as number
      vGS = props.component.properties?.vGS as number
      vDS = props.component.properties?.vDS as number
      transconductance = props.component.properties?.transconductance as number
    }
  } catch (error) {
    console.error('🔍 Exception in MOSFET processing:', error)
  }

  return {
    nodeIndex,
    voltage,
    current,
    powerDissipation,
    operatingRegion,
    baseCurrent,
    collectorCurrent,
    emitterCurrent,
    vBE,
    vCE,
    currentGain,
    drainCurrent,
    vGS,
    vDS,
    transconductance,
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

// Helper methods for formatting and styling
const formatCurrent = (current: number): string => {
  if (Math.abs(current) >= 1e-3) {
    return `${(current * 1000).toFixed(3)}mA`
  } else if (Math.abs(current) >= 1e-6) {
    return `${(current * 1e6).toFixed(3)}μA`
  } else if (Math.abs(current) >= 1e-9) {
    return `${(current * 1e9).toFixed(3)}nA`
  } else {
    return `${current.toExponential(2)}A`
  }
}

const getOperatingRegionClass = (region: string): string => {
  switch (region) {
    case 'Active':
      return 'text-green-600 font-semibold'
    case 'Saturation':
      return 'text-orange-600 font-semibold'
    case 'Cutoff':
      return 'text-slate-500 font-semibold'
    case 'Triode':
      return 'text-blue-600 font-semibold'
    default:
      return 'text-slate-600'
  }
}
</script>

<style scoped>
/* Properties Panel - Design System Styling */
.properties-panel {
  padding: 0;
  background: transparent;
}

/* Value input group for sliders and number inputs */
.value-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Slider styles with design system colors */
.slider-container {
  width: 100%;
}

.property-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  margin: 0.25rem 0;
  cursor: pointer;
}

.property-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.property-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.property-slider:hover {
  background: #cbd5e1;
}

.property-slider:focus::-webkit-slider-thumb {
  background: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.property-slider:focus::-moz-range-thumb {
  background: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.slider-label-min,
.slider-label-max {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}
</style>
