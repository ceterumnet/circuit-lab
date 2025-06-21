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
    @click="handleClick"
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
        points: [0, -30, 0, -8],
        stroke: '#333',
        strokeWidth: 1.5,
      }"
    />
    <v-line
      :config="{
        points: [0, 30, 0, 8],
        stroke: '#333',
        strokeWidth: 1.5,
      }"
    />

    <!-- Contact points -->
    <v-circle
      :config="{
        x: 0,
        y: -8,
        radius: 2,
        fill: '#333',
      }"
    />
    <v-circle
      :config="{
        x: 0,
        y: 8,
        radius: 2,
        fill: '#333',
      }"
    />

    <!-- Switch blade/arm -->
    <v-line
      :config="{
        points: isOpen ? [0, -8, 8, -18] : [0, -8, 0, 8],
        stroke: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
        strokeWidth: isSelected || isHighlighted ? 3 : 2,
        lineCap: 'round',
      }"
    />

    <!-- Interactive indicator (clickable area highlight) -->
    <v-rect
      v-if="isHovered"
      :config="{
        x: -15,
        y: -20,
        width: 30,
        height: 20,
        fill: 'rgba(0, 123, 255, 0.1)',
        stroke: '#007bff',
        strokeWidth: 1,
        dash: [2, 2],
        cornerRadius: 3,
      }"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -45,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- State indicator -->
    <v-text
      :config="{
        x: 15,
        y: 0,
        text: isOpen ? 'OPEN' : 'CLOSED',
        fontSize: 8,
        fontFamily: 'Arial',
        fill: isOpen ? '#dc3545' : '#28a745',
        fontStyle: 'bold',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'
import { useCircuitStore } from '@/stores/circuit'
import { computed, ref } from 'vue'
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
const circuitStore = useCircuitStore()
const componentDefinition = computed(() => getComponentDefinition(props.component.type))

const isHovered = ref(false)

const isOpen = computed(() => {
  return props.component.properties?.isOpen === true // Default to closed (false = closed, true = open)
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

function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
}

function handleClick() {
  // Toggle switch state when clicked (not during drag)
  if (!interactionStore.isDraggingComponent) {
    const newState = !isOpen.value
    const newProperties = {
      ...props.component.properties,
      isOpen: newState,
    }
    circuitStore.updateComponent(props.component.id, {
      properties: newProperties,
    })
    console.log(`Switch ${props.component.id} toggled to ${newState ? 'OPEN' : 'CLOSED'}`)
  }
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
