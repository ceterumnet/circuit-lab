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
  >
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
import type { Ground, Position } from '@/types/circuit'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'

interface Props {
  component: Ground
}

interface Emits {
  (e: 'select'): void
  (e: 'dragstart'): void
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

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
}
</script>
