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
import type { CircuitNode, Position } from '@/types/components'
import { useInteractionStore } from '@/stores/interaction'
import { computed } from 'vue'
import type { KonvaEventObject } from 'konva/lib/Node'

const props = defineProps<{
  component: CircuitNode
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'dragstart'): void
  (e: 'dragmove', position: Position): void
  (e: 'dragend', position: Position): void
  (e: 'mouseenter'): void
  (e: 'mouseleave'): void
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'node-connect', nodeId: string): void
}>()

const interactionStore = useInteractionStore()

const isSelected = computed(() => interactionStore.selectedComponentId === props.component.id)

const isHighlighted = computed(() => {
  const wireState = interactionStore.wireCreationState
  const hovered = interactionStore.hoveredTerminal

  if (!wireState.isActive) return false

  // Don't highlight the node the wire is starting from
  if (wireState.startTerminal?.componentId === props.component.id) return false

  return hovered?.componentId === props.component.id
})

function handleClick() {
  emit('select')
}

function handleDragStart() {
  emit('dragstart')
}

function handleDragMove(e: KonvaEventObject<DragEvent>) {
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
  if (!pos) return

  // For a node, the component and terminal IDs are the same
  emit(
    'terminal-mousedown',
    props.component.terminal,
    props.component.id,
    pos
  )
}
</script>
