<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      rotation: component.rotation,
      draggable: true,
    }"
    @dragstart="$emit('dragstart', $event)"
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

    <!-- Professional AC Voltage Source Symbol using matching SVG -->
    <v-group
      :config="{
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
      }"
    >
      <!-- Symbol background for selection/highlighting -->
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

      <!-- AC Voltage Source Symbol Content -->
      <!-- Sine wave inside circle to indicate AC -->
      <v-line
        :config="{
          points: [-12, 0, -8, -8, -4, 0, 0, 8, 4, 0, 8, -8, 12, 0],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />

      <!-- Polarity markers -->
      <v-text
        :config="{
          x: -3,
          y: -12,
          text: '+',
          fontSize: 8,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          textAnchor: 'middle',
        }"
      />
      <v-text
        :config="{
          x: -2,
          y: 14,
          text: '−',
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          textAnchor: 'middle',
        }"
      />

      <!-- Connection lines -->
      <v-line
        :config="{
          points: [0, -20, 0, -30],
          stroke: '#333',
          strokeWidth: 1.5,
        }"
      />
      <v-line
        :config="{
          points: [0, 20, 0, 30],
          stroke: '#333',
          strokeWidth: 1.5,
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
        y: -40,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- AC parameters display -->
    <v-text
      :config="{
        x: -30,
        y: 30,
        text: acParametersLabel,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'
import { computed } from 'vue'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

interface Emits {
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

// AC parameters computed below

const acParametersLabel = computed(() => {
  if (!props.component.properties) return ''

  const amplitude = props.component.properties.amplitude || 0
  const frequency = props.component.properties.frequency || 0
  const phase = props.component.properties.phase || 0

  let amplitudeStr = `${amplitude}V`
  if (Math.abs(amplitude as number) >= 1000) {
    amplitudeStr = `${(amplitude as number) / 1000}kV`
  } else if (Math.abs(amplitude as number) < 1) {
    amplitudeStr = `${(amplitude as number) * 1000}mV`
  }

  let freqStr = `${frequency}Hz`
  if ((frequency as number) >= 1000000) {
    freqStr = `${(frequency as number) / 1000000}MHz`
  } else if ((frequency as number) >= 1000) {
    freqStr = `${(frequency as number) / 1000}kHz`
  }

  const phaseStr = phase !== 0 ? ` ∠${phase}°` : ''

  return `${amplitudeStr}@${freqStr}${phaseStr}`
})

const isSelected = computed(() =>
  interactionStore.selectedComponentIds.includes(props.component.id),
)

const isHighlighted = computed(() => {
  const wireState = interactionStore.wireCreationState
  const hovered = interactionStore.hoveredTerminal

  if (!wireState.isActive) return false

  if (wireState.startTerminal?.componentId === props.component.id) return false

  return hovered?.componentId === props.component.id
})

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
  emit('dragend', newPosition)
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

function handleMouseEnter() {
  // Handle mouse enter if needed
}

function handleMouseLeave() {
  // Handle mouse leave if needed
}
</script>
