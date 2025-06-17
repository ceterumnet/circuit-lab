<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import * as componentFactory from '@/services/componentFactory'
import { findTerminalAtPosition } from '@/services/geometry'
import { screenToWorld } from '@/services/coordinates'

// Stage configuration
const stageConfig = ref({
  width: 800,
  height: 600,
  draggable: false,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
})

const gridSize = 30

// Grid lines for visual reference
const gridLinesX = computed(() => {
  const lines = []
  const { scale, position } = interactionStore.canvasTransform
  const { width } = stageConfig.value

  const startX = Math.floor(-position.x / scale / gridSize) * gridSize
  const endX = startX + Math.ceil(width / scale / gridSize) * gridSize

  for (let i = startX; i <= endX; i += gridSize) {
    lines.push(i)
  }
  return lines
})

const gridLinesY = computed(() => {
  const lines = []
  const { scale, position } = interactionStore.canvasTransform
  const { height } = stageConfig.value

  const startY = Math.floor(-position.y / scale / gridSize) * gridSize
  const endY = startY + Math.ceil(height / scale / gridSize) * gridSize

  for (let i = startY; i <= endY; i += gridSize) {
    lines.push(i)
  }
  return lines
})

// Store
const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()

// Computed properties for rendering order
const wires = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type === 'wire')
)
const otherComponents = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type !== 'wire')
)

// Computed property for placement cursor
const placementCursor = computed(() => {
  return interactionStore.componentToPlace ? 'crosshair' : 'default'
})

// Refs
const stageRef = ref()
const resizeObserver = ref<ResizeObserver | null>(null)

// Mouse interaction state
const isDragging = ref(false)
const dragTarget = ref<string | null>(null)
const isPanning = ref(false)

// Event handlers
function handleStageWheel(e: KonvaEventObject<WheelEvent>) {
  e.evt.preventDefault()

  const stage = e.target.getStage()
  if (!stage) return

  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()
  if (!pointer) return

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }

  const newScale = oldScale * (e.evt.deltaY > 0 ? 0.95 : 1.05)

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  }

  interactionStore.setCanvasTransform(newScale, newPos)
}

function handleStageClick(e: KonvaEventObject<MouseEvent>) {
  // Prevent component placement/deselection when finishing a pan
  if (isPanning.value || e.evt.button === 1) {
    return
  }

  // Check if we clicked on the background (stage or grid elements)
  const isBackground =
    e.target === e.target.getStage() ||
    e.target.name() === 'grid-background' ||
    e.target.className === 'Rect' ||
    e.target.className === 'Line'

  if (isBackground) {
    // If a wire is being drawn, a click on the background should finish it.
    if (interactionStore.wireCreationState.isActive) {
      const stage = e.target.getStage()
      if (stage) {
        const pos = stage.getPointerPosition()
        if (pos) {
          const worldPos = screenToWorld(pos)
          interactionStore.finishWireCreationToPosition(worldPos)
        }
      }
      // Prevent other click logic from running
      return
    }

    const componentToPlace = interactionStore.componentToPlace
    if (componentToPlace) {
      const stage = e.target.getStage()
      if (stage) {
        const pos = stage.getPointerPosition()
        if (pos) {
          const worldPos = screenToWorld(pos)

          const snappedPos = {
            x: Math.round(worldPos.x / gridSize) * gridSize,
            y: Math.round(worldPos.y / gridSize) * gridSize,
          }
          const newComponent = componentFactory.createComponent(
            circuitStore.currentCircuit,
            componentToPlace,
            snappedPos,
          )
          if (newComponent) {
            circuitStore.addComponent(newComponent)
          }
          // Deactivate placement mode after placing a component
          interactionStore.setComponentToPlace(null)
        }
      }
    } else {
      // Clear selection and cancel any active operations
      interactionStore.clearSelection()
      interactionStore.cancelWireCreation()
    }
  }
}

function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (!stage) return

  const pos = stage.getPointerPosition()
  if (pos) {
    const worldPos = screenToWorld(pos)
    if (isDragging.value && dragTarget.value) {
      // Handle component dragging
      const snappedPos = {
        x: Math.round(worldPos.x / gridSize) * gridSize,
        y: Math.round(worldPos.y / gridSize) * gridSize,
      }
      circuitStore.moveComponent(dragTarget.value, snappedPos)
    } else if (interactionStore.wireCreationState.isActive) {
      // Handle wire preview during creation
      interactionStore.updateWirePreview(worldPos)
    }
  }
}

function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
  if (isDragging.value) {
    isDragging.value = false
    dragTarget.value = null
  } else if (interactionStore.wireCreationState.isActive) {
    const stage = e.target.getStage()
    if (stage) {
      const pos = stage.getPointerPosition()
      if (pos) {
        const worldPos = screenToWorld(pos)
        const terminal = findTerminalAtPosition(
          circuitStore.currentCircuit,
          worldPos,
        )
        if (!terminal) {
          interactionStore.finishWireCreationToPosition(worldPos)
        }
      }
    }
  }
}

function handleComponentSelect(componentId: string) {
  interactionStore.selectComponent(componentId)
}

function handleComponentMoveStart(componentId: string) {
  // If a drag starts on a component that just initiated a wire draw,
  // cancel the wire draw. The user's intent is to move the component.
  if (
    interactionStore.wireCreationState.isActive &&
    interactionStore.wireCreationState.startTerminal?.componentId === componentId
  ) {
    interactionStore.cancelWireCreation()
  }

  isDragging.value = true
  dragTarget.value = componentId
}

function handleComponentMove(componentId: string, position: { x: number; y: number }) {
  if (isDragging.value) {
    circuitStore.moveComponent(componentId, position)
  }
}

function handleComponentMoveEnd(componentId: string, position: { x: number; y: number }) {
  if (isDragging.value) {
    const snappedPos = {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    }
    circuitStore.moveComponent(componentId, snappedPos)
    isDragging.value = false
    dragTarget.value = null
  }
}

function handleTerminalMouseDown(terminalId: string, componentId: string) {
  if (interactionStore.wireCreationState.isActive) {
    // If a wire is being created, this mousedown finishes it.
    interactionStore.finishWireCreation(terminalId, componentId);
  } else {
    // Otherwise, this mousedown starts a new wire.
    interactionStore.startWireCreation(terminalId, componentId);
  }
}

function handleNodeConnect(nodeId: string) {
  // Handle connections to nodes (for existing wires connecting to nodes)
  if (interactionStore.wireCreationState.isActive) {
    interactionStore.finishWireCreationToNode(nodeId)
  }
}

function handleContextMenu() {
  // Cancel current action on right click
  interactionStore.cancelWireCreation()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    circuitStore.deleteSelectedComponent()
  } else if (e.key === 'Escape') {
    interactionStore.cancelWireCreation()
    interactionStore.clearSelection()
  } else if (e.code === 'Space') {
    e.preventDefault()
    if (!isPanning.value) {
      isPanning.value = true
      stageConfig.value.draggable = true
      const container = document.querySelector('.circuit-canvas-container')
      if (container) (container as HTMLElement).style.cursor = 'grab'
    }
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (isPanning.value) {
      isPanning.value = false
      stageConfig.value.draggable = false
      const container = document.querySelector('.circuit-canvas-container')
      if (container) {
        container.classList.remove('grabbing')
        ;(container as HTMLElement).style.cursor = placementCursor.value
      }
    }
  }
}

function handleStageDragMove(e: KonvaEventObject<DragEvent>) {
  if (isPanning.value) {
    const stage = e.target.getStage()
    if (stage) {
      interactionStore.setCanvasTransform(stage.scaleX(), stage.position())
    }
  }
}

onMounted(() => {
  const container = document.querySelector('.circuit-canvas-container')
  if (container) {
    const updateSize = () => {
      stageConfig.value.width = container.clientWidth
      stageConfig.value.height = container.clientHeight
    }

    resizeObserver.value = new ResizeObserver(updateSize)
    resizeObserver.value.observe(container)

    updateSize() // Initial size set
  }
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})

watch(
  () => interactionStore.selectedComponentId,
  (newId, oldId) => {
    if (oldId) {
      circuitStore.updateComponent(oldId, { selected: false })
    }
    if (newId) {
      circuitStore.updateComponent(newId, { selected: true })
    }
  },
)

watch(
  () => interactionStore.canvasTransform,
  (newTransform) => {
    stageConfig.value.scaleX = newTransform.scale
    stageConfig.value.scaleY = newTransform.scale
    stageConfig.value.x = newTransform.position.x
    stageConfig.value.y = newTransform.position.y
  },
  { deep: true }
)
</script>

<template>
  <div
    class="circuit-canvas-container"
    :class="{ grabbing: isPanning }"
    :style="{ cursor: placementCursor }"
    @contextmenu.prevent
  >
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleStageClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @contextmenu="handleContextMenu"
      @wheel="handleStageWheel"
      @dragmove="handleStageDragMove"
    >
      <v-layer>
        <!-- Grid background -->
        <v-rect
          :config="{
            name: 'grid-background',
            x: gridLinesX[0] - gridSize,
            y: gridLinesY[0] - gridSize,
            width:
              gridLinesX[gridLinesX.length - 1] - gridLinesX[0] + gridSize * 2,
            height:
              gridLinesY[gridLinesY.length - 1] - gridLinesY[0] + gridSize * 2,
            fill: '#fafafa',
          }"
        />

        <!-- Grid lines -->
        <v-line
          v-for="x in gridLinesX"
          :key="`grid-x-${x}`"
          :config="{
            points: [x, gridLinesY[0] - gridSize, x, gridLinesY[gridLinesY.length - 1] + gridSize],
            stroke: '#e0e0e0',
            strokeWidth: 1,
          }"
        />
        <v-line
          v-for="y in gridLinesY"
          :key="`grid-y-${y}`"
          :config="{
            points: [gridLinesX[0] - gridSize, y, gridLinesX[gridLinesX.length - 1] + gridSize, y],
            stroke: '#e0e0e0',
            strokeWidth: 1,
          }"
        />

        <!-- Wires (rendered first, so they are in the background) -->
        <circuit-component
          v-for="component in wires"
          :key="component.id"
          :component="component"
          @select="handleComponentSelect"
          @move-start="handleComponentMoveStart"
          @move="handleComponentMove"
          @move-end="handleComponentMoveEnd"
          @terminal-mousedown="handleTerminalMouseDown"
          @node-connect="handleNodeConnect"
        />

        <!-- Other components (rendered on top of wires) -->
        <circuit-component
          v-for="component in otherComponents"
          :key="component.id"
          :component="component"
          @select="handleComponentSelect"
          @move-start="handleComponentMoveStart"
          @move="handleComponentMove"
          @move-end="handleComponentMoveEnd"
          @terminal-mousedown="handleTerminalMouseDown"
          @node-connect="handleNodeConnect"
        />

        <!-- Wire creation preview -->
        <v-line
          v-if="
            interactionStore.wireCreationState.isActive &&
            interactionStore.wireCreationState.startTerminal &&
            interactionStore.wireCreationState.previewPosition
          "
          :config="{
            points: [
              interactionStore.wireCreationState.startTerminal.position.x,
              interactionStore.wireCreationState.startTerminal.position.y,
              interactionStore.wireCreationState.previewPosition.x,
              interactionStore.wireCreationState.previewPosition.y,
            ],
            stroke: '#007bff',
            strokeWidth: 2,
            dash: [5, 5],
            listening: false,
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.circuit-canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #fafafa;
}

.circuit-canvas-container.grabbing {
  cursor: grabbing !important;
}
</style>
