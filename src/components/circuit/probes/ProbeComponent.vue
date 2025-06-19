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
import type { Probe, Position } from '@/types/components'
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

// Computed property for current direction and color
const currentInfo = computed(() => {
  if (props.probe.type !== 'current') return { value: 0, isPositive: true }

  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return { value: 0, isPositive: true }

  const { currents } = dcSolution
  const targetId = props.probe.targetId
  const wire = circuitStore.currentCircuit.components.find((c) => c.id === targetId)
  if (wire?.type !== 'wire' || !wire.properties) return { value: 0, isPositive: true }

  // Get the wire's current directly from the simulation results
  let wireCurrent = currents[targetId]

  if (wireCurrent === undefined) {
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

    if (componentCurrent === undefined) return { value: 0, isPositive: true }

    // Fix sign convention for voltage sources - flip the sign so current flowing out of positive terminal is positive
    wireCurrent = componentCurrent
    if (isVoltageSource) {
      wireCurrent = -componentCurrent
    }
  }

  let adjustedCurrent = wireCurrent

  // Apply probe direction setting
  if (props.probe.direction === false) {
    adjustedCurrent = -adjustedCurrent
  }

  return {
    value: adjustedCurrent,
    isPositive: adjustedCurrent >= 0,
  }
})

const currentColor = computed(() => {
  if (props.probe.type !== 'current') return 'lightseagreen'
  return currentInfo.value.isPositive ? '#28a745' : '#dc3545' // Green for positive, red for negative
})

// Arrow components for current direction indicator
const arrowLinePoints = computed(() => {
  if (props.probe.type !== 'current') return []

  const direction = props.probe.direction !== false ? 1 : -1 // Default to forward (true)
  const lineLength = 12
  const yPos = -18 // Position above the readout box

  if (direction > 0) {
    // Right-pointing arrow line
    return [8, yPos, 8 + lineLength, yPos]
  } else {
    // Left-pointing arrow line
    return [-8, yPos, -8 - lineLength, yPos]
  }
})

const arrowHeadPath = computed(() => {
  if (props.probe.type !== 'current') return ''

  const direction = props.probe.direction !== false ? 1 : -1 // Default to forward (true)
  const arrowSize = 4
  const yPos = -18 // Position above the readout box

  if (direction > 0) {
    // Right-pointing arrow head
    const tipX = 8 + 12
    return `M${tipX},${yPos} L${tipX - arrowSize},${yPos - arrowSize / 2} L${tipX - arrowSize},${yPos + arrowSize / 2} Z`
  } else {
    // Left-pointing arrow head
    const tipX = -8 - 12
    return `M${tipX},${yPos} L${tipX + arrowSize},${yPos - arrowSize / 2} L${tipX + arrowSize},${yPos + arrowSize / 2} Z`
  }
})

const probeValue = computed(() => {
  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return 'N/A'

  const { voltages, currents, termToNodeIndex } = dcSolution
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
