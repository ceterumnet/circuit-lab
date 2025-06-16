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
        x: -20,
        y: -20,
        width: 40,
        height: 50,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Ground symbol -->
    <!-- Vertical line -->
    <v-line
      :config="{
        points: [0, -15, 0, 15],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Horizontal lines (decreasing size) -->
    <v-line
      :config="{
        points: [-15, 15, 15, 15],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />
    <v-line
      :config="{
        points: [-10, 20, 10, 20],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />
    <v-line
      :config="{
        points: [-5, 25, 5, 25],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Connection terminal -->
    <circuit-terminal
      :terminal-id="component.terminal"
      :position="{ x: 0, y: -15 }"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: 10,
        y: -5,
        text: component.label || 'GND',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { Ground, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'

interface Props {
  component: Ground
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
