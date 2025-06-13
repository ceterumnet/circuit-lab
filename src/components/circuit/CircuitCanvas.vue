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
            name: 'grid-background',
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
          @terminal-click="handleTerminalClick"
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
import { ComponentType } from '@/types/circuit'
import type { Resistor, VoltageSource, Ground, Position } from '@/types/circuit'

interface Props {
  selectedTool?: ComponentType | null
}

interface Emits {
  (e: 'component-placed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
  // Check if we clicked on the background (stage or grid elements)
  const isBackground =
    e.target === e.target.getStage() ||
    e.target.name() === 'grid-background' ||
    e.target.className === 'Rect' ||
    e.target.className === 'Line'

  // If clicking on background and a tool is selected, place component
  if (isBackground && props.selectedTool) {
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      // Snap to grid
      const snappedPos = {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      }
      addComponentAtPosition(props.selectedTool, snappedPos)
      emit('component-placed')
    }
  } else if (isBackground) {
    // If no tool selected and clicking on background, clear selection and cancel wiring
    circuitStore.clearSelection()
    circuitStore.cancelWiring()
  }
}

function addComponentAtPosition(type: ComponentType, position: { x: number; y: number }) {
  const id = circuitStore.generateComponentId(type)

  const baseComponent = {
    id,
    type,
    position,
    rotation: 0,
    selected: false,
  }

  let component

  switch (type) {
    case ComponentType.RESISTOR:
      component = {
        ...baseComponent,
        type: ComponentType.RESISTOR,
        resistance: { value: 1000, unit: 'Ω' },
        terminals: [`${id}_1`, `${id}_2`],
      } as Resistor
      break

    case ComponentType.VOLTAGE_SOURCE:
      component = {
        ...baseComponent,
        type: ComponentType.VOLTAGE_SOURCE,
        voltage: { value: 5, unit: 'V' },
        sourceType: 'dc' as const,
        terminals: [`${id}_pos`, `${id}_neg`],
      } as VoltageSource
      break

    case ComponentType.GROUND:
      component = {
        ...baseComponent,
        type: ComponentType.GROUND,
        terminal: `${id}_gnd`,
      } as Ground
      break

    default:
      return
  }

  circuitStore.addComponent(component)
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

function handleTerminalClick(terminalId: string, componentId: string, position: Position) {
  // Calculate world position (component position + terminal offset)
  const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)
  if (component) {
    const worldPosition = {
      x: component.position.x + position.x,
      y: component.position.y + position.y,
    }

    circuitStore.selectTerminal(terminalId, componentId, worldPosition)
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
