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
    <!-- Ground symbol -->
    <!-- Vertical line -->
    <v-line
      :config="{
        points: [0, -15, 0, 15],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Horizontal lines (decreasing size) -->
    <v-line
      :config="{
        points: [-15, 15, 15, 15],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />
    <v-line
      :config="{
        points: [-10, 20, 10, 20],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />
    <v-line
      :config="{
        points: [-5, 25, 5, 25],
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Connection terminal -->
    <v-circle
      :config="{
        x: 0,
        y: -15,
        radius: 3,
        fill: '#666',
        stroke: '#333',
        strokeWidth: 1,
      }"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: 10,
        y: -5,
        text: component.label || 'GND',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { Ground } from '@/types/circuit'

interface Props {
  component: Ground
}

interface Emits {
  (e: 'select'): void
  (e: 'dragstart'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick() {
  emit('select')
}

function handleDragStart() {
  emit('dragstart')
}
</script>
