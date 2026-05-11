import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CircuitComponent } from '@/types/components'
import { calculateWireIntersections } from '@/services/intersections'
import * as geometry from '@/services/geometry'

vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(() => ({})),
}))

vi.mock('@/services/geometry', () => ({
  getTerminalWorldPosition: vi.fn(),
}))

function createComponent(id: string, type: string, position = { x: 0, y: 0 }): CircuitComponent {
  return {
    id,
    type,
    position,
    rotation: 0,
    selected: false,
    properties: {},
  }
}

function createWire(
  id: string,
  startComponentId: string,
  startTerminal: string,
  endComponentId: string,
  endTerminal: string
): CircuitComponent {
  return {
    id,
    type: 'wire',
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: {
      startComponentId,
      startTerminal,
      endComponentId,
      endTerminal,
    },
  }
}

const getTerminalWorldPosition = vi.mocked(geometry.getTerminalWorldPosition)

describe('calculateWireIntersections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty map when there are no wires', () => {
    const components: CircuitComponent[] = []
    const result = calculateWireIntersections(components)
    expect(result.size).toBe(0)
  })

  it('returns an empty map when there is only one wire (no pairs)', () => {
    const wire1 = createWire('w1', 'c1', 't1', 'c2', 't2')
    const result = calculateWireIntersections([wire1])
    expect(result.size).toBe(0)
  })

  it('returns an empty map for parallel wires with no intersection', () => {
    const components = [
      createComponent('c1', 'voltage_source', { x: 0, y: 0 }),
      createComponent('c2', 'resistor', { x: 100, y: 0 }),
      createComponent('c3', 'voltage_source', { x: 0, y: 10 }),
      createComponent('c4', 'resistor', { x: 100, y: 10 }),
      createWire('w1', 'c1', 't1', 'c2', 't2'),
      createWire('w2', 'c3', 't1', 'c4', 't2'),
    ]

    getTerminalWorldPosition.mockImplementation((comp, _terminal) => {
      if (comp.id === 'c1') return { x: 0, y: 0 }
      if (comp.id === 'c2') return { x: 100, y: 0 }
      if (comp.id === 'c3') return { x: 0, y: 10 }
      if (comp.id === 'c4') return { x: 100, y: 10 }
      return { x: 0, y: 0 }
    })

    const result = calculateWireIntersections(components)
    expect(result.size).toBe(0)
  })

  it('returns one intersection for each wire when wires cross in an X shape', () => {
    const components = [
      createComponent('c1', 'voltage_source'),
      createComponent('c2', 'resistor'),
      createComponent('c3', 'voltage_source'),
      createComponent('c4', 'resistor'),
      createWire('w1', 'c1', 't1', 'c2', 't2'),
      createWire('w2', 'c3', 't1', 'c4', 't2'),
    ]

    getTerminalWorldPosition.mockImplementation((comp, _terminal) => {
      if (comp.id === 'c1') return { x: 0, y: 0 }
      if (comp.id === 'c2') return { x: 100, y: 100 }
      if (comp.id === 'c3') return { x: 0, y: 100 }
      if (comp.id === 'c4') return { x: 100, y: 0 }
      return { x: 0, y: 0 }
    })

    const result = calculateWireIntersections(components)

    expect(result.size).toBe(2)
    expect(result.get('w1')!.length).toBe(1)
    expect(result.get('w2')!.length).toBe(1)
    expect(result.get('w1')![0]).toEqual({ x: 50, y: 50 })
    expect(result.get('w2')![0]).toEqual({ x: 50, y: 50 })
  })

  it('returns an intersection at the endpoint when wires touch at their endpoints', () => {
    const components = [
      createComponent('c1', 'voltage_source'),
      createComponent('c2', 'resistor'),
      createComponent('c3', 'ground'),
      createComponent('c4', 'node'),
      createWire('w1', 'c1', 't1', 'c2', 't2'),
      createWire('w2', 'c3', 't1', 'c4', 't2'),
    ]

    getTerminalWorldPosition.mockImplementation((comp, _terminal) => {
      if (comp.id === 'c1') return { x: 0, y: 0 }
      if (comp.id === 'c2') return { x: 50, y: 50 }
      if (comp.id === 'c3') return { x: 50, y: 50 }
      if (comp.id === 'c4') return { x: 100, y: 0 }
      return { x: 0, y: 0 }
    })

    const result = calculateWireIntersections(components)

    expect(result.size).toBe(2)
    expect(result.get('w1')![0]).toEqual({ x: 50, y: 50 })
    expect(result.get('w2')![0]).toEqual({ x: 50, y: 50 })
  })

  it('handles multiple intersections across different wire pairs', () => {
    const components = [
      createComponent('c1', 'voltage_source'),
      createComponent('c2', 'ground'),
      createComponent('c3', 'node'),
      createComponent('c4', 'node'),
      createComponent('c5', 'resistor'),
      createComponent('c6', 'resistor'),
      createWire('w1', 'c1', 't+', 'c2', 't−'),
      createWire('w2', 'c3', 't1', 'c4', 't2'),
      createWire('w3', 'c5', 't1', 'c6', 't2'),
    ]

    getTerminalWorldPosition.mockImplementation((comp, _terminal) => {
      if (comp.id === 'c1') return { x: 0, y: 0 }
      if (comp.id === 'c2') return { x: 100, y: 100 }
      if (comp.id === 'c3') return { x: 0, y: 50 }
      if (comp.id === 'c4') return { x: 100, y: 50 }
      if (comp.id === 'c5') return { x: 0, y: 25 }
      if (comp.id === 'c6') return { x: 100, y: 25 }
      return { x: 0, y: 0 }
    })

    const result = calculateWireIntersections(components)

    expect(result.get('w1')!.length).toBe(2)
    expect(result.get('w2')!.length).toBe(1)
    expect(result.get('w3')!.length).toBe(1)

    const w1Points = result.get('w1')!
    expect(w1Points).toContainEqual({ x: 50, y: 50 })
    expect(w1Points).toContainEqual({ x: 25, y: 25 })
  })

  it('skips wires with missing properties', () => {
    const wire = {
      id: 'w1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    } as CircuitComponent

    const components = [wire]
    const result = calculateWireIntersections(components)
    expect(result.size).toBe(0)
  })

  it('skips wires referencing missing components', () => {
    const wire = createWire('w1', 'missing1', 't1', 'missing2', 't2')
    const result = calculateWireIntersections([wire])
    expect(result.size).toBe(0)
  })
})
