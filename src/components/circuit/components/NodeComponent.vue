<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      draggable: true,
    }"
    @dragstart="handleDragStart"
    @dragmove="handleDragMove"
    @dragend="handleDragEnd"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- Node body -->
    <v-ring
      :config="{
        outerRadius: 6,
        innerRadius: 4,
        fill: 'white',
        stroke: isSelected ? 'blue' : isHighlighted ? '#ffc107' : 'black',
        strokeWidth: isSelected || isHighlighted ? 2 : 1,
      }"
    />
    <!-- Terminal is a separate, interactive entity -->
    <circuit-terminal
      v-if="nodeDefinition"
      :component-id="component.id"
      :terminal-id="nodeDefinition.terminals[0].id"
      :position="{ x: 0, y: 0 }"
      :is-selected="isSelected"
      @terminal-click="handleTerminalClick"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import CircuitTerminal from './CircuitTerminal.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { getComponentDefinition } from '@/registry/components'
import { useInteractionStore } from '@/stores/interaction'

const props = defineProps<{
  component: CircuitComponent
}>()

const emit = defineEmits<{
  (e: 'select', event: KonvaEventObject<MouseEvent>): void
  (e: 'dragstart', event: KonvaEventObject<DragEvent>): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
}>()

const interactionStore = useInteractionStore()
const nodeDefinition = computed(() => getComponentDefinition('node'))

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

function handleClick(e: KonvaEventObject<MouseEvent>) {
  console.log('[NodeComponent] handleClick on group fired')
  emit('select', e)
}

function handleDragStart(e: KonvaEventObject<DragEvent>) {
  console.log('[NodeComponent] handleDragStart on group fired')
  emit('dragstart', e)
}

function handleDragMove(e: { target: { x(): number; y(): number } }) {
  console.log('[NodeComponent] handleDragMove on group fired')
  const newPosition = {
    x: e.target.x(),
    y: e.target.y(),
  }
  emit('dragmove', newPosition)
}

function handleDragEnd(e: { target: { x(): number; y(): number } }) {
  console.log('[NodeComponent] handleDragEnd on group fired')
  const newPosition = {
    x: Math.round(e.target.x() / 30) * 30,
    y: Math.round(e.target.y() / 30) * 30,
  }
  emit('dragend', newPosition)
}

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  console.log(
    `[NodeComponent] handleTerminalClick received from terminal. Emitting up to CircuitComponent.`,
  )
  emit('terminal-click', terminalId, componentId, position)
}

function handleMouseEnter(event: KonvaEventObject<MouseEvent>) {
  console.log('[NodeComponent] handleMouseEnter on group fired')
  const stage = event.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
}

function handleMouseLeave(event: KonvaEventObject<MouseEvent>) {
  console.log('[NodeComponent] handleMouseLeave on group fired')
  const stage = event.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
}
</script>
