<template>
  <v-circle
    :config="{
      x: position.x,
      y: position.y,
      radius: isHovered || isDragging || isValidDropTarget ? 6 : 3,
      fill: isDragging ? '#28a745' : isValidDropTarget ? '#ffc107' : isHovered ? '#007bff' : '#666',
      stroke: isSelected ? '#ff0000' : isValidDropTarget ? '#fd7e14' : '#333',
      strokeWidth: isSelected || isValidDropTarget ? 2 : 1,
      draggable: true,
    }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dragstart="handleDragStart"
    @dragmove="handleDragMove"
    @dragend="handleDragEnd"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Position } from '@/types/circuit'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useCircuitStore } from '@/stores/circuit'

interface Props {
  terminalId: string
  position: Position
  componentId: string
  isSelected?: boolean
}

interface Emits {
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-hover', terminalId: string, componentId: string, isHovered: boolean): void
  (e: 'terminal-drag-start', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-move', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-drag-end', terminalId: string, componentId: string, position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

const isHovered = ref(false)
const isDragging = ref(false)

// Check if this terminal can accept a drag connection
const isValidDropTarget = computed(() => {
  const dragState = circuitStore.dragConnectionState
  return (
    dragState.isActive &&
    dragState.startTerminal &&
    dragState.startTerminal.terminalId !== props.terminalId &&
    dragState.startTerminal.componentId !== props.componentId
  )
})

function handleClick(e: KonvaEventObject<MouseEvent>) {
  // Prevent component selection (Konva event)
  e.cancelBubble = true
  emit('terminal-click', props.terminalId, props.componentId, props.position)
}

function handleMouseEnter() {
  isHovered.value = true
  emit('terminal-hover', props.terminalId, props.componentId, true)
}

function handleMouseLeave() {
  isHovered.value = false
  emit('terminal-hover', props.terminalId, props.componentId, false)
}

function handleDragStart(e: KonvaEventObject<DragEvent>) {
  e.cancelBubble = true
  isDragging.value = true
  emit('terminal-drag-start', props.terminalId, props.componentId, props.position)
}

function handleDragMove(e: KonvaEventObject<DragEvent>) {
  e.cancelBubble = true
  const stage = e.target.getStage()
  const pointerPos = stage?.getPointerPosition()
  if (pointerPos) {
    emit('terminal-drag-move', props.terminalId, props.componentId, pointerPos)
  }
}

function handleDragEnd(e: KonvaEventObject<DragEvent>) {
  e.cancelBubble = true
  isDragging.value = false
  const stage = e.target.getStage()
  const pointerPos = stage?.getPointerPosition()
  if (pointerPos) {
    emit('terminal-drag-end', props.terminalId, props.componentId, pointerPos)
  }

  // Reset terminal position (it shouldn't actually move)
  e.target.position({ x: props.position.x, y: props.position.y })
}
</script>
