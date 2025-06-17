<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
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
const nodes = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type === 'node')
)
const otherComponents = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type !== 'wire' && c.type !== 'node')
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
        const pos = screenToWorld(stage.getPointerPosition()!)
        interactionStore.finishWireCreationToPosition(pos)
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

      circuitStore.currentCircuit.components.forEach(component => {
        if (component.type === 'wire') return // Wires can't be marquee selected for now

        const { x, y } = component.position
        if (x > x1 && x < x2 && y > y1 && y < y2) {
          interactionStore.addToSelection(component.id)
        }
      })
    }
  }

  // Dragging logic
  if (isDragging.value) {
    isDragging.value = false
    dragTarget.value = null
    dragStartPositions.value.clear()
  }
}

function handleComponentSelect(componentId: string, e: KonvaEventObject<MouseEvent>) {
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

  isDragging.value = true
  dragTarget.value = componentId

  const stage = e.target.getStage()
  if (!stage) return
  dragStartPointerPosition.value = screenToWorld(stage.getPointerPosition()!)

  // If the dragged component is not selected, select only it.
  if (!interactionStore.selectedComponentIds.includes(componentId)) {
    interactionStore.selectComponent(componentId, e.evt.shiftKey)
  }

  // Store initial positions of all selected components
  dragStartPositions.value.clear()
  interactionStore.selectedComponentIds.forEach(id => {
    const component = circuitStore.currentCircuit.components.find(c => c.id === id)
    if (component && component.type !== 'wire') {
      dragStartPositions.value.set(id, { ...component.position })
    }
  })
}

function handleComponentMove(componentId: string, position: { x: number; y: number }) {
  const startPos = dragStartPositions.value.get(componentId)
  if (!startPos) return

  const dx = position.x - startPos.x
  const dy = position.y - startPos.y

  interactionStore.selectedComponentIds.forEach(id => {
    // if (id === componentId) return // Skip the component that's already being dragged

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
  const startPos = dragStartPositions.value.get(componentId)
  if (!startPos) return

  const dx = position.x - startPos.x
  const dy = position.y - startPos.y

  interactionStore.selectedComponentIds.forEach(id => {
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
      circuitStore.moveComponent(id, snappedPos)
    }
  })
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
  const targetNodeName = (e.target as HTMLElement)?.nodeName;
  if (targetNodeName === 'INPUT' || targetNodeName === 'TEXTAREA') {
    return; // Do not process keyboard shortcuts if focus is on an input field
  }

  // Cancel wire creation on Escape or Delete
  if (
    (e.key === 'Escape' || e.key === 'Delete' || e.key === 'Backspace') &&
    interactionStore.wireCreationState.isActive
  ) {
    interactionStore.cancelWireCreation();
    return; // Prevent other keydown actions
  }

  // Delete selected components
  if ((e.key === 'Delete' || e.key === 'Backspace') && interactionStore.selectedComponentIds.length > 0) {
    circuitStore.deleteSelectedComponent()
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

function getVoltageLabelConfig(nodeComponent: CircuitComponentType) {
  if (!circuitStore.dcSolution) return { visible: false };
  const { voltages, termToNodeIndex } = circuitStore.dcSolution;

  const nodeDef = getComponentDefinition('node');
  if (!nodeDef) return { visible: false };

  // Find the unique terminal ID for this node component
  const terminalId = `${nodeComponent.id}:${nodeDef.terminals[0].id}`;

  // Find the electrical node index this terminal belongs to
  const electricalNodeIndex = termToNodeIndex.get(terminalId);
  if (electricalNodeIndex === undefined) return { visible: false };

  // Find the node name (representative ID) for this electrical node
  let representativeNodeId = '';
  for(const [key, val] of termToNodeIndex.entries()){
    if(val === electricalNodeIndex){
      representativeNodeId = key;
      break;
    }
  }

  const voltage = voltages[representativeNodeId];

  if (voltage === undefined) return { visible: false };

  return {
    x: nodeComponent.position.x + 8,
    y: nodeComponent.position.y - 18,
    text: `${voltage.toFixed(2)}V`,
    fontSize: 14,
    fontFamily: 'Arial',
    fill: 'blue',
    visible: true,
  };
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
  () => interactionStore.selectedComponentIds,
  (newIds, oldIds) => {
    const idsToDeselect = oldIds.filter(id => !newIds.includes(id))
    const idsToSelect = newIds.filter(id => !oldIds.includes(id))

    idsToDeselect.forEach(id => {
      circuitStore.updateComponent(id, { selected: false })
    })
    idsToSelect.forEach(id => {
      circuitStore.updateComponent(id, { selected: true })
    })
  },
  { deep: true }
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
      @mousedown="handleStageMouseDown"
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
          @terminal-mousedown="handleTerminalMouseDown"
          @node-connect="handleNodeConnect"
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

        <!-- DC Voltage Labels -->
        <v-text
          v-for="component in nodes"
          :key="`voltage-${component.id}`"
          :config="getVoltageLabelConfig(component)"
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
