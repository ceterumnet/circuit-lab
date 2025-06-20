import { onMounted, onUnmounted } from 'vue'
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
    const interactionStore = useInteractionStore()

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
    removeComponentWithHistory,
    moveComponentWithHistory,
    createWireWithHistory,
    createWireToPositionWithHistory,
    addProbeWithHistory,
    removeProbeWithHistory,
    updateProbePositionWithHistory,
    splitWireAndConnectWithHistory,
    deleteSelectedComponentWithHistory,
    updateComponentWithHistory,
    clearCircuitWithHistory,

    // Undo/Redo
    undo,
    redo,
    canUndo: historyStore.canUndo,
    canRedo: historyStore.canRedo,

    // History info
    getHistoryList: historyStore.getHistoryList,
  }
}
