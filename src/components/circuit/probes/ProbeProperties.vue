<template>
  <div class="probe-properties">
    <div class="property-item">
      <label>ID:</label>
      <span class="property-value">{{ probe.id }}</span>
    </div>

    <div class="property-item">
      <label>Type:</label>
      <span class="property-value"
        >{{ probe.type === 'voltage' ? 'Voltage' : 'Current' }} Probe</span
      >
    </div>

    <div class="property-item">
      <label>Target:</label>
      <span class="property-value">{{ probe.targetId }}</span>
    </div>

    <!-- Current direction info (read-only, automatically determined) -->
    <div v-if="probe.type === 'current'" class="property-item">
      <label>Flow Direction:</label>
      <span class="property-value direction-indicator">
        {{ physicalCurrentInfo.flowsStartToEnd ? '→ Start to End' : '← End to Start' }}
        <small class="direction-note">(Automatically determined)</small>
      </span>
    </div>

    <div class="property-item">
      <label>Value:</label>
      <span class="property-value">{{ probeValue }}</span>
    </div>

    <!-- Probe Debug Information -->
    <div class="debug-section">
      <h4 class="debug-title">🔍 Debug Information</h4>

      <!-- Basic Probe Info -->
      <div class="debug-table">
        <div class="debug-row">
          <span class="debug-label">Position:</span>
          <span class="debug-value"
            >{{ probe.position.x.toFixed(1) }}, {{ probe.position.y.toFixed(1) }}</span
          >
        </div>
        <div class="debug-row">
          <span class="debug-label">Target Type:</span>
          <span class="debug-value">{{ targetComponent?.type || 'Unknown' }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Measurement:</span>
          <span class="debug-value">{{
            probe.type === 'voltage' ? 'Node Voltage' : 'Branch Current'
          }}</span>
        </div>
      </div>

      <!-- Current Probe Specific Debug -->
      <div v-if="probe.type === 'current'" class="debug-subsection">
        <h5 class="debug-subtitle">Current Probe Details</h5>
        <div class="debug-table">
          <div class="debug-row">
            <span class="debug-label">Wire Start:</span>
            <span class="debug-value">{{ wireDebugInfo.startConnection }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Wire End:</span>
            <span class="debug-value">{{ wireDebugInfo.endConnection }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Sim Current:</span>
            <span class="debug-value"
              >{{ wireDebugInfo.simulationCurrent?.toFixed(6) || 'N/A' }}A</span
            >
          </div>
          <div class="debug-row">
            <span class="debug-label">Raw Sign:</span>
            <span class="debug-value">{{
              wireDebugInfo.simulationCurrent && wireDebugInfo.simulationCurrent >= 0 ? '+' : '-'
            }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Physical Dir:</span>
            <span class="debug-value">{{
              physicalCurrentInfo.flowsStartToEnd ? 'Start→End' : 'End→Start'
            }}</span>
          </div>
        </div>
      </div>

      <!-- Voltage Probe Specific Debug -->
      <div v-if="probe.type === 'voltage'" class="debug-subsection">
        <h5 class="debug-subtitle">Voltage Probe Details</h5>
        <div class="debug-table">
          <div class="debug-row">
            <span class="debug-label">Node Index:</span>
            <span class="debug-value">{{ voltageDebugInfo.nodeIndex || 'N/A' }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Reference:</span>
            <span class="debug-value">Ground (0V)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="property-item">
      <button class="delete-button" @click="deleteProbe">🗑️ Delete Probe</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

  // Physical Current Direction Algorithm:
  // - Positive current: flows from startComponent to endComponent
  // - Negative current: flows from endComponent to startComponent
  // - Always display positive magnitude with arrow showing direction

  return {
    magnitude: Math.abs(rawCurrent),
    flowsStartToEnd: rawCurrent >= 0,
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
.probe-properties {
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

.property-value {
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.direction-toggle {
  display: flex;
  gap: 0.25rem;
}

.direction-btn {
  flex: 1;
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.direction-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.direction-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
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

.direction-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.direction-note {
  color: #6c757d;
  font-style: italic;
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
</style>
