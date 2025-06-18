<template>
  <v-group>
    <!-- Resistor component -->
    <resistor-component
      v-if="component.type === 'resistor'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
    />

    <!-- Voltage source component -->
    <voltage-source-component
      v-else-if="component.type === 'voltage_source'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
    />

    <!-- Ground component -->
    <ground-component
      v-else-if="component.type === 'ground'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
    />

    <!-- Node component -->
    <node-component
      v-else-if="component.type === 'node'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
    />

    <!-- Wire component -->
    <wire-component
      v-else-if="component.type === 'wire'"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import ResistorComponent from '@/components/circuit/components/ResistorComponent.vue'
import VoltageSourceComponent from '@/components/circuit/components/VoltageSourceComponent.vue'
import GroundComponent from '@/components/circuit/components/GroundComponent.vue'
import WireComponent from '@/components/circuit/components/WireComponent.vue'
import NodeComponent from '@/components/circuit/components/NodeComponent.vue'
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
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
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
    const startComponent = components.find((c) => c.id === startComponentId)
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
    const endComponent = components.find((c) => c.id === endComponentId)
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

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  console.log(
    `[CircuitComponent] handleTerminalClick received from ${componentId}. Emitting up to CircuitCanvas.`,
  )
  emit('terminal-click', terminalId, componentId, position)
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
