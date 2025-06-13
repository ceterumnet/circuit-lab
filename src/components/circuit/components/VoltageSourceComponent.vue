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
    <!-- Voltage source body (circle) -->
    <v-circle
      :config="{
        x: 0,
        y: 0,
        radius: 20,
        fill: 'white',
        stroke: component.selected ? '#2196f3' : '#333',
        strokeWidth: component.selected ? 3 : 2,
      }"
    />

    <!-- Plus symbol -->
    <v-line
      :config="{
        points: [-8, -8, 8, -8],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />
    <v-line
      :config="{
        points: [0, -12, 0, -4],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />

    <!-- Minus symbol -->
    <v-line
      :config="{
        points: [-8, 8, 8, 8],
        stroke: '#333',
        strokeWidth: 2,
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

    <!-- Connection lines -->
    <v-line
      :config="{
        points: [-30, 0, -20, 0],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />
    <v-line
      :config="{
        points: [20, 0, 30, 0],
        stroke: '#333',
        strokeWidth: 2,
      }"
    />

    <!-- Component label -->
    <v-text
      :config="{
        x: -20,
        y: -40,
        text: component.label || component.id,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
      }"
    />

    <!-- Voltage value -->
    <v-text
      :config="{
        x: -20,
        y: 30,
        text: `${component.voltage.value}${component.voltage.unit}`,
        fontSize: 10,
        fontFamily: 'Arial',
        fill: '#666',
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import type { VoltageSource } from '@/types/circuit'

interface Props {
  component: VoltageSource
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
