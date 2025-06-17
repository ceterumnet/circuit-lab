import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Circuit,
  CircuitComponent,
  Position,
  SimulationResult,
  Wire,
  CircuitNode,
} from '@/types/components'
import type { DC_Result } from '@/services/simulation'
import { generateComponentId } from '@/services/componentFactory'
import { useInteractionStore } from './interaction'
import { solveDC } from '@/services/simulation'

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
  const dcSolution = ref<DC_Result | null>(null);
  const lastDcSolution = ref<DC_Result | null>(null);

  const interactionStore = useInteractionStore()

  // Getters
  const singleSelectedComponent = computed(() => {
    const ids = interactionStore.selectedComponentIds
    if (ids.length !== 1) return null
    return currentCircuit.value.components.find((c) => c.id === ids[0]) || null
  })

  const componentCount = computed(() => currentCircuit.value.components.length)

  // Actions
  function addComponent(component: CircuitComponent) {
    currentCircuit.value.components.push(component)
  }

  function removeComponent(componentId: string) {
    const componentToRemove = currentCircuit.value.components.find(c => c.id === componentId);
    if (!componentToRemove) return;

    // Find wires connected to the component being removed
    const wiresToRemove = currentCircuit.value.components.filter(c => {
      if (c.type !== 'wire') return false;
      const props = c.properties;
      return props?.startComponentId === componentId || props?.endComponentId === componentId;
    }).map(w => w.id);

    // Remove the component
    const componentIndex = currentCircuit.value.components.findIndex((c) => c.id === componentId)
    if (componentIndex !== -1) {
      currentCircuit.value.components.splice(componentIndex, 1)
    }

    // Remove the connected wires
    for (const wireId of wiresToRemove) {
      const wireIndex = currentCircuit.value.components.findIndex(c => c.id === wireId);
      if (wireIndex !== -1) {
        currentCircuit.value.components.splice(wireIndex, 1);
      }
    }

    if (interactionStore.selectedComponentIds.includes(componentId)) {
      interactionStore.removeFromSelection(componentId)
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
    dcSolution.value = null;
    lastDcSolution.value = null;
  }

  async function runDCSimulation() {
    try {
      const solution = await solveDC(currentCircuit.value);
      dcSolution.value = solution;
      lastDcSolution.value = dcSolution.value
    } catch (error) {
      console.error('DC analysis failed:', error);
      // Restore the last valid solution if the current one fails
      dcSolution.value = lastDcSolution.value;
    }
  }

  watch(
    () => currentCircuit.value,
    () => {
      runDCSimulation()
    },
    { deep: true }
  )

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

  function setDcSolution(solution: DC_Result | null) {
    dcSolution.value = solution;
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
    interactionStore.selectedComponentIds.forEach(id => {
      removeComponent(id)
    })
    interactionStore.clearSelection()
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
    dcSolution,
    lastDcSolution,

    // Getters
    singleSelectedComponent,
    componentCount,

    // Actions
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    clearCircuit,
    startSimulation,
    setDcSolution,
    createWire,
    deleteSelectedComponent,
    deleteWire,
    runDCSimulation,
  }
})
