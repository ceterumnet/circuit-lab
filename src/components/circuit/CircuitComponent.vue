<template>
  <v-group>
    <!-- Resistor component -->
    <v-group v-if="component.type === ComponentType.RESISTOR">
      <resistor-component
        :component="component as Resistor"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-click="handleTerminalClick"
        @terminal-drag-start="handleTerminalDragStart"
        @terminal-drag-move="handleTerminalDragMove"
        @terminal-drag-end="handleTerminalDragEnd"
      />
    </v-group>

    <!-- Voltage source component -->
    <v-group v-else-if="component.type === ComponentType.VOLTAGE_SOURCE">
      <voltage-source-component
        :component="component as VoltageSource"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-click="handleTerminalClick"
        @terminal-drag-start="handleTerminalDragStart"
        @terminal-drag-move="handleTerminalDragMove"
        @terminal-drag-end="handleTerminalDragEnd"
      />
    </v-group>

    <!-- Ground component -->
    <v-group v-else-if="component.type === ComponentType.GROUND">
      <ground-component
        :component="component as Ground"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-click="handleTerminalClick"
        @terminal-drag-start="handleTerminalDragStart"
        @terminal-drag-move="handleTerminalDragMove"
        @terminal-drag-end="handleTerminalDragEnd"
      />
    </v-group>

    <!-- Wire component -->
    <v-group v-else-if="component.type === ComponentType.WIRE">
      <wire-component
        :component="component as Wire"
        :start-position="wireStartPosition"
        :end-position="wireEndPosition"
        @select="handleSelect"
        @delete="handleWireDelete"
      />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  CircuitComponent,
  Resistor,
  VoltageSource,
  Ground,
  Wire,
  Position,
} from '@/types/circuit'
import { ComponentType } from '@/types/circuit'
import ResistorComponent from '@/components/circuit/components/ResistorComponent.vue'
import VoltageSourceComponent from '@/components/circuit/components/VoltageSourceComponent.vue'
import GroundComponent from '@/components/circuit/components/GroundComponent.vue'
import WireComponent from '@/components/circuit/components/WireComponent.vue'
import { useCircuitStore } from '@/stores/circuit'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', componentId: string): void
  (e: 'move', componentId: string, startDrag: boolean): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-start', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-move', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-end', terminalId: string, componentId: string, position: Position): void
  (e: 'wire-delete', wireId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

// Computed properties for wire positions (reactive to component position changes)
const wireStartPosition = computed(() => {
  if (props.component.type === ComponentType.WIRE) {
    const wire = props.component as Wire
    // Explicitly access the reactive components array to ensure reactivity
    const components = circuitStore.currentCircuit.components

    // Find the component that has the start terminal
    const startComponent = components.find(
      (c: CircuitComponent) => c.type !== ComponentType.WIRE && hasTerminal(c, wire.startTerminal),
    )

    if (!startComponent) {
      return { x: 0, y: 0 }
    }

    return getTerminalWorldPosition(startComponent, wire.startTerminal)
  }
  return { x: 0, y: 0 }
})

const wireEndPosition = computed(() => {
  if (props.component.type === ComponentType.WIRE) {
    const wire = props.component as Wire
    // Explicitly access the reactive components array to ensure reactivity
    const components = circuitStore.currentCircuit.components

    // Find the component that has the end terminal
    const endComponent = components.find(
      (c: CircuitComponent) => c.type !== ComponentType.WIRE && hasTerminal(c, wire.endTerminal),
    )

    if (!endComponent) {
      return { x: 0, y: 0 }
    }

    return getTerminalWorldPosition(endComponent, wire.endTerminal)
  }
  return { x: 0, y: 0 }
})

function handleSelect() {
  emit('select', props.component.id)
}

function handleDragStart() {
  emit('move', props.component.id, true)
}

function handleDragMove(position: Position) {
  // Update the component position in the store during drag for real-time wire updates
  circuitStore.moveComponent(props.component.id, position)
}

function handleDragEnd(position: Position) {
  // Final position update with grid snapping
  circuitStore.moveComponent(props.component.id, position)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
}

function handleTerminalDragStart(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-start', terminalId, componentId, position)
}

function handleTerminalDragMove(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-move', terminalId, componentId, position)
}

function handleTerminalDragEnd(terminalId: string, componentId: string, position: Position) {
  emit('terminal-drag-end', terminalId, componentId, position)
}

function handleWireDelete() {
  emit('wire-delete', props.component.id)
}

function hasTerminal(component: CircuitComponent, terminalId: string): boolean {
  switch (component.type) {
    case ComponentType.RESISTOR:
    case ComponentType.VOLTAGE_SOURCE:
      return (component as Resistor | VoltageSource).terminals.includes(terminalId)
    case ComponentType.GROUND:
      return (component as Ground).terminal === terminalId
    default:
      return false
  }
}

function getTerminalWorldPosition(component: CircuitComponent, terminalId: string): Position {
  let localOffset: Position

  switch (component.type) {
    case ComponentType.RESISTOR:
    case ComponentType.VOLTAGE_SOURCE: {
      const terminals = (component as Resistor | VoltageSource).terminals
      const terminalIndex = terminals.indexOf(terminalId)
      // Left terminal at -30, right terminal at +30
      const offsetX = terminalIndex === 0 ? -30 : 30
      localOffset = { x: offsetX, y: 0 }
      break
    }
    case ComponentType.GROUND: {
      // Ground has single terminal at top
      localOffset = { x: 0, y: -15 }
      break
    }
    default:
      return component.position
  }

  // Apply rotation transformation to local offset
  const rotatedOffset = rotatePoint(localOffset, component.rotation)

  return {
    x: component.position.x + rotatedOffset.x,
    y: component.position.y + rotatedOffset.y,
  }
}

// Helper function to rotate a point around origin
function rotatePoint(point: Position, angleInDegrees: number): Position {
  const angleInRadians = (angleInDegrees * Math.PI) / 180
  const cos = Math.cos(angleInRadians)
  const sin = Math.sin(angleInRadians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}
</script>
