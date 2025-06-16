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
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />

    <!-- Connection terminals -->
    <circuit-terminal
      :terminal-id="component.terminals[0]"
      :position="{ x: -30, y: 0 }"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
    />
    <circuit-terminal
      :terminal-id="component.terminals[1]"
      :position="{ x: 30, y: 0 }"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
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

interface Props {
  component: Resistor
}

interface Emits {
  (e: 'select'): void
  (e: 'dragstart'): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

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

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
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
