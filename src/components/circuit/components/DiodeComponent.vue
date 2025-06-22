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
        x: -35,
        y: -25,
        width: 70,
        height: 50,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Professional Diode Symbol using Konva shapes that match DiodeSymbol.vue -->
    <v-group :config="{ x: -30, y: -20 }">
      <!-- Terminal connection lines -->
      <v-line
        :config="{
          points: [5, 20, 15, 20],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />
      <v-line
        :config="{
          points: [45, 20, 55, 20],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />

      <!-- Diode triangle (anode side) - matches SVG polygon -->
      <v-line
        :config="{
          points: [15, 10, 15, 30, 30, 20, 15, 10],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
          fill: isForwardBiased
            ? '#22c55e'
            : isSelected
              ? '#ff4d4d'
              : isHighlighted
                ? '#ffc107'
                : '#333',
          closed: true,
          lineJoin: 'round',
        }"
      />

      <!-- Diode bar (cathode side) -->
      <v-line
        :config="{
          points: [30, 10, 30, 30],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 2.5,
        }"
      />

      <!-- Polarity markings -->
      <v-text
        :config="{
          x: 10,
          y: 8,
          text: 'A',
          fontSize: 8,
          fontFamily: 'Arial',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        }"
      />
      <v-text
        :config="{
          x: 35,
          y: 8,
          text: 'K',
          fontSize: 8,
          fontFamily: 'Arial',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        }"
      />
    </v-group>

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

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: 35,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />

    <!-- Saturation current display -->
    <v-text
      :config="{
        x: -20,
        y: 48,
        text: `Is=${formatCurrent(saturationCurrent)}`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#888',
      }"
    />

    <!-- Forward/Reverse Bias Indicator -->
    <v-text
      v-if="biasState"
      :config="{
        x: 45,
        y: -10,
        text: biasState,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: biasColor,
        fontStyle: 'bold',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import DiodeSymbol from '@/components/circuit/symbols/DiodeSymbol.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', event: KonvaEventObject<MouseEvent>): void
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

// Component properties with defaults
const saturationCurrent = computed(
  () => (props.component.properties?.saturationCurrent as number) || 1e-12,
)

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

// Bias state determination (will be enhanced when simulation integration is complete)
const isForwardBiased = computed(() => {
  // Placeholder for forward bias detection
  // Will be connected to simulation results when Newton-Raphson solver is integrated
  return false
})

const isReverseBiased = computed(() => {
  // Placeholder for reverse bias detection
  return false
})

const biasState = computed(() => {
  if (isForwardBiased.value) return 'FORWARD'
  if (isReverseBiased.value) return 'REVERSE'
  return null
})

const biasColor = computed(() => {
  if (isForwardBiased.value) return '#22c55e' // Green for forward bias
  if (isReverseBiased.value) return '#ef4444' // Red for reverse bias
  return '#6b7280' // Gray for unknown state
})

// Event handlers
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
  console.log('[DiodeComponent] handleDragEnd emitting:', newPosition)
  emit('dragend', newPosition)
}

function handleMouseEnter() {
  // Handle mouse enter if needed
}

function handleMouseLeave() {
  // Handle mouse leave if needed
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

// Utility functions
function formatCurrent(current: number): string {
  if (current >= 1e-3) return `${(current * 1000).toFixed(1)}mA`
  if (current >= 1e-6) return `${(current * 1e6).toFixed(1)}µA`
  if (current >= 1e-9) return `${(current * 1e9).toFixed(1)}nA`
  if (current >= 1e-12) return `${(current * 1e12).toFixed(1)}pA`
  return `${current.toExponential(1)}A`
}
</script>

<style scoped>
/* Add styles if needed */
</style>
