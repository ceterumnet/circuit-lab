<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      draggable: true,
    }"
    @dragstart="$emit('dragstart', $event)"
    @dragmove="$emit('dragmove', $event.target.position())"
    @dragend="$emit('dragend', $event.target.position())"
    @click="$emit('select', $event)"
  >
    <v-circle
      :config="{
        radius: 5,
        fill: component.selected ? 'blue' : 'black',
        stroke: component.selected ? 'blue' : 'black',
        strokeWidth: 2,
      }"
    />
    <circuit-terminal
      v-if="nodeDefinition"
      :component-id="component.id"
      :terminal-id="nodeDefinition.terminals[0].id"
      :position="{ x: 0, y: 0 }"
      @terminal-mousedown="(terminalId: string, componentId: string, position: Position) => $emit('terminal-mousedown', terminalId, componentId, position)"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from './CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { getComponentDefinition } from '@/registry/components'

defineProps<{
  component: CircuitComponent
}>()

const nodeDefinition = computed(() => getComponentDefinition('node'))

defineEmits<{
  (e: 'select', event: KonvaEventObject<MouseEvent>): void
  (e: 'dragstart', event: KonvaEventObject<DragEvent>): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
}>()
</script>
