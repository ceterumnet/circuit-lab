import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Position } from '@/types/components'
import { useCircuitStore } from './circuit'
import { getTerminalWorldPosition } from '@/services/geometry'

export const useInteractionStore = defineStore('interaction', () => {
  // State
  const selectedComponentIds = ref<string[]>([])
  const componentToPlace = ref<string | null>(null)
  const probingType = ref<'voltage' | 'current' | null>(null)
  const hoveredTerminal = ref<{ componentId: string; terminalId: string } | null>(null)
  const hoveredWireId = ref<string | null>(null)

  // NEW: Ctrl key state for modifier-based wiring
  const isCtrlKeyHeld = ref(false)

  // NEW: Flag to prevent click events immediately after wire drag completion
  const justCompletedWireDrag = ref(false)

  const wireCreationState = ref<{
    isActive: boolean
    isDragging: boolean
    startTerminal: {
      terminalId: string
      componentId: string
      position: Position
    } | null
    previewPosition: Position | null
  }>({
    isActive: false,
    isDragging: false,
    startTerminal: null,
    previewPosition: null,
  })

  const canvasTransform = ref({
    scale: 1,
    position: { x: 0, y: 0 },
  })

  const isDraggingComponent = ref(false)

  // Actions
  function setDraggingComponent(isDragging: boolean) {
    isDraggingComponent.value = isDragging
  }

  // NEW: Function to set Ctrl key state
  function setCtrlKeyHeld(isHeld: boolean) {
    isCtrlKeyHeld.value = isHeld
  }

  function setProbeType(type: 'voltage' | 'current' | null) {
    probingType.value = type
    if (type) {
      setComponentToPlace(null)
      cancelWireCreation()
      clearSelection()
    }
  }

  function setCanvasTransform(scale: number, position: Position) {
    canvasTransform.value = { scale, position }
  }

  function setHoveredTerminal(info: { componentId: string; terminalId: string } | null) {
    hoveredTerminal.value = info
  }

  function setHoveredWire(wireId: string | null) {
    hoveredWireId.value = wireId
  }

  function setComponentToPlace(type: string | null) {
    componentToPlace.value = type
    // When entering placement mode, cancel any other actions
    if (type) {
      clearSelection()
      cancelWireCreation()
    }
  }

  function selectComponent(componentId: string | null, isMultiSelect = false) {
    if (isMultiSelect && componentId) {
      if (selectedComponentIds.value.includes(componentId)) {
        removeFromSelection(componentId)
      } else {
        addToSelection(componentId)
      }
    } else if (componentId) {
      selectedComponentIds.value = [componentId]
    } else {
      selectedComponentIds.value = []
    }
  }

  function addToSelection(componentId: string) {
    if (!selectedComponentIds.value.includes(componentId)) {
      selectedComponentIds.value.push(componentId)
    }
  }

  function removeFromSelection(componentId: string) {
    const index = selectedComponentIds.value.indexOf(componentId)
    if (index > -1) {
      selectedComponentIds.value.splice(index, 1)
    }
  }

  function clearSelection() {
    selectedComponentIds.value = []
  }

  function cancelWireCreation() {
    wireCreationState.value = {
      isActive: false,
      isDragging: false,
      startTerminal: null,
      previewPosition: null,
    }
    setHoveredTerminal(null) // Clear hovered terminal on cancel
  }

  function startWireCreation(terminalId: string, componentId: string) {
    const circuitStore = useCircuitStore()
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)
    if (component) {
      const worldPosition = getTerminalWorldPosition(component, terminalId)

      wireCreationState.value = {
        isActive: true,
        isDragging: false,
        startTerminal: { terminalId, componentId, position: worldPosition },
        previewPosition: worldPosition,
      }
    }
  }

  function updateWirePreview(position: Position) {
    if (wireCreationState.value.isActive) {
      wireCreationState.value.previewPosition = position
    }
  }

  function finishWireCreation(terminalId: string, componentId: string) {
    if (!wireCreationState.value.isActive || !wireCreationState.value.startTerminal) {
      cancelWireCreation()
      return
    }

    const circuitStore = useCircuitStore()
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)
    if (component) {
      const worldPosition = getTerminalWorldPosition(component, terminalId)

      const startTerminal = wireCreationState.value.startTerminal
      const endTerminal = { terminalId, componentId, position: worldPosition }

      // Don't allow connecting a terminal to itself
      if (
        startTerminal.componentId === endTerminal.componentId &&
        startTerminal.terminalId === endTerminal.terminalId
      ) {
        // Just cancel the wire creation, do nothing else
      } else {
        circuitStore.createWire(startTerminal, endTerminal)
      }
    }

    cancelWireCreation()
  }

  function finishWireCreationToPosition(position: Position) {
    if (!wireCreationState.value.isActive || !wireCreationState.value.startTerminal) {
      cancelWireCreation()
      return
    }

    const circuitStore = useCircuitStore()
    const newNodeInfo = circuitStore.createNodeAndConnectWire(
      wireCreationState.value.startTerminal,
      position,
    )

    if (newNodeInfo) {
      // Immediately start a new wire segment from the new node
      startWireCreation(newNodeInfo.terminalId, newNodeInfo.nodeId)
    } else {
      // If node creation failed for some reason, cancel the whole thing
      cancelWireCreation()
    }
  }

  // NEW: Functions for drag-based wire creation
  function startWireDrag(terminalId: string, componentId: string) {
    const circuitStore = useCircuitStore()
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)
    if (component) {
      const worldPosition = getTerminalWorldPosition(component, terminalId)

      wireCreationState.value = {
        isActive: true,
        isDragging: true, // This is now a drag operation
        startTerminal: { terminalId, componentId, position: worldPosition },
        previewPosition: worldPosition,
      }
    }
  }

  function updateWireDrag(position: Position) {
    if (wireCreationState.value.isActive && wireCreationState.value.isDragging) {
      wireCreationState.value.previewPosition = position
    }
  }

  function finishWireDrag(terminalId?: string, componentId?: string) {
    if (!wireCreationState.value.isActive || !wireCreationState.value.isDragging) {
      cancelWireCreation()
      return
    }

    // Set flag to prevent immediate click events
    justCompletedWireDrag.value = true

    // Clear the flag after a short delay
    setTimeout(() => {
      justCompletedWireDrag.value = false
    }, 100)

    // If we have a target terminal, connect to it
    if (terminalId && componentId) {
      finishWireCreation(terminalId, componentId)
    } else {
      // Otherwise, create a node at the current preview position
      if (wireCreationState.value.previewPosition) {
        finishWireCreationToPosition(wireCreationState.value.previewPosition)
      } else {
        cancelWireCreation()
      }
    }
  }

  return {
    // State
    selectedComponentIds,
    componentToPlace,
    probingType,
    hoveredTerminal,
    hoveredWireId,
    wireCreationState,
    canvasTransform,
    isDraggingComponent,
    isCtrlKeyHeld,
    justCompletedWireDrag,
    // Actions
    setDraggingComponent,
    setCtrlKeyHeld,
    setProbeType,
    setCanvasTransform,
    setHoveredTerminal,
    setHoveredWire,
    setComponentToPlace,
    selectComponent,
    addToSelection,
    removeFromSelection,
    clearSelection,
    cancelWireCreation,
    startWireCreation,
    updateWirePreview,
    finishWireCreation,
    finishWireCreationToPosition,
    startWireDrag,
    updateWireDrag,
    finishWireDrag,
  }
})
