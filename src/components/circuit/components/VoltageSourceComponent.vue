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
    <!-- Voltage source body (circle) -->
    <v-circle
      :config="{
        x: 0,
        y: 0,
        radius: 20,
        fill: 'white',
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Plus symbol -->
    <v-line
      :config="{
        points: [-8, -8, 8, -8],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />
    <v-line
      :config="{
        points: [0, -12, 0, -4],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />

    <!-- Minus symbol -->
    <v-line
      :config="{
        points: [-8, 8, 8, 8],
        stroke: '#333',
        strokeWidth: 2,
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

    <!-- Connection lines -->
    <v-line
      :config="{
        points: [-30, 0, -20, 0],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />
    <v-line
      :config="{
        points: [20, 0, 30, 0],
        stroke: '#333',
        strokeWidth: 2,
      }"
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

    <!-- Voltage value -->
    <v-text
      :config="{
        x: -20,
        y: 30,
        text: `${component.voltage.value}${component.voltage.unit}`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { VoltageSource, Position } from '@/types/circuit'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'

interface Props {
  component: VoltageSource
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
