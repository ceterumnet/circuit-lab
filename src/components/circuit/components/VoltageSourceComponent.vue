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
        y: -25,
        width: 80,
        height: 50,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Voltage source body (circle) -->
    <v-circle
      :config="{
        x: 0,
        y: 0,
        radius: 20,
        fill: 'white',
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1,
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
      @terminal-mousedown="handleTerminalMouseDown"
    />
    <circuit-terminal
      :terminal-id="component.terminals[1]"
      :position="{ x: 30, y: 0 }"
      :component-id="component.id"
      @terminal-mousedown="handleTerminalMouseDown"
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
import type { VoltageSource, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'
import { computed } from 'vue'

interface Props {
  component: VoltageSource
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

  if (!wireState.isActive) return false

  if (wireState.startTerminal?.componentId === props.component.id) return false

  return hovered?.componentId === props.component.id
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
