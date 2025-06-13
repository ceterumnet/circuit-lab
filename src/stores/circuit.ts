import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Circuit,
  CircuitComponent,
  ComponentType,
  Position,
  SimulationResult,
  Resistor,
  VoltageSource,
  Ground,
} from '@/types/circuit'

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

  return {
    // State
    currentCircuit,
    selectedComponentId,
    isSimulating,
    simulationResults,

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
  }
})
