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
      />
    </v-group>

    <!-- Node component -->
    <v-group v-else-if="component.type === ComponentType.NODE">
      <node-component
        :component="component as CircuitNode"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @dragmove="handleDragMove"
        @dragend="handleDragEnd"
        @terminal-click="handleTerminalClick"
        @node-connect="handleNodeConnect"
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
  CircuitNode,
  Position,
} from '@/types/circuit'
import { ComponentType } from '@/types/circuit'
import ResistorComponent from '@/components/circuit/components/ResistorComponent.vue'
import VoltageSourceComponent from '@/components/circuit/components/VoltageSourceComponent.vue'
import GroundComponent from '@/components/circuit/components/GroundComponent.vue'
import WireComponent from '@/components/circuit/components/WireComponent.vue'
import NodeComponent from '@/components/circuit/components/NodeComponent.vue'
import { useCircuitStore } from '@/stores/circuit'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', componentId: string): void
  (e: 'move', componentId: string, startDrag: boolean): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'node-connect', nodeId: string): void
  (e: 'wire-delete', wireId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

// Computed properties for wire positions (reactive to component position changes)
const wireStartPosition = computed(() => {
  if (props.component.type === ComponentType.WIRE) {
    const wire = props.component as Wire
    const components = circuitStore.currentCircuit.components

    // Check if connected to a terminal
    if (wire.startTerminal) {
      const startComponent = components.find(
        (c: CircuitComponent) =>
          c.type !== ComponentType.WIRE && hasTerminal(c, wire.startTerminal!),
      )
      if (startComponent) {
        return getTerminalWorldPosition(startComponent, wire.startTerminal)
      }
    }

    // Fall back to stored position
    return wire.startPosition || { x: 0, y: 0 }
  }
  return { x: 0, y: 0 }
})

const wireEndPosition = computed(() => {
  if (props.component.type === ComponentType.WIRE) {
    const wire = props.component as Wire
    const components = circuitStore.currentCircuit.components

    console.log('🔗 Computing wireEndPosition for', wire.id, {
      endTerminal: wire.endTerminal,
      endPosition: wire.endPosition,
    })

    // Check if connected to a terminal
    if (wire.endTerminal) {
      const endComponent = components.find(
        (c: CircuitComponent) => c.type !== ComponentType.WIRE && hasTerminal(c, wire.endTerminal!),
      )
      if (endComponent) {
        const terminalPos = getTerminalWorldPosition(endComponent, wire.endTerminal)
        console.log('🔗 Connected to terminal:', wire.endTerminal, terminalPos)
        return terminalPos
      }
    }

    // Fall back to stored position
    const fallbackPos = wire.endPosition || { x: 0, y: 0 }
    console.log('🔗 Using fallback position:', fallbackPos)
    return fallbackPos
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

function handleNodeConnect(nodeId: string) {
  emit('node-connect', nodeId)
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
    case ComponentType.NODE:
      return (component as CircuitNode).terminal === terminalId
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
    case ComponentType.NODE: {
      // Node terminal is at the center
      localOffset = { x: 0, y: 0 }
      break
    }
    default:
      // Fallback with validation
      const pos = component.position
      return {
        x: isNaN(pos.x) ? 0 : pos.x,
        y: isNaN(pos.y) ? 0 : pos.y,
      }
  }

  // Apply rotation transformation to local offset
  const rotatedOffset = rotatePoint(localOffset, component.rotation)

  // Calculate final position
  const finalX = component.position.x + rotatedOffset.x
  const finalY = component.position.y + rotatedOffset.y

  // Only fallback to 0 if both component position AND offset are invalid
  return {
    x: isNaN(finalX) ? (isNaN(component.position.x) ? 0 : component.position.x) : finalX,
    y: isNaN(finalY) ? (isNaN(component.position.y) ? 0 : component.position.y) : finalY,
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
