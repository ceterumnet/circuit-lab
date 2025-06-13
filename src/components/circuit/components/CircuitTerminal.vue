<template>
  <v-circle
    :config="{
      x: position.x,
      y: position.y,
      radius: isHovered ? 5 : 3,
      fill: isHovered ? '#007bff' : '#666',
      stroke: isSelected ? '#ff0000' : '#333',
      strokeWidth: isSelected ? 2 : 1,
    }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Position } from '@/types/circuit'
import type { KonvaEventObject } from 'konva/lib/Node'

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

const isHovered = ref(false)

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
</script>
