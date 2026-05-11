// Set up localStorage BEFORE any imports (vue-devtools-kit checks at module load time)
// biome-ignore lint: this needs to be the first line
// biome-ignore lint: storageObj is used in the getters/setters below
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
import type { CircuitComponent, Circuit, Probe, Position } from '@/types/components'

// -- Mock interaction store --
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

// -- Mock simulation service --
vi.mock('@/services/simulation', () => ({
  solveDC: vi.fn(),
}))

// -- Mock component factory --
vi.mock('@/services/componentFactory', () => ({
  generateComponentId: vi.fn(),
  createComponent: vi.fn(),
}))

// -- Mock registry --
vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(),
}))

import { useCircuitStore } from '@/stores/circuit'
import { solveDC, type DC_Result } from '@/services/simulation'
import { generateComponentId, createComponent } from '@/services/componentFactory'
import { getComponentDefinition } from '@/registry/components'

// -- Helper --
function makeComponent(
  id: string,
  type: string,
  props?: { [key: string]: string | number | boolean | Position },
): CircuitComponent {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: props ?? {},
  }
}

function buildConnectedCircuit(store: ReturnType<typeof useCircuitStore>): void {
  store.addComponent(makeComponent('V1', 'voltage_source', { voltage: 5 }))
  store.addComponent(makeComponent('R1', 'resistor', { resistance: 1000 }))
  store.addComponent(makeComponent('G1', 'ground'))
  store.addComponent(
    makeComponent('W1', 'wire', {
      startComponentId: 'V1',
      startTerminal: 'positive',
      endComponentId: 'R1',
      endTerminal: 'terminal1',
    }),
  )
  store.addComponent(
    makeComponent('W2', 'wire', {
      startComponentId: 'V1',
      startTerminal: 'negative',
      endComponentId: 'G1',
      endTerminal: 'terminal',
    }),
  )
  store.addComponent(
    makeComponent('W3', 'wire', {
      startComponentId: 'R1',
      startTerminal: 'terminal2',
      endComponentId: 'G1',
      endTerminal: 'terminal',
    }),
  )
}

// -- beforeEach --
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
  vi.mocked(solveDC).mockResolvedValue(null)
  vi.mocked(generateComponentId).mockReturnValue('GEN_ID')
  vi.mocked(createComponent).mockReturnValue(null)
  vi.mocked(getComponentDefinition).mockReturnValue({
    type: 'resistor',
    name: 'Resistor',
    category: 'passive',
    complexity: 'simple',
    terminals: [{ id: 't1', position: { x: 0, y: 0 }, type: 'io' as const }],
    properties: [],
  })
})

// =====================================================================
describe('State Defaults', () => {
  it('initializes with default circuit (id="default", name="New Circuit", empty arrays)', () => {
    const store = useCircuitStore()
    expect(store.currentCircuit.id).toBe('default')
    expect(store.currentCircuit.name).toBe('New Circuit')
    expect(store.currentCircuit.components).toEqual([])
    expect(store.currentCircuit.wires).toEqual([])
    expect(store.currentCircuit.probes).toEqual([])
  })

  it('initializes simulation state clean (isSimulating=false, dcSolution=null, errors=[], hasValid=false)', () => {
    const store = useCircuitStore()
    expect(store.isSimulating).toBe(false)
    expect(store.dcSolution).toBe(null)
    expect(store.simulationErrors).toEqual([])
    expect(store.hasValidSimulation).toBe(false)
  })

  it('initializes real-time defaults (isRealTime=false, throttle=100)', () => {
    const store = useCircuitStore()
    expect(store.isRealTimeSimulation).toBe(false)
    expect(store.simulationThrottleMs).toBe(100)
  })

  it('initializes clipboard empty', () => {
    const store = useCircuitStore()
    expect(store.getClipboardData().components).toEqual([])
    expect(store.getClipboardData().wires).toEqual([])
    expect(store.getClipboardData().probes).toEqual([])
  })
})

// =====================================================================
describe('addComponent / removeComponent / updateComponent', () => {
  it('addComponent pushes to array', () => {
    const store = useCircuitStore()
    const comp = makeComponent('R1', 'resistor', { resistance: 100 })
    store.addComponent(comp)
    expect(store.currentCircuit.components).toHaveLength(1)
    expect(store.currentCircuit.components[0].id).toBe('R1')
  })

  it('removeComponent removes from array', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.removeComponent('R1')
    expect(store.currentCircuit.components).toHaveLength(0)
  })

  it('removeComponent removes connected wires', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'R1',
        endComponentId: 'G1',
      }),
    )
    store.removeComponent('R1')
    expect(store.currentCircuit.components).toHaveLength(0)
  })

  it('removeComponent no-op for non-existent ID', () => {
    const store = useCircuitStore()
    store.removeComponent('NONEXISTENT')
    expect(store.currentCircuit.components).toHaveLength(0)
  })

  it('removeComponent removes from interaction selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    mockInteractionStore.selectedComponentIds = ['R1']
    store.removeComponent('R1')
    expect(mockInteractionStore.removeFromSelection).toHaveBeenCalledWith('R1')
  })

  it('updateComponent applies partial updates via Object.assign', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    store.updateComponent('R1', { rotation: 90 })
    expect(store.currentCircuit.components[0].rotation).toBe(90)
  })

  it('moveComponent delegates to updateComponent', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.moveComponent('R1', { x: 10, y: 20 })
    expect(store.currentCircuit.components[0].position).toEqual({ x: 10, y: 20 })
  })
})

// =====================================================================
describe('createWire', () => {
  it('creates wire object with correct structure and adds to components', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('W1')

    store.createWire(
      { terminalId: 't1', componentId: 'R1', position: { x: 0, y: 0 } },
      { terminalId: 't2', componentId: 'R2', position: { x: 10, y: 10 } },
    )

    expect(store.currentCircuit.components).toHaveLength(1)
    const wire = store.currentCircuit.components[0]
    expect(wire.type).toBe('wire')
    expect(wire.id).toBe('W1')
    expect(wire.properties?.startTerminal).toBe('t1')
    expect(wire.properties?.startComponentId).toBe('R1')
    expect(wire.properties?.endTerminal).toBe('t2')
    expect(wire.properties?.endComponentId).toBe('R2')
  })

  it('generates unique ID via generateComponentId', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('UNIQUE_ID')

    store.createWire(
      { terminalId: 't1', componentId: 'R1', position: { x: 0, y: 0 } },
      { terminalId: 't2', componentId: 'R2', position: { x: 0, y: 0 } },
    )

    expect(generateComponentId).toHaveBeenCalledWith(store.currentCircuit, 'wire')
  })
})

// =====================================================================
describe('validateCircuit', () => {
  it('error when no ground and no voltage source', () => {
    const store = useCircuitStore()
    const errors = store.validateCircuit()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('ground')
  })

  it('passes when ground exists (connected via self-loop wire)', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        startTerminal: 'terminal',
        endComponentId: 'G1',
        endTerminal: 'terminal',
      }),
    )
    const errors = store.validateCircuit()
    expect(errors.length).toBe(0)
  })

  it('passes when ground + voltage source + resistor all connected', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('V1', 'voltage_source', { voltage: 5 }),
    )
    store.addComponent(
      makeComponent('R1', 'resistor', { resistance: 100 }),
    )
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'R1',
        endTerminal: 'terminal1',
      }),
    )
    store.addComponent(
      makeComponent('W2', 'wire', {
        startComponentId: 'R1',
        startTerminal: 'terminal2',
        endComponentId: 'G1',
        endTerminal: 'terminal',
      }),
    )
    store.addComponent(
      makeComponent('W3', 'wire', {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'G1',
        endTerminal: 'terminal',
      }),
    )
    const errors = store.validateCircuit()
    expect(errors.length).toBe(0)
  })

  it('passes when voltage source exists', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('V1', 'voltage_source', { voltage: 5 }),
    )
    store.addComponent(
      makeComponent('R1', 'resistor', { resistance: 100 }),
    )
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'V1',
        endComponentId: 'R1',
      }),
    )
    const errors = store.validateCircuit()
    expect(errors.length).toBe(0)
  })

  it('detects floating components (no wires connected)', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('R1', 'resistor', { resistance: 100 }),
    )
    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('not connected'))).toBe(true)
  })

  it('ignores wires and nodes in floating component check', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'G1',
      }),
    )
    store.addComponent(makeComponent('N1', 'node'))
    const errors = store.validateCircuit()
    expect(errors.length).toBe(0)
  })

  it('validates resistor resistance > 0 (errors for 0, -1, undefined)', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))

    // resistance = 0
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 0 }))
    let errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('resistance'))).toBe(true)

    // start fresh for -1
    store.clearCircuit()
    store.addComponent(makeComponent('G2', 'ground'))
    store.addComponent(makeComponent('R2', 'resistor', { resistance: -1 }))
    errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('resistance'))).toBe(true)

    // start fresh for undefined
    store.clearCircuit()
    store.addComponent(makeComponent('G3', 'ground'))
    store.addComponent(makeComponent('R3', 'resistor', {}))
    errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('resistance'))).toBe(true)
  })

  it('validates voltage_source voltage != 0', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('V1', 'voltage_source', { voltage: 0 }),
    )
    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('voltage'))).toBe(true)
  })

  it('validates current_source current != 0', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('I1', 'current_source', { current: 0 }),
    )
    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('current'))).toBe(true)
  })
})

// =====================================================================
describe('runDCSimulation', () => {
  it('sets isSimulating=true during execution', async () => {
    const store = useCircuitStore()
    buildConnectedCircuit(store)

    let resolveLater: (v: DC_Result) => void
    vi.mocked(solveDC).mockReturnValue(
      new Promise((resolve) => {
        resolveLater = resolve
      }),
    )

    const promise = store.runDCSimulation()

    expect(store.isSimulating).toBe(true)

    resolveLater!({
      voltages: {},
      currents: {},
      termToNodeIndex: new Map(),
    })

    await promise
  })

  it('returns false and sets errors when validation fails', async () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    const result = await store.runDCSimulation()

    expect(result).toBe(false)
    expect(store.simulationErrors.length).toBeGreaterThan(0)
  })

  it('sets dcSolution and hasValidSimulation=true on success', async () => {
    const store = useCircuitStore()
    buildConnectedCircuit(store)

    const mockSolution = {
      voltages: { 0: 0 },
      currents: {},
      termToNodeIndex: new Map(),
    }
    vi.mocked(solveDC).mockResolvedValue(mockSolution)

    const result = await store.runDCSimulation()

    expect(result).toBe(true)
    expect(store.dcSolution).toStrictEqual(mockSolution)
    expect(store.hasValidSimulation).toBe(true)
  })

  it('captures floatingNodeWarnings in simulationWarnings', async () => {
    const store = useCircuitStore()
    buildConnectedCircuit(store)

    const mockSolution = {
      voltages: {},
      currents: {},
      termToNodeIndex: new Map(),
      floatingNodeWarnings: ['Node 1 is floating'],
    }
    vi.mocked(solveDC).mockResolvedValue(mockSolution)

    await store.runDCSimulation()

    expect(store.simulationWarnings).toEqual(['Node 1 is floating'])
  })

  it('handles solveDC returning null (convergence failure)', async () => {
    const store = useCircuitStore()
    buildConnectedCircuit(store)
    vi.mocked(solveDC).mockResolvedValue(null)

    const result = await store.runDCSimulation()

    expect(result).toBe(false)
    expect(store.dcSolution).toBe(null)
    expect(store.simulationErrors.length).toBeGreaterThan(0)
  })

  it('catches exceptions', async () => {
    const store = useCircuitStore()
    buildConnectedCircuit(store)
    vi.mocked(solveDC).mockRejectedValue(new Error('solver crash'))

    const result = await store.runDCSimulation()

    expect(result).toBe(false)
    expect(store.simulationErrors[0]).toContain('solver crash')
    expect(store.dcSolution).toBe(null)
  })
})

// =====================================================================
describe('clearCircuit', () => {
  it('resets all circuit data to defaults', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    store.clearCircuit()

    expect(store.currentCircuit.components).toEqual([])
    expect(store.currentCircuit.name).toBe('New Circuit')
  })

  it('clears interaction store and simulation state', () => {
    const store = useCircuitStore()
    mockInteractionStore.selectedComponentIds = ['R1']

    store.clearCircuit()

    expect(mockInteractionStore.selectComponent).toHaveBeenCalledWith(null)
    expect(store.dcSolution).toBe(null)
    expect(store.hasValidSimulation).toBe(false)
    expect(store.simulationErrors).toEqual([])
  })
})

// =====================================================================
describe('Probes', () => {
  it('addProbe creates probe and exits probe mode (interaction store)', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('P1')

    store.addProbe('W1', { x: 10, y: 20 }, 'voltage')

    expect(store.currentCircuit.probes).toHaveLength(1)
    const probe = store.currentCircuit.probes[0]
    expect(probe.id).toBe('P1')
    expect(probe.type).toBe('voltage')
    expect(probe.targetId).toBe('W1')
    expect(mockInteractionStore.setProbeType).toHaveBeenCalledWith(null)
  })

  it('removeProbe removes probe', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('W1', { x: 10, y: 20 }, 'voltage')

    store.removeProbe('P1')

    expect(store.currentCircuit.probes).toHaveLength(0)
  })

  it('removeProbe no-op for non-existent', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('W1', { x: 10, y: 20 }, 'voltage')

    store.removeProbe('NONEXISTENT')

    expect(store.currentCircuit.probes).toHaveLength(1)
  })

  it('updateProbePosition / updateProbeDirection', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('W1', { x: 10, y: 20 }, 'current')

    store.updateProbePosition('P1', { x: 50, y: 60 })
    expect(store.currentCircuit.probes[0].position).toEqual({ x: 50, y: 60 })

    store.updateProbeDirection('P1', false)
    expect(store.currentCircuit.probes[0].direction).toBe(false)
  })
})

// =====================================================================
describe('Wire Splitting', () => {
  beforeEach(() => {
    vi.mocked(generateComponentId).mockImplementation(() => 'WIRE_ID')
    vi.mocked(createComponent).mockReturnValue({
      id: 'NODE_ID',
      type: 'node',
      position: { x: 5, y: 5 },
      rotation: 0,
      selected: false,
    } as CircuitComponent)
    vi.mocked(getComponentDefinition).mockReturnValue({
      type: 'wire',
      name: 'Wire',
      category: 'connection',
      complexity: 'simple',
      terminals: [{ id: 't1', position: { x: 0, y: 0 }, type: 'io' as const }],
      properties: [],
    })
  })

  it('splitWireAndConnect creates Y-junction (3 wires + 1 node, original deleted)', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('W_orig', 'wire', {
        startComponentId: 'R1',
        startTerminal: 't1',
        endComponentId: 'R2',
        endTerminal: 't2',
      }),
    )

    let callCount = 0
    vi.mocked(generateComponentId).mockImplementation(() => {
      callCount++
      if (callCount <= 3) return `W_new${callCount}`
      return 'NODE_ID'
    })

    store.splitWireAndConnect('W_orig', { x: 5, y: 5 }, {
      terminalId: 't3',
      componentId: 'R3',
      position: { x: 5, y: 5 },
    })

    // Original deleted, 1 node + 3 wires added
    const wires = store.currentCircuit.components.filter((c) => c.type === 'wire')
    const nodes = store.currentCircuit.components.filter((c) => c.type === 'node')
    expect(wires).toHaveLength(3)
    expect(nodes).toHaveLength(1)
  })

  it('splitWireAndConnect no-op for non-existent wire', () => {
    const store = useCircuitStore()
    const initialLen = store.currentCircuit.components.length
    store.splitWireAndConnect('NOTHERE', { x: 0, y: 0 }, {
      terminalId: 't1',
      componentId: 'R1',
      position: { x: 0, y: 0 },
    })
    expect(store.currentCircuit.components.length).toBe(initialLen)
  })

  it('splitWireAndConnectDirect creates T-junction (2 wires, no node)', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('W_orig', 'wire', {
        startComponentId: 'R1',
        startTerminal: 't1',
        endComponentId: 'R2',
        endTerminal: 't2',
      }),
    )

    let callCount = 0
    vi.mocked(generateComponentId).mockImplementation(() => {
      callCount++
      return `D_new${callCount}`
    })

    store.splitWireAndConnectDirect('W_orig', {
      terminalId: 't3',
      componentId: 'R3',
      position: { x: 5, y: 5 },
    })

    const wires = store.currentCircuit.components.filter((c) => c.type === 'wire')
    const nodes = store.currentCircuit.components.filter((c) => c.type === 'node')
    expect(wires).toHaveLength(2)
    expect(nodes).toHaveLength(0)
  })

  it('splitWireAndConnectDirect no-op for invalid wire', () => {
    const store = useCircuitStore()
    const initialLen = store.currentCircuit.components.length
    store.splitWireAndConnectDirect('NOTHERE', {
      terminalId: 't1',
      componentId: 'R1',
      position: { x: 0, y: 0 },
    })
    expect(store.currentCircuit.components.length).toBe(initialLen)
  })

  it('splitWireAndConnectMultiple with 2 terminals creates series', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('W_orig', 'wire', {
        startComponentId: 'R1',
        startTerminal: 't1',
        endComponentId: 'R2',
        endTerminal: 't2',
      }),
    )

    let callCount = 0
    vi.mocked(generateComponentId).mockImplementation(() => {
      callCount++
      return `S_new${callCount}`
    })

    store.splitWireAndConnectMultiple('W_orig', [
      { terminalId: 't3', componentId: 'R3', position: { x: 0, y: 0 } },
      { terminalId: 't4', componentId: 'R3', position: { x: 0, y: 0 } },
    ])

    // Creates 2 wires (series connection)
    const wires = store.currentCircuit.components.filter((c) => c.type === 'wire')
    expect(wires).toHaveLength(2)
  })

  it('splitWireAndConnectMultiple with 3+ terminals creates fanout', () => {
    const store = useCircuitStore()
    store.addComponent(
      makeComponent('W_orig', 'wire', {
        startComponentId: 'R1',
        startTerminal: 't1',
        endComponentId: 'R2',
        endTerminal: 't2',
      }),
    )

    let callCount = 0
    vi.mocked(generateComponentId).mockImplementation(() => {
      callCount++
      return `F_new${callCount}`
    })

    store.splitWireAndConnectMultiple('W_orig', [
      { terminalId: 't3', componentId: 'R3', position: { x: 0, y: 0 } },
      { terminalId: 't4', componentId: 'R4', position: { x: 0, y: 0 } },
      { terminalId: 't5', componentId: 'R5', position: { x: 0, y: 0 } },
    ])

    // For 3 terminals: each gets 2 wires (start->new, end->new) = 6 wires
    const wires = store.currentCircuit.components.filter((c) => c.type === 'wire')
    expect(wires).toHaveLength(6)
  })
})

// =====================================================================
describe('deleteSelectedComponent', () => {
  it('deletes both components and probes from selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('R1', { x: 10, y: 10 }, 'voltage')

    mockInteractionStore.selectedComponentIds = ['R1', 'P1']

    store.deleteSelectedComponent()

    expect(store.currentCircuit.components).toHaveLength(0)
    expect(store.currentCircuit.probes).toHaveLength(0)
  })

  it('clears interaction selection', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    mockInteractionStore.selectedComponentIds = ['R1']

    store.deleteSelectedComponent()

    expect(mockInteractionStore.clearSelection).toHaveBeenCalled()
  })
})

// =====================================================================
describe('Import/Export', () => {
  it('exportCircuitAsJSON returns pretty-printed JSON', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('G1', 'ground'))

    const json = store.exportCircuitAsJSON()

    expect(json).toContain('"id": "default"')
    expect(json).toContain('G1')
    expect(json).toContain('\n')
  })

  it('importCircuitFromJSON restores from valid JSON', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))

    const circuit: Circuit = {
      id: 'imported',
      name: 'Test Circuit',
      components: [makeComponent('G1', 'ground')],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = store.importCircuitFromJSON(JSON.stringify(circuit))

    expect(result).toBe(true)
    expect(store.currentCircuit.id).toBe('imported')
    expect(store.currentCircuit.name).toBe('Test Circuit')
    expect(store.currentCircuit.components).toHaveLength(1)
  })

  it('importCircuitFromJSON returns false for invalid/missing data', () => {
    const store = useCircuitStore()

    expect(store.importCircuitFromJSON('not json')).toBe(false)
    expect(store.importCircuitFromJSON(JSON.stringify({ id: '', components: null }))).toBe(false)
    expect(store.importCircuitFromJSON(JSON.stringify({ id: 'ok', components: 'notarray' }))).toBe(false)
  })
})

// =====================================================================
describe('Clipboard', () => {
  it('copySelectedComponents copies selected components', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    store.addComponent(makeComponent('R2', 'resistor', { resistance: 200 }))
    mockInteractionStore.selectedComponentIds = ['R1']

    const result = store.copySelectedComponents()

    expect(result).toBe(true)
    expect(store.getClipboardData().components).toHaveLength(1)
    expect(store.getClipboardData().components[0].id).toBe('R1')
  })

  it('copySelectedComponents includes wires between two selected components', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    store.addComponent(makeComponent('R2', 'resistor', { resistance: 200 }))
    store.addComponent(
      makeComponent('W1', 'wire', {
        startComponentId: 'R1',
        endComponentId: 'R2',
      }),
    )
    mockInteractionStore.selectedComponentIds = ['R1', 'R2']

    store.copySelectedComponents()

    expect(store.getClipboardData().components).toHaveLength(2)
    expect(store.getClipboardData().wires).toHaveLength(1)
  })

  it('copySelectedComponents returns false when nothing selected', () => {
    const store = useCircuitStore()
    mockInteractionStore.selectedComponentIds = []

    const result = store.copySelectedComponents()

    expect(result).toBe(false)
  })

  it('cutSelectedComponents copies then deletes', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    mockInteractionStore.selectedComponentIds = ['R1']

    const result = store.cutSelectedComponents()

    expect(result).toBe(true)
    expect(store.hasClipboardContent()).toBe(true)
    expect(store.currentCircuit.components).toHaveLength(0)
  })

  it('hasClipboardContent returns true/false correctly', () => {
    const store = useCircuitStore()

    expect(store.hasClipboardContent()).toBe(false)

    store.addComponent(makeComponent('R1', 'resistor'))
    mockInteractionStore.selectedComponentIds = ['R1']
    store.copySelectedComponents()

    expect(store.hasClipboardContent()).toBe(true)
  })

  it('pasteComponents pastes from clipboard with offset', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    mockInteractionStore.selectedComponentIds = ['R1']
    store.copySelectedComponents()

    vi.mocked(generateComponentId).mockReturnValue('PCOMP')
    const initialLen = store.currentCircuit.components.length
    const result = store.pasteComponents()

    expect(result).toBe(true)
    expect(store.currentCircuit.components.length).toBeGreaterThan(initialLen)
  })

  it('getClipboardComponents returns clipboard components after copy', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))
    mockInteractionStore.selectedComponentIds = ['R1']
    store.copySelectedComponents()

    const clips = store.getClipboardComponents()

    expect(clips).toHaveLength(1)
    expect(clips[0].id).toBe('R1')
  })

  it('pasteComponents returns false when clipboard is empty', () => {
    const store = useCircuitStore()

    const result = store.pasteComponents()

    expect(result).toBe(false)
  })
})

// =====================================================================
describe('pasteComponentsAtPosition probe logic', () => {
  it('pastes probes with updated target references when component is copied and pasted', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))

    vi.mocked(generateComponentId).mockImplementation(() => 'P1')
    store.addProbe('R1', { x: 100, y: 100 }, 'voltage')

    // Select both the component and the probe, then copy
    mockInteractionStore.selectedComponentIds = ['R1', 'P1']
    store.copySelectedComponents()

    expect(store.getClipboardData().components).toHaveLength(1)
    expect(store.getClipboardData().probes).toHaveLength(1)

    // Set up generateComponentId to return distinct IDs for each call
    let callCount = 0
    vi.mocked(generateComponentId).mockImplementation(() => {
      callCount++
      if (callCount === 1) return 'R2'
      return 'P2'
    })

    const initialProbeLen = store.currentCircuit.probes.length
    const result = store.pasteComponentsAtPosition({ x: 200, y: 200 })

    expect(result).toBe(true)
    expect(store.currentCircuit.probes.length).toBeGreaterThan(initialProbeLen)

    const newProbe = store.currentCircuit.probes.find((p) => p.id === 'P2')
    expect(newProbe).toBeDefined()
    expect(newProbe!.targetId).toBe('R2')
  })

  it('skips probe and logs warning when target reference is missing', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor', { resistance: 100 }))

    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('R1', { x: 100, y: 100 }, 'voltage')

    // Select both component and probe, then copy
    mockInteractionStore.selectedComponentIds = ['R1', 'P1']
    store.copySelectedComponents()

    // Remove the component from clipboard so the probe's target has no mapping
    const clipboard = store.getClipboardData()
    clipboard.components = []

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Still need generateComponentId to return something for the probe
    vi.mocked(generateComponentId).mockReturnValue('P_bad_new')

    const initialProbeCount = store.currentCircuit.probes.length
    const result = store.pasteComponentsAtPosition({ x: 0, y: 0 })

    expect(result).toBe(true)
    expect(store.currentCircuit.probes).toHaveLength(initialProbeCount)
    expect(warnSpy).toHaveBeenCalledWith(
      'Cannot paste probe P1: missing target reference',
    )
  })
})

// =====================================================================
describe('Real-time Simulation', () => {
  it('setSimulationThrottleMs clamps 50-1000', () => {
    const store = useCircuitStore()

    store.setSimulationThrottleMs(10)
    expect(store.simulationThrottleMs).toBe(50)

    store.setSimulationThrottleMs(2000)
    expect(store.simulationThrottleMs).toBe(1000)

    store.setSimulationThrottleMs(500)
    expect(store.simulationThrottleMs).toBe(500)
  })

  it('enableRealTimeSimulation + disableRealTimeSimulation toggle correctly', () => {
    const store = useCircuitStore()

    store.enableRealTimeSimulation()
    expect(store.isRealTimeSimulation).toBe(true)

    store.disableRealTimeSimulation()
    expect(store.isRealTimeSimulation).toBe(false)
  })

  it('toggleRealTimeSimulation', () => {
    const store = useCircuitStore()

    store.toggleRealTimeSimulation()
    expect(store.isRealTimeSimulation).toBe(true)

    store.toggleRealTimeSimulation()
    expect(store.isRealTimeSimulation).toBe(false)
  })
})

// =====================================================================
describe('singleSelectedItem getter', () => {
  it('returns component when one ID selected and found', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    mockInteractionStore.selectedComponentIds = ['R1']

    const item = store.singleSelectedItem
    expect(item).not.toBeNull()
    expect((item as CircuitComponent).id).toBe('R1')
  })

  it('returns probe when component not found but probe matches', () => {
    const store = useCircuitStore()
    vi.mocked(generateComponentId).mockReturnValue('P1')
    store.addProbe('W1', { x: 10, y: 10 }, 'voltage')
    mockInteractionStore.selectedComponentIds = ['P1']

    const item = store.singleSelectedItem
    expect(item).not.toBeNull()
    expect((item as Probe).id).toBe('P1')
  })

  it('returns null for 0 or 2+ selected', () => {
    const store = useCircuitStore()
    store.addComponent(makeComponent('R1', 'resistor'))
    store.addComponent(makeComponent('R2', 'resistor'))

    mockInteractionStore.selectedComponentIds = []
    expect(store.singleSelectedItem).toBeNull()

    mockInteractionStore.selectedComponentIds = ['R1', 'R2']
    expect(store.singleSelectedItem).toBeNull()
  })
})
