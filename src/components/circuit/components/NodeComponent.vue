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
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown="handleTerminalMouseDown"
  >
    <v-circle
      :config="{
        radius: 6,
        fill: isSelected ? '#ff4d4d' : isHighlighted ? '#ffc107' : '#333',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { CircuitComponent, Position } from '@/types/components'
import { useInteractionStore } from '@/stores/interaction'
import { computed } from 'vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'select', event: KonvaEventObject<MouseEvent>): void
  (e: 'dragstart', event: KonvaEventObject<MouseEvent>): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'mouseenter'): void
  (e: 'mouseleave'): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'node-connect', nodeId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interactionStore = useInteractionStore()
const componentDefinition = computed(() => getComponentDefinition('node'))

const isSelected = computed(() => interactionStore.selectedComponentIds.includes(props.component.id))

const isHighlighted = computed(() => {
  const wireState = interactionStore.wireCreationState
  if (!wireState.isActive) return false
  if (wireState.startTerminal?.componentId === props.component.id) return false
  return interactionStore.hoveredTerminal?.componentId === props.component.id
})

function handleClick(e: KonvaEventObject<MouseEvent>) {
  emit('select', e)
}

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

function handleDragEnd(e: KonvaEventObject<DragEvent>) {
  const newPosition = {
    x: Math.round(e.target.x() / 30) * 30, // Snap to grid on end
    y: Math.round(e.target.y() / 30) * 30,
  }
  emit('dragend', newPosition)
}

function handleMouseEnter(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
  emit('mouseenter')
}

function handleMouseLeave(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
  emit('mouseleave')
}

function handleTerminalMouseDown(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage()
  if (!stage) return

  const pos = stage.getPointerPosition()
  if (!pos || !componentDefinition.value) return

  // For a node, the component and terminal IDs are the same
  emit(
    'terminal-mousedown',
    componentDefinition.value.terminals[0].id,
    props.component.id,
    pos
  )
}
</script>
