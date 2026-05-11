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
        x: -40,
        y: -40,
        width: 80,
        height: 80,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- PMOS Symbol -->
    <v-group :config="{ x: -30, y: -30 }">
      <!-- Gate connection (left) -->
      <v-line
        :config="{
          points: [5, 30, 14, 30],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />

      <!-- Gate bar (vertical, left of oxide) -->
      <v-line
        :config="{
          points: [14, 14, 14, 46],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 2.5,
        }"
      />

      <!-- Oxide gap (insulator) -->
      <v-rect
        :config="{
          x: 17,
          y: 14,
          width: 4,
          height: 32,
          fill: 'transparent',
        }"
      />

      <!-- Channel (vertical, right of oxide) -->
      <v-line
        :config="{
          points: [21, 14, 21, 46],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 2,
        }"
      />

      <!-- Drain connection (top) -->
      <v-line
        :config="{
          points: [21, 14, 21, 5],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />

      <!-- Source connection (bottom) -->
      <v-line
        :config="{
          points: [21, 46, 21, 55],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1.5,
        }"
      />

      <!-- Body arrow on source (pointing inward - toward channel for PMOS) -->
      <v-line
        :config="{
          points: [19, 48, 21, 50, 21, 46, 19, 48],
          stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          strokeWidth: 1,
          fill: isActive ? '#22c55e' : isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
          closed: true,
        }"
      />

      <!-- Terminal labels -->
      <v-text
        :config="{
          x: 25,
          y: 8,
          text: 'D',
          fontSize: 8,
          fontFamily: 'Arial',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        }"
      />
      <v-text
        :config="{
          x: 8,
          y: 28,
          text: 'G',
          fontSize: 8,
          fontFamily: 'Arial',
          fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        }"
      />
      <v-text
        :config="{
          x: 25,
          y: 52,
          text: 'S',
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
    <circuit-terminal
      v-if="componentDefinition"
      :terminal-id="componentDefinition.terminals[2].id"
      :position="componentDefinition.terminals[2].position"
      :component-id="component.id"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -30,
        y: 45,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />

    <!-- Threshold voltage display -->
    <v-text
      :config="{
        x: -30,
        y: 58,
        text: `Vth=${thresholdVoltage.toFixed(1)}V`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#888',
      }"
    />

    <!-- Operating region indicator -->
    <v-text
      v-if="operatingRegion"
      :config="{
        x: 50,
        y: -15,
        text: operatingRegion,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: regionColor,
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
const thresholdVoltage = computed(
  () => (props.component.properties?.thresholdVoltage as number) || -1.0,
)

const _kp = computed(() => (props.component.properties?.kp as number) || 100e-6)

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

  // Highlight if any terminal is hovered
  return hovered?.componentId === props.component.id
})

// PMOS-specific computed properties for educational display
const isActive = computed(() => {
  return (props.component.properties?.isActive as boolean) || false
})

const operatingRegion = computed(() => {
  return (props.component.properties?.operatingRegion as string) || ''
})

const regionColor = computed(() => {
  switch (operatingRegion.value) {
    case 'Active':
      return '#22c55e'
    case 'Saturation':
      return '#f59e0b'
    case 'Cutoff':
      return '#6b7280'
    case 'Triode':
      return '#3b82f6'
    default:
      return '#888'
  }
})

// Event handlers following the established pattern
const handleDragStart = (event: KonvaEventObject<MouseEvent>) => {
  emit('select', event)
  emit('dragstart', event)
}

const handleDragMove = (event: KonvaEventObject<MouseEvent>) => {
  const stage = event.target.getStage()
  if (stage) {
    const position = stage.getPointerPosition()
    if (position) {
      emit('dragmove', { x: position.x, y: position.y })
    }
  }
}

const handleDragEnd = (event: KonvaEventObject<MouseEvent>) => {
  const stage = event.target.getStage()
  if (stage) {
    const position = stage.getPointerPosition()
    if (position) {
      emit('dragend', { x: position.x, y: position.y })
    }
  }
}

const handleMouseEnter = () => {
  // Could be used for hover effects in the future
}

const handleMouseLeave = () => {
  // Could be used for hover effects in the future
}

const handleTerminalClick = (terminalId: string, componentId: string, position: Position) => {
  emit('terminal-click', terminalId, componentId, position)
}

const handleTerminalMouseDown = (terminalId: string, componentId: string, position: Position) => {
  emit('terminal-mousedown', terminalId, componentId, position)
}

const handleTerminalMouseUp = (terminalId: string, componentId: string, position: Position) => {
  emit('terminal-mouseup', terminalId, componentId, position)
}
</script>
