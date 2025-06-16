<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      draggable: true,
    }"
    @dragstart="handleClick"
    @dragmove="(e: KonvaEventObject<DragEvent>) => emit('drag', e)"
    @dragend="(e: KonvaEventObject<DragEvent>) => emit('dragend', e)"
    @click="handleClick"
    @mouseenter="() => emit('mouseenter')"
    @mouseleave="() => emit('mouseleave')"
    @mousedown="handleMouseDown"
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
import type { CircuitNode } from '@/types/components'
import { useInteractionStore } from '@/stores/interaction'
import { computed } from 'vue'
import type { KonvaEventObject } from 'konva/lib/Node'

const props = defineProps<{
  component: CircuitNode
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'drag', event: KonvaEventObject<DragEvent>): void
  (e: 'dragend', event: KonvaEventObject<DragEvent>): void
  (e: 'mouseenter'): void
  (e: 'mouseleave'): void
  (e: 'mousedown', event: KonvaEventObject<MouseEvent>): void
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
  emit('select', props.component.id)
}

function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
  emit('mousedown', event)
}
</script>
