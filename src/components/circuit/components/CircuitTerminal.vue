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
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const circuitStore = useCircuitStore()

const isHovered = ref(false)

// Check if this terminal can accept a wire connection
const isValidDropTarget = computed(() => {
  const wireState = circuitStore.wireCreationState
  return (
    wireState.isActive &&
    wireState.startTerminal &&
    wireState.startTerminal.terminalId !== props.terminalId &&
    wireState.startTerminal.componentId !== props.componentId
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

// Drag functionality removed - terminals are now click-only for solid architecture
</script>
