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
        y: -20,
        width: 80,
        height: 40,
        fill: 'rgba(0,0,0,0.01)',
      }"
    />

    <!-- Inductor symbol (coil arcs) -->
    <!-- Left connection line -->
    <v-line
      :config="{
        points: [-30, 0, -18, 0],
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
      }"
    />

    <!-- Coil arcs -->
    <v-arc
      :config="{
        x: -12,
        y: 0,
        innerRadius: 6,
        outerRadius: 6,
        angle: 180,
        rotation: 0,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
      }"
    />
    <v-arc
      :config="{
        x: 0,
        y: 0,
        innerRadius: 6,
        outerRadius: 6,
        angle: 180,
        rotation: 0,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
      }"
    />
    <v-arc
      :config="{
        x: 12,
        y: 0,
        innerRadius: 6,
        outerRadius: 6,
        angle: 180,
        rotation: 0,
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
      }"
    />

    <!-- Right connection line -->
    <v-line
      :config="{
        points: [18, 0, 30, 0],
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 2 : 1.5,
        lineCap: 'round',
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

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -25,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- Inductance value -->
    <v-text
      :config="{
        x: -20,
        y: 15,
        text: inductanceLabel,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
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

const inductanceLabel = computed(() => {
  if (!props.component.properties) return ''
  const inductance = props.component.properties.inductance || 0
  const definition = componentDefinition.value?.properties.find((p) => p.key === 'inductance')
  const unit = definition?.unit || 'H'

  if (typeof inductance === 'number') {
    if (inductance >= 1) {
      return `${inductance}${unit}`
    }
    if (inductance >= 1e-3) {
      return `${inductance * 1000}m${unit}`
    }
    if (inductance >= 1e-6) {
      return `${inductance * 1000000}μ${unit}`
    }
    if (inductance >= 1e-9) {
      return `${inductance * 1000000000}n${unit}`
    }
  }
  return `${inductance}${unit}`
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
  // Component hover logic if needed
}

function handleMouseLeave() {
  // Component hover cleanup if needed
}
</script>
