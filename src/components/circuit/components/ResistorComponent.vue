<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      rotation: component.rotation,
      draggable: true,
    }"
    @click="handleClick"
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
        y: -20,
        width: 80,
        height: 40,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Resistor body (zigzag pattern) -->
    <v-line
      :config="{
        points: zigzagPoints,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />

    <!-- Connection terminals -->
    <circuit-terminal
      :terminal-id="component.terminals[0]"
      :position="{ x: -30, y: 0 }"
      :component-id="component.id"
      @terminal-mousedown="handleTerminalMouseDown"
    />
    <circuit-terminal
      :terminal-id="component.terminals[1]"
      :position="{ x: 30, y: 0 }"
      :component-id="component.id"
      @terminal-mousedown="handleTerminalMouseDown"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -25,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- Resistance value -->
    <v-text
      :config="{
        x: -20,
        y: 15,
        text: `${component.resistance.value}${component.resistance.unit}`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Resistor, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'

interface Props {
  component: Resistor
}

interface Emits {
  (e: 'select'): void
  (e: 'dragstart'): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interactionStore = useInteractionStore()

const isSelected = computed(() => interactionStore.selectedComponentId === props.component.id)

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

// Create zigzag pattern for resistor
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

function handleClick() {
  emit('select')
}

function handleDragStart() {
  emit('dragstart')
}

function handleDragMove(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: e.target.x(), // Don't snap during drag for smooth movement
    y: e.target.y(),
  }
  emit('dragmove', newPosition)
}

function handleDragEnd(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: Math.round(e.target.x() / 30) * 30, // Snap to grid on end
    y: Math.round(e.target.y() / 30) * 30,
  }
  emit('dragend', newPosition)
}

function handleTerminalMouseDown(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mousedown', terminalId, componentId, position)
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
