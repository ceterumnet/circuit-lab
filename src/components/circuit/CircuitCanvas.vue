<template>
  <div class="circuit-canvas-container">
    <v-stage
      ref="stage"
      :config="stageConfig"
      @mousedown="handleStageClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <v-layer ref="mainLayer">
        <!-- Grid background -->
        <v-rect
          :config="{
            x: 0,
            y: 0,
            width: stageConfig.width,
            height: stageConfig.height,
            fill: '#fafafa',
            stroke: '#e0e0e0',
            strokeWidth: 1,
          }"
        />

        <!-- Grid lines -->
        <v-line
          v-for="x in gridLinesX"
          :key="`grid-x-${x}`"
          :config="{
            points: [x, 0, x, stageConfig.height],
            stroke: '#f0f0f0',
            strokeWidth: 1,
          }"
        />
        <v-line
          v-for="y in gridLinesY"
          :key="`grid-y-${y}`"
          :config="{
            points: [0, y, stageConfig.width, y],
            stroke: '#f0f0f0',
            strokeWidth: 1,
          }"
        />

        <!-- Circuit components -->
        <circuit-component
          v-for="component in circuitStore.currentCircuit.components"
          :key="component.id"
          :component="component"
          @select="handleComponentSelect"
          @move="handleComponentMove"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
import type { KonvaEventObject } from 'konva/lib/Node'

// Stage configuration
const stageConfig = ref({
  width: 800,
  height: 600,
})

const gridSize = 20

// Grid lines for visual reference
const gridLinesX = computed(() => {
  const lines = []
  for (let i = 0; i <= stageConfig.value.width; i += gridSize) {
    lines.push(i)
  }
  return lines
})

const gridLinesY = computed(() => {
  const lines = []
  for (let i = 0; i <= stageConfig.value.height; i += gridSize) {
    lines.push(i)
  }
  return lines
})

// Store
const circuitStore = useCircuitStore()

// Refs
const stage = ref()
const mainLayer = ref()

// Mouse interaction state
const isDragging = ref(false)
const dragTarget = ref<string | null>(null)

// Event handlers
function handleStageClick(e: KonvaEventObject<MouseEvent>) {
  // If clicking on empty space, clear selection
  if (e.target === e.target.getStage()) {
    circuitStore.clearSelection()
  }
}

function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
  if (isDragging.value && dragTarget.value) {
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      // Snap to grid
      const snappedPos = {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      }
      circuitStore.moveComponent(dragTarget.value, snappedPos)
    }
  }
}

function handleMouseUp() {
  isDragging.value = false
  dragTarget.value = null
}

function handleComponentSelect(componentId: string) {
  circuitStore.selectComponent(componentId)
}

function handleComponentMove(componentId: string, startDrag: boolean) {
  if (startDrag) {
    isDragging.value = true
    dragTarget.value = componentId
  }
}

// Resize canvas to fit container
onMounted(() => {
  const container = document.querySelector('.circuit-canvas-container')
  if (container) {
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      stageConfig.value.width = width
      stageConfig.value.height = height
    })
    resizeObserver.observe(container)
  }
})
</script>

<style scoped>
.circuit-canvas-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
}
</style>
