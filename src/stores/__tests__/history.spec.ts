import { describe, it, expect, beforeEach, vi } from 'vitest'

const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => (key in storage ? storage[key] : null),
  setItem: (key: string, value: string) => { storage[key] = String(value) },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { for (const k in storage) delete storage[k] },
  get length() { return Object.keys(storage).length },
  key: (i: number) => Object.keys(storage)[i] ?? null,
})

const mockRestoreCircuit = vi.fn()
vi.mock('@/stores/circuit', () => ({
  useCircuitStore: () => ({ restoreCircuit: mockRestoreCircuit }),
}))

import { createPinia, setActivePinia } from 'pinia'

import { useHistoryStore } from '@/stores/history'
import type { Circuit } from '@/types/components'

let history: ReturnType<typeof useHistoryStore>

function makeCircuit(overrides: Partial<Circuit> = {}): Circuit {
  return { id: 'test', name: 'Test', components: [], wires: [], probes: [], nodes: {}, ...overrides }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockRestoreCircuit.mockClear()
  history = useHistoryStore()
})

describe('State Defaults', () => {
  it('initializes with empty history, currentIndex=-1, isInitialized=false', () => {
    expect(history.history).toEqual([])
    expect(history.currentIndex).toBe(-1)
    expect(history.isInitialized).toBe(false)
  })
})

describe('Getters', () => {
  it('canUndo is false initially (currentIndex=-1)', () => {
    expect(history.canUndo).toBe(false)
  })

  it('canUndo is true after saving two states', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    expect(history.canUndo).toBe(true)
  })

  it('canRedo is false initially', () => {
    expect(history.canRedo).toBe(false)
  })

  it('canRedo is true after save twice + undo', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    history.undo()
    expect(history.canRedo).toBe(true)
  })

  it('currentState returns null at initial state', () => {
    expect(history.currentState).toBeNull()
  })

  it('currentState returns the current entry after save', () => {
    const circ = makeCircuit({ id: 'circ1' })
    history.saveState(circ, 'test')
    expect(history.currentState).not.toBeNull()
    expect(history.currentState!.description).toBe('test')
  })
})

describe('saveState', () => {
  it('deep clones circuit (JSON parse/stringify)', () => {
    const circ = makeCircuit({ id: 'original', name: 'Orig' })
    history.saveState(circ, 'save')

    circ.name = 'Mutated'

    expect(history.history[0].circuit.name).toBe('Orig')
  })

  it('increments currentIndex from -1 to 0 on first save', () => {
    history.saveState(makeCircuit())
    expect(history.currentIndex).toBe(0)
  })

  it('truncates future states after undo + new save', () => {
    history.saveState(makeCircuit({ id: 'A' }), 'A')
    history.saveState(makeCircuit({ id: 'B' }), 'B')
    history.undo()
    history.saveState(makeCircuit({ id: 'C' }), 'C')

    expect(history.history).toHaveLength(2)
    expect(history.history[0].circuit.id).toBe('A')
    expect(history.history[1].circuit.id).toBe('C')
    expect(history.currentIndex).toBe(1)
  })

  it('enforces maxHistorySize (50 entries)', () => {
    for (let i = 0; i < 51; i++) {
      history.saveState(makeCircuit({ id: String(i) }), `save ${i}`)
    }
    expect(history.history).toHaveLength(50)
    expect(history.history[0].circuit.id).toBe('1')
    expect(history.currentIndex).toBe(49)
  })

  it('uses default description "Action" when none provided', () => {
    history.saveState(makeCircuit())
    expect(history.history[0].description).toBe('Action')
  })

  it('uses custom description when provided', () => {
    history.saveState(makeCircuit(), 'my custom action')
    expect(history.history[0].description).toBe('my custom action')
  })
})

describe('undo / redo', () => {
  it('undo returns false at first state (currentIndex=0)', () => {
    history.saveState(makeCircuit())
    const result = history.undo()
    expect(result).toBe(false)
    expect(history.currentIndex).toBe(0)
  })

  it('undo decrements index and calls restoreCircuit', () => {
    history.saveState(makeCircuit({ id: 'A' }), 'A')
    history.saveState(makeCircuit({ id: 'B' }), 'B')
    history.undo()

    expect(history.currentIndex).toBe(0)
    expect(mockRestoreCircuit).toHaveBeenCalledTimes(1)
    expect(mockRestoreCircuit).toHaveBeenCalledWith(history.history[0].circuit)
  })

  it('undo returns true on success', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    const result = history.undo()
    expect(result).toBe(true)
  })

  it('redo returns false at last state', () => {
    history.saveState(makeCircuit(), 'A')
    const result = history.redo()
    expect(result).toBe(false)
    expect(history.currentIndex).toBe(0)
  })

  it('redo increments index and calls restoreCircuit', () => {
    history.saveState(makeCircuit({ id: 'A' }), 'A')
    history.saveState(makeCircuit({ id: 'B' }), 'B')
    history.undo()
    mockRestoreCircuit.mockClear()

    history.redo()

    expect(history.currentIndex).toBe(1)
    expect(mockRestoreCircuit).toHaveBeenCalledTimes(1)
    expect(mockRestoreCircuit).toHaveBeenCalledWith(history.history[1].circuit)
  })

  it('redo returns true on success', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    history.undo()
    const result = history.redo()
    expect(result).toBe(true)
  })

  it('undo followed by redo restores correct state', () => {
    history.saveState(makeCircuit({ id: 'A' }), 'A')
    history.saveState(makeCircuit({ id: 'B' }), 'B')

    history.undo()
    expect(history.currentIndex).toBe(0)
    expect(history.currentState!.circuit.id).toBe('A')

    history.redo()
    expect(history.currentIndex).toBe(1)
    expect(history.currentState!.circuit.id).toBe('B')
  })

  it('undo at boundary (index 0) leaves index at 0', () => {
    history.saveState(makeCircuit())
    history.undo()
    history.undo()
    expect(history.currentIndex).toBe(0)
  })

  it('redo at boundary leaves index at last', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    history.redo()
    history.redo()
    expect(history.currentIndex).toBe(1)
  })
})

describe('initializeHistory', () => {
  it('creates first entry with "Initial state" description', () => {
    const circ = makeCircuit({ id: 'init' })
    history.initializeHistory(circ)
    expect(history.history).toHaveLength(1)
    expect(history.history[0].description).toBe('Initial state')
  })

  it('sets isInitialized=true', () => {
    history.initializeHistory(makeCircuit())
    expect(history.isInitialized).toBe(true)
  })

  it('is idempotent — call twice, only 1 entry created', () => {
    history.initializeHistory(makeCircuit({ id: 'first' }))
    history.initializeHistory(makeCircuit({ id: 'second' }))
    expect(history.history).toHaveLength(1)
    expect(history.history[0].circuit.id).toBe('first')
  })
})

describe('clearHistory', () => {
  it('resets all state including isInitialized=false', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    history.isInitialized = true

    history.clearHistory()

    expect(history.history).toEqual([])
    expect(history.currentIndex).toBe(-1)
    expect(history.isInitialized).toBe(false)
  })
})

describe('getHistoryList', () => {
  it('returns array with index, description, timestamp, isCurrent', () => {
    history.saveState(makeCircuit(), 'first')
    history.saveState(makeCircuit(), 'second')

    const list = history.getHistoryList()
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ index: 0, description: 'first', isCurrent: false })
    expect(list[1]).toMatchObject({ index: 1, description: 'second', isCurrent: true })
    expect(typeof list[0].timestamp).toBe('number')
    expect(typeof list[1].timestamp).toBe('number')
  })

  it('marks only currentIndex as isCurrent=true', () => {
    history.saveState(makeCircuit(), 'A')
    history.saveState(makeCircuit(), 'B')
    history.saveState(makeCircuit(), 'C')
    history.undo()

    const list = history.getHistoryList()

    expect(list[0].isCurrent).toBe(false)
    expect(list[1].isCurrent).toBe(true)
    expect(list[2].isCurrent).toBe(false)
  })
})
