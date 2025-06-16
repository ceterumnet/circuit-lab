<template>
  <v-circle
    :config="{
      x: position.x,
      y: position.y,
      radius: isHovered || isValidDropTarget ? 6 : 3,
      fill: isValidDropTarget ? '#ffc107' : isHovered ? '#007bff' : '#666',
      stroke: isSelected ? '#ff0000' : isValidDropTarget ? '#fd7e14' : '#333',
      strokeWidth: isSelected || isValidDropTarget ? 2 : 1,
      draggable: false,
    }"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Position } from '@/types/components'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useInteractionStore } from '@/stores/interaction'

interface Props {
  terminalId: string
  position: Position
  componentId: string
  isSelected?: boolean
}

interface Emits {
  (e: 'terminal-mousedown', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-hover', terminalId: string, componentId: string, isHovered: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const interactionStore = useInteractionStore()

const isSelected = computed(
  () => interactionStore.selectedComponentId === props.componentId
)

const isValidDropTarget = computed(() => {
  const wireState = interactionStore.wireCreationState
  const hovered = interactionStore.hoveredTerminal

  if (!wireState.isActive || !hovered) return false

  return (
    hovered.componentId === props.componentId &&
    hovered.terminalId === props.terminalId &&
    wireState.startTerminal?.terminalId !== props.terminalId
  )
})

const isHovered = ref(false)

const position = computed(() => {
  return props.position
})

function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
  // Prevent component selection (Konva event)
  e.cancelBubble = true
  emit('terminal-mousedown', props.terminalId, props.componentId, props.position)
}

function handleMouseEnter() {
  isHovered.value = true
  emit('terminal-hover', props.terminalId, props.componentId, true)
}

function handleMouseLeave() {
  isHovered.value = false
  emit('terminal-hover', props.terminalId, props.componentId, false)
}

// Drag functionality removed - terminals are now click-only for solid architecture
</script>
