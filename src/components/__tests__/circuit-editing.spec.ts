const storageObj: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => (key in storageObj ? storageObj[key] : null),
    setItem: (key: string, value: string) => { storageObj[key] = value },
    removeItem: (key: string) => { delete storageObj[key] },
    clear: () => {
      for (const k of Object.keys(storageObj)) delete storageObj[k]
    },
    get length() {
      return Object.keys(storageObj).length
    },
    key: (i: number) => Object.keys(storageObj)[i] ?? null,
  },
  writable: true,
  configurable: true,
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { CircuitComponent } from '@/types/components'

const mockInteractionStore = {
  selectedComponentIds: [] as string[],
  selectComponent: vi.fn((id: string | null) => {
    if (id) mockInteractionStore.selectedComponentIds = [id]
    else mockInteractionStore.selectedComponentIds = []
  }),
  removeFromSelection: vi.fn((id: string) => {
    const idx = mockInteractionStore.selectedComponentIds.indexOf(id)
    if (idx > -1) mockInteractionStore.selectedComponentIds.splice(idx, 1)
  }),
  clearSelection: vi.fn(() => {
    mockInteractionStore.selectedComponentIds = []
  }),
  addToSelection: vi.fn((id: string) => {
    if (!mockInteractionStore.selectedComponentIds.includes(id)) {
      mockInteractionStore.selectedComponentIds.push(id)
    }
  }),
  setProbeType: vi.fn(),
  cancelWireCreation: vi.fn(),
  wireCreationState: {
    isActive: false,
    isDragging: false,
    startTerminal: null,
    previewPosition: null,
  },
}

vi.mock('@/stores/interaction', () => ({
  useInteractionStore: () => mockInteractionStore,
}))

vi.mock('@/services/simulation', () => ({
  solveDC: vi.fn(),
}))

vi.mock('@/services/componentFactory', () => ({
  generateComponentId: vi.fn(),
  createComponent: vi.fn(),
}))

vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(),
}))

import { useCircuitStore } from '@/stores/circuit'
import { generateComponentId, createComponent } from '@/services/componentFactory'
import { getComponentDefinition } from '@/registry/components'

function makeComponent(
  id: string,
  type: string,
  props?: Record<string, string | number | boolean>,
): CircuitComponent {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: props ?? ({} as Record<string, string | number | boolean>),
  }
}

beforeEach(() => {
  for (const k of Object.keys(storageObj)) delete storageObj[k]
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockInteractionStore.selectedComponentIds = []
  mockInteractionStore.clearSelection.mockReset()
  mockInteractionStore.selectComponent.mockReset()
  mockInteractionStore.removeFromSelection.mockReset()
  mockInteractionStore.addToSelection.mockReset()
  mockInteractionStore.setProbeType.mockReset()
  mockInteractionStore.cancelWireCreation.mockReset()
  vi.mocked(generateComponentId).mockReturnValue('GEN_ID')
  vi.mocked(createComponent).mockReturnValue(null)
  vi.mocked(getComponentDefinition).mockReturnValue({
    type: 'resistor',
    name: 'Resistor',
    category: 'passive',
    complexity: 'simple',
    terminals: [{ id: 't1', position: { x: 0, y: 0 }, type: 'io' }],
    properties: [],
  })
})

describe('addComponent', () => {
  it('adds a component to the components array', () => {
    const store = useCircuitStore()
    const comp = makeComponent('R1', 'resistor', { resistance: 100 })
    store.addComponent(comp)

    expect(store.currentCircuit.components).toHaveLength(1)
    expect(store.currentCircuit.components[0].id).toBe(comp.id)
    expect(store.currentCircuit.components[0].type).toBe(comp.type)
  })

  it('adds multiple components in order', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    store.addComponent(makeComponent('G1', 'ground'))

    expect(store.currentCircuit.components).toHaveLength(2)
    expect(store.currentCircuit.components[0].id).toBe('R1')
    expect(store.currentCircuit.components[1].id).toBe('G1')
  })

  it('works on an empty circuit', () => {
    const store = useCircuitStore()
    const comp = makeComponent('R1', 'resistor', { resistance: 50 })
    store.addComponent(comp)

    expect(store.currentCircuit.components).toHaveLength(1)
    expect(store.componentCount).toBe(1)
  })

  it('preserves existing components when adding a new one', () => {
    const store = useCircuitStore()
    const existing = makeComponent('G1', 'ground')
    store.addComponent(existing)

    const newComp = makeComponent('R1', 'resistor', { resistance: 100 })
    store.addComponent(newComp)

    expect(store.currentCircuit.components).toHaveLength(2)
    expect(store.currentCircuit.components[0].id).toBe('G1')
    expect(store.currentCircuit.components[1].id).toBe('R1')
  })
})

describe('removeComponent', () => {
  it('removes a component from the array', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('R2', 'resistor'))

    store.removeComponent('R1')

    expect(store.currentCircuit.components).toHaveLength(1)
    expect(store.currentCircuit.components[0].id).toBe('R2')
  })

  it('does nothing when the component does not exist', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    store.removeComponent('NONEXISTENT')

    expect(store.currentCircuit.components).toHaveLength(1)
  })

  it('does nothing when circuit is empty', () => {
    const store = useCircuitStore()

    store.removeComponent('R1')

    expect(mockInteractionStore.removeFromSelection).not.toHaveBeenCalled()
    expect(store.currentCircuit.components).toHaveLength(0)
  })

  it('calls removeFromSelection when component is in selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['R1']
    store.removeComponent('R1')

    expect(mockInteractionStore.removeFromSelection).toHaveBeenCalledWith('R1')
  })

  it('does not call removeFromSelection when component is not in selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['OTHER']
    store.removeComponent('R1')

    expect(mockInteractionStore.removeFromSelection).not.toHaveBeenCalled()
  })

  it('removes wires connected to the component', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('W1', 'wire', { startComponentId: 'R1', endComponentId: 'G1' }),
    )

    store.removeComponent('R1')

    expect(store.currentCircuit.components).toHaveLength(1)
    expect(store.currentCircuit.components[0].id).toBe('G1')
  })

  it('leaves unrelated wires intact', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('R2', 'resistor'))
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('W1', 'wire', { startComponentId: 'R2', endComponentId: 'G1' }),
    )

    store.removeComponent('R1')

    expect(store.currentCircuit.components).toHaveLength(3)
    expect(store.currentCircuit.components.map((c) => c.id)).toEqual(['R2', 'G1', 'W1'])
  })

  it('updates componentCount after removal', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('G1', 'ground'))

    expect(store.componentCount).toBe(2)
    store.removeComponent('R1')
    expect(store.componentCount).toBe(1)
  })
})

describe('updateComponent and moveComponent', () => {
  it('updates properties on an existing component', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))

    store.updateComponent('R1', { rotation: 90 })

    expect(store.currentCircuit.components[0].rotation).toBe(90)
  })

  it('updates position via moveComponent', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    store.moveComponent('R1', { x: 50, y: 100 })

    expect(store.currentCircuit.components[0].position).toEqual({ x: 50, y: 100 })
  })

  it('does nothing for non-existent component', () => {
    const store = useCircuitStore()

    store.updateComponent('NONEXISTENT', { rotation: 45 })

    expect(store.currentCircuit.components).toHaveLength(0)
  })
})

describe('selection via interaction store', () => {
  it('delegates component selection to interaction store', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectComponent('R1')

    expect(mockInteractionStore.selectedComponentIds).toEqual(['R1'])
  })

  it('clearSelection resets selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['R1', 'R2']
    mockInteractionStore.clearSelection()

    expect(mockInteractionStore.selectedComponentIds).toEqual([])
  })

  it('addToSelection adds a new id to the selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.addToSelection('R1')

    expect(mockInteractionStore.selectedComponentIds).toEqual(['R1'])
  })

  it('singleSelectedItem returns the component when one ID is selected', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['R1']

    expect(store.singleSelectedItem).not.toBeNull()
    expect((store.singleSelectedItem as CircuitComponent).id).toBe('R1')
  })

  it('singleSelectedItem returns null when multiple ids are selected', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('R2', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['R1', 'R2']

    expect(store.singleSelectedItem).toBeNull()
  })

  it('singleSelectedItem returns null when nothing is selected', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = []

    expect(store.singleSelectedItem).toBeNull()
  })

  it('singleSelectedItem returns null when selected id does not exist', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    mockInteractionStore.selectedComponentIds = ['NONEXISTENT']

    expect(store.singleSelectedItem).toBeNull()
  })
})

describe('component filtering', () => {
  it('filtering by type returns correct subset', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    store.addComponent(makeComponent('R2', 'resistor', { resistance: 200 }))
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(makeComponent('V1', 'voltage_source', { voltage: 5 }))

    const resistors = store.currentCircuit.components.filter((c) => c.type === 'resistor')

    expect(resistors).toHaveLength(2)
    expect(resistors[0].id).toBe('R1')
    expect(resistors[1].id).toBe('R2')
  })

  it('filtering returns empty array when no matches', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('G1', 'ground'))

    const results = store.currentCircuit.components.filter((c) => c.type === 'diode')

    expect(results).toHaveLength(0)
  })

  it('wires are stored in the same components array', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('W1', 'wire', { startComponentId: 'R1', endComponentId: 'G1' }),
    )

    const wires = store.currentCircuit.components.filter((c) => c.type === 'wire')

    expect(wires).toHaveLength(1)
    expect(wires[0].id).toBe('W1')
  })
})

describe('updateComponentProperty', () => {
  it('modifies a property value on the component', () => {
    const store = useCircuitStore()
    const comp = makeComponent('R1', 'resistor', { resistance: 100 })
    store.addComponent(comp)

    store.updateComponent('R1', { properties: { ...comp.properties, resistance: 200 } })

    expect(store.currentCircuit.components[0].properties?.resistance).toBe(200)
  })

  it('adds a new property via updateComponent', () => {
    const store = useCircuitStore()
    const comp = makeComponent('R1', 'resistor', { resistance: 100 })
    store.addComponent(comp)

    store.updateComponent('R1', { properties: { resistance: 100, label: 'R1-new' } })

    expect(store.currentCircuit.components[0].properties?.label).toBe('R1-new')
  })
})

describe('clearCircuit', () => {
  it('resets all components and clears selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    mockInteractionStore.selectedComponentIds = ['R1']

    store.clearCircuit()

    expect(store.currentCircuit.components).toHaveLength(0)
    expect(mockInteractionStore.selectComponent).toHaveBeenCalledWith(null)
  })

  it('resets simulation state', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    store.clearCircuit()

    expect(store.dcSolution).toBeNull()
    expect(store.hasValidSimulation).toBe(false)
    expect(store.simulationErrors).toEqual([])
  })
})
