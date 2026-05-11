// Set up localStorage BEFORE any imports (vue-devtools-kit checks at module load time)
// biome-ignore lint: this needs to be the first line
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
import type { CircuitComponent, Position } from '@/types/components'

// -- Mock interaction store --
const mockInteractionStore = {
  selectedComponentIds: [] as string[],
  selectComponent: vi.fn(),
  removeFromSelection: vi.fn(),
  clearSelection: vi.fn(),
  addToSelection: vi.fn(),
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

// -- Helpers --
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
    properties: props || {},
  }
}

function buildCircuit(
  store: ReturnType<typeof useCircuitStore>,
  components: CircuitComponent[],
): void {
  store.clearCircuit()
  components.forEach((c) => store.addComponent(c))
}

// -- beforeEach --
beforeEach(() => {
  for (const k of Object.keys(storageObj)) delete storageObj[k]
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockInteractionStore.selectedComponentIds = []
})

// =====================================================================
describe('validateCircuit', () => {
  it('valid simple circuit passes validation', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('R1', 'resistor', { resistance: 220 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'R1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors).toHaveLength(0)
  })

  it('missing ground and voltage source fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('R1', 'resistor', { resistance: 100 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'R1',
        endComponentId: 'R1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.length).toBeGreaterThan(0)
    const groundError = errors.find((e) => e.includes('ground') && e.includes('voltage source'))
    expect(groundError).toBeDefined()
  })

  it('floating resistor fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('R1', 'resistor', { resistance: 100 }),
    ])

    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('not connected'))).toBe(true)
  })

  it('zero-resistance resistor fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('R1', 'resistor', { resistance: 0 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'R1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('resistance'))).toBe(true)
  })

  it('zero-voltage source fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('V1', 'voltage_source', { voltage: 0 }),
    ])

    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('voltage'))).toBe(true)
  })

  it('multiple errors accumulate', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('R1', 'resistor', { resistance: 0 }),
      makeComponent('V1', 'voltage_source', { voltage: 0 }),
      makeComponent('I1', 'current_source', { current: 0 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'R1',
      }),
      makeComponent('W2', 'wire', {
        startComponentId: 'R1',
        endComponentId: 'V1',
      }),
      makeComponent('W3', 'wire', {
        startComponentId: 'R1',
        endComponentId: 'I1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.length).toBe(3)
    expect(errors.some((e) => e.includes('resistance'))).toBe(true)
    expect(errors.some((e) => e.includes('voltage'))).toBe(true)
    expect(errors.some((e) => e.includes('current'))).toBe(true)
  })

  it('circuit with valid V+R+G passes', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('V1', 'voltage_source', { voltage: 5 }),
      makeComponent('R1', 'resistor', { resistance: 1000 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'R1',
        endTerminal: 'terminal1',
      }),
      makeComponent('W2', 'wire', {
        startComponentId: 'R1',
        startTerminal: 'terminal2',
        endComponentId: 'G1',
        endTerminal: 'terminal',
      }),
      makeComponent('W3', 'wire', {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'G1',
        endTerminal: 'terminal',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors).toHaveLength(0)
  })

  it('component with no properties passes (ground)', () => {
    const store = useCircuitStore()
    const ground: CircuitComponent = {
      id: 'G1',
      type: 'ground',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {},
    }
    buildCircuit(store, [
      ground,
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'G1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.length).toBe(0)
  })

  it('wire-only circuit without ground fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('W1', 'wire', {
        startTerminal: 't1',
        endTerminal: 't2',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.length).toBeGreaterThan(0)
    const groundError = errors.find((e) => e.includes('ground'))
    expect(groundError).toBeDefined()
  })

  it('multiple voltage sources allowed', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('V1', 'voltage_source', { voltage: 5 }),
      makeComponent('V2', 'voltage_source', { voltage: 12 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'V1',
      }),
      makeComponent('W2', 'wire', {
        startComponentId: 'V1',
        endComponentId: 'V2',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors).toHaveLength(0)
  })

  it('current source with zero current fails', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('I1', 'current_source', { current: 0 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'I1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors.some((e) => e.includes('current'))).toBe(true)
  })

  it('current source with valid current passes', () => {
    const store = useCircuitStore()
    buildCircuit(store, [
      makeComponent('G1', 'ground'),
      makeComponent('I1', 'current_source', { current: 0.002 }),
      makeComponent('W1', 'wire', {
        startComponentId: 'G1',
        endComponentId: 'I1',
      }),
    ])

    const errors = store.validateCircuit()
    expect(errors).toHaveLength(0)
  })
})
