<template>
  <v-group @click="handleClick">
    <!-- Resistor component -->
    <resistor-component
      v-if="component.type === 'resistor'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Capacitor component -->
    <capacitor-component
      v-else-if="component.type === 'capacitor'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Inductor component -->
    <inductor-component
      v-else-if="component.type === 'inductor'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
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
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Current source component -->
    <current-source-component
      v-else-if="component.type === 'current_source'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- AC Voltage source component -->
    <a-c-voltage-source-component
      v-else-if="component.type === 'ac_voltage_source'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- AC Current source component -->
    <a-c-current-source-component
      v-else-if="component.type === 'ac_current_source'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Switch component -->
    <switch-component
      v-else-if="component.type === 'switch'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Variable resistor component -->
    <variable-resistor-component
      v-else-if="component.type === 'variable_resistor'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Potentiometer component -->
    <potentiometer-component
      v-else-if="component.type === 'potentiometer'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- Diode component -->
    <DiodeComponent
      v-else-if="component.type === 'diode'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- LED component -->
    <LEDComponent
      v-else-if="component.type === 'led'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- BJT component -->
    <BJTComponent
      v-else-if="component.type === 'bjt_npn'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- NMOS component -->
    <NMOSComponent
      v-else-if="component.type === 'mosfet_n'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
    />

    <!-- PMOS component -->
    <PMOSComponent
      v-else-if="component.type === 'mosfet_p'"
      :component="component"
      @select="handleSelect"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @terminal-click="handleTerminalClick"
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
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
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
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
      @terminal-mousedown="handleTerminalMouseDown"
      @terminal-mouseup="handleTerminalMouseUp"
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
import CapacitorComponent from '@/components/circuit/components/CapacitorComponent.vue'
import InductorComponent from '@/components/circuit/components/InductorComponent.vue'
import VoltageSourceComponent from '@/components/circuit/components/VoltageSourceComponent.vue'
import CurrentSourceComponent from '@/components/circuit/components/CurrentSourceComponent.vue'
import ACVoltageSourceComponent from '@/components/circuit/components/ACVoltageSourceComponent.vue'
import ACCurrentSourceComponent from '@/components/circuit/components/ACCurrentSourceComponent.vue'
import SwitchComponent from '@/components/circuit/components/SwitchComponent.vue'
import VariableResistorComponent from '@/components/circuit/components/VariableResistorComponent.vue'
import PotentiometerComponent from '@/components/circuit/components/PotentiometerComponent.vue'
import DiodeComponent from '@/components/circuit/components/DiodeComponent.vue'
import LEDComponent from '@/components/circuit/components/LEDComponent.vue'
import BJTComponent from '@/components/circuit/components/BJTComponent.vue'
import NMOSComponent from '@/components/circuit/components/NMOSComponent.vue'
import PMOSComponent from '@/components/circuit/components/PMOSComponent.vue'
import GroundComponent from '@/components/circuit/components/GroundComponent.vue'
import WireComponent from '@/components/circuit/components/WireComponent.vue'
import NodeComponent from '@/components/circuit/components/NodeComponent.vue'
import { useCircuitStore } from '@/stores/circuit'
import { getTerminalWorldPosition } from '@/services/geometry'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'move-start', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'move', componentId: string, position: Position): void
  (e: 'move-end', componentId: string, position: Position): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-mouseup', terminalId: string, componentId: string, position: Position): void
  (e: 'wire-probe', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-delete', wireId: string): void
  (e: 'wire-mouseenter', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseleave', componentId: string, event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseup', componentId: string, event: KonvaEventObject<MouseEvent>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()

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

function handleClick(e: KonvaEventObject<MouseEvent>) {
  // If we are in a probing mode and click a wire, place a probe.
  if (interactionStore.probingType && props.component.type === 'wire') {
    e.cancelBubble = true
    emit('wire-probe', props.component.id, e)
    return
  }

  // Otherwise, handle component selection.
  emit('select', props.component.id, e)
}

function handleSelect(event: KonvaEventObject<MouseEvent>) {
  // This is now handled by the main handleClick to avoid conflicts.
  // emit('select', props.component.id, event)
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
  console.log('[CircuitComponent] handleDragEnd received:', position)
  emit('move-end', props.component.id, position)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  console.log(
    `[CircuitComponent] handleTerminalClick received from ${componentId}. Emitting up to CircuitCanvas.`,
  )
  emit('terminal-click', terminalId, componentId, position)
}

// NEW: Handle terminal mousedown events for drag-based wire creation
function handleTerminalMouseDown(terminalId: string, componentId: string, position: Position) {
  console.log(
    `[CircuitComponent] handleTerminalMouseDown received from ${componentId}. Emitting up to CircuitCanvas.`,
  )
  emit('terminal-mousedown', terminalId, componentId, position)
}

// NEW: Handle terminal mouseup events for drag-based wire creation
function handleTerminalMouseUp(terminalId: string, componentId: string, position: Position) {
  console.log(
    `[CircuitComponent] handleTerminalMouseUp received from ${componentId}. Emitting up to CircuitCanvas.`,
  )
  emit('terminal-mouseup', terminalId, componentId, position)
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
