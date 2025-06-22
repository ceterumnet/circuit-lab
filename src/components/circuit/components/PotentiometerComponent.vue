<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      rotation: component.rotation,
      draggable: true,
    }"
    @dragstart="handleDragStart"
    @dragmove="handleDragMove"
    @dragend="handleDragEnd"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Hit area -->
    <v-rect
      :config="{
        x: -40,
        y: -30,
        width: 80,
        height: 60,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Potentiometer body (zigzag pattern) -->
    <v-line
      :config="{
        points: zigzagPoints,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />

    <!-- Wiper arrow (adjustable tap) -->
    <v-line
      :config="{
        points: wiperArrowPoints,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#666',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />

    <!-- Wiper connection line -->
    <v-line
      :config="{
        points: wiperConnectionPoints,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1,
        lineCap: 'round',
      }"
    />

    <!-- Connection terminals -->
    <circuit-terminal
      v-if="componentDefinition"
      :terminal-id="componentDefinition.terminals[0].id"
      :position="componentDefinition.terminals[0].position"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />
    <circuit-terminal
      v-if="componentDefinition"
      :terminal-id="componentDefinition.terminals[1].id"
      :position="componentDefinition.terminals[1].position"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />
    <circuit-terminal
      v-if="componentDefinition"
      :terminal-id="componentDefinition.terminals[2].id"
      :position="componentDefinition.terminals[2].position"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -40,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- Total resistance value -->
    <v-text
      :config="{
        x: -25,
        y: 25,
        text: totalResistanceLabel,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />

    <!-- Wiper position indicator -->
    <v-text
      :config="{
        x: -25,
        y: 35,
        text: wiperPositionLabel,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#007bff',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'dragstart', event: KonvaEventObject<MouseEvent>): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-mouseup', terminalId: string, componentId: string, position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interactionStore = useInteractionStore()

const componentDefinition = computed(() => getComponentDefinition(props.component.type))

const totalResistanceLabel = computed(() => {
  if (!props.component.properties) return ''
  const totalResistance = props.component.properties.totalResistance || 0
  const definition = componentDefinition.value?.properties.find((p) => p.key === 'totalResistance')
  const unit = definition?.unit || 'Ω'

  if (typeof totalResistance === 'number' && totalResistance >= 1000000) {
    return `${(totalResistance / 1000000).toFixed(1)}M${unit}`
  }
  if (typeof totalResistance === 'number' && totalResistance >= 1000) {
    return `${(totalResistance / 1000).toFixed(1)}k${unit}`
  }
  return `${totalResistance}${unit}`
})

const wiperPositionLabel = computed(() => {
  if (!props.component.properties) return ''
  const wiperPosition = props.component.properties.wiperPosition || 50
  return `${wiperPosition}%`
})

const wiperPosition = computed(() => {
  if (!props.component.properties) return 50
  return (props.component.properties.wiperPosition as number) || 50
})

const isSelected = computed(() =>
  interactionStore.selectedComponentIds.includes(props.component.id),
)

const isHighlighted = computed(() => {
  const wireState = interactionStore.wireCreationState
  const hovered = interactionStore.hoveredTerminal

  // Highlight only during wire creation
  if (!wireState.isActive) return false

  // Don't highlight the component the wire is starting from
  if (wireState.startTerminal?.componentId === props.component.id) return false

  // Check if the hovered terminal belongs to this component
  return hovered?.componentId === props.component.id
})

// Create zigzag pattern for potentiometer (same as regular resistor)
const zigzagPoints = computed(() => {
  const points = []
  const width = 40
  const height = 8
  const segments = 6

  // Start point
  points.push(-30, 0)
  points.push(-width / 2, 0)

  // Zigzag pattern
  for (let i = 0; i < segments; i++) {
    const x = -width / 2 + (i + 0.5) * (width / segments)
    const y = i % 2 === 0 ? -height : height
    points.push(x, y)
  }

  // End point
  points.push(width / 2, 0)
  points.push(30, 0)

  return points
})

// Create wiper arrow based on position
const wiperArrowPoints = computed(() => {
  // Calculate wiper X position based on percentage (0% = left, 100% = right)
  const wiperX = -20 + (wiperPosition.value / 100) * 40

  return [
    wiperX,
    -15, // Start of arrow line
    wiperX,
    -2, // End of arrow line (touching resistor)
    wiperX - 3,
    -5, // Arrow head left
    wiperX,
    -2, // Arrow tip
    wiperX + 3,
    -5, // Arrow head right
  ]
})

// Create wiper connection line to terminal
const wiperConnectionPoints = computed(() => {
  // Calculate wiper X position based on percentage
  const wiperX = -20 + (wiperPosition.value / 100) * 40

  return [
    wiperX,
    -15, // Start at arrow base
    0,
    -20, // End at wiper terminal
  ]
})

function handleDragStart(e: KonvaEventObject<MouseEvent>) {
  emit('dragstart', e)
}

function handleDragMove(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: e.target.x(),
    y: e.target.y(),
  }
  emit('dragmove', newPosition)
}

function handleDragEnd(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: e.target.x(),
    y: e.target.y(),
  }
  console.log('[PotentiometerComponent] handleDragEnd emitting:', newPosition)
  emit('dragend', newPosition)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
}

function handleTerminalMouseDown(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mousedown', terminalId, componentId, position)
}

function handleTerminalMouseUp(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mouseup', terminalId, componentId, position)
}

function handleMouseEnter(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
}

function handleMouseLeave(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
}
</script>
