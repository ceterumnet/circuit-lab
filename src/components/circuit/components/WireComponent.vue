<template>
  <v-group>
    <!-- Hit area line -->
    <v-line
      :config="{
        points: wirePoints,
        stroke: 'rgba(0,0,0,0.01)',
        strokeWidth: 10,
        lineCap: 'round',
      }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />

    <!-- Visible wire line -->
    <v-line
      :config="{
        points: wirePoints,
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
        lineCap: 'round',
        listening: false, // Make this line non-interactive
      }"
    />

    <!-- Selection indicator -->
    <v-line
      v-if="component.selected"
      :config="{
        points: wirePoints,
        stroke: '#2196f3',
        strokeWidth: 6,
        opacity: 0.3,
        lineCap: 'round',
        listening: false, // Make this line non-interactive
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import type { KonvaEventObject } from 'konva/lib/Node'

interface Props {
  component: CircuitComponent
  startPosition?: Position
  endPosition?: Position
}

interface Emits {
  (e: 'select'): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const wirePoints = computed(() => {
  const componentProps = props.component.properties || {}

  // Use the provided positions if available, otherwise fall back to component's stored positions
  const start = props.startPosition || componentProps.startPosition || { x: 0, y: 0 }
  const end = props.endPosition || componentProps.endPosition || { x: 0, y: 0 }

  // Validate positions to prevent NaN values
  const validStart = {
    x: isNaN((start as Position).x) ? 0 : (start as Position).x,
    y: isNaN((start as Position).y) ? 0 : (start as Position).y,
  }
  const validEnd = {
    x: isNaN((end as Position).x) ? 0 : (end as Position).x,
    y: isNaN((end as Position).y) ? 0 : (end as Position).y,
  }

  // Simple straight line for now
  return [validStart.x, validStart.y, validEnd.x, validEnd.y]
})

function handleClick() {
  emit('select')
}

function handleDoubleClick() {
  emit('delete')
}

function handleMouseEnter(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
}

function handleMouseLeave(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
}
</script>
