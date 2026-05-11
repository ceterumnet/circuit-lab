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

    <!-- Professional LED Symbol using Konva shapes that match LEDSymbol.vue -->
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

      <!-- LED triangle (anode side) - matches SVG polygon -->
      <v-line
        :config="{
          points: [15, 10, 15, 30, 30, 20, 15, 10],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
          fill: isLEDOn ? ledDisplayColor : 'transparent',
          closed: true,
          lineJoin: 'round',
        }"
      />

      <!-- LED bar (cathode side) -->
      <v-line
        :config="{
          points: [30, 10, 30, 30],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 2.5,
        }"
      />

      <!-- Light rays (visible when LED is on) -->
      <v-group v-if="isLEDOn" :config="{ opacity: 0.8 }">
        <!-- First light ray -->
        <v-line
          :config="{
            points: [32, 12, 40, 8],
            stroke: ledDisplayColor,
            strokeWidth: 1,
          }"
        />
        <v-line
          :config="{
            points: [38, 6, 40, 8, 38, 10, 38, 6],
            stroke: ledDisplayColor,
            fill: ledDisplayColor,
            closed: true,
          }"
        />

        <!-- Second light ray -->
        <v-line
          :config="{
            points: [32, 16, 42, 12],
            stroke: ledDisplayColor,
            strokeWidth: 1,
          }"
        />
        <v-line
          :config="{
            points: [40, 10, 42, 12, 40, 14, 40, 10],
            stroke: ledDisplayColor,
            fill: ledDisplayColor,
            closed: true,
          }"
        />
      </v-group>

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

      <!-- Color indicator text -->
      <v-text
        :config="{
          x: 30,
          y: 36,
          text: ledColor.toUpperCase(),
          fontSize: 6,
          fontFamily: 'Arial',
          fill: ledDisplayColor,
          opacity: 0.7,
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

    <!-- LED parameters display -->
    <v-text
      :config="{
        x: -20,
        y: 48,
        text: `${ledColor.toUpperCase()} Vf=${forwardVoltage.toFixed(1)}V`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#888',
      }"
    />

    <!-- LED State Indicator -->
    <v-text
      v-if="ledState"
      :config="{
        x: 45,
        y: -10,
        text: ledState,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: ledStateColor,
        fontStyle: 'bold',
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
import { useCircuitStore } from '@/stores/circuit'
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
const circuitStore = useCircuitStore()

const componentDefinition = computed(() => getComponentDefinition(props.component.type))

// LED properties with defaults
const ledColor = computed(() => (props.component.properties?.color as string) || 'red')

const _saturationCurrent = computed(
  () => (props.component.properties?.saturationCurrent as number) || undefined, // Let LEDStamper handle defaults
)

const forwardVoltage = computed(() => {
  // Color-specific forward voltages for educational realism
  const forwardVoltages = {
    red: 1.7,
    yellow: 1.8,
    green: 2.1,
    blue: 3.0,
    white: 3.3,
  }
  return forwardVoltages[ledColor.value as keyof typeof forwardVoltages] || 1.7
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

// LED state determination connected to simulation results
const isLEDOn = computed(() => {
  const dcSolution = circuitStore.dcSolution
  if (!dcSolution) return false

  // Get LED current from simulation results
  const ledCurrent = dcSolution.currents[props.component.id]
  if (ledCurrent === undefined) return false

  // LED is considered "on" when current exceeds a reasonable threshold
  // For typical LEDs, 0.5mA (500μA) is a good threshold for visible light
  const onThreshold = 0.0005 // 0.5mA
  return Math.abs(ledCurrent) > onThreshold
})

const ledState = computed(() => {
  if (isLEDOn.value) return 'ON'
  return 'OFF'
})

const ledStateColor = computed(() => {
  if (isLEDOn.value) {
    return ledDisplayColor.value
  }
  return '#6b7280' // Gray when off
})

const ledDisplayColor = computed(() => {
  // Use color-specific LED colors when on
  const colorMap = {
    red: '#ff4444',
    green: '#44ff44',
    blue: '#4444ff',
    yellow: '#ffff44',
    white: '#ffffff',
  }
  return colorMap[ledColor.value as keyof typeof colorMap] || '#ff4444'
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
  console.log('[LEDComponent] handleDragEnd emitting:', newPosition)
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
</script>

<style scoped>
/* Add styles if needed */
</style>
