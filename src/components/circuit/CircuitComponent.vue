<template>
  <v-group>
    <!-- Resistor component -->
    <v-group v-if="component.type === ComponentType.RESISTOR">
      <resistor-component
        :component="component as Resistor"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @terminal-click="handleTerminalClick"
      />
    </v-group>

    <!-- Voltage source component -->
    <v-group v-else-if="component.type === ComponentType.VOLTAGE_SOURCE">
      <voltage-source-component
        :component="component as VoltageSource"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @terminal-click="handleTerminalClick"
      />
    </v-group>

    <!-- Ground component -->
    <v-group v-else-if="component.type === ComponentType.GROUND">
      <ground-component
        :component="component as Ground"
        @select="handleSelect"
        @dragstart="handleDragStart"
        @terminal-click="handleTerminalClick"
      />
    </v-group>

    <!-- Wire component -->
    <v-group v-else-if="component.type === ComponentType.WIRE">
      <wire-component
        :component="component as Wire"
        :start-position="(component as Wire).points[0]"
        :end-position="(component as Wire).points[1]"
        @select="handleSelect"
      />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
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

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', componentId: string): void
  (e: 'move', componentId: string, startDrag: boolean): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSelect() {
  emit('select', props.component.id)
}

function handleDragStart() {
  emit('move', props.component.id, true)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  emit('terminal-click', terminalId, componentId, position)
}
</script>
