<template>
  <v-group>
    <!-- Probe Lead Line -->
    <v-line
      :config="{
        points: [probe.position.x, probe.position.y, leadEndPoint.x, leadEndPoint.y],
        stroke: '#adb5bd',
        strokeWidth: 1,
        dash: [3, 3],
        listening: false,
      }"
    />

    <!-- Draggable probe group -->
    <v-group
      ref="groupRef"
      :config="groupConfig"
      @dragend="handleDragEnd"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Probe Icon -->
      <v-circle
        :config="{
          radius: 6,
          fill: probe.type === 'voltage' ? 'deeppink' : currentColor,
          stroke: 'white',
          strokeWidth: 2,
        }"
      />

      <!-- Current Direction Arrow (only for current probes) -->
      <v-group v-if="probe.type === 'current'">
        <!-- Arrow shaft -->
        <v-line
          :config="{
            points: arrowLinePoints,
            stroke: currentColor,
            strokeWidth: 2,
            listening: false,
          }"
        />
        <!-- Arrow head -->
        <v-path
          :config="{
            data: arrowHeadPath,
            fill: currentColor,
            stroke: currentColor,
            strokeWidth: 1,
            listening: false,
          }"
        />
      </v-group>

      <!-- Readout Display -->
      <v-rect
        :config="{
          x: 10,
          y: -12,
          width: 70,
          height: 20,
          fill: '#f8f9fa',
          cornerRadius: 3,
          stroke: '#dee2e6',
          strokeWidth: 1,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOpacity: 0.1,
          shadowOffsetY: 1,
        }"
      />
      <v-text
        :config="{
          text: probeValue,
          x: 15,
          y: -8,
          fontSize: 12,
          fill: '#212529',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          listening: false,
          width: 60,
          align: 'right',
        }"
      />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import type { Probe } from '@/types/components'
import type { KonvaEventObject } from 'konva/lib/Node'
import { getComponentDefinition } from '@/registry/components'
import { getTerminalWorldPosition } from '@/services/geometry'

interface Props {
  probe: Probe
}

interface Emits {
  (e: 'select', probeId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'dragend', probeId: string, event: KonvaEventObject<DragEvent>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupRef = ref<any>(null)

watch(
  () => props.probe.position,
  (newPosition) => {
    const node = groupRef.value?.getNode()
    if (node) {
      node.to({
        x: newPosition.x,
        y: newPosition.y,
        duration: 0.1, // A short animation can smooth the transition
      })
    }
  },
  { deep: true },
)

const leadEndPoint = computed(() => {
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === props.probe.targetId)
  if (wire?.type !== 'wire' || !wire.properties) return props.probe.position

  const wireProps = wire.properties
  const components = circuitStore.currentCircuit.components
  const startComp = components.find((c) => c.id === wireProps.startComponentId)
  const endComp = components.find((c) => c.id === wireProps.endComponentId)

  if (!startComp || !endComp) return props.probe.position

  const p1 = getTerminalWorldPosition(startComp, wireProps.startTerminal as string)
  const p2 = getTerminalWorldPosition(endComp, wireProps.endTerminal as string)

  const probePos = props.probe.position

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  if (dx === 0 && dy === 0) return p1

  const t = ((probePos.x - p1.x) * dx + (probePos.y - p1.y) * dy) / (dx * dx + dy * dy)

  if (t < 0) return p1
  if (t > 1) return p2

  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
  }
})

// Physical current direction computation following the new specification
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

  // Debug logging for current direction analysis
  if (wire?.properties && Math.abs(rawCurrent) > 1e-12) {
    const startCompId = wire.properties.startComponentId as string
    const endCompId = wire.properties.endComponentId as string
    const startComp = circuitStore.currentCircuit.components.find((c) => c.id === startCompId)
    const endComp = circuitStore.currentCircuit.components.find((c) => c.id === endCompId)

    console.log(`🔍 Current Probe Debug for ${targetId}:`)
    console.log(`  Raw MNA Current: ${rawCurrent.toFixed(6)}A (direct from simulation)`)
    console.log(
      `  Wire: ${startCompId}:${wire.properties.startTerminal} → ${endCompId}:${wire.properties.endTerminal}`,
    )
    console.log(`  Start Component: ${startComp?.type} (${startCompId})`)
    console.log(`  End Component: ${endComp?.type} (${endCompId})`)
    console.log(`  Physical Flow Direction: ${flowsStartToEnd ? 'Start→End' : 'End→Start'}`)
    console.log(`  Arrow Direction: ${flowsStartToEnd ? 'RIGHT (→)' : 'LEFT (←)'}`)
    console.log(
      `  Physical meaning: Current flows FROM ${flowsStartToEnd ? startCompId : endCompId} TO ${flowsStartToEnd ? endCompId : startCompId}`,
    )
    console.log(`  Multimeter-equivalent: ${Math.abs(rawCurrent).toFixed(6)}A`)
  }

  return {
    magnitude: Math.abs(rawCurrent),
    flowsStartToEnd: flowsStartToEnd,
  }
})

// Legacy currentInfo for backward compatibility (now uses physicalCurrentInfo)
const _currentInfo = computed(() => {
  const physical = physicalCurrentInfo.value
  return {
    value: physical.magnitude, // Always positive now
    isPositive: true, // Always true since we show magnitude only
  }
})

const currentColor = computed(() => {
  if (props.probe.type !== 'current') return 'lightseagreen'
  // Always green now since we always show positive magnitude with directional arrow
  return '#28a745'
})

// Physical direction arrow components - always point in actual current flow direction
const arrowLinePoints = computed(() => {
  if (props.probe.type !== 'current') return []

  // Calculate the actual wire direction vector
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === props.probe.targetId)
  if (wire?.type !== 'wire' || !wire.properties) return []

  const wireProps = wire.properties
  const components = circuitStore.currentCircuit.components
  const startComp = components.find((c) => c.id === wireProps.startComponentId)
  const endComp = components.find((c) => c.id === wireProps.endComponentId)

  if (!startComp || !endComp) return []

  // Get actual wire endpoints
  const startPos = getTerminalWorldPosition(startComp, wireProps.startTerminal as string)
  const endPos = getTerminalWorldPosition(endComp, wireProps.endTerminal as string)

  // Calculate wire direction vector
  const wireVector = { x: endPos.x - startPos.x, y: endPos.y - startPos.y }
  const wireLength = Math.sqrt(wireVector.x * wireVector.x + wireVector.y * wireVector.y)

  if (wireLength === 0) return []

  // Normalize the wire vector
  const normalizedWire = { x: wireVector.x / wireLength, y: wireVector.y / wireLength }

  // Use physical current direction
  const flowsStartToEnd = physicalCurrentInfo.value.flowsStartToEnd
  const arrowLength = 12
  const yOffset = -18 // Position above the readout box

  // Calculate arrow direction based on actual wire direction and current flow
  const arrowDirection = flowsStartToEnd ? 1 : -1
  const arrowVector = {
    x: normalizedWire.x * arrowDirection,
    y: normalizedWire.y * arrowDirection,
  }

  // Position arrow line along the wire direction
  const startX = 8 - (arrowLength / 2) * arrowVector.x
  const startY = yOffset - (arrowLength / 2) * arrowVector.y
  const endX = 8 + (arrowLength / 2) * arrowVector.x
  const endY = yOffset + (arrowLength / 2) * arrowVector.y

  return [startX, startY, endX, endY]
})

const arrowHeadPath = computed(() => {
  if (props.probe.type !== 'current') return ''

  // Calculate the actual wire direction vector
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === props.probe.targetId)
  if (wire?.type !== 'wire' || !wire.properties) return ''

  const wireProps = wire.properties
  const components = circuitStore.currentCircuit.components
  const startComp = components.find((c) => c.id === wireProps.startComponentId)
  const endComp = components.find((c) => c.id === wireProps.endComponentId)

  if (!startComp || !endComp) return ''

  // Get actual wire endpoints
  const startPos = getTerminalWorldPosition(startComp, wireProps.startTerminal as string)
  const endPos = getTerminalWorldPosition(endComp, wireProps.endTerminal as string)

  // Calculate wire direction vector
  const wireVector = { x: endPos.x - startPos.x, y: endPos.y - startPos.y }
  const wireLength = Math.sqrt(wireVector.x * wireVector.x + wireVector.y * wireVector.y)

  if (wireLength === 0) return ''

  // Normalize the wire vector
  const normalizedWire = { x: wireVector.x / wireLength, y: wireVector.y / wireLength }

  // Use physical current direction
  const flowsStartToEnd = physicalCurrentInfo.value.flowsStartToEnd
  const arrowSize = 4
  const yOffset = -18 // Position above the readout box

  // Calculate arrow direction based on actual wire direction and current flow
  const arrowDirection = flowsStartToEnd ? 1 : -1
  const arrowVector = {
    x: normalizedWire.x * arrowDirection,
    y: normalizedWire.y * arrowDirection,
  }

  // Position arrow head at the tip of the arrow line
  const tipX = 8 + 6 * arrowVector.x
  const tipY = yOffset + 6 * arrowVector.y

  // Calculate perpendicular vector for arrow head wings
  const perpVector = { x: -arrowVector.y, y: arrowVector.x }

  // Arrow head points
  const wing1X = tipX - arrowSize * arrowVector.x + (arrowSize / 2) * perpVector.x
  const wing1Y = tipY - arrowSize * arrowVector.y + (arrowSize / 2) * perpVector.y
  const wing2X = tipX - arrowSize * arrowVector.x - (arrowSize / 2) * perpVector.x
  const wing2Y = tipY - arrowSize * arrowVector.y - (arrowSize / 2) * perpVector.y

  return `M${tipX},${tipY} L${wing1X},${wing1Y} L${wing2X},${wing2Y} Z`
})

const probeValue = computed(() => {
  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return 'N/A'

  const { voltages, currents: _currents, termToNodeIndex } = dcSolution
  const targetId = props.probe.targetId

  if (props.probe.type === 'voltage') {
    const targetComponent = circuitStore.currentCircuit.components.find((c) => c.id === targetId)

    if (targetComponent?.type === 'wire' && targetComponent.properties) {
      const startCompId = targetComponent.properties.startComponentId as string
      const startTermId = targetComponent.properties.startTerminal as string
      const endCompId = targetComponent.properties.endComponentId as string
      const endTermId = targetComponent.properties.endTerminal as string

      // Get voltages at both ends of the wire
      const startTerminalId = `${startCompId}:${startTermId}`
      const endTerminalId = `${endCompId}:${endTermId}`

      const startNodeIndex = termToNodeIndex.get(startTerminalId)
      const endNodeIndex = termToNodeIndex.get(endTerminalId)

      const startVoltage = startNodeIndex !== undefined ? voltages[startNodeIndex] : undefined
      const endVoltage = endNodeIndex !== undefined ? voltages[endNodeIndex] : undefined

      // Smart terminal selection: choose the higher voltage terminal
      // This makes more intuitive sense for voltage probes in series circuits
      // where users typically want to measure "how far up the voltage chain" they are
      if (startVoltage !== undefined && endVoltage !== undefined) {
        // Use the higher voltage (more positive) terminal
        const voltage = Math.max(startVoltage, endVoltage)
        return `${voltage.toFixed(3)}V`
      } else if (startVoltage !== undefined) {
        return `${startVoltage.toFixed(3)}V`
      } else if (endVoltage !== undefined) {
        return `${endVoltage.toFixed(3)}V`
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

const groupConfig = computed(() => {
  const position = props.probe.position
  return {
    ...position,
    draggable: true,
  }
})

function handleClick(event: KonvaEventObject<MouseEvent>) {
  emit('select', props.probe.id, event)
}

function handleDragEnd(event: KonvaEventObject<DragEvent>) {
  // Prevent emitting the event if the position hasn't changed
  if (event.target.x() === props.probe.position.x && event.target.y() === props.probe.position.y) {
    return
  }
  emit('dragend', props.probe.id, event)
}

function handleMouseEnter(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
}

function handleMouseLeave(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
}
</script>
