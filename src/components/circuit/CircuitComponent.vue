<template>
  <v-group>
    <!-- Resistor component -->
    <v-group v-if="component.type === 'resistor'">
      <resistor-component
        :component="component"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-mousedown="handleTerminalMouseDown"
      />
    </v-group>

    <!-- Voltage source component -->
    <v-group v-else-if="component.type === 'voltage_source'">
      <voltage-source-component
        :component="component"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-mousedown="handleTerminalMouseDown"
      />
    </v-group>

    <!-- Ground component -->
    <v-group v-else-if="component.type === 'ground'">
      <ground-component
        :component="component"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-mousedown="handleTerminalMouseDown"
      />
    </v-group>

    <!-- Node component (rendered directly) -->
    <v-group
      v-else-if="component.type === 'node'"
      :config="{
        x: component.position.x,
        y: component.position.y,
        draggable: true
      }"
      @dragstart="handleDragStart"
      @dragmove="(e) => handleDragMove(e.target.position())"
      @dragend="(e) => handleDragEnd(e.target.position())"
      @click="handleSelect"
    >
      <v-circle
        :config="{
          radius: 5,
          fill: component.selected ? 'blue' : 'black',
          stroke: component.selected ? 'blue' : 'black',
          strokeWidth: 2
        }"
      />
      <!-- The node's single, central terminal -->
      <circuit-terminal
        v-if="component.terminals && component.terminals.length > 0"
        :component-id="component.id"
        :terminal-id="component.terminals[0].id"
        :position="{ x: 0, y: 0 }"
        @terminal-mousedown="handleTerminalMouseDown"
      />
    </v-group>

    <!-- Wire component -->
    <v-group v-else-if="component.type === 'wire'">
      <wire-component
        :component="component"
        :start-position="wireStartPosition"
        :end-position="wireEndPosition"
        @select="handleSelect"
        @delete="handleWireDelete"
        @wire-mouseenter="handleWireMouseEnter"
        @wire-mouseleave="handleWireMouseLeave"
        @wire-mouseup="handleWireMouseUp"
      />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  CircuitComponent,
  Position,
} from '@/types/components'
import ResistorComponent from '@/components/circuit/components/ResistorComponent.vue'
import VoltageSourceComponent from '@/components/circuit/components/VoltageSourceComponent.vue'
import GroundComponent from '@/components/circuit/components/GroundComponent.vue'
import WireComponent from '@/components/circuit/components/WireComponent.vue'
import CircuitTerminal from '@/components/circuit/components/CircuitTerminal.vue'
import { useCircuitStore } from '@/stores/circuit'
import { getTerminalWorldPosition } from '@/services/geometry'
import type { KonvaEventObject } from 'konva/lib/Node'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'move-start', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'move', componentId: string, position: Position): void
  (e: 'move-end', componentId: string, position: Position): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'wire-delete', wireId: string): void
  (e: 'wire-mouseenter', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseleave', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseup', componentId: string, event: KonvaEventObject<MouseEvent>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

// Computed properties for wire positions (reactive to component position changes)
const wireStartPosition = computed(() => {
  if (props.component.type !== 'wire') return { x: 0, y: 0 }

  const wire = props.component
  const components = circuitStore.currentCircuit.components
  const wireProps = wire.properties || {}

  const startTerminalId = wireProps.startTerminal as string | undefined
  const startComponentId = wireProps.startComponentId as string | undefined

  if (startTerminalId && startComponentId) {
    const startComponent = components.find(c => c.id === startComponentId)
    if (startComponent) {
      return getTerminalWorldPosition(startComponent, startTerminalId)
    }
  }

  // Fallback for wires not connected to a component (e.g., during creation)
  return (wireProps.startPosition as Position) || { x: 0, y: 0 }
})

const wireEndPosition = computed(() => {
  if (props.component.type !== 'wire') return { x: 0, y: 0 }

  const wire = props.component
  const components = circuitStore.currentCircuit.components
  const wireProps = wire.properties || {}

  const endTerminalId = wireProps.endTerminal as string | undefined
  const endComponentId = wireProps.endComponentId as string | undefined

  if (endTerminalId && endComponentId) {
    const endComponent = components.find(c => c.id === endComponentId)
    if (endComponent) {
      return getTerminalWorldPosition(endComponent, endTerminalId)
    }
  }

  // Fallback for wires not connected to a component (e.g., during creation)
  return (wireProps.endPosition as Position) || { x: 0, y: 0 }
})

function handleSelect(event: KonvaEventObject<MouseEvent>) {
  emit('select', props.component.id, event)
}

function handleDragStart(event: KonvaEventObject<MouseEvent>) {
  emit('move-start', props.component.id, event)
}

function handleDragMove(position: Position) {
  // Update the component position in the store for real-time wire updates
  emit('move', props.component.id, position)
}

function handleDragEnd(position: Position) {
  // Final position update with grid snapping
  emit('move-end', props.component.id, position)
}

function handleTerminalMouseDown(terminalId: string, componentId: string, position: Position) {
  emit('terminal-mousedown', terminalId, componentId, position)
}

function handleWireDelete() {
  emit('wire-delete', props.component.id)
}

function handleWireMouseEnter(event: KonvaEventObject<MouseEvent>) {
  emit('wire-mouseenter', props.component.id, event)
}

function handleWireMouseLeave(event: KonvaEventObject<MouseEvent>) {
  emit('wire-mouseleave', props.component.id, event)
}

function handleWireMouseUp(event: KonvaEventObject<MouseEvent>) {
  emit('wire-mouseup', props.component.id, event)
}
</script>
