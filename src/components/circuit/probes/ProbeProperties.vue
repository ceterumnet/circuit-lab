<template>
  <div class="properties-panel">
    <!-- Probe Information Section -->
    <div class="property-section">
      <div class="property-section-title">Probe Information</div>
      <div class="property-field">
        <label class="property-label">ID</label>
        <div class="property-value">{{ probe.id }}</div>
      </div>
      <div class="property-field">
        <label class="property-label">Type</label>
        <div class="property-value">
          {{ probe.type === 'voltage' ? 'Voltage' : 'Current' }} Probe
        </div>
      </div>
      <div class="property-field">
        <label class="property-label">Target</label>
        <div class="property-value">{{ probe.targetId }}</div>
      </div>
    </div>

    <!-- Measurement Results Section -->
    <div class="property-section">
      <div class="property-section-title">Measurement Results</div>

      <!-- Current direction info (read-only, automatically determined) -->
      <div v-if="probe.type === 'current'" class="property-field">
        <label class="property-label">Flow Direction</label>
        <div class="property-value flex items-center gap-2">
          <span>{{
            physicalCurrentInfo.flowsStartToEnd ? '→ Start to End' : '← End to Start'
          }}</span>
          <small class="text-xs text-slate-500 italic">(Automatically determined)</small>
        </div>
      </div>

      <div class="property-field">
        <label class="property-label">Measured Value</label>
        <div
          class="property-value"
          :class="{
            'voltage-display': probe.type === 'voltage',
            'current-display': probe.type === 'current',
          }"
        >
          {{ probeValue }}
        </div>
      </div>
    </div>

    <!-- Debug Information Section -->
    <div class="property-section">
      <div class="property-section-title flex items-center gap-2">
        <Search class="w-4 h-4" />
        Debug Information
      </div>

      <!-- Basic Probe Info -->
      <div class="property-field">
        <label class="property-label">Position</label>
        <div class="property-value">
          {{ probe.position.x.toFixed(1) }}, {{ probe.position.y.toFixed(1) }}
        </div>
      </div>
      <div class="property-field">
        <label class="property-label">Target Type</label>
        <div class="property-value">{{ targetComponent?.type || 'Unknown' }}</div>
      </div>
      <div class="property-field">
        <label class="property-label">Measurement</label>
        <div class="property-value">
          {{ probe.type === 'voltage' ? 'Node Voltage' : 'Branch Current' }}
        </div>
      </div>

      <!-- Current Probe Specific Debug -->
      <div v-if="probe.type === 'current'" class="mt-4">
        <h5 class="text-xs font-semibold text-slate-700 mb-2">Current Probe Details</h5>
        <div class="property-field">
          <label class="property-label">Start Connection</label>
          <div class="property-value">{{ wireDebugInfo.startConnection }}</div>
        </div>
        <div class="property-field">
          <label class="property-label">End Connection</label>
          <div class="property-value">{{ wireDebugInfo.endConnection }}</div>
        </div>
        <div class="property-field">
          <label class="property-label">Simulation Current</label>
          <div class="property-value">
            {{
              wireDebugInfo.simulationCurrent !== undefined
                ? wireDebugInfo.simulationCurrent.toFixed(6) + 'A'
                : 'N/A'
            }}
          </div>
        </div>
        <div class="property-field">
          <label class="property-label">Physical Direction</label>
          <div class="property-value">
            {{ physicalCurrentInfo.flowsStartToEnd ? 'Start → End' : 'End ← Start' }}
          </div>
        </div>
        <div class="property-field">
          <label class="property-label">Current Magnitude</label>
          <div class="property-value">{{ physicalCurrentInfo.magnitude.toFixed(6) }}A</div>
        </div>
      </div>

      <!-- Voltage Probe Specific Debug -->
      <div v-if="probe.type === 'voltage'" class="mt-4">
        <h5 class="text-xs font-semibold text-slate-700 mb-2">Voltage Probe Details</h5>
        <div class="property-field">
          <label class="property-label">Node Index</label>
          <div class="property-value">
            {{ voltageDebugInfo.nodeIndex !== undefined ? voltageDebugInfo.nodeIndex : 'N/A' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="property-section">
      <div class="property-section-title">Actions</div>
      <button
        class="btn btn-secondary w-full text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center gap-2"
        @click="deleteProbe"
      >
        <Trash2 class="w-4 h-4" />
        Delete Probe
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, Trash2 } from 'lucide-vue-next'
import { useCircuitStore } from '@/stores/circuit'
import { useCircuitHistory } from '@/composables/useCircuitHistory'
import type { Probe } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  probe: Probe
}

const props = defineProps<Props>()
const circuitStore = useCircuitStore()

// Physical current direction computation (matching ProbeComponent logic)
const physicalCurrentInfo = computed(() => {
  if (props.probe.type !== 'current') return { magnitude: 0, flowsStartToEnd: true }

  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return { magnitude: 0, flowsStartToEnd: true }

  const { currents } = dcSolution
  const targetId = props.probe.targetId
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === targetId)
  if (wire?.type !== 'wire' || !wire.properties) return { magnitude: 0, flowsStartToEnd: true }

  // Get the wire's current directly from the simulation results
  let rawCurrent = currents[targetId]

  if (rawCurrent === undefined) {
    // Fallback: try to find current from connected components (for backward compatibility)
    const startCompId = wire.properties.startComponentId as string
    const endCompId = wire.properties.endComponentId as string

    let componentCurrent = currents[startCompId]
    let isVoltageSource = false

    // Check if we're dealing with a voltage source and need to flip the sign
    const startComp = circuitStore.currentCircuit.components.find((c) => c.id === startCompId)
    const endComp = circuitStore.currentCircuit.components.find((c) => c.id === endCompId)

    if (startComp?.type === 'voltage_source') {
      isVoltageSource = true
    } else if (endComp?.type === 'voltage_source') {
      componentCurrent = currents[endCompId]
      isVoltageSource = true
    } else if (componentCurrent === undefined) {
      componentCurrent = currents[endCompId]
    }

    if (componentCurrent === undefined) return { magnitude: 0, flowsStartToEnd: true }

    // Fix sign convention for voltage sources - flip the sign so current flowing out of positive terminal is positive
    rawCurrent = componentCurrent
    if (isVoltageSource) {
      rawCurrent = -componentCurrent
    }
  }

  // PURE PHYSICS-BASED CURRENT DIRECTION ALGORITHM:
  // - Positive current: flows from startComponent to endComponent
  // - Negative current: flows from endComponent to startComponent
  // - NO GROUND OVERRIDES: Ground symbols do not artificially change current direction
  // - Always display positive magnitude with arrow showing actual current flow

  const flowsStartToEnd = rawCurrent >= 0

  return {
    magnitude: Math.abs(rawCurrent),
    flowsStartToEnd: flowsStartToEnd,
  }
})

// Legacy currentInfo for backward compatibility (now uses physicalCurrentInfo)
const currentInfo = computed(() => {
  const physical = physicalCurrentInfo.value
  return {
    value: physical.magnitude, // Always positive now
    isPositive: true, // Always true since we show magnitude only
  }
})

const probeValue = computed(() => {
  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return 'N/A'

  const { voltages, termToNodeIndex } = dcSolution
  const targetId = props.probe.targetId

  if (props.probe.type === 'voltage') {
    const targetComponent = circuitStore.currentCircuit.components.find((c) => c.id === targetId)

    if (targetComponent?.type === 'wire' && targetComponent.properties) {
      const startCompId = targetComponent.properties.startComponentId as string
      const startTermId = targetComponent.properties.startTerminal as string

      const fullTerminalId = `${startCompId}:${startTermId}`
      const nodeIndex = termToNodeIndex.get(fullTerminalId)

      if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
        return `${voltages[nodeIndex].toFixed(3)}V`
      }
    } else if (targetComponent?.type === 'node') {
      const nodeDef = getComponentDefinition('node')
      if (!nodeDef) return 'N/A'
      const fullTerminalId = `${targetId}:${nodeDef.terminals[0].id}`
      const nodeIndex = termToNodeIndex.get(fullTerminalId)

      if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
        return `${voltages[nodeIndex].toFixed(3)}V`
      }
    }
  } else if (props.probe.type === 'current') {
    // Use physical current magnitude (always positive)
    const currentMagnitude = physicalCurrentInfo.value.magnitude

    if (currentMagnitude < 1e-12) return '0A'

    // Always positive display - direction shown by arrow
    let value: string
    let unit: string

    if (currentMagnitude >= 1) {
      value = currentMagnitude.toPrecision(3)
      unit = 'A'
    } else if (currentMagnitude >= 1e-3) {
      value = (currentMagnitude * 1e3).toPrecision(3)
      unit = 'mA'
    } else if (currentMagnitude >= 1e-6) {
      value = (currentMagnitude * 1e6).toPrecision(3)
      unit = 'µA'
    } else if (currentMagnitude >= 1e-9) {
      value = (currentMagnitude * 1e9).toPrecision(3)
      unit = 'nA'
    } else {
      value = (currentMagnitude * 1e12).toPrecision(3)
      unit = 'pA'
    }
    return `${value}${unit}`
  }

  return 'N/A'
})

// Direction toggle removed - now automatically determined by physical current flow

// Debug information computed properties
const targetComponent = computed(() => {
  return circuitStore.currentCircuit.components.find((c) => c.id === props.probe.targetId)
})

const wireDebugInfo = computed(() => {
  if (props.probe.type !== 'current') {
    return { startConnection: 'N/A', endConnection: 'N/A', simulationCurrent: undefined }
  }

  const targetWire = circuitStore.currentCircuit.components.find(
    (c) => c.id === props.probe.targetId,
  )
  if (!targetWire || targetWire.type !== 'wire' || !targetWire.properties) {
    return { startConnection: 'N/A', endConnection: 'N/A', simulationCurrent: undefined }
  }

  const wireProps = targetWire.properties
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

  // Get simulation current for this wire
  const simulationCurrent = circuitStore.dcSolution?.currents[props.probe.targetId]

  return { startConnection, endConnection, simulationCurrent }
})

const voltageDebugInfo = computed(() => {
  if (props.probe.type !== 'voltage') {
    return { nodeIndex: undefined }
  }

  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return { nodeIndex: undefined }

  const { termToNodeIndex } = dcSolution

  // For voltage probes, try to find the node index
  let nodeIndex: number | undefined

  // If probing a component terminal
  const targetComp = circuitStore.currentCircuit.components.find(
    (c) => c.id === props.probe.targetId,
  )
  if (targetComp) {
    const compDef = getComponentDefinition(targetComp.type)
    if (compDef?.terminals?.[0]) {
      const terminalId = `${targetComp.id}:${compDef.terminals[0].id}`
      nodeIndex = termToNodeIndex.get(terminalId)
    }
  }

  return { nodeIndex }
})

function deleteProbe() {
  const historyActions = useCircuitHistory()
  historyActions.removeProbeWithHistory(props.probe.id)
}
</script>

<style scoped>
/* Properties Panel - Design System Styling */
.properties-panel {
  padding: 0;
  background: transparent;
}
</style>
