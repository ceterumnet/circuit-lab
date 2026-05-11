import { computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useHistoryStore } from '@/stores/history'
import { useInteractionStore } from '@/stores/interaction'
import type { CircuitComponent, Position, Wire, CircuitNode } from '@/types/components'

export function useCircuitHistory() {
  const circuitStore = useCircuitStore()
  const historyStore = useHistoryStore()
  const interactionStore = useInteractionStore()

  // Each component gets its own history actions, but keyboard shortcuts are handled centrally

  // Don't automatically initialize here - let the main component do it

  // History-aware actions
  function addComponentWithHistory(component: CircuitComponent, description?: string) {
    const desc = description || `Add ${component.type}`
    circuitStore.addComponent(component)
    historyStore.saveState(circuitStore.currentCircuit, desc)
  }

  function removeComponentWithHistory(componentId: string, description?: string) {
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId)
    const componentType = component?.type || 'component'

    circuitStore.removeComponent(componentId)
    historyStore.saveState(circuitStore.currentCircuit, description || `Remove ${componentType}`)
  }

  function moveComponentWithHistory(componentId: string, position: Position, description?: string) {
    circuitStore.moveComponent(componentId, position)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Move component')
  }

  function createWireWithHistory(
    startTerminal: { terminalId: string; componentId: string; position: Position },
    endTerminal: { terminalId: string; componentId: string; position: Position },
    description?: string,
  ) {
    circuitStore.createWire(startTerminal, endTerminal)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Create wire')
  }

  function deleteSelectedComponentWithHistory(description?: string) {
    circuitStore.deleteSelectedComponent()
    historyStore.saveState(circuitStore.currentCircuit, description || 'Delete selected')
  }

  function updateComponentWithHistory(
    componentId: string,
    updates: Partial<Wire | CircuitNode>,
    description?: string,
  ) {
    circuitStore.updateComponent(componentId, updates)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Update component')
  }

  function createWireToPositionWithHistory(position: Position, description?: string) {
  const _interactionStore = useInteractionStore()

    if (
      !interactionStore.wireCreationState.isActive ||
      !interactionStore.wireCreationState.startTerminal
    ) {
      return
    }

    const startTerminal = interactionStore.wireCreationState.startTerminal

    // Create the node and wire, but DON'T start a new interactive wire creation
    // History should only save completed states, not interactive processes
    circuitStore.createNodeAndConnectWire(startTerminal, position)

    // Cancel the wire creation state before saving history
    interactionStore.cancelWireCreation()

    // Save the completed state
    historyStore.saveState(circuitStore.currentCircuit, description || 'Create wire')
  }

  function addProbeWithHistory(
    targetId: string,
    position: Position,
    type: 'voltage' | 'current',
    description?: string,
  ) {
    circuitStore.addProbe(targetId, position, type)
    historyStore.saveState(circuitStore.currentCircuit, description || `Add ${type} probe`)
  }

  function splitWireAndConnectWithHistory(
    wireId: string,
    position: Position,
    newWireStartTerminal: { terminalId: string; componentId: string; position: Position },
    description?: string,
  ) {
    circuitStore.splitWireAndConnect(wireId, position, newWireStartTerminal)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Split wire')
  }

  // NEW: Split wire and connect directly to terminal
  function splitWireAndConnectDirectWithHistory(
    wireId: string,
    newTerminal: { terminalId: string; componentId: string; position: Position },
    description?: string,
  ) {
    circuitStore.splitWireAndConnectDirect(wireId, newTerminal)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Connect to wire')
  }

  // NEW: Split wire and connect multiple terminals
  function splitWireAndConnectMultipleWithHistory(
    wireId: string,
    newTerminals: Array<{ terminalId: string; componentId: string; position: Position }>,
    description?: string,
  ) {
    circuitStore.splitWireAndConnectMultiple(wireId, newTerminals)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Connect multiple to wire')
  }

  function removeProbeWithHistory(probeId: string, description?: string) {
    circuitStore.removeProbe(probeId)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Remove probe')
  }

  function updateProbePositionWithHistory(
    probeId: string,
    position: Position,
    description?: string,
  ) {
    circuitStore.updateProbePosition(probeId, position)
    historyStore.saveState(circuitStore.currentCircuit, description || 'Move probe')
  }

  function clearCircuitWithHistory(description?: string) {
    historyStore.saveState(circuitStore.currentCircuit, description || 'Clear circuit')
    circuitStore.clearCircuit()
    // Reinitialize history after clearing
    historyStore.initializeHistory(circuitStore.currentCircuit)
  }

  function pasteComponentsWithHistory(description?: string) {
    const success = circuitStore.pasteComponents()
    if (success) {
      historyStore.saveState(circuitStore.currentCircuit, description || 'Paste components')
    }
    return success
  }

  function pasteComponentsAtPositionWithHistory(
    targetPosition: Position,
    rotation: number = 0,
    description?: string,
  ) {
    const success = circuitStore.pasteComponentsAtPosition(targetPosition, rotation)
    if (success) {
      historyStore.saveState(circuitStore.currentCircuit, description || 'Paste components')
    }
    return success
  }

  function cutComponentsWithHistory(description?: string) {
    const success = circuitStore.cutSelectedComponents()
    if (success) {
      historyStore.saveState(circuitStore.currentCircuit, description || 'Cut components')
    }
    return success
  }

  // NEW: Add component with auto-connect functionality
  function addComponentWithAutoConnectHistory(
    component: CircuitComponent,
    intersections: Array<{
      type: 'terminal' | 'wire'
      terminalId: string
      targetTerminalId?: string
      targetComponentId?: string
      targetWireId?: string
      intersectionPoint?: Position
    }>,
    description?: string,
  ) {
    console.log(
      `[AutoConnect] Adding component ${component.id} with ${intersections.length} intersections:`,
      intersections,
    )

    // First add the component
    circuitStore.addComponent(component)

    // Group intersections by wire to handle multiple terminals on same wire
    const wireIntersections = new Map<string, Array<(typeof intersections)[0]>>()
    const terminalIntersections: Array<(typeof intersections)[0]> = []

    for (const intersection of intersections) {
      if (intersection.type === 'wire' && intersection.targetWireId) {
        if (!wireIntersections.has(intersection.targetWireId)) {
          wireIntersections.set(intersection.targetWireId, [])
        }
        wireIntersections.get(intersection.targetWireId)!.push(intersection)
      } else if (intersection.type === 'terminal') {
        terminalIntersections.push(intersection)
      }
    }

    console.log(
      `[AutoConnect] Grouped into ${wireIntersections.size} wire intersections and ${terminalIntersections.length} terminal intersections`,
    )
    console.log(`[AutoConnect] Wire intersections:`, Array.from(wireIntersections.entries()))
    console.log(`[AutoConnect] Terminal intersections:`, terminalIntersections)

    // Handle terminal-to-terminal connections
    for (const intersection of terminalIntersections) {
      if (intersection.targetComponentId && intersection.targetTerminalId) {
        const componentTerminal = {
          terminalId: intersection.terminalId,
          componentId: component.id,
          position: { x: 0, y: 0 }, // Will be calculated by createWire
        }
        const targetTerminal = {
          terminalId: intersection.targetTerminalId,
          componentId: intersection.targetComponentId,
          position: { x: 0, y: 0 }, // Will be calculated by createWire
        }
        circuitStore.createWire(componentTerminal, targetTerminal)
      }
    }

    // Handle wire intersections (one wire at a time to avoid duplication)
    for (const [wireId, wireIntersectionList] of wireIntersections) {
      console.log(
        `[AutoConnect] Processing wire ${wireId} with ${wireIntersectionList.length} intersections`,
      )

      // For all components (including nodes), use the new logic
      const componentTerminals = wireIntersectionList.map((intersection) => ({
        terminalId: intersection.terminalId,
        componentId: component.id,
        position: { x: 0, y: 0 }, // Will be calculated by createWire
      }))

      console.log(`[AutoConnect] Component terminals for wire ${wireId}:`, componentTerminals)
      circuitStore.splitWireAndConnectMultiple(wireId, componentTerminals)
    }

    const desc =
      description || `Add ${component.type}${intersections.length > 0 ? ' with auto-connect' : ''}`
    historyStore.saveState(circuitStore.currentCircuit, desc)
  }

  // Undo/redo functions (without automatic keyboard setup)
  function undo() {
    return historyStore.undo()
  }

  function redo() {
    return historyStore.redo()
  }

  return {
    // History actions
    addComponentWithHistory,
    addComponentWithAutoConnectHistory,
    removeComponentWithHistory,
    moveComponentWithHistory,
    createWireWithHistory,
    createWireToPositionWithHistory,
    addProbeWithHistory,
    removeProbeWithHistory,
    updateProbePositionWithHistory,
    splitWireAndConnectWithHistory,
    splitWireAndConnectDirectWithHistory,
    splitWireAndConnectMultipleWithHistory,
    deleteSelectedComponentWithHistory,
    updateComponentWithHistory,
    clearCircuitWithHistory,
    pasteComponentsWithHistory,
    pasteComponentsAtPositionWithHistory,
    cutComponentsWithHistory,

    // Undo/Redo
    undo,
    redo,
    canUndo: computed(() => historyStore.canUndo),
    canRedo: computed(() => historyStore.canRedo),

    // History info
    getHistoryList: historyStore.getHistoryList,
  }
}
