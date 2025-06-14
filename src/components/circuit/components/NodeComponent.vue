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
    @click="handleClick"
  >
    <!-- Node circle -->
    <v-circle
      :config="{
        radius: 4,
        fill: component.selected ? '#2196f3' : '#000',
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 2 : 1,
      }"
    />

    <!-- Selection indicator -->
    <v-circle
      v-if="component.selected"
      :config="{
        radius: 8,
        stroke: '#2196f3',
        strokeWidth: 2,
        opacity: 0.5,
      }"
    />

    <!-- Terminal (invisible, for connections) -->
    <CircuitTerminal
      :terminal-id="component.terminal"
      :component-id="component.id"
      :position="{ x: 0, y: 0 }"
      @click="handleTerminalClick"
      @drag-start="handleTerminalDragStart"
      @drag-move="handleTerminalDragMove"
      @drag-end="handleTerminalDragEnd"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { CircuitNode, Position } from '@/types/circuit'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'

interface Props {
  component: CircuitNode
}

interface Emits {
  (e: 'select'): void
  (e: 'move', startDrag: boolean): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-start', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-move', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-end', terminalId: string, componentId: string, position: Position): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick() {
  emit('select')
}

function handleDragStart() {
  emit('move', true)
}

function handleDragMove() {
  emit('move', false)
}

function handleDragEnd() {
  emit('move', false)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
}

function handleTerminalDragStart(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-start', terminalId, componentId, position)
}

function handleTerminalDragMove(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-move', terminalId, componentId, position)
}

function handleTerminalDragEnd(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-end', terminalId, componentId, position)
}
</script>
