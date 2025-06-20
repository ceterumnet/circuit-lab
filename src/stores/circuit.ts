import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Circuit,
  CircuitComponent,
  Position,
  SimulationResult,
  Wire,
  CircuitNode,
  Probe,
} from '@/types/components'
import type { DC_Result } from '@/services/simulation'
import { generateComponentId, createComponent } from '@/services/componentFactory'
import { useInteractionStore } from './interaction'
import { solveDC } from '@/services/simulation'
import { getComponentDefinition } from '@/registry/components'

export const useCircuitStore = defineStore('circuit', () => {
  // State
  const currentCircuit = ref<Circuit>({
    id: 'default',
    name: 'New Circuit',
    components: [],
    wires: [],
    probes: [],
    nodes: {},
  })

  const isSimulating = ref(false)
  const simulationResults = ref<SimulationResult | null>(null)
  const dcSolution = ref<DC_Result | null>(null)
  const lastDcSolution = ref<DC_Result | null>(null)
  const simulationErrors = ref<string[]>([])
  const hasValidSimulation = ref(false)

  // Getters
  const singleSelectedItem = computed(() => {
    const interactionStore = useInteractionStore()
    const ids = interactionStore.selectedComponentIds
    if (ids.length !== 1) return null

    const component = currentCircuit.value.components.find((c) => c.id === ids[0])
    if (component) return component

    const probe = currentCircuit.value.probes.find((p) => p.id === ids[0])
    if (probe) return probe

    return null
  })

  const componentCount = computed(() => currentCircuit.value.components.length)
  const probeCount = computed(() => currentCircuit.value.probes.length)

  // Actions
  function addComponent(component: CircuitComponent) {
    currentCircuit.value.components.push(component)
  }

  function removeComponent(componentId: string) {
    const componentToRemove = currentCircuit.value.components.find((c) => c.id === componentId)
    if (!componentToRemove) return

    // Find wires connected to the component being removed
    const wiresToRemove = currentCircuit.value.components
      .filter((c) => {
        if (c.type !== 'wire') return false
        const props = c.properties
        return props?.startComponentId === componentId || props?.endComponentId === componentId
      })
      .map((w) => w.id)

    // Remove the component
    const componentIndex = currentCircuit.value.components.findIndex((c) => c.id === componentId)
    if (componentIndex !== -1) {
      currentCircuit.value.components.splice(componentIndex, 1)
    }

    // Remove the connected wires
    for (const wireId of wiresToRemove) {
      const wireIndex = currentCircuit.value.components.findIndex((c) => c.id === wireId)
      if (wireIndex !== -1) {
        currentCircuit.value.components.splice(wireIndex, 1)
      }
    }

    const interactionStore = useInteractionStore()
    if (interactionStore.selectedComponentIds.includes(componentId)) {
      interactionStore.removeFromSelection(componentId)
    }
  }

  function updateComponent(componentId: string, updates: Partial<Wire | CircuitNode>) {
    const component = currentCircuit.value.components.find((c) => c.id === componentId)
    if (component) {
      Object.assign(component, updates)
    }
  }

  function moveComponent(componentId: string, position: Position) {
    updateComponent(componentId, { position })
  }

  function clearCircuit() {
    currentCircuit.value = {
      id: 'default',
      name: 'New Circuit',
      components: [],
      wires: [],
      probes: [],
      nodes: {},
    }
    const interactionStore = useInteractionStore()
    interactionStore.selectComponent(null)
    simulationResults.value = null
    dcSolution.value = null
    lastDcSolution.value = null
    simulationErrors.value = []
    hasValidSimulation.value = false
  }

  function validateCircuit() {
    const errors: string[] = []
    const components = currentCircuit.value.components

    // Check for ground connection
    const hasGround = components.some((c) => c.type === 'ground')
    const hasVoltageSource = components.some((c) => c.type === 'voltage_source')

    if (!hasGround && !hasVoltageSource) {
      errors.push('Circuit must have either a ground component or a voltage source for reference.')
    }

    // Check for floating components (components with no connections)
    const wires = components.filter((c) => c.type === 'wire')
    const connectedComponentIds = new Set<string>()

    wires.forEach((wire) => {
      if (wire.properties?.startComponentId) {
        connectedComponentIds.add(wire.properties.startComponentId as string)
      }
      if (wire.properties?.endComponentId) {
        connectedComponentIds.add(wire.properties.endComponentId as string)
      }
    })

    const floatingComponents = components.filter(
      (c) => c.type !== 'wire' && c.type !== 'node' && !connectedComponentIds.has(c.id),
    )

    if (floatingComponents.length > 0) {
      errors.push(`${floatingComponents.length} component(s) are not connected to any wires.`)
    }

    // Check for components with missing required properties
    components.forEach((component) => {
      if (component.type === 'resistor') {
        const resistance = component.properties?.resistance as number | undefined
        if (!resistance || resistance <= 0) {
          errors.push(`Resistor ${component.label || component.id} has invalid resistance value.`)
        }
      }
      if (component.type === 'voltage_source') {
        const voltage = component.properties?.voltage as number | undefined
        if (!voltage || voltage === 0) {
          errors.push(
            `Voltage source ${component.label || component.id} has invalid voltage value.`,
          )
        }
      }
    })

    // Check for short circuits (voltage sources with zero resistance paths)
    // This is a simplified check - a more comprehensive version would analyze the circuit topology
    const voltageSourcesCount = components.filter((c) => c.type === 'voltage_source').length
    if (voltageSourcesCount > 1) {
      errors.push('Multiple voltage sources detected. This may cause convergence issues.')
    }

    simulationErrors.value = errors
    return errors
  }

  async function runDCSimulation() {
    // Clear previous simulation state
    isSimulating.value = true
    simulationErrors.value = []
    hasValidSimulation.value = false

    try {
      // Validate circuit before simulation
      const errors = validateCircuit()

      if (errors.length > 0) {
        console.warn('Circuit validation failed:', errors)
        isSimulating.value = false
        return false
      }

      // Run the simulation
      const solution = await solveDC(currentCircuit.value)

      if (solution) {
        dcSolution.value = solution
        lastDcSolution.value = dcSolution.value
        hasValidSimulation.value = true
        console.log('DC simulation completed successfully')
      } else {
        simulationErrors.value = [
          'Simulation failed to converge. Check for circuit topology issues.',
        ]
        dcSolution.value = null
        console.error('DC simulation failed to converge')
      }
    } catch (error) {
      console.error('DC analysis failed:', error)
      simulationErrors.value = [
        `Simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]
      dcSolution.value = null
    }

    isSimulating.value = false
    return hasValidSimulation.value
  }

  // Removed automatic simulation watcher - simulation is now explicit

  // Main simulation function - now used as the explicit simulation trigger
  async function startSimulation() {
    return await runDCSimulation()
  }

  function setDcSolution(solution: DC_Result | null) {
    dcSolution.value = solution
  }

  function createWire(
    startTerminal: { terminalId: string; componentId: string; position: Position },
    endTerminal: { terminalId: string; componentId: string; position: Position },
  ) {
    const wireId = generateComponentId(currentCircuit.value, 'wire')

    const wire: CircuitComponent = {
      id: wireId,
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: startTerminal.terminalId,
        startComponentId: startTerminal.componentId,
        endTerminal: endTerminal.terminalId,
        endComponentId: endTerminal.componentId,
      },
    }

    addComponent(wire)
  }

  function deleteSelectedComponent() {
    const interactionStore = useInteractionStore()
    const idsToDelete = [...interactionStore.selectedComponentIds]

    idsToDelete.forEach((id) => {
      const isComponent = currentCircuit.value.components.some((c) => c.id === id)
      if (isComponent) {
        removeComponent(id)
        return
      }

      const isProbe = currentCircuit.value.probes.some((p) => p.id === id)
      if (isProbe) {
        removeProbe(id)
      }
    })

    interactionStore.clearSelection()
  }

  function deleteWire(wireId: string) {
    const index = currentCircuit.value.components.findIndex(
      (c) => c.type === 'wire' && c.id === wireId,
    )
    if (index !== -1) {
      currentCircuit.value.components.splice(index, 1)
    }
  }

  function splitWireAndConnect(
    wireId: string,
    position: Position,
    newWireStartTerminal: { terminalId: string; componentId: string; position: Position },
  ) {
    const originalWire = currentCircuit.value.components.find((c) => c.id === wireId)
    if (!originalWire || originalWire.type !== 'wire' || !originalWire.properties) return

    // 1. Save original wire's endpoints
    const startComponentId = originalWire.properties.startComponentId as string
    const startTerminalId = originalWire.properties.startTerminal as string
    const endComponentId = originalWire.properties.endComponentId as string
    const endTerminalId = originalWire.properties.endTerminal as string

    // 2. Delete the original wire
    deleteWire(wireId)

    // 3. Create a new node at the split position
    const newNode = createComponent(currentCircuit.value, 'node', position) as CircuitNode
    if (!newNode) return
    addComponent(newNode)

    const nodeDef = getComponentDefinition('node')
    if (!nodeDef) return
    const nodeTerminal = {
      terminalId: nodeDef.terminals[0].id,
      componentId: newNode.id,
      position: newNode.position,
    }

    // 4. Create two new wires from original endpoints to the new node
    createWire(
      { componentId: startComponentId, terminalId: startTerminalId, position: { x: 0, y: 0 } },
      nodeTerminal,
    )
    createWire(
      { componentId: endComponentId, terminalId: endTerminalId, position: { x: 0, y: 0 } },
      nodeTerminal,
    )

    // 5. Connect the new wire to the new node
    createWire(newWireStartTerminal, nodeTerminal)
  }

  function createNodeAndConnectWire(
    startTerminal: { terminalId: string; componentId: string; position: Position },
    position: Position,
  ) {
    // 1. Create a new node at the specified position
    const newNode = createComponent(currentCircuit.value, 'node', position) as CircuitNode
    if (!newNode) return null
    addComponent(newNode)

    // 2. Get the new node's terminal information
    const nodeDef = getComponentDefinition('node')
    if (!nodeDef) return null

    const nodeTerminal = {
      terminalId: nodeDef.terminals[0].id,
      componentId: newNode.id,
      position: newNode.position,
    }

    // 3. Create the wire connecting the start terminal to the new node
    createWire(startTerminal, nodeTerminal)

    // 4. Return the new node's info for chained wiring
    return {
      nodeId: newNode.id,
      terminalId: nodeTerminal.terminalId,
    }
  }

  function addProbe(targetId: string, position: Position, type: 'voltage' | 'current') {
    const newProbe: Probe = {
      id: generateComponentId(currentCircuit.value, 'probe'),
      type,
      targetId,
      position,
      direction: true, // Default to forward direction for current probes
    }
    currentCircuit.value.probes.push(newProbe)
    const interactionStore = useInteractionStore()
    interactionStore.setProbeType(null) // Exit probe mode after placing one
  }

  function removeProbe(probeId: string) {
    const index = currentCircuit.value.probes.findIndex((p) => p.id === probeId)
    if (index > -1) {
      currentCircuit.value.probes.splice(index, 1)
    }
    const interactionStore = useInteractionStore()
    if (interactionStore.selectedComponentIds.includes(probeId)) {
      interactionStore.removeFromSelection(probeId)
    }
  }

  function updateProbePosition(probeId: string, position: Position) {
    const probe = currentCircuit.value.probes.find((p) => p.id === probeId)
    if (probe) {
      probe.position = position
    }
  }

  function updateProbeDirection(probeId: string, direction: boolean) {
    const probe = currentCircuit.value.probes.find((p) => p.id === probeId)
    if (probe) {
      probe.direction = direction
    }
  }

  function restoreCircuit(circuit: Circuit) {
    // Clear selection before restoring
    const interactionStore = useInteractionStore()
    interactionStore.clearSelection()
    interactionStore.cancelWireCreation()

    // Deep clone to avoid reference issues
    currentCircuit.value = JSON.parse(JSON.stringify(circuit))

    // Clear simulation state when restoring
    simulationResults.value = null
    dcSolution.value = null
    lastDcSolution.value = null
    simulationErrors.value = []
    hasValidSimulation.value = false
  }

  // Initialize history tracking
  function initializeHistory() {
    // This will be called from the main component to set up history tracking
  }

  return {
    // State
    currentCircuit,
    isSimulating,
    simulationResults,
    dcSolution,
    lastDcSolution,
    simulationErrors,
    hasValidSimulation,

    // Getters
    singleSelectedItem,
    componentCount,
    probeCount,

    // Actions
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    clearCircuit,
    startSimulation,
    validateCircuit,
    setDcSolution,
    createWire,
    deleteSelectedComponent,
    deleteWire,
    runDCSimulation,
    splitWireAndConnect,
    createNodeAndConnectWire,
    addProbe,
    removeProbe,
    updateProbePosition,
    updateProbeDirection,
    restoreCircuit,
    initializeHistory,
  }
})
