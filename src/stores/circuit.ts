import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Circuit,
  CircuitComponent,
  Position,
  SimulationResult,
  Resistor,
  VoltageSource,
  Ground,
  Wire,
} from '@/types/circuit'
import { ComponentType } from '@/types/circuit'

export const useCircuitStore = defineStore('circuit', () => {
  // State
  const currentCircuit = ref<Circuit>({
    id: 'default',
    name: 'New Circuit',
    components: [],
    nodes: {},
  })

  const selectedComponentId = ref<string | null>(null)
  const isSimulating = ref(false)
  const simulationResults = ref<SimulationResult | null>(null)

  // Wire connection state
  const selectedTerminal = ref<{
    terminalId: string
    componentId: string
    position: Position
  } | null>(null)
  const isWiringMode = ref(false)

  // Drag connection state
  const dragConnectionState = ref<{
    isActive: boolean
    startTerminal: {
      terminalId: string
      componentId: string
      position: Position
    } | null
    currentPosition: Position | null
    targetTerminal: {
      terminalId: string
      componentId: string
      position: Position
    } | null
  }>({
    isActive: false,
    startTerminal: null,
    currentPosition: null,
    targetTerminal: null,
  })

  // Getters
  const selectedComponent = computed(() => {
    if (!selectedComponentId.value) return null
    return currentCircuit.value.components.find((c) => c.id === selectedComponentId.value) || null
  })

  const componentCount = computed(() => currentCircuit.value.components.length)

  // Actions
  function addComponent(component: CircuitComponent) {
    currentCircuit.value.components.push(component)
  }

  function removeComponent(componentId: string) {
    const index = currentCircuit.value.components.findIndex((c) => c.id === componentId)
    if (index !== -1) {
      currentCircuit.value.components.splice(index, 1)
      if (selectedComponentId.value === componentId) {
        selectedComponentId.value = null
      }
    }
  }

  function updateComponent(
    componentId: string,
    updates: Partial<Resistor | VoltageSource | Ground>,
  ) {
    const component = currentCircuit.value.components.find((c) => c.id === componentId)
    if (component) {
      Object.assign(component, updates)
    }
  }

  function selectComponent(componentId: string | null) {
    // Deselect previous component
    if (selectedComponentId.value) {
      updateComponent(selectedComponentId.value, { selected: false })
    }

    selectedComponentId.value = componentId

    // Select new component
    if (componentId) {
      updateComponent(componentId, { selected: true })
    }
  }

  function clearSelection() {
    selectComponent(null)
  }

  function moveComponent(componentId: string, position: Position) {
    updateComponent(componentId, { position })
  }

  function generateComponentId(type: ComponentType): string {
    const typePrefix = type.substring(0, 1).toUpperCase()
    const existingIds = currentCircuit.value.components
      .filter((c) => c.type === type)
      .map((c) => c.id)

    let counter = 1
    let newId = `${typePrefix}${counter}`

    while (existingIds.includes(newId)) {
      counter++
      newId = `${typePrefix}${counter}`
    }

    return newId
  }

  function clearCircuit() {
    currentCircuit.value = {
      id: 'default',
      name: 'New Circuit',
      components: [],
      nodes: {},
    }
    selectedComponentId.value = null
    simulationResults.value = null
  }

  function startSimulation() {
    isSimulating.value = true
    // TODO: Implement actual simulation logic
    setTimeout(() => {
      isSimulating.value = false
      // Mock simulation result for now
      simulationResults.value = {
        nodes: [],
        currents: {},
        timestamp: Date.now(),
      }
    }, 1000)
  }

  // Wire connection functions
  function selectTerminal(terminalId: string, componentId: string, position: Position) {
    if (!selectedTerminal.value) {
      // First terminal selected - start wire
      selectedTerminal.value = { terminalId, componentId, position }
      isWiringMode.value = true
    } else {
      // Second terminal selected - complete wire
      const startTerminal = selectedTerminal.value
      const endTerminal = { terminalId, componentId, position }

      // Don't allow connecting to same terminal or same component
      if (
        startTerminal.terminalId !== endTerminal.terminalId &&
        startTerminal.componentId !== endTerminal.componentId
      ) {
        createWire(startTerminal, endTerminal)
      }

      // Reset wire mode
      selectedTerminal.value = null
      isWiringMode.value = false
    }
  }

  function createWire(
    startTerminal: { terminalId: string; componentId: string; position: Position },
    endTerminal: { terminalId: string; componentId: string; position: Position },
  ) {
    const wireId = generateComponentId(ComponentType.WIRE)

    const wire = {
      id: wireId,
      type: ComponentType.WIRE,
      position: { x: 0, y: 0 }, // Wires don't have a single position
      rotation: 0,
      selected: false,
      startTerminal: startTerminal.terminalId,
      endTerminal: endTerminal.terminalId,
      points: [], // Will be calculated dynamically
    } as Wire

    addComponent(wire)
  }

  // Drag connection functions
  function startDragConnection(terminalId: string, componentId: string, position: Position) {
    // Calculate world position (component position + terminal offset)
    const component = currentCircuit.value.components.find((c) => c.id === componentId)
    if (component) {
      const worldPosition = {
        x: component.position.x + position.x,
        y: component.position.y + position.y,
      }

      dragConnectionState.value = {
        isActive: true,
        startTerminal: { terminalId, componentId, position: worldPosition },
        currentPosition: worldPosition,
        targetTerminal: null,
      }
    }
  }

  function updateDragConnection(position: Position) {
    if (dragConnectionState.value.isActive) {
      dragConnectionState.value.currentPosition = position
    }
  }

  function finishDragConnection(terminalId: string, componentId: string, position: Position) {
    if (!dragConnectionState.value.isActive || !dragConnectionState.value.startTerminal) {
      cancelDragConnection()
      return
    }

    // Calculate world position (component position + terminal offset)
    const component = currentCircuit.value.components.find((c) => c.id === componentId)
    if (component) {
      const worldPosition = {
        x: component.position.x + position.x,
        y: component.position.y + position.y,
      }

      const startTerminal = dragConnectionState.value.startTerminal
      const endTerminal = { terminalId, componentId, position: worldPosition }

      // Don't allow connecting to same terminal or same component
      if (
        startTerminal.terminalId !== endTerminal.terminalId &&
        startTerminal.componentId !== endTerminal.componentId
      ) {
        createWire(startTerminal, endTerminal)
      }
    }

    cancelDragConnection()
  }

  function cancelDragConnection() {
    dragConnectionState.value = {
      isActive: false,
      startTerminal: null,
      currentPosition: null,
      targetTerminal: null,
    }
  }

  function findTerminalAtPosition(
    position: Position,
  ): { terminalId: string; componentId: string; position: Position } | null {
    // Find all terminals in the circuit
    for (const component of currentCircuit.value.components) {
      if (component.type === ComponentType.WIRE) continue

      let terminals: string[] = []
      if (
        component.type === ComponentType.RESISTOR ||
        component.type === ComponentType.VOLTAGE_SOURCE
      ) {
        terminals = (component as Resistor | VoltageSource).terminals
      } else if (component.type === ComponentType.GROUND) {
        terminals = [(component as Ground).terminal]
      }

      for (const terminalId of terminals) {
        const terminalWorldPos = getTerminalWorldPosition(component, terminalId)

        // Check if position is within 15 pixels of the terminal
        const distance = Math.sqrt(
          Math.pow(position.x - terminalWorldPos.x, 2) +
            Math.pow(position.y - terminalWorldPos.y, 2),
        )

        if (distance <= 15) {
          // Calculate local terminal position with rotation applied
          let localOffset: Position

          switch (component.type) {
            case ComponentType.RESISTOR:
            case ComponentType.VOLTAGE_SOURCE: {
              const terminals = (component as Resistor | VoltageSource).terminals
              const terminalIndex = terminals.indexOf(terminalId)
              const offsetX = terminalIndex === 0 ? -30 : 30
              localOffset = { x: offsetX, y: 0 }
              break
            }
            case ComponentType.GROUND: {
              localOffset = { x: 0, y: -15 }
              break
            }
            default:
              localOffset = { x: 0, y: 0 }
          }

          // Apply rotation to get the local terminal position that matches the visual component
          const rotatedLocalOffset = rotatePoint(localOffset, component.rotation)

          return {
            terminalId,
            componentId: component.id,
            position: rotatedLocalOffset,
          }
        }
      }
    }

    return null
  }

  function getTerminalWorldPosition(component: CircuitComponent, terminalId: string): Position {
    let localOffset: Position

    switch (component.type) {
      case ComponentType.RESISTOR:
      case ComponentType.VOLTAGE_SOURCE: {
        const terminals = (component as Resistor | VoltageSource).terminals
        const terminalIndex = terminals.indexOf(terminalId)
        // Left terminal at -30, right terminal at +30
        const offsetX = terminalIndex === 0 ? -30 : 30
        localOffset = { x: offsetX, y: 0 }
        break
      }
      case ComponentType.GROUND: {
        // Ground has single terminal at top
        localOffset = { x: 0, y: -15 }
        break
      }
      default:
        return component.position
    }

    // Apply rotation transformation to local offset
    const rotatedOffset = rotatePoint(localOffset, component.rotation)

    return {
      x: component.position.x + rotatedOffset.x,
      y: component.position.y + rotatedOffset.y,
    }
  }

  // Helper function to rotate a point around origin
  function rotatePoint(point: Position, angleInDegrees: number): Position {
    const angleInRadians = (angleInDegrees * Math.PI) / 180
    const cos = Math.cos(angleInRadians)
    const sin = Math.sin(angleInRadians)

    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
    }
  }

  function cancelWiring() {
    selectedTerminal.value = null
    isWiringMode.value = false
    cancelDragConnection()
  }

  function deleteWire(wireId: string) {
    removeComponent(wireId)
  }

  function deleteSelectedComponent() {
    if (selectedComponentId.value) {
      removeComponent(selectedComponentId.value)
    }
  }

  return {
    // State
    currentCircuit,
    selectedComponentId,
    isSimulating,
    simulationResults,
    selectedTerminal,
    isWiringMode,
    dragConnectionState,

    // Getters
    selectedComponent,
    componentCount,

    // Actions
    addComponent,
    removeComponent,
    updateComponent,
    selectComponent,
    clearSelection,
    moveComponent,
    generateComponentId,
    clearCircuit,
    startSimulation,

    // Wire functions
    selectTerminal,
    createWire,
    cancelWiring,
    deleteWire,
    deleteSelectedComponent,

    // Drag connection functions
    startDragConnection,
    updateDragConnection,
    finishDragConnection,
    cancelDragConnection,
    findTerminalAtPosition,
    getTerminalWorldPosition,
  }
})
