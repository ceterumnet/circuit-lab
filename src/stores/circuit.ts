import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Circuit,
  CircuitComponent,
  Position,
  SimulationResult,
  Wire,
  CircuitNode,
} from '@/types/components'
import { generateComponentId } from '@/services/componentFactory'
import { useInteractionStore } from './interaction'

export const useCircuitStore = defineStore('circuit', () => {
  // State
  const currentCircuit = ref<Circuit>({
    id: 'default',
    name: 'New Circuit',
    components: [],
    nodes: {},
  })

  const isSimulating = ref(false)
  const simulationResults = ref<SimulationResult | null>(null)

  const interactionStore = useInteractionStore()

  // Getters
  const selectedComponent = computed(() => {
    if (!interactionStore.selectedComponentId) return null
    return currentCircuit.value.components.find((c) => c.id === interactionStore.selectedComponentId) || null
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
      if (interactionStore.selectedComponentId === componentId) {
        interactionStore.selectComponent(null)
      }
    }
  }

  function updateComponent(
    componentId: string,
    updates: Partial<Wire | CircuitNode>,
  ) {
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
      nodes: {},
    }
    interactionStore.selectComponent(null)
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
    if (interactionStore.selectedComponentId) {
      removeComponent(interactionStore.selectedComponentId)
    }
  }

  function deleteWire(wireId: string) {
    const index = currentCircuit.value.components.findIndex(
      (c) => c.type === 'wire' && c.id === wireId
    );
    if (index !== -1) {
      currentCircuit.value.components.splice(index, 1);
    }
  }

  return {
    // State
    currentCircuit,
    isSimulating,
    simulationResults,

    // Getters
    selectedComponent,
    componentCount,

    // Actions
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    clearCircuit,
    startSimulation,
    createWire,
    deleteSelectedComponent,
    deleteWire,
  }
})
