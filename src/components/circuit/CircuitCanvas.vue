<template>
  <div class="circuit-canvas-container" @contextmenu.prevent>
    <v-stage
      ref="stage"
      :config="stageConfig"
      @mousedown="handleStageClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @contextmenu="handleContextMenu"
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
          @node-connect="handleNodeConnect"
          @wire-delete="handleWireDelete"
        />

        <!-- Wire creation preview -->
        <v-line
          v-if="
            circuitStore.wireCreationState.isActive &&
            circuitStore.wireCreationState.startTerminal &&
            circuitStore.wireCreationState.previewPosition
          "
          :config="{
            points: [
              circuitStore.wireCreationState.startTerminal.position.x,
              circuitStore.wireCreationState.startTerminal.position.y,
              circuitStore.wireCreationState.previewPosition.x,
              circuitStore.wireCreationState.previewPosition.y,
            ],
            stroke: '#007bff',
            strokeWidth: 2,
            dash: [5, 5],
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Resistor, VoltageSource, Ground, CircuitNode } from '@/types/components'
import { InteractionMode } from '@/types/components'

interface Emits {
  (e: 'component-placed'): void
}

const emit = defineEmits<Emits>()

// Stage configuration
const stageConfig = ref({
  width: 800,
  height: 600,
})

const gridSize = 30

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

  const pos = e.target.getStage()?.getPointerPosition()
  if (pos) {
    const snappedPos = {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    }

    // Handle different interaction modes
    switch (circuitStore.currentMode) {
      case InteractionMode.PLACE_COMPONENT:
        if (isBackground && circuitStore.modeData?.componentType) {
          const componentType = circuitStore.modeData.componentType as string
          addComponentAtPosition(componentType, snappedPos)
          emit('component-placed')
        }
        break

      case InteractionMode.WIRE:
        if (isBackground && circuitStore.wireCreationState.isActive) {
          // Create node and finish wire
          circuitStore.finishWireCreationToPosition(snappedPos)
        }
        break

      case InteractionMode.SELECT_MOVE:
      default:
        if (isBackground) {
          // Clear selection and cancel any active operations
          circuitStore.clearSelection()
          circuitStore.cancelWiring()
        }
        break
    }
  }
}

function addComponentAtPosition(type: string, position: { x: number; y: number }) {
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
    case 'resistor':
      component = {
        ...baseComponent,
        type: 'resistor',
        resistance: { value: 1000, unit: 'Ω' },
        terminals: [`${id}_1`, `${id}_2`],
      } as Resistor
      break

    case 'voltage_source':
      component = {
        ...baseComponent,
        type: 'voltage_source',
        voltage: { value: 5, unit: 'V' },
        sourceType: 'dc' as const,
        terminals: [`${id}_pos`, `${id}_neg`],
      } as VoltageSource
      break

    case 'ground':
      component = {
        ...baseComponent,
        type: 'ground',
        terminal: `${id}_gnd`,
      } as Ground
      break

    case 'node':
      component = {
        ...baseComponent,
        type: 'node',
        terminal: `${id}_terminal`,
      } as CircuitNode
      break

    default:
      return
  }

  circuitStore.addComponent(component)
}

function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
  const pos = e.target.getStage()?.getPointerPosition()
  if (pos) {
    if (isDragging.value && dragTarget.value) {
      // Handle component dragging
      const snappedPos = {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      }
      circuitStore.moveComponent(dragTarget.value, snappedPos)
    } else if (circuitStore.wireCreationState.isActive) {
      // Handle wire preview during creation
      circuitStore.updateWirePreview(pos)
    }
  }
}

function handleMouseUp() {
  isDragging.value = false
  dragTarget.value = null
}

function handleContextMenu(e: Event) {
  // Prevent browser's default right-click context menu
  e.preventDefault()
}

function handleComponentSelect(componentId: string) {
  // Handle component selection based on current mode
  switch (circuitStore.currentMode) {
    case InteractionMode.DELETE:
      // Delete component immediately in delete mode
      circuitStore.removeComponent(componentId)
      break

    case InteractionMode.ROTATE:
      // Rotate component in rotate mode
      const component = circuitStore.currentCircuit.components.find(c => c.id === componentId)
      if (component) {
        circuitStore.updateComponent(componentId, { rotation: (component.rotation + 90) % 360 })
      }
      break

    case InteractionMode.SELECT_MOVE:
    default:
      // Select component in select mode
      circuitStore.selectComponent(componentId)
      break
  }
}

function handleComponentMove(componentId: string, startDrag: boolean) {
  if (startDrag) {
    isDragging.value = true
    dragTarget.value = componentId
  }
}

function handleTerminalClick(terminalId: string, componentId: string) {
  // Only handle terminal clicks in wire mode
  if (circuitStore.currentMode === InteractionMode.WIRE) {
    if (circuitStore.wireCreationState.isActive) {
      // Second click - finish wire creation
      circuitStore.finishWireCreation(terminalId, componentId)
    } else {
      // First click - start wire creation
      circuitStore.startWireCreation(terminalId, componentId)
    }
  }
}

function handleNodeConnect(nodeId: string) {
  // Handle connections to nodes (for existing wires connecting to nodes)
  if (circuitStore.wireCreationState.isActive) {
    circuitStore.finishWireCreationToNode(nodeId)
  }
}

function handleWireDelete(wireId: string) {
  circuitStore.deleteWire(wireId)
}

// Keyboard event handler
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    circuitStore.deleteSelectedComponent()
  } else if (e.key === 'Escape') {
    circuitStore.cancelWiring()
    circuitStore.clearSelection()
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

  // Add keyboard event listeners
  document.addEventListener('keydown', handleKeyDown)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.circuit-canvas-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 1px solid #ddd;
  overflow: hidden;
  background-color: #fafafa;
}
</style>
