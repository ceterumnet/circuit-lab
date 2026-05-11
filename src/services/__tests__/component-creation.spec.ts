import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Circuit, CircuitComponent, Position, Probe, ComponentDefinition } from '@/types/components'
import { generateComponentId, createComponent } from '../componentFactory'
import { getComponentDefinition } from '@/registry/components'

// -- Mock registry --
vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(),
}))

// -- Helpers --
function emptyCircuit(): Circuit {
  return {
    id: 'test-circuit',
    name: 'Test',
    components: [],
    wires: [],
    probes: [],
    nodes: {},
  }
}

function makeComponent(id: string, type: string): CircuitComponent {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: {},
  }
}

function makeProbe(id: string): Probe {
  return {
    id,
    type: 'voltage',
    targetId: 'W1',
    position: { x: 0, y: 0 },
  }
}

function resistorDefinition(): ComponentDefinition {
  return {
    type: 'resistor',
    name: 'Resistor',
    category: 'passive',
    complexity: 'simple',
    terminals: [
      { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
      { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' },
    ],
    properties: [
      { key: 'resistance', type: 'number', label: 'Resistance', unit: 'Ω', default: 1000 },
    ],
  }
}

function voltageSourceDefinition(): ComponentDefinition {
  return {
    type: 'voltage_source',
    name: 'Voltage Source',
    category: 'power',
    complexity: 'simple',
    terminals: [
      { id: 'positive', position: { x: 0, y: -30 }, type: 'output' },
      { id: 'negative', position: { x: 0, y: 30 }, type: 'output' },
    ],
    properties: [
      { key: 'voltage', type: 'number', label: 'Voltage', unit: 'V', default: 5 },
    ],
  }
}

function diodeDefinition(): ComponentDefinition {
  return {
    type: 'diode',
    name: 'Diode',
    category: 'active',
    complexity: 'moderate',
    terminals: [
      { id: 'anode', position: { x: -30, y: 0 }, type: 'input' },
      { id: 'cathode', position: { x: 30, y: 0 }, type: 'output' },
    ],
    properties: [
      { key: 'isIdeal', type: 'boolean', label: 'Ideal', default: false },
    ],
  }
}

function groundDefinition(): ComponentDefinition {
  return {
    type: 'ground',
    name: 'Ground',
    category: 'connection',
    complexity: 'simple',
    terminals: [
      { id: 'terminal', position: { x: 0, y: -20 }, type: 'power' },
    ],
    properties: [],
  }
}

// -- beforeEach --
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getComponentDefinition).mockReturnValue(resistorDefinition())
})

// =====================================================================
describe('generateComponentId', () => {
  it('generates "R1" for resistor on empty circuit', () => {
    const circuit = emptyCircuit()
    expect(generateComponentId(circuit, 'resistor')).toBe('R1')
  })

  it('generates "V1" for voltage_source', () => {
    const circuit = emptyCircuit()
    expect(generateComponentId(circuit, 'voltage_source')).toBe('V1')
  })

  it('generates "D1" for diode', () => {
    const circuit = emptyCircuit()
    expect(generateComponentId(circuit, 'diode')).toBe('D1')
  })

  it('generates "G1" for ground', () => {
    const circuit = emptyCircuit()
    expect(generateComponentId(circuit, 'ground')).toBe('G1')
  })

  it('increments past existing component IDs', () => {
    const circuit = emptyCircuit()
    circuit.components = [makeComponent('R1', 'resistor'), makeComponent('R2', 'resistor')]
    expect(generateComponentId(circuit, 'resistor')).toBe('R3')
  })

  it('skips probe IDs with same prefix', () => {
    const circuit = emptyCircuit()
    circuit.probes = [makeProbe('R1'), makeProbe('R2')]
    circuit.components = [makeComponent('R3', 'resistor')]
    expect(generateComponentId(circuit, 'resistor')).toBe('R4')
  })

  it('handles gaps in existing IDs', () => {
    const circuit = emptyCircuit()
    circuit.components = [makeComponent('R1', 'resistor')]
    expect(generateComponentId(circuit, 'resistor')).toBe('R2')
  })

  it('uses only the first character of the type for the prefix', () => {
    const circuit = emptyCircuit()
    circuit.components = [makeComponent('C1', 'capacitor')]
    expect(generateComponentId(circuit, 'capacitor')).toBe('C2')
  })

  it('generates correct ID for types starting with lowercase', () => {
    const circuit = emptyCircuit()
    expect(generateComponentId(circuit, 'current_source')).toBe('C1')
  })

  it('handles cross-type ID collisions (R-probe blocks resistor IDs)', () => {
    const circuit = emptyCircuit()
    circuit.probes = [makeProbe('R1')]
    expect(generateComponentId(circuit, 'resistor')).toBe('R2')
  })
})

// =====================================================================
describe('createComponent', () => {
  it('returns a component with correct structure', () => {
    const circuit = emptyCircuit()
    const pos: Position = { x: 100, y: 200 }

    const result = createComponent(circuit, 'resistor', pos)

    expect(result).not.toBeNull()
    expect(result!.id).toBe('R1')
    expect(result!.type).toBe('resistor')
    expect(result!.position).toEqual(pos)
    expect(result!.rotation).toBe(0)
    expect(result!.selected).toBe(false)
  })

  it('populates default properties from the component definition', () => {
    const circuit = emptyCircuit()
    vi.mocked(getComponentDefinition).mockReturnValue(resistorDefinition())

    const result = createComponent(circuit, 'resistor', { x: 0, y: 0 })

    expect(result!.properties).toEqual({ resistance: 1000 })
  })

  it('populates default properties for voltage_source', () => {
    const circuit = emptyCircuit()
    vi.mocked(getComponentDefinition).mockReturnValue(voltageSourceDefinition())

    const result = createComponent(circuit, 'voltage_source', { x: 50, y: 50 })

    expect(result!.properties).toEqual({ voltage: 5 })
  })

  it('populates default properties for diode', () => {
    const circuit = emptyCircuit()
    vi.mocked(getComponentDefinition).mockReturnValue(diodeDefinition())

    const result = createComponent(circuit, 'diode', { x: 0, y: 0 })

    expect(result!.properties).toEqual({ isIdeal: false })
  })

  it('handles empty properties array (ground)', () => {
    const circuit = emptyCircuit()
    vi.mocked(getComponentDefinition).mockReturnValue(groundDefinition())

    const result = createComponent(circuit, 'ground', { x: 0, y: 0 })

    expect(result).not.toBeNull()
    expect(result!.id).toBe('G1')
    expect(result!.properties).toEqual({})
  })

  it('returns null for unknown component type', () => {
    const circuit = emptyCircuit()
    vi.mocked(getComponentDefinition).mockReturnValue(undefined)

    const result = createComponent(circuit, 'nonexistent_type', { x: 0, y: 0 })

    expect(result).toBeNull()
  })

  it('calls getComponentDefinition with the correct type', () => {
    const circuit = emptyCircuit()

    createComponent(circuit, 'resistor', { x: 0, y: 0 })

    expect(getComponentDefinition).toHaveBeenCalledWith('resistor')
  })

  it('generates unique ID when components already exist', () => {
    const circuit = emptyCircuit()
    circuit.components = [makeComponent('R1', 'resistor')]
    vi.mocked(getComponentDefinition).mockReturnValue(resistorDefinition())

    const result = createComponent(circuit, 'resistor', { x: 0, y: 0 })

    expect(result!.id).toBe('R2')
  })

  it('generates unique ID when probes use same prefix', () => {
    const circuit = emptyCircuit()
    circuit.probes = [makeProbe('D1')]
    vi.mocked(getComponentDefinition).mockReturnValue(diodeDefinition())

    const result = createComponent(circuit, 'diode', { x: 0, y: 0 })

    expect(result!.id).toBe('D2')
  })
})
