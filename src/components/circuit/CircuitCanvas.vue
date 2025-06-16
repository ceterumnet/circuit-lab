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

        <!-- Wires (rendered first, so they are in the background) -->
        <circuit-component
          v-for="component in wires"
          :key="component.id"
          :component="component"
          @select="handleComponentSelect"
          @move-start="handleComponentMoveStart"
          @move="handleComponentMove"
          @move-end="handleComponentMoveEnd"
          @terminal-click="handleTerminalClick"
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
          @terminal-click="handleTerminalClick"
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
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import CircuitComponent from '@/components/circuit/CircuitComponent.vue'
import type { KonvaEventObject } from 'konva/lib/Node'
import { InteractionMode } from '@/types/components'
import * as componentFactory from '@/services/componentFactory'

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
const interactionStore = useInteractionStore()

// Computed properties for rendering order
const wires = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type === 'wire')
)
const otherComponents = computed(() =>
  circuitStore.currentCircuit.components.filter(c => c.type !== 'wire')
)

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
    switch (interactionStore.currentMode) {
      case InteractionMode.PLACE_COMPONENT:
        if (isBackground && interactionStore.modeData?.componentType) {
          const componentType = interactionStore.modeData.componentType as string
          addComponentAtPosition(componentType, snappedPos)
          emit('component-placed')
        }
        break

      case InteractionMode.WIRE:
        if (isBackground && interactionStore.wireCreationState.isActive) {
          // Create node and finish wire
          // interactionStore.finishWireCreationToPosition(snappedPos) // This needs to be created
        }
        break

      case InteractionMode.SELECT_MOVE:
      default:
        if (isBackground) {
          // Clear selection and cancel any active operations
          interactionStore.clearSelection()
          interactionStore.cancelWireCreation()
        }
        break
    }
  }
}

function addComponentAtPosition(type: string, position: { x: number; y: number }) {
  const newComponent = componentFactory.createComponent(circuitStore.currentCircuit, type, position)
  if (newComponent) {
    circuitStore.addComponent(newComponent)
  }
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
    } else if (interactionStore.wireCreationState.isActive) {
      // Handle wire preview during creation
      interactionStore.updateWirePreview(pos)
    }
  }
}

function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    dragTarget.value = null
  }
}

function handleComponentMoveStart(componentId: string) {
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

function handleComponentSelect(componentId: string) {
  // Handle component selection based on current mode
  switch (interactionStore.currentMode) {
    case InteractionMode.ROTATE:
      // Rotate component in rotate mode
      const component = circuitStore.currentCircuit.components.find(c => c.id === componentId)
      if (component) {
        circuitStore.updateComponent(componentId, { rotation: (component.rotation + 90) % 360 })
      }
      break
    case InteractionMode.DELETE:
      // Delete component immediately in delete mode
      circuitStore.removeComponent(componentId)
      break
    case InteractionMode.SELECT_MOVE:
    default:
      interactionStore.selectComponent(componentId)
      break
  }
}

function handleTerminalClick(terminalId: string, componentId: string) {
  // Only handle terminal clicks in wire mode
  if (interactionStore.currentMode === InteractionMode.WIRE) {
    if (interactionStore.wireCreationState.isActive) {
      // Second click - finish wire creation
      interactionStore.finishWireCreation(terminalId, componentId)
    } else {
      // First click - start wire creation
      interactionStore.startWireCreation(terminalId, componentId)
    }
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
  if (interactionStore.currentMode === InteractionMode.WIRE) {
    interactionStore.cancelWireCreation()
  } else {
    interactionStore.setMode(InteractionMode.SELECT_MOVE)
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    circuitStore.deleteSelectedComponent()
  } else if (e.key === 'Escape') {
    interactionStore.cancelWireCreation()
    interactionStore.clearSelection()
  }
}

onMounted(() => {
  const container = document.querySelector('.circuit-canvas-container')
  if (container) {
    stageConfig.value.width = container.clientWidth
    stageConfig.value.height = container.clientHeight
  }
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
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
</script>

<style scoped>
.circuit-canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #fafafa;
}
</style>
