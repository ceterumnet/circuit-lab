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

    <!-- Current source body (circle) -->
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

    <!-- Connection lines -->
    <v-line
      :config="{
        points: [0, -20, 0, -30],
        stroke: '#333',
        strokeWidth: 1,
      }"
    />
    <v-line
      :config="{
        points: [0, 20, 0, 30],
        stroke: '#333',
        strokeWidth: 1,
      }"
    />

    <!-- Current flow arrow (horizontal) -->
    <v-line
      :config="{
        points: [-12, 0, 12, 0],
        stroke: '#555',
        strokeWidth: 2,
      }"
    />
    <!-- Arrow head -->
    <v-line
      :config="{
        points: [8, -4, 12, 0, 8, 4],
        stroke: '#555',
        strokeWidth: 2,
        lineCap: 'round',
        lineJoin: 'round',
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

    <!-- Current value -->
    <v-text
      :config="{
        x: -20,
        y: 30,
        text: currentLabel,
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

const currentLabel = computed(() => {
  if (!props.component.properties) return ''
  const current = props.component.properties.current || 0
  const definition = componentDefinition.value?.properties.find((p) => p.key === 'current')
  const unit = definition?.unit || 'A'

  if (typeof current === 'number' && Math.abs(current) >= 1) {
    return `${current}${unit}`
  }
  if (typeof current === 'number' && Math.abs(current) < 0.001) {
    return `${current * 1000000}µ${unit}`
  }
  if (typeof current === 'number' && Math.abs(current) < 1) {
    return `${current * 1000}m${unit}`
  }
  return `${current}${unit}`
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

// NEW: Handle terminal mouse events for drag-based wire creation
function handleTerminalMouseDown(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mousedown', terminalId, componentId, position)
}

function handleTerminalMouseUp(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mouseup', terminalId, componentId, position)
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
