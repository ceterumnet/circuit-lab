<template>
  <v-group>
    <!-- Single draggable circle - no nested groups, no terminal conflicts -->
    <v-circle
      :config="{
        x: component.position.x,
        y: component.position.y,
        radius: 4,
        fill: component.selected ? '#2196f3' : '#000',
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 2 : 1,
        draggable: true,
      }"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @click="handleClick"
    />

    <!-- Selection indicator (separate element) -->
    <v-circle
      v-if="component.selected"
      :config="{
        x: component.position.x,
        y: component.position.y,
        radius: 8,
        stroke: '#2196f3',
        strokeWidth: 2,
        opacity: 0.5,
        listening: false,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { CircuitNode, Position } from '@/types/circuit'
import type { KonvaEventObject } from 'konva/lib/Node'

interface Props {
  component: CircuitNode
}

interface Emits {
  (e: 'select'): void
  (e: 'move', componentId: string, startDrag: boolean): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick(e: KonvaEventObject<MouseEvent>) {
  // Handle both component selection AND terminal clicks
  e.cancelBubble = true

  // Emit component selection
  emit('select')

  // Also emit terminal click for wire creation (node terminal is at center)
  emit('terminal-click', props.component.terminal, props.component.id, { x: 0, y: 0 })
}

function handleDragStart() {
  emit('move', props.component.id, true)
}

function handleDragMove(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: e.target.x(), // Don't snap during drag for smooth movement
    y: e.target.y(),
  }
  emit('move', props.component.id, false)
  // Also emit dragmove with position for real-time wire updates
  emit('dragmove', newPosition)
}

function handleDragEnd(e: { target: { x(): number; y(): number } }) {
  const newPosition = {
    x: Math.round(e.target.x() / 20) * 20, // Snap to grid on end
    y: Math.round(e.target.y() / 20) * 20,
  }
  emit('move', props.component.id, false)
  // Also emit dragend with final position
  emit('dragend', newPosition)
}
</script>
