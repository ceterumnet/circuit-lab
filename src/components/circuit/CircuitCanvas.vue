<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
import ProbeComponent from '@/components/circuit/probes/ProbeComponent.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import * as componentFactory from '@/services/componentFactory'
import { screenToWorld } from '@/services/coordinates'
import type { CircuitComponent as CircuitComponentType } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

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

const gridSize = 5
const majorGridSize = 30

// Grid lines for visual reference
const gridLinesX = computed(() => {
  const lines = []
  const { scale, position } = interactionStore.canvasTransform
  const { width } = stageConfig.value

  const startX = Math.floor(-position.x / scale / majorGridSize) * majorGridSize
  const endX = startX + (Math.ceil(width / scale / majorGridSize) + 1) * majorGridSize

  for (let i = startX; i <= endX; i += majorGridSize) {
    lines.push(i)
  }
  return lines
})

const gridLinesY = computed(() => {
  const lines = []
  const { scale, position } = interactionStore.canvasTransform
  const { height } = stageConfig.value

  const startY = Math.floor(-position.y / scale / majorGridSize) * majorGridSize
  const endY = startY + (Math.ceil(height / scale / majorGridSize) + 1) * majorGridSize

  for (let i = startY; i <= endY; i += majorGridSize) {
    lines.push(i)
  }
  return lines
})

// Store
const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()

// Computed properties for rendering order
const wires = computed(() =>
  circuitStore.currentCircuit.components.filter((c) => c.type === 'wire'),
)
const nodes = computed(() =>
  circuitStore.currentCircuit.components.filter((c) => c.type === 'node'),
)
const otherComponents = computed(() =>
  circuitStore.currentCircuit.components.filter((c) => c.type !== 'wire' && c.type !== 'node'),
)
const probes = computed(() => circuitStore.currentCircuit.probes);

// Computed property for placement cursor
const placementCursor = computed(() => {
  return interactionStore.componentToPlace ? 'crosshair' : 'default'
})

// Refs
const stageRef = ref()
const containerRef = ref<HTMLElement | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

// Mouse interaction state
const dragTarget = ref<string | null>(null)
const isPanning = ref(false)
const dragStartPointerPosition = ref({ x: 0, y: 0 })
const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())
const selectionBox = ref({
  visible: false,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
})

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

function handleStageMouseDown(e: KonvaEventObject<MouseEvent>) {
  // Prevent component placement/deselection when finishing a pan or middle clicking
  if (isPanning.value || e.evt.button === 1) {
    return
  }

  const stage = e.target.getStage()
  if (!stage) return

  // Check if we clicked on the background
  const isBackground = e.target === stage || e.target.name() === 'grid-background'
  if (isBackground) {
    const pos = screenToWorld(stage.getPointerPosition()!)
    selectionBox.value = {
      visible: true,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
    }

    if (!e.evt.shiftKey) {
      interactionStore.clearSelection()
    }
  }
}

function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (!stage) return

  // Update selection box
  if (selectionBox.value.visible) {
    const pos = screenToWorld(stage.getPointerPosition()!)
    selectionBox.value.x2 = pos.x
    selectionBox.value.y2 = pos.y
    return // Don't process other mouse move logic during marquee
  }

  // Handle wire preview during creation
  if (interactionStore.wireCreationState.isActive) {
    const pos = stage.getPointerPosition()
    if (pos) {
      const worldPos = screenToWorld(pos)
      interactionStore.updateWirePreview(worldPos)
    }
  }
}

function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (!stage) return

  // Marquee selection logic
  if (selectionBox.value.visible) {
    // If the box is small, treat it as a click on the background
    const isClick =
      Math.abs(selectionBox.value.x1 - selectionBox.value.x2) < 5 &&
      Math.abs(selectionBox.value.y1 - selectionBox.value.y2) < 5

    selectionBox.value.visible = false // Hide the box immediately

    if (isClick) {
      // Background click logic (place component or finish wire)
      if (interactionStore.wireCreationState.isActive) {
        const worldPos = screenToWorld(stage.getPointerPosition()!)
        const snappedPos = {
          x: Math.round(worldPos.x / gridSize) * gridSize,
          y: Math.round(worldPos.y / gridSize) * gridSize,
        }
        interactionStore.finishWireCreationToPosition(snappedPos)
      } else if (interactionStore.componentToPlace) {
        const worldPos = screenToWorld(stage.getPointerPosition()!)
        const snappedPos = {
          x: Math.round(worldPos.x / gridSize) * gridSize,
          y: Math.round(worldPos.y / gridSize) * gridSize,
        }
        const newComponent = componentFactory.createComponent(
          circuitStore.currentCircuit,
          interactionStore.componentToPlace,
          snappedPos,
        )
        if (newComponent) {
          circuitStore.addComponent(newComponent)
        }
        interactionStore.setComponentToPlace(null)
      } else if (!e.evt.shiftKey) {
        // Only clear selection on a background click if shift isn't held
        interactionStore.clearSelection()
        interactionStore.cancelWireCreation()
      }
    } else {
      // Marquee selection
      const box = selectionBox.value
      const x1 = Math.min(box.x1, box.x2)
      const y1 = Math.min(box.y1, box.y2)
      const x2 = Math.max(box.x1, box.x2)
      const y2 = Math.max(box.y1, box.y2)

      circuitStore.currentCircuit.components.forEach((component) => {
        if (component.type === 'wire') return // Wires can't be marquee selected for now

        const { x, y } = component.position
        if (x > x1 && x < x2 && y > y1 && y < y2) {
          interactionStore.addToSelection(component.id)
        }
      })
    }
  }

  // Dragging logic
  // This logic is now handled exclusively by handleComponentMoveEnd to avoid race conditions
  // if (interactionStore.isDraggingComponent) {
  //   interactionStore.setDraggingComponent(false)
  //   dragTarget.value = null
  //   dragStartPositions.value.clear()
  // }
}

function handleComponentSelect(componentId: string, e: KonvaEventObject<MouseEvent>) {
  // If a wire is being created, a click on a component body should do nothing.
  if (interactionStore.wireCreationState.isActive) {
    return
  }
  interactionStore.selectComponent(componentId, e.evt.shiftKey)
}

function handleComponentMoveStart(componentId: string, e: KonvaEventObject<MouseEvent>) {
  // If a drag starts on a component that just initiated a wire draw,
  // cancel the wire draw. The user's intent is to move the component.
  if (
    interactionStore.wireCreationState.isActive &&
    interactionStore.wireCreationState.startTerminal?.componentId === componentId
  ) {
    interactionStore.cancelWireCreation()
  }

  interactionStore.setDraggingComponent(true)
  dragTarget.value = componentId

  const stage = e.target.getStage()
  if (!stage) return
  dragStartPointerPosition.value = screenToWorld(stage.getPointerPosition()!)

  const isCurrentlySelected = interactionStore.selectedComponentIds.includes(componentId)

  // If the dragged component is not part of the current selection,
  // it becomes the only selected item.
  if (!isCurrentlySelected) {
    interactionStore.selectComponent(componentId, false)
  }

  // Use nextTick to ensure the selection state is updated before we read it
  nextTick(() => {
    const idsToDrag = interactionStore.selectedComponentIds

    // Store initial positions of all selected components
    dragStartPositions.value.clear()
    idsToDrag.forEach((id) => {
      const component = circuitStore.currentCircuit.components.find((c) => c.id === id)
      if (component && component.type !== 'wire') {
        dragStartPositions.value.set(id, { ...component.position })
      }
    })
    console.log(
      '[CircuitCanvas] dragStartPositions populated in nextTick:',
      JSON.stringify(Array.from(dragStartPositions.value.entries())),
    )
  })
}

function handleComponentMove(componentId: string, position: { x: number; y: number }) {
  const startPos = dragStartPositions.value.get(componentId)
  if (!startPos) return

  const dx = position.x - startPos.x
  const dy = position.y - startPos.y

  interactionStore.selectedComponentIds.forEach((id) => {
    const otherStartPos = dragStartPositions.value.get(id)
    if (otherStartPos) {
      const newPos = {
        x: otherStartPos.x + dx,
        y: otherStartPos.y + dy,
      }
      circuitStore.moveComponent(id, newPos)
    }
  })
}

function handleComponentMoveEnd(componentId: string, position: { x: number; y: number }) {
  console.log(`[CircuitCanvas] handleComponentMoveEnd for ${componentId} received:`, position)

  // Log the state AT THE MOMENT THE FUNCTION IS CALLED
  console.log(
    '[CircuitCanvas] Current selected IDs:',
    JSON.stringify(interactionStore.selectedComponentIds),
  )
  console.log(
    '[CircuitCanvas] Current dragStartPositions:',
    JSON.stringify(Array.from(dragStartPositions.value.entries())),
  )

  const startPos = dragStartPositions.value.get(componentId)
  if (!startPos) {
    console.error(
      `[CircuitCanvas] Could not find start position for ${componentId}. Snapping will fail.`,
    )
    return
  }

  const dx = position.x - startPos.x
  const dy = position.y - startPos.y

  if (interactionStore.selectedComponentIds.length === 0) {
    console.warn(
      '[CircuitCanvas] selectedComponentIds is empty. Snapping only the dragged component.',
    )
    // Fallback for when selection is lost, snap only the dragged component
    const snappedPos = {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    }
    console.log(`[CircuitCanvas] Fallback Snapped position for ${componentId}:`, snappedPos)
    circuitStore.moveComponent(componentId, snappedPos)
  } else {
    interactionStore.selectedComponentIds.forEach((id) => {
      const otherStartPos = dragStartPositions.value.get(id)
      if (otherStartPos) {
        const newPos = {
          x: otherStartPos.x + dx,
          y: otherStartPos.y + dy,
        }
        const snappedPos = {
          x: Math.round(newPos.x / gridSize) * gridSize,
          y: Math.round(newPos.y / gridSize) * gridSize,
        }
        console.log(`[CircuitCanvas] Snapped position for ${id}:`, snappedPos)
        circuitStore.moveComponent(id, snappedPos)
      } else {
        console.error(`[CircuitCanvas] Could not find start position for selected component ${id}.`)
      }
    })
  }

  interactionStore.setDraggingComponent(false)
  dragStartPositions.value.clear()
  console.log('[CircuitCanvas] isDraggingComponent set to false')
}

function handleContextMenu() {
  // Cancel current action on right click
  interactionStore.cancelWireCreation()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (interactionStore.wireCreationState.isActive) {
      interactionStore.cancelWireCreation()
    } else if (interactionStore.componentToPlace) {
      interactionStore.setComponentToPlace(null)
    } else {
      interactionStore.clearSelection()
    }
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    circuitStore.deleteSelectedComponent()
  }

  // Pan on spacebar
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    isPanning.value = true
    stageConfig.value.draggable = true
    const stage = stageRef.value?.getStage()
    if (stage) {
      stage.container().style.cursor = 'grab'
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

function handleWireMouseEnter(_componentId: string, _event: KonvaEventObject<MouseEvent>) {
  // TODO: Implement this
}

function handleWireMouseLeave(_componentId: string, _event: KonvaEventObject<MouseEvent>) {
  // TODO: Implement this
}

function handleWireMouseUp(_componentId: string, _event: KonvaEventObject<MouseEvent>) {
  // TODO: Implement this
}

function handleTerminalClick(terminalId: string, componentId: string) {
  console.log(`[CircuitCanvas] handleTerminalClick received for component: ${componentId}`)
  const wireState = interactionStore.wireCreationState

  if (wireState.isActive) {
    interactionStore.finishWireCreation(terminalId, componentId)
  } else {
    // If not wiring, a click on a terminal ALWAYS starts a wire.
    interactionStore.startWireCreation(terminalId, componentId)
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    isPanning.value = false
    stageConfig.value.draggable = false
    const stage = stageRef.value?.getStage()
    if (stage) {
      stage.container().style.cursor = 'default'
    }
  }
}

function handleStageDblClick() {
  if (interactionStore.wireCreationState.isActive) {
    interactionStore.cancelWireCreation()
  }
}

function handleProbePlacement(targetId: string, e: KonvaEventObject<MouseEvent>) {
  const probeType = interactionStore.probingType;
  if (!probeType) return;

  const stage = e.target.getStage();
  if (!stage) return;

  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return;

  const position = screenToWorld(pointerPosition);

  circuitStore.addProbe(targetId, position, probeType);
}

function handleProbeSelect(probeId: string, e: KonvaEventObject<MouseEvent>) {
  interactionStore.selectComponent(probeId, e.evt.shiftKey);
}

function handleProbeMoveEnd(probeId: string, e: KonvaEventObject<DragEvent>) {
  const newPosition = { x: e.target.x(), y: e.target.y() };
  circuitStore.updateProbePosition(probeId, newPosition);
}

// Lifecycle hooks
onMounted(() => {
  if (!containerRef.value) return

  resizeObserver.value = new ResizeObserver((entries) => {
    const entry = entries[0]
    stageConfig.value.width = entry.contentRect.width
    stageConfig.value.height = entry.contentRect.height
  })
  resizeObserver.value.observe(containerRef.value)

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

watch(
  () => interactionStore.selectedComponentIds,
  (newIds, oldIds) => {
    const idsToDeselect = oldIds.filter((id) => !newIds.includes(id))
    const idsToSelect = newIds.filter((id) => !oldIds.includes(id))

    idsToDeselect.forEach((id) => {
      circuitStore.updateComponent(id, { selected: false })
    })
    idsToSelect.forEach((id) => {
      circuitStore.updateComponent(id, { selected: true })
    })
  },
  { deep: true },
)

watch(
  () => interactionStore.canvasTransform,
  (newTransform) => {
    stageConfig.value.scaleX = newTransform.scale
    stageConfig.value.scaleY = newTransform.scale
    stageConfig.value.x = newTransform.position.x
    stageConfig.value.y = newTransform.position.y
  },
  { deep: true },
)
</script>

<template>
  <div ref="containerRef" class="circuit-canvas-container" :style="{ cursor: placementCursor }">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleStageMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @contextmenu="handleContextMenu"
      @wheel="handleStageWheel"
      @dragmove="handleStageDragMove"
      @dblclick="handleStageDblClick"
    >
      <v-layer>
        <!-- Grid background -->
        <v-rect
          :config="{
            name: 'grid-background',
            x: gridLinesX[0] - majorGridSize,
            y: gridLinesY[0] - majorGridSize,
            width: gridLinesX[gridLinesX.length - 1] - gridLinesX[0] + majorGridSize * 2,
            height: gridLinesY[gridLinesY.length - 1] - gridLinesY[0] + majorGridSize * 2,
            fill: '#fafafa',
          }"
        />

        <!-- Grid lines -->
        <v-line
          v-for="x in gridLinesX"
          :key="`grid-x-${x}`"
          :config="{
            points: [
              x,
              gridLinesY[0] - majorGridSize,
              x,
              gridLinesY[gridLinesY.length - 1] + majorGridSize,
            ],
            stroke: '#e0e0e0',
            strokeWidth: 1,
          }"
        />
        <v-line
          v-for="y in gridLinesY"
          :key="`grid-y-${y}`"
          :config="{
            points: [
              gridLinesX[0] - majorGridSize,
              y,
              gridLinesX[gridLinesX.length - 1] + majorGridSize,
              y,
            ],
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
          @terminal-click="handleTerminalClick"
          @wire-mouseenter="handleWireMouseEnter"
          @wire-mouseleave="handleWireMouseLeave"
          @wire-mouseup="handleWireMouseUp"
          @wire-probe="handleProbePlacement"
        />

        <!-- Nodes -->
        <circuit-component
          v-for="component in nodes"
          :key="component.id"
          :component="component"
          @select="handleComponentSelect"
          @move-start="handleComponentMoveStart"
          @move="handleComponentMove"
          @move-end="handleComponentMoveEnd"
          @terminal-click="handleTerminalClick"
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
          @terminal-click="handleTerminalClick"
          @wire-probe="handleProbePlacement"
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

        <!-- Probes -->
        <probe-component
          v-for="probe in probes"
          :key="probe.id"
          :probe="probe"
          @select="handleProbeSelect"
          @dragend="handleProbeMoveEnd"
        />

        <!-- Selection Rectangle -->
        <v-rect
          v-if="selectionBox.visible"
          :config="{
            x: Math.min(selectionBox.x1, selectionBox.x2),
            y: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x1 - selectionBox.x2),
            height: Math.abs(selectionBox.y1 - selectionBox.y2),
            fill: 'rgba(0, 123, 255, 0.2)',
            stroke: 'rgba(0, 123, 255, 0.6)',
            strokeWidth: 1,
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
