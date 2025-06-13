<template>
  <v-group
    :config="{
      x: component.position.x,
      y: component.position.y,
      rotation: component.rotation,
      draggable: true,
    }"
    @click="handleClick"
    @dragstart="handleDragStart"
  >
    <!-- Resistor body (zigzag pattern) -->
    <v-line
      :config="{
        points: zigzagPoints,
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />

    <!-- Connection terminals -->
    <v-circle
      :config="{
        x: -30,
        y: 0,
        radius: 3,
        fill: '#666',
        stroke: '#333',
        strokeWidth: 1,
      }"
    />
    <v-circle
      :config="{
        x: 30,
        y: 0,
        radius: 3,
        fill: '#666',
        stroke: '#333',
        strokeWidth: 1,
      }"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -25,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- Resistance value -->
    <v-text
      :config="{
        x: -20,
        y: 15,
        text: `${component.resistance.value}${component.resistance.unit}`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Resistor } from '@/types/circuit'

interface Props {
  component: Resistor
}

interface Emits {
  (e: 'select'): void
  (e: 'dragstart'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Create zigzag pattern for resistor
const zigzagPoints = computed(() => {
  const points = []
  const width = 40
  const height = 8
  const segments = 6

  // Start point
  points.push(-30, 0)
  points.push(-width / 2, 0)

  // Zigzag pattern
  for (let i = 0; i < segments; i++) {
    const x = -width / 2 + (i + 0.5) * (width / segments)
    const y = i % 2 === 0 ? -height : height
    points.push(x, y)
  }

  // End point
  points.push(width / 2, 0)
  points.push(30, 0)

  return points
})

function handleClick() {
  emit('select')
}

function handleDragStart() {
  emit('dragstart')
}
</script>
