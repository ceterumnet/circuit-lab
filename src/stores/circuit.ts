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

  // Clipboard functionality
  const clipboardComponents = ref<CircuitComponent[]>([])

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

    // Note: Multiple voltage sources are now supported with the new simulation engine
    // No longer artificially limiting circuits to single voltage source

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

  // NEW: Split wire and connect directly to terminal (no intermediate node)
  function splitWireAndConnectDirect(
    wireId: string,
    newTerminal: { terminalId: string; componentId: string; position: Position },
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

    // 3. Create two new wires: original endpoints to the new terminal
    createWire(
      { componentId: startComponentId, terminalId: startTerminalId, position: { x: 0, y: 0 } },
      newTerminal,
    )
    createWire(
      { componentId: endComponentId, terminalId: endTerminalId, position: { x: 0, y: 0 } },
      newTerminal,
    )
  }

  // NEW: Split wire and connect multiple terminals at once (replaces wire section)
  function splitWireAndConnectMultiple(
    wireId: string,
    newTerminals: Array<{ terminalId: string; componentId: string; position: Position }>,
  ) {
    console.log(`[Circuit] splitWireAndConnectMultiple: wireId=${wireId}, terminals=`, newTerminals)

    const originalWire = currentCircuit.value.components.find((c) => c.id === wireId)
    if (!originalWire || originalWire.type !== 'wire' || !originalWire.properties) {
      console.error(`[Circuit] Original wire ${wireId} not found or invalid`)
      return
    }

    // 1. Save original wire's endpoints
    const startComponentId = originalWire.properties.startComponentId as string
    const startTerminalId = originalWire.properties.startTerminal as string
    const endComponentId = originalWire.properties.endComponentId as string
    const endTerminalId = originalWire.properties.endTerminal as string

    console.log(
      `[Circuit] Original wire endpoints: ${startComponentId}:${startTerminalId} -> ${endComponentId}:${endTerminalId}`,
    )

    // 2. Delete the original wire
    deleteWire(wireId)
    console.log(`[Circuit] Deleted original wire ${wireId}`)

    // 3. For components with exactly 2 terminals (like resistors), create series connection
    if (newTerminals.length === 2) {
      console.log(`[Circuit] Creating series connection for 2 terminals (no internal wire)`)
      // Connect: original_start -> terminal1, terminal2 -> original_end
      // The connection between terminal1 and terminal2 is implicit in the component
      console.log(
        `[Circuit] Creating wire: ${startComponentId}:${startTerminalId} -> ${newTerminals[0].componentId}:${newTerminals[0].terminalId}`,
      )
      createWire(
        { componentId: startComponentId, terminalId: startTerminalId, position: { x: 0, y: 0 } },
        newTerminals[0],
      )

      console.log(
        `[Circuit] Creating wire: ${newTerminals[1].componentId}:${newTerminals[1].terminalId} -> ${endComponentId}:${endTerminalId}`,
      )
      createWire(newTerminals[1], {
        componentId: endComponentId,
        terminalId: endTerminalId,
        position: { x: 0, y: 0 },
      })
    } else {
      console.log(`[Circuit] Creating parallel connections for ${newTerminals.length} terminals`)
      // For other cases (single terminal like nodes, or more complex), use original logic
      for (const newTerminal of newTerminals) {
        console.log(
          `[Circuit] Creating wire: ${startComponentId}:${startTerminalId} -> ${newTerminal.componentId}:${newTerminal.terminalId}`,
        )
        createWire(
          { componentId: startComponentId, terminalId: startTerminalId, position: { x: 0, y: 0 } },
          newTerminal,
        )
        console.log(
          `[Circuit] Creating wire: ${endComponentId}:${endTerminalId} -> ${newTerminal.componentId}:${newTerminal.terminalId}`,
        )
        createWire(
          { componentId: endComponentId, terminalId: endTerminalId, position: { x: 0, y: 0 } },
          newTerminal,
        )
      }
    }

    console.log(`[Circuit] splitWireAndConnectMultiple completed`)
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

  function saveCircuitToStorage(name: string): boolean {
    try {
      // Get existing saved circuits
      const savedCircuitsJson = localStorage.getItem('circuitlab_saved_circuits')
      const savedCircuits = savedCircuitsJson ? JSON.parse(savedCircuitsJson) : {}

      // Create save data with metadata
      const saveData = {
        circuit: JSON.parse(JSON.stringify(currentCircuit.value)),
        savedAt: new Date().toISOString(),
        name: name.trim() || 'Untitled Circuit',
      }

      // Update the circuit name if provided
      if (name.trim()) {
        currentCircuit.value.name = name.trim()
      }

      // Save to storage
      savedCircuits[name.trim() || 'Untitled Circuit'] = saveData
      localStorage.setItem('circuitlab_saved_circuits', JSON.stringify(savedCircuits))

      console.log(`[Circuit] Saved circuit: "${saveData.name}"`)
      return true
    } catch (error) {
      console.error('[Circuit] Failed to save circuit:', error)
      return false
    }
  }

  function loadCircuitFromStorage(name: string): boolean {
    try {
      const savedCircuitsJson = localStorage.getItem('circuitlab_saved_circuits')
      if (!savedCircuitsJson) {
        console.warn('[Circuit] No saved circuits found')
        return false
      }

      const savedCircuits = JSON.parse(savedCircuitsJson)
      const saveData = savedCircuits[name]

      if (!saveData || !saveData.circuit) {
        console.warn(`[Circuit] Circuit "${name}" not found`)
        return false
      }

      restoreCircuit(saveData.circuit)
      console.log(`[Circuit] Loaded circuit: "${name}" (saved ${saveData.savedAt})`)
      return true
    } catch (error) {
      console.error('[Circuit] Failed to load circuit:', error)
      return false
    }
  }

  function getSavedCircuits(): Array<{ name: string; savedAt: string }> {
    try {
      const savedCircuitsJson = localStorage.getItem('circuitlab_saved_circuits')
      if (!savedCircuitsJson) return []

      const savedCircuits = JSON.parse(savedCircuitsJson)
      return Object.keys(savedCircuits)
        .map((name) => ({
          name,
          savedAt: savedCircuits[name].savedAt,
        }))
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    } catch (error) {
      console.error('[Circuit] Failed to get saved circuits:', error)
      return []
    }
  }

  function deleteCircuitFromStorage(name: string): boolean {
    try {
      const savedCircuitsJson = localStorage.getItem('circuitlab_saved_circuits')
      if (!savedCircuitsJson) return false

      const savedCircuits = JSON.parse(savedCircuitsJson)
      if (!(name in savedCircuits)) return false

      delete savedCircuits[name]
      localStorage.setItem('circuitlab_saved_circuits', JSON.stringify(savedCircuits))
      console.log(`[Circuit] Deleted circuit: "${name}"`)
      return true
    } catch (error) {
      console.error('[Circuit] Failed to delete circuit:', error)
      return false
    }
  }

  function exportCircuitAsJSON(): string {
    return JSON.stringify(currentCircuit.value, null, 2)
  }

  function importCircuitFromJSON(jsonString: string): boolean {
    try {
      const circuit = JSON.parse(jsonString) as Circuit

      // Basic validation
      if (!circuit.id || !circuit.components || !Array.isArray(circuit.components)) {
        throw new Error('Invalid circuit format')
      }

      restoreCircuit(circuit)
      console.log(`[Circuit] Imported circuit: "${circuit.name}"`)
      return true
    } catch (error) {
      console.error('[Circuit] Failed to import circuit:', error)
      return false
    }
  }

  // Initialize history tracking
  function initializeHistory() {
    // This will be called from the main component to set up history tracking
  }

  // Copy selected components to clipboard
  function copySelectedComponents() {
    const interactionStore = useInteractionStore()
    const selectedIds = interactionStore.selectedComponentIds

    if (selectedIds.length === 0) {
      console.log('No components selected to copy')
      return false
    }

    // Get selected components (excluding wires for now - they're more complex)
    const componentsToCopy = currentCircuit.value.components.filter(
      (c) => selectedIds.includes(c.id) && c.type !== 'wire',
    )

    if (componentsToCopy.length === 0) {
      console.log('No copyable components selected')
      return false
    }

    // Deep copy the components to avoid reference issues
    clipboardComponents.value = componentsToCopy.map((component) => ({
      ...component,
      properties: component.properties ? { ...component.properties } : undefined,
    }))

    console.log(`Copied ${clipboardComponents.value.length} components to clipboard`)
    return true
  }

  // Paste components from clipboard
  function pasteComponents() {
    if (clipboardComponents.value.length === 0) {
      console.log('No components in clipboard to paste')
      return false
    }

    const interactionStore = useInteractionStore()
    const pastedIds: string[] = []

    // Calculate offset to avoid overlapping with originals
    const PASTE_OFFSET = 50

    // Find the bounding box center of clipboard components
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    clipboardComponents.value.forEach((component) => {
      minX = Math.min(minX, component.position.x)
      minY = Math.min(minY, component.position.y)
      maxX = Math.max(maxX, component.position.x)
      maxY = Math.max(maxY, component.position.y)
    })

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Paste each component with new ID and offset position
    clipboardComponents.value.forEach((originalComponent) => {
      // Generate new unique ID
      const newId = generateComponentId(currentCircuit.value, originalComponent.type)

      // Calculate relative position from center and apply offset
      const relativeX = originalComponent.position.x - centerX
      const relativeY = originalComponent.position.y - centerY
      const newPosition = {
        x: centerX + relativeX + PASTE_OFFSET,
        y: centerY + relativeY + PASTE_OFFSET,
      }

      // Create new component with new ID and position
      const newComponent: CircuitComponent = {
        ...originalComponent,
        id: newId,
        position: newPosition,
        selected: false, // Don't select pasted components initially
        properties: originalComponent.properties ? { ...originalComponent.properties } : undefined,
      }

      // Add to circuit
      addComponent(newComponent)
      pastedIds.push(newId)
    })

    // Select the pasted components
    interactionStore.clearSelection()
    pastedIds.forEach((id) => interactionStore.addToSelection(id))

    console.log(`Pasted ${pastedIds.length} components with IDs: ${pastedIds.join(', ')}`)
    return true
  }

  // Check if clipboard has components
  function hasClipboardContent() {
    return clipboardComponents.value.length > 0
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
    splitWireAndConnectDirect,
    splitWireAndConnectMultiple,
    createNodeAndConnectWire,
    addProbe,
    removeProbe,
    updateProbePosition,
    updateProbeDirection,
    restoreCircuit,
    saveCircuitToStorage,
    loadCircuitFromStorage,
    getSavedCircuits,
    deleteCircuitFromStorage,
    exportCircuitAsJSON,
    importCircuitFromJSON,
    initializeHistory,
    copySelectedComponents,
    pasteComponents,
    hasClipboardContent,
  }
})
