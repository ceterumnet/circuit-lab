// Polyfill localStorage for jsdom environment — must be before any import
// so @vue/devtools-kit initialization works.
const store: Record<string, string> = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  writable: true,
  configurable: true,
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

type MockComponent = {
  id: string
  type: string
  position: { x: number; y: number }
  rotation: number
}

const mockCircuitStore = {
  currentCircuit: { components: [] as MockComponent[] },
  createWire: vi.fn(),
  createNodeAndConnectWire: vi.fn(),
}
vi.mock('@/stores/circuit', () => ({
  useCircuitStore: () => mockCircuitStore,
}))

vi.mock('@/services/geometry', () => ({
  getTerminalWorldPosition: vi.fn(() => ({ x: 100, y: 100 })),
}))

import { useInteractionStore } from '@/stores/interaction'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockCircuitStore.currentCircuit.components = []
  mockCircuitStore.createWire.mockClear()
  mockCircuitStore.createNodeAndConnectWire.mockReturnValue(null)
})

describe('State Defaults', () => {
  it('initializes with empty selection, null placement state', () => {
    const store2 = useInteractionStore()
    expect(store2.selectedComponentIds).toEqual([])
    expect(store2.componentToPlace).toBeNull()
  })

  it('initializes wireCreationState with all false/null', () => {
    const store2 = useInteractionStore()
    expect(store2.wireCreationState.isActive).toBe(false)
    expect(store2.wireCreationState.isDragging).toBe(false)
    expect(store2.wireCreationState.startTerminal).toBeNull()
    expect(store2.wireCreationState.previewPosition).toBeNull()
  })

  it('initializes componentSelectorState as closed', () => {
    const store2 = useInteractionStore()
    expect(store2.componentSelectorState.isOpen).toBe(false)
  })
})

describe('Selection', () => {
  it('selectComponent replaces selection with single ID', () => {
    const store2 = useInteractionStore()
    store2.selectComponent('a')
    store2.selectComponent('b')
    expect(store2.selectedComponentIds).toEqual(['b'])
  })

  it('selectComponent with null clears selection', () => {
    const store2 = useInteractionStore()
    store2.selectComponent('a')
    store2.selectComponent(null)
    expect(store2.selectedComponentIds).toEqual([])
  })

  it('selectComponent in multiSelect mode toggles (add then remove)', () => {
    const store2 = useInteractionStore()
    store2.selectComponent('a', true)
    expect(store2.selectedComponentIds).toEqual(['a'])
    store2.selectComponent('b', true)
    expect(store2.selectedComponentIds).toEqual(['a', 'b'])
    store2.selectComponent('a', true)
    expect(store2.selectedComponentIds).toEqual(['b'])
  })

  it('addToSelection deduplicates', () => {
    const store2 = useInteractionStore()
    store2.addToSelection('a')
    store2.addToSelection('a')
    expect(store2.selectedComponentIds).toEqual(['a'])
  })

  it('removeFromSelection removes ID, no-op for non-existent', () => {
    const store2 = useInteractionStore()
    store2.addToSelection('a')
    store2.addToSelection('b')
    store2.removeFromSelection('a')
    expect(store2.selectedComponentIds).toEqual(['b'])
    store2.removeFromSelection('nonexistent')
    expect(store2.selectedComponentIds).toEqual(['b'])
  })

  it('clearSelection empties array', () => {
    const store2 = useInteractionStore()
    store2.addToSelection('a')
    store2.addToSelection('b')
    store2.clearSelection()
    expect(store2.selectedComponentIds).toEqual([])
  })
})

describe('Mode Switching', () => {
  it('setComponentToPlace(type) enables persistence, clears selection and wire creation', () => {
    const store2 = useInteractionStore()
    store2.addToSelection('a')
    store2.setComponentToPlace('resistor')
    expect(store2.componentToPlace).toBe('resistor')
    expect(store2.isComponentPlacementPersistent).toBe(true)
    expect(store2.selectedComponentIds).toEqual([])
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('setComponentToPlace(null) disables persistence', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.setComponentToPlace(null)
    expect(store2.componentToPlace).toBeNull()
    expect(store2.isComponentPlacementPersistent).toBe(false)
  })

  it('setProbeType clears component placement, wire creation, and selection', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.addToSelection('a')
    store2.setProbeType('voltage')
    expect(store2.probingType).toBe('voltage')
    expect(store2.componentToPlace).toBeNull()
    expect(store2.wireCreationState.isActive).toBe(false)
    expect(store2.selectedComponentIds).toEqual([])
  })

  it('exitComponentPlacement clears both componentToPlace and persistence', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.exitComponentPlacement()
    expect(store2.componentToPlace).toBeNull()
    expect(store2.isComponentPlacementPersistent).toBe(false)
  })
})

describe('handleComponentPlaced', () => {
  it('clears componentToPlace when persistence is off', () => {
    const store2 = useInteractionStore()
    // setComponentToPlace enables persistence, so disable it manually
    store2.setComponentToPlace('resistor')
    store2.isComponentPlacementPersistent = false
    store2.handleComponentPlaced()
    expect(store2.componentToPlace).toBeNull()
  })

  it('preserves componentToPlace when persistence is on', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.handleComponentPlaced()
    expect(store2.componentToPlace).toBe('resistor')
  })
})

describe('Wire Creation', () => {
  it('startWireCreation sets up state, calls getTerminalWorldPosition with correct args', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]

    store2.startWireCreation('t1', 'comp1')

    expect(store2.wireCreationState.isActive).toBe(true)
    expect(store2.wireCreationState.startTerminal).toEqual({
      terminalId: 't1',
      componentId: 'comp1',
      position: { x: 100, y: 100 },
    })
  })

  it('startWireCreation does nothing when component not found', () => {
    const store2 = useInteractionStore()
    store2.startWireCreation('t1', 'nonexistent')
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('finishWireCreation creates wire when terminals differ', () => {
    const store2 = useInteractionStore()
    const mockComp1 = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    const mockComp2 = { id: 'comp2', type: 'capacitor', position: { x: 10, y: 10 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComp1, mockComp2]

    store2.startWireCreation('t1', 'comp1')
    store2.finishWireCreation('t2', 'comp2')

    expect(mockCircuitStore.createWire).toHaveBeenCalledTimes(1)
  })

  it('finishWireCreation cancels without creating when terminal is same as start', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]

    store2.startWireCreation('t1', 'comp1')
    store2.finishWireCreation('t1', 'comp1')

    expect(mockCircuitStore.createWire).not.toHaveBeenCalled()
  })

  it('finishWireCreation cancels and returns when not active', () => {
    const store2 = useInteractionStore()
    store2.finishWireCreation('t1', 'comp1')
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('finishWireCreation calls onCreate callback', () => {
    const store2 = useInteractionStore()
    const mockComp1 = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    const mockComp2 = { id: 'comp2', type: 'capacitor', position: { x: 10, y: 10 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComp1, mockComp2]
    const callback = vi.fn()

    store2.startWireCreation('t1', 'comp1')
    store2.finishWireCreation('t2', 'comp2', callback)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('finishWireCreationToPosition creates node via circuit store', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]
    mockCircuitStore.createNodeAndConnectWire.mockReturnValue(null)

    store2.startWireCreation('t1', 'comp1')
    // Capture startTerminal before finishWireCreationToPosition calls cancelWireCreation
    const capturedStart = store2.wireCreationState.startTerminal
    store2.finishWireCreationToPosition({ x: 200, y: 300 })

    expect(mockCircuitStore.createNodeAndConnectWire).toHaveBeenCalledWith(
      capturedStart,
      { x: 200, y: 300 },
    )
  })

  it('finishWireCreationToPosition chains startWireCreation when node succeeds', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    const mockNode = { id: 'newNode', type: 'node', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent, mockNode]
    mockCircuitStore.createNodeAndConnectWire.mockReturnValue({
      terminalId: 'newTerm',
      nodeId: 'newNode',
    })

    store2.startWireCreation('t1', 'comp1')
    store2.finishWireCreationToPosition({ x: 200, y: 300 })

    expect(store2.wireCreationState.isActive).toBe(true)
  })

  it('finishWireCreationToPosition cancels when node creation returns null', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]
    mockCircuitStore.createNodeAndConnectWire.mockReturnValue(null)

    store2.startWireCreation('t1', 'comp1')
    store2.finishWireCreationToPosition({ x: 200, y: 300 })

    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('updateWirePreview updates previewPosition', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]

    store2.startWireCreation('t1', 'comp1')
    store2.updateWirePreview({ x: 200, y: 300 })

    expect(store2.wireCreationState.previewPosition).toEqual({ x: 200, y: 300 })
  })
})

describe('Wire Drag', () => {
  it('startWireDrag sets up with isDragging=true', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]

    store2.startWireDrag('t1', 'comp1')

    expect(store2.wireCreationState.isActive).toBe(true)
    expect(store2.wireCreationState.isDragging).toBe(true)
  })

  it('finishWireDrag with terminal delegates to finishWireCreation', () => {
    const store2 = useInteractionStore()
    const mockComp1 = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    const mockComp2 = { id: 'comp2', type: 'capacitor', position: { x: 10, y: 10 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComp1, mockComp2]

    store2.startWireDrag('t1', 'comp1')
    store2.finishWireDrag('t2', 'comp2')

    // Verify the end result: createWire was called (finishWireCreation → createWire)
    expect(mockCircuitStore.createWire).toHaveBeenCalledTimes(1)
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('finishWireDrag without terminal delegates to finishWireCreationToPosition', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    const mockNode = { id: 'newNode', type: 'node', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent, mockNode]
    mockCircuitStore.createNodeAndConnectWire.mockReturnValue({
      terminalId: 'newTerm',
      nodeId: 'newNode',
    })

    store2.startWireDrag('t1', 'comp1')
    store2.wireCreationState.previewPosition = { x: 200, y: 300 }

    // finishWireDrag → finishWireCreationToPosition → createNodeAndConnectWire + startWireCreation
    store2.finishWireDrag()

    expect(mockCircuitStore.createNodeAndConnectWire).toHaveBeenCalledTimes(1)
    expect(store2.wireCreationState.isActive).toBe(true)
  })

  it('finishWireDrag sets justCompletedWireDrag flag', () => {
    const store2 = useInteractionStore()
    const mockComponent = { id: 'comp1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0 }
    mockCircuitStore.currentCircuit.components = [mockComponent]

    store2.startWireDrag('t1', 'comp1')
    store2.finishWireDrag('t2', 'comp2')

    expect(store2.justCompletedWireDrag).toBe(true)
  })
})

describe('Component Placement Preview', () => {
  it('rotatePlacementComponent increments by 90 mod 360', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')

    store2.rotatePlacementComponent()
    expect(store2.componentPlacementPreview.rotation).toBe(90)

    store2.rotatePlacementComponent()
    expect(store2.componentPlacementPreview.rotation).toBe(180)

    store2.rotatePlacementComponent()
    expect(store2.componentPlacementPreview.rotation).toBe(270)

    store2.rotatePlacementComponent()
    expect(store2.componentPlacementPreview.rotation).toBe(0)
  })

  it('rotatePlacementComponentCounterClockwise decrements correctly (0→270)', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')

    store2.rotatePlacementComponentCounterClockwise()
    expect(store2.componentPlacementPreview.rotation).toBe(270)
  })

  it('updateComponentPlacementPreview preserves rotation', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.rotatePlacementComponent()

    store2.updateComponentPlacementPreview({ x: 50, y: 50 })

    expect(store2.componentPlacementPreview.rotation).toBe(90)
    expect(store2.componentPlacementPreview.position).toEqual({ x: 50, y: 50 })
  })

  it('clearComponentPlacementPreview resets to defaults', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')
    store2.rotatePlacementComponent()
    store2.updateComponentPlacementPreview({ x: 50, y: 50 })

    store2.clearComponentPlacementPreview()

    expect(store2.componentPlacementPreview.position).toBeNull()
    expect(store2.componentPlacementPreview.rotation).toBe(0)
    expect(store2.componentPlacementPreview.intersections).toEqual([])
  })
})

describe('Paste Placement', () => {
  it('startPastePlacement sets active, cancels other modes', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')

    store2.startPastePlacement()

    expect(store2.pastePlacementPreview.isActive).toBe(true)
    expect(store2.componentToPlace).toBeNull()
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('rotatePastePlacement wraps at 360', () => {
    const store2 = useInteractionStore()
    store2.startPastePlacement()

    // 4 rotations: 0→90→180→270→(360→0)
    for (let i = 0; i < 4; i++) {
      store2.rotatePastePlacement()
    }
    expect(store2.pastePlacementPreview.rotation).toBe(0)
  })

  it('rotatePastePlacementCounterClockwise wraps at 0 (→ 270)', () => {
    const store2 = useInteractionStore()
    store2.startPastePlacement()

    store2.rotatePastePlacementCounterClockwise()
    expect(store2.pastePlacementPreview.rotation).toBe(270)
  })

  it('cancelPastePlacement resets to inactive', () => {
    const store2 = useInteractionStore()
    store2.startPastePlacement()
    store2.pastePlacementPreview.rotation = 90
    store2.pastePlacementPreview.position = { x: 50, y: 50 }

    store2.cancelPastePlacement()

    expect(store2.pastePlacementPreview.isActive).toBe(false)
    expect(store2.pastePlacementPreview.position).toBeNull()
    expect(store2.pastePlacementPreview.rotation).toBe(0)
  })
})

describe('Component Selector', () => {
  it('openComponentSelector opens, cancels other modes', () => {
    const store2 = useInteractionStore()
    store2.setComponentToPlace('resistor')

    store2.openComponentSelector({ x: 100, y: 100 })

    expect(store2.componentSelectorState.isOpen).toBe(true)
    expect(store2.componentSelectorState.position).toEqual({ x: 100, y: 100 })
    expect(store2.componentToPlace).toBeNull()
    expect(store2.wireCreationState.isActive).toBe(false)
  })

  it('closeComponentSelector resets to closed', () => {
    const store2 = useInteractionStore()
    store2.openComponentSelector()

    store2.closeComponentSelector()

    expect(store2.componentSelectorState.isOpen).toBe(false)
    expect(store2.componentSelectorState.searchQuery).toBe('')
    expect(store2.componentSelectorState.selectedIndex).toBe(0)
    expect(store2.componentSelectorState.position).toBeNull()
  })

  it('updateComponentSelectorSearch updates query, resets index to 0', () => {
    const store2 = useInteractionStore()
    store2.openComponentSelector()
    store2.componentSelectorState.selectedIndex = 5

    store2.updateComponentSelectorSearch('res')

    expect(store2.componentSelectorState.searchQuery).toBe('res')
    expect(store2.componentSelectorState.selectedIndex).toBe(0)
  })

  it('selectFromComponentSelector returns null when not open', () => {
    const store2 = useInteractionStore()
    const result = store2.selectFromComponentSelector()
    expect(result).toBeNull()
  })
})

describe('Simple Setters', () => {
  it('setHoveredTerminal sets state directly', () => {
    const store2 = useInteractionStore()
    store2.setHoveredTerminal({ componentId: 'comp1', terminalId: 't1' })
    expect(store2.hoveredTerminal).toEqual({ componentId: 'comp1', terminalId: 't1' })
    store2.setHoveredTerminal(null)
    expect(store2.hoveredTerminal).toBeNull()
  })

  it('setHoveredWire sets state directly', () => {
    const store2 = useInteractionStore()
    store2.setHoveredWire('wire1')
    expect(store2.hoveredWireId).toBe('wire1')
    store2.setHoveredWire(null)
    expect(store2.hoveredWireId).toBeNull()
  })

  it('setCanvasTransform sets state directly', () => {
    const store2 = useInteractionStore()
    store2.setCanvasTransform(2, { x: 10, y: 20 })
    expect(store2.canvasTransform).toEqual({ scale: 2, position: { x: 10, y: 20 } })
  })

  it('setCtrlKeyHeld sets state directly', () => {
    const store2 = useInteractionStore()
    store2.setCtrlKeyHeld(true)
    expect(store2.isCtrlKeyHeld).toBe(true)
    store2.setCtrlKeyHeld(false)
    expect(store2.isCtrlKeyHeld).toBe(false)
  })

  it('setDraggingComponent sets state directly', () => {
    const store2 = useInteractionStore()
    store2.setDraggingComponent(true)
    expect(store2.isDraggingComponent).toBe(true)
    store2.setDraggingComponent(false)
    expect(store2.isDraggingComponent).toBe(false)
  })
})
