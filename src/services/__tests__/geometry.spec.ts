import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CircuitComponent, Circuit } from '@/types/components'

const mockGetComponentDefinition = vi.hoisted(() => vi.fn())

vi.mock('@/registry/components', async () => {
  const actual = await vi.importActual<object>('@/registry/components')
  return {
    getComponentDefinition: mockGetComponentDefinition,
    ...actual,
  }
})

import {
  rotatePoint,
  getTerminalWorldPosition,
  findTerminalAtPosition,
  findWireAtPosition,
  findIntersectionsForComponent,
} from '../geometry'

const resolver = () => `test_${Math.random().toString(36).slice(2)}`

const resistorDef = {
  type: 'resistor',
  name: 'Resistor',
  category: 'passive' as const,
  complexity: 'simple' as const,
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' as const },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' as const },
  ],
  properties: [],
}

const voltageSourceDef = {
  type: 'voltage_source',
  name: 'Voltage Source',
  category: 'power' as const,
  complexity: 'simple' as const,
  terminals: [
    { id: 'positive', position: { x: -30, y: 0 }, type: 'power' as const },
    { id: 'negative', position: { x: 30, y: 0 }, type: 'power' as const },
  ],
  properties: [],
}

const groundDef = {
  type: 'ground',
  name: 'Ground',
  category: 'connection' as const,
  complexity: 'simple' as const,
  terminals: [{ id: 'terminal', position: { x: 0, y: 0 }, type: 'power' as const }],
  properties: [],
}

const nodeDef = {
  type: 'node',
  name: 'Node',
  category: 'connection' as const,
  complexity: 'simple' as const,
  terminals: [{ id: 'terminal', position: { x: 0, y: 0 }, type: 'io' as const }],
  properties: [],
}

const switchDef = {
  type: 'switch',
  name: 'Switch',
  category: 'active' as const,
  complexity: 'simple' as const,
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' as const },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' as const },
  ],
  properties: [],
}

const diodeDef = {
  type: 'diode',
  name: 'Diode',
  category: 'active' as const,
  complexity: 'moderate' as const,
  terminals: [
    { id: 'anode', position: { x: -30, y: 0 }, type: 'io' as const },
    { id: 'cathode', position: { x: 30, y: 0 }, type: 'io' as const },
  ],
  properties: [],
}

const wireDef = {
  type: 'wire',
  name: 'Wire',
  category: 'connection' as const,
  complexity: 'simple' as const,
  terminals: [
    { id: 'start', position: { x: -20, y: 0 }, type: 'io' as const },
    { id: 'end', position: { x: 20, y: 0 }, type: 'io' as const },
  ],
  properties: [],
}

function setMockRegistry() {
  mockGetComponentDefinition.mockImplementation((type: string) => {
    const map: Record<string, ReturnType<typeof mockGetComponentDefinition>> = {
      resistor: resistorDef,
      voltage_source: voltageSourceDef,
      ground: groundDef,
      node: nodeDef,
      switch: switchDef,
      diode: diodeDef,
      wire: wireDef,
    }
    return map[type]
  })
}

describe('rotatePoint', () => {
  it('rotates (1,0) by 0° -> (1,0)', () => {
    expect(rotatePoint({ x: 1, y: 0 }, 0)).toEqual({ x: 1, y: 0 })
  })

  it('rotates (1,0) by 90° -> (0,1)', () => {
    const result = rotatePoint({ x: 1, y: 0 }, 90)
    expect(result.x).toBeCloseTo(0, 10)
    expect(result.y).toBeCloseTo(1, 10)
  })

  it('rotates (1,0) by 180° -> (-1,0)', () => {
    const result = rotatePoint({ x: 1, y: 0 }, 180)
    expect(result.x).toBeCloseTo(-1, 10)
    expect(result.y).toBeCloseTo(0, 10)
  })

  it('rotates (1,0) by 270° -> (0,-1)', () => {
    const result = rotatePoint({ x: 1, y: 0 }, 270)
    expect(result.x).toBeCloseTo(0, 10)
    expect(result.y).toBeCloseTo(-1, 10)
  })

  it('rotates (1,0) by -90° -> (0,-1)', () => {
    const result = rotatePoint({ x: 1, y: 0 }, -90)
    expect(result.x).toBeCloseTo(0, 10)
    expect(result.y).toBeCloseTo(-1, 10)
  })

  it('rotates (0,1) by 180° -> (0,-1)', () => {
    const result = rotatePoint({ x: 0, y: 1 }, 180)
    expect(result.x).toBeCloseTo(0, 10)
    expect(result.y).toBeCloseTo(-1, 10)
  })

  it('rotates (1,0) by 45° -> (~0.707, ~0.707)', () => {
    const result = rotatePoint({ x: 1, y: 0 }, 45)
    const expected = Math.cos(Math.PI / 4)
    expect(result.x).toBeCloseTo(expected, 10)
    expect(result.y).toBeCloseTo(expected, 10)
  })

  it('keeps origin at origin for any angle', () => {
    for (const angle of [0, 30, 90, 135, 180, 270, 360]) {
      const result = rotatePoint({ x: 0, y: 0 }, angle)
      expect(result.x).toBeCloseTo(0, 10)
      expect(result.y).toBeCloseTo(0, 10)
    }
  })
})

describe('getTerminalWorldPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockRegistry()
  })

  it('returns terminal offset for unrotated component at origin', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'terminal2')
    expect(result).toEqual({ x: 30, y: 0 })
  })

  it('rotates terminal by 90°', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 200 },
      rotation: 90,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'terminal2')
    expect(result.x).toBeCloseTo(100, 10)
    expect(result.y).toBeCloseTo(230, 10)
  })

  it('adds component position offset', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 50, y: 60 },
      rotation: 0,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'terminal1')
    expect(result.x).toBeCloseTo(20, 10)
    expect(result.y).toBeCloseTo(60, 10)
  })

  it('returns component position as fallback for unknown component type', () => {
    vi.clearAllMocks()
    mockGetComponentDefinition.mockReturnValue(undefined)

    const comp: CircuitComponent = {
      id: resolver(),
      type: 'unknown_type',
      position: { x: 100, y: 200 },
      rotation: 0,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'terminal1')
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('returns component position as fallback for unknown terminal', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 200 },
      rotation: 0,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'nonexistent')
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('returns {0,0} when NaN is detected in position', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: NaN, y: 200 },
      rotation: 0,
      selected: false,
    }
    const result = getTerminalWorldPosition(comp, 'terminal1')
    expect(result).toEqual({ x: 0, y: 0 })
  })
})

describe('findTerminalAtPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockRegistry()
  })

  it('finds terminal within 15px', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [comp],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findTerminalAtPosition(circuit, { x: 125, y: 100 })
    expect(result).not.toBeNull()
    expect(result!.componentId).toBe(comp.id)
    expect(result!.terminalId).toBe('terminal2')
  })

  it('returns null when position is too far from any terminal', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [comp],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findTerminalAtPosition(circuit, { x: 500, y: 500 })
    expect(result).toBeNull()
  })

  it('returns null for empty circuit', () => {
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findTerminalAtPosition(circuit, { x: 0, y: 0 })
    expect(result).toBeNull()
  })

  it('skips wire components', () => {
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findTerminalAtPosition(circuit, { x: 0, y: 0 })
    expect(result).toBeNull()
  })

  it('returns first matching terminal across multiple components', () => {
    const comp1: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
    }
    const comp2: CircuitComponent = {
      id: resolver(),
      type: 'voltage_source',
      position: { x: 105, y: 100 },
      rotation: 0,
      selected: false,
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [comp1, comp2],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findTerminalAtPosition(circuit, { x: 125, y: 100 })
    expect(result).not.toBeNull()
    expect(result!.componentId).toBe(comp1.id)
    expect(result!.terminalId).toBe('terminal2')
  })
})

describe('findWireAtPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockRegistry()
  })

  it('finds wire when position is close to the segment', () => {
    const startComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const endComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 200, y: 0 },
      rotation: 0,
      selected: false,
    }
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 100, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: startComp.id,
        startTerminal: 'terminal2',
        endComponentId: endComp.id,
        endTerminal: 'terminal1',
      },
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [startComp, endComp, wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findWireAtPosition(circuit, { x: 115, y: 0 })
    expect(result).not.toBeNull()
    expect(result!.wireId).toBe(wire.id)
    expect(result!.intersectionPoint.x).toBeCloseTo(115, 10)
    expect(result!.intersectionPoint.y).toBeCloseTo(0, 10)
  })

  it('returns null when position is far from wire', () => {
    const startComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const endComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 200, y: 0 },
      rotation: 0,
      selected: false,
    }
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 100, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: startComp.id,
        startTerminal: 'terminal2',
        endComponentId: endComp.id,
        endTerminal: 'terminal1',
      },
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [startComp, endComp, wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findWireAtPosition(circuit, { x: 500, y: 500 })
    expect(result).toBeNull()
  })

  it('returns null when no wires exist in circuit', () => {
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findWireAtPosition(circuit, { x: 0, y: 0 })
    expect(result).toBeNull()
  })

  it('skips non-wire components', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'fake',
        startTerminal: 't1',
        endComponentId: 'fake2',
        endTerminal: 't2',
      },
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [comp],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findWireAtPosition(circuit, { x: 100, y: 100 })
    expect(result).toBeNull()
  })

  it('handles custom tolerance', () => {
    const startComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const endComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 200, y: 0 },
      rotation: 0,
      selected: false,
    }
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 100, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: startComp.id,
        startTerminal: 'terminal2',
        endComponentId: endComp.id,
        endTerminal: 'terminal1',
      },
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [startComp, endComp, wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findWireAtPosition(circuit, { x: 110, y: 10 }, 5)
    expect(result).toBeNull()
  })
})

describe('findIntersectionsForComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockRegistry()
  })

  it('returns empty array for unknown component type', () => {
    vi.clearAllMocks()
    mockGetComponentDefinition.mockReturnValue(undefined)
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findIntersectionsForComponent(circuit, 'unknown_type', { x: 0, y: 0 })
    expect(result).toEqual([])
  })

  it('detects terminal-terminal intersection', () => {
    const resistor1: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [resistor1],
      wires: [],
      probes: [],
      nodes: {},
    }

    // Place hypothetical resistor overlapping resistor1.
    // terminal1 at (-30,0) hits resistor1.terminal1 at (-30,0) — distance 0.
    const result = findIntersectionsForComponent(circuit, 'resistor', { x: 0, y: 0 }, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const terminalIntersection = result.find(
      (r) =>
        r.type === 'terminal' &&
        r.targetComponentId === resistor1.id,
    )
    expect(terminalIntersection).toBeDefined()
  })

  it('detects terminal-wire intersection', () => {
    const startComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 50, y: 0 },
      rotation: 0,
      selected: false,
    }
    const endComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 250, y: 0 },
      rotation: 0,
      selected: false,
    }
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 150, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: startComp.id,
        startTerminal: 'terminal1',
        endComponentId: endComp.id,
        endTerminal: 'terminal1',
      },
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [startComp, endComp, wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findIntersectionsForComponent(circuit, 'resistor', { x: 35, y: 0 }, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const wireIntersection = result.find(
      (r) =>
        r.type === 'wire' &&
        r.targetWireId === wire.id,
    )
    expect(wireIntersection).toBeDefined()
  })

  it('returns empty array when no intersections exist', () => {
    const comp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 500, y: 500 },
      rotation: 0,
      selected: false,
    }
    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [comp],
      wires: [],
      probes: [],
      nodes: {},
    }

    const result = findIntersectionsForComponent(circuit, 'resistor', { x: 0, y: 0 }, 0)
    expect(result).toEqual([])
  })

  it('checks each terminal independently', () => {
    const resistor1: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [resistor1],
      wires: [],
      probes: [],
      nodes: {},
    }

    // Place hypothetical resistor on top of resistor1 — both terminals should match
    const result = findIntersectionsForComponent(circuit, 'resistor', { x: 0, y: 0 }, 0)
    expect(result.length).toBe(2)

    const terminal1Match = result.find(
      (r) =>
        r.type === 'terminal' &&
        r.terminalId === 'terminal1' &&
        r.targetTerminalId === 'terminal1' &&
        r.targetComponentId === resistor1.id,
    )
    expect(terminal1Match).toBeDefined()

    const terminal2Match = result.find(
      (r) =>
        r.type === 'terminal' &&
        r.terminalId === 'terminal2' &&
        r.targetTerminalId === 'terminal2' &&
        r.targetComponentId === resistor1.id,
    )
    expect(terminal2Match).toBeDefined()
  })

  it('checks both terminal and wire intersections together', () => {
    const nodeComp: CircuitComponent = {
      id: resolver(),
      type: 'node',
      position: { x: 15, y: 0 },
      rotation: 0,
      selected: false,
    }

    const startComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
    }
    const endComp: CircuitComponent = {
      id: resolver(),
      type: 'resistor',
      position: { x: 60, y: 0 },
      rotation: 0,
      selected: false,
    }
    const wire: CircuitComponent = {
      id: resolver(),
      type: 'wire',
      position: { x: 30, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: startComp.id,
        startTerminal: 'terminal2',
        endComponentId: endComp.id,
        endTerminal: 'terminal1',
      },
    }

    const circuit: Circuit = {
      id: resolver(),
      name: 'test',
      components: [nodeComp, startComp, endComp, wire],
      wires: [],
      probes: [],
      nodes: {},
    }

    // startComp at (0,0) has terminals at (-30,0) and (30,0)
    // endComp at (60,0) has terminals at (30,0) and (90,0)
    // Wire from startComp.terminal2 (30,0) to endComp.terminal1 (30,0) — zero-length wire at (30,0)
    // Placing hypothetical resistor at (0,0):
    // terminal1 at (-30,0) hits startComp.terminal1; terminal2 at (30,0) hits the wire
    const result = findIntersectionsForComponent(circuit, 'resistor', { x: 0, y: 0 }, 0)

    const terminalHits = result.filter((r) => r.type === 'terminal')
    expect(terminalHits.length).toBeGreaterThanOrEqual(1)

    const wireHits = result.filter((r) => r.type === 'wire')
    expect(wireHits.length).toBeGreaterThanOrEqual(1)
  })
})