<template>
  <v-group>
    <!-- Wire line -->
    <v-line
      :config="{
        points: wirePoints,
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
        lineCap: 'round',
      }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
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
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Wire, Position } from '@/types/circuit'

interface Props {
  component: Wire
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
  // Use the provided positions if available, otherwise fall back to component's stored positions
  const start = props.startPosition || props.component.startPosition || { x: 0, y: 0 }
  const end = props.endPosition || props.component.endPosition || { x: 0, y: 0 }

  // Validate positions to prevent NaN values
  const validStart = {
    x: isNaN(start.x) ? 0 : start.x,
    y: isNaN(start.y) ? 0 : start.y,
  }
  const validEnd = {
    x: isNaN(end.x) ? 0 : end.x,
    y: isNaN(end.y) ? 0 : end.y,
  }

  console.log('🔗 WireComponent rendering:', {
    wireId: props.component.id,
    startPos: validStart,
    endPos: validEnd,
    hasStartTerminal: !!props.component.startTerminal,
    hasEndTerminal: !!props.component.endTerminal,
    points: [validStart.x, validStart.y, validEnd.x, validEnd.y],
  })

  // Simple straight line for now
  return [validStart.x, validStart.y, validEnd.x, validEnd.y]
})

function handleClick() {
  emit('select')
}

function handleDoubleClick() {
  emit('delete')
}
</script>
