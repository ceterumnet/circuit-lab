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
  (e: 'terminal-click', terminalId: string, componentId: string, position: Position): void
  (e: 'terminal-hover', terminalId: string, componentId: string, isHovered: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const interactionStore = useInteractionStore()

const isSelected = computed(() => interactionStore.selectedComponentIds.includes(props.componentId))

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

function handleClick(e: KonvaEventObject<MouseEvent>) {
  console.log(
    `[CircuitTerminal] handleClick fired for component: ${props.componentId}, terminal: ${props.terminalId}`,
  )
  // Prevent component selection by stopping the event from bubbling to the parent group.
  e.cancelBubble = true
  emit('terminal-click', props.terminalId, props.componentId, props.position)
}

function handleMouseEnter() {
  console.log(
    `[CircuitTerminal] handleMouseEnter fired for ${props.componentId} -> ${props.terminalId}`,
  )
  isHovered.value = true
  emit('terminal-hover', props.terminalId, props.componentId, true)
}

function handleMouseLeave() {
  console.log(
    `[CircuitTerminal] handleMouseLeave fired for ${props.componentId} -> ${props.terminalId}`,
  )
  isHovered.value = false
  emit('terminal-hover', props.terminalId, props.componentId, false)
}
</script>
