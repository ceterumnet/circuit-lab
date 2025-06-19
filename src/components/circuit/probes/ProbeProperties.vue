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

    <!-- Direction toggle for current probes -->
    <div v-if="probe.type === 'current'" class="property-item">
      <label>Direction:</label>
      <div class="direction-toggle">
        <button
          :class="['direction-btn', { active: probe.direction !== false }]"
          @click="toggleDirection(true)"
          title="Forward direction"
        >
          → Forward
        </button>
        <button
          :class="['direction-btn', { active: probe.direction === false }]"
          @click="toggleDirection(false)"
          title="Reverse direction"
        >
          ← Reverse
        </button>
      </div>
    </div>

    <div class="property-item">
      <label>Value:</label>
      <span class="property-value">{{ probeValue }}</span>
    </div>

    <div class="property-item">
      <button class="delete-button" @click="deleteProbe">🗑️ Delete Probe</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import type { Probe } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  probe: Probe
}

const props = defineProps<Props>()
const circuitStore = useCircuitStore()

// Computed property for current direction and value (matching ProbeComponent logic)
const currentInfo = computed(() => {
  if (props.probe.type !== 'current') return { value: 0, isPositive: true }

  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return { value: 0, isPositive: true }

  const { currents } = dcSolution
  const targetId = props.probe.targetId
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === targetId)
  if (wire?.type !== 'wire' || !wire.properties) return { value: 0, isPositive: true }

  // Find the component (resistor, v-source) connected to the wire to get the current from.
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

  if (componentCurrent === undefined) return { value: 0, isPositive: true }

  // Fix sign convention for voltage sources - flip the sign so current flowing out of positive terminal is positive
  let adjustedCurrent = componentCurrent
  if (isVoltageSource) {
    adjustedCurrent = -componentCurrent
  }

  // Apply probe direction setting
  if (props.probe.direction === false) {
    adjustedCurrent = -adjustedCurrent
  }

  return {
    value: adjustedCurrent,
    isPositive: adjustedCurrent >= 0,
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
    const current = currentInfo.value.value

    if (Math.abs(current) < 1e-12) return '0A'

    const sign = current >= 0 ? '' : '-'
    const absCurrent = Math.abs(current)
    let value: string
    let unit: string

    if (absCurrent >= 1) {
      value = absCurrent.toPrecision(3)
      unit = 'A'
    } else if (absCurrent >= 1e-3) {
      value = (absCurrent * 1e3).toPrecision(3)
      unit = 'mA'
    } else if (absCurrent >= 1e-6) {
      value = (absCurrent * 1e6).toPrecision(3)
      unit = 'µA'
    } else if (absCurrent >= 1e-9) {
      value = (absCurrent * 1e9).toPrecision(3)
      unit = 'nA'
    } else {
      value = (absCurrent * 1e12).toPrecision(3)
      unit = 'pA'
    }
    return `${sign}${value}${unit}`
  }

  return 'N/A'
})

function toggleDirection(direction: boolean) {
  circuitStore.updateProbeDirection(props.probe.id, direction)
}

function deleteProbe() {
  circuitStore.removeProbe(props.probe.id)
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
</style>
