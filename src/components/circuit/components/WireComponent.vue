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
import type { Wire } from '@/types/circuit'

interface Props {
  component: Wire
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
}

interface Emits {
  (e: 'select'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const wirePoints = computed(() => {
  const start = props.startPosition
  const end = props.endPosition

  // Simple straight line for now
  return [start.x, start.y, end.x, end.y]
})

function handleClick() {
  emit('select')
}
</script>
