import type { Circuit, CircuitComponent, Wire, Position } from '@/types/components'
import type { TestCircuitSpec, ExpectedResults, TolerancePresets } from './test-types'
import { TolerancePresets as Tolerances } from './test-types'

/**
 * Circuit Factory for generating test circuits programmatically
 * Implements the circuit generation utilities outlined in the MNA Tests Plan
 */

let componentIdCounter = 1
let wireIdCounter = 1
let nodeIdCounter = 1

/** Reset ID counters for predictable test IDs */
export function resetIdCounters(): void {
  componentIdCounter = 1
  wireIdCounter = 1
  nodeIdCounter = 1
}

/** Generate unique component ID */
function nextComponentId(prefix: string): string {
  return `${prefix}${componentIdCounter++}`
}

/** Generate unique wire ID */
function nextWireId(): string {
  return `W${wireIdCounter++}`
}

/** Generate unique node ID */
function nextNodeId(): string {
  return `N${nodeIdCounter++}`
}

/** Create a basic position */
function createPosition(x: number, y: number): Position {
  return { x, y }
}

/**
 * Create a basic resistor circuit for unit testing
 * Simple single resistor with voltage source and ground
 */
export function createBasicResistorCircuit(resistance: number): TestCircuitSpec {
  // Use predictable IDs for this circuit type
  const vsId = 'VS1'
  const resistorId = 'R1'
  const groundId = 'GND1'

  const components: CircuitComponent[] = [
    {
      id: vsId,
      type: 'voltage_source',
      position: createPosition(100, 100),
      rotation: 0,
      selected: false,
      properties: {
        voltage: 5.0,
        label: 'V1',
      },
    },
    {
      id: resistorId,
      type: 'resistor',
      position: createPosition(200, 100),
      rotation: 0,
      selected: false,
      properties: {
        resistance: resistance,
        label: 'R1',
      },
    },
    {
      id: groundId,
      type: 'ground',
      position: createPosition(150, 200),
      rotation: 0,
      selected: false,
    },
  ]

  const wires: Wire[] = [
    {
      id: 'W1',
      type: 'wire',
      position: createPosition(150, 100),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_positive`,
        endTerminal: `${resistorId}_1`,
        startPosition: createPosition(125, 100),
        endPosition: createPosition(175, 100),
      },
    },
    {
      id: 'W2',
      type: 'wire',
      position: createPosition(150, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${resistorId}_2`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(225, 100),
        endPosition: createPosition(150, 175),
      },
    },
    {
      id: 'W3',
      type: 'wire',
      position: createPosition(100, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_negative`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(75, 100),
        endPosition: createPosition(150, 175),
      },
    },
  ]

  const circuit: Circuit = {
    id: 'test-basic-resistor',
    name: 'Basic Resistor Test Circuit',
    components,
    wires,
    probes: [],
    nodes: {},
  }

  const expectedCurrent = 5.0 / resistance // Ohm's law: I = V/R
  const expectedResults: ExpectedResults = {
    voltages: {
      N1: 5.0, // Voltage source positive terminal
      N2: 0.0, // Ground node
      N0: 0.0, // Ground reference
    },
    currents: {
      [resistorId]: expectedCurrent,
      [vsId]: expectedCurrent,
    },
    tolerances: Tolerances.HIGH_PRECISION_LINEAR,
  }

  return {
    id: `unit-resistor-basic-${resistance}`,
    description: `Basic resistor circuit with ${resistance}Ω resistor for unit testing`,
    category: 'unit',
    testType: 'stamper',
    component: 'resistor',
    scenario: 'basic',
    variation: `${resistance}ohm`,
    circuit,
    expectedResults,
    toleranceJustification:
      'Linear circuit with resistor-only network should achieve highest precision with enhanced numerical solver',
  }
}

/**
 * Create a voltage divider circuit for functional testing
 * Two resistors in series with voltage source and ground
 */
export function createVoltageDividerCircuit(
  r1: number,
  r2: number,
  vSource: number,
): TestCircuitSpec {
  // Use predictable IDs for this circuit type
  const vsId = 'VS1'
  const r1Id = 'R1'
  const r2Id = 'R2'
  const groundId = 'GND1'

  const components: CircuitComponent[] = [
    {
      id: vsId,
      type: 'voltage_source',
      position: createPosition(100, 100),
      rotation: 0,
      selected: false,
      properties: {
        voltage: vSource,
        label: 'V1',
      },
    },
    {
      id: r1Id,
      type: 'resistor',
      position: createPosition(200, 100),
      rotation: 0,
      selected: false,
      properties: {
        resistance: r1,
        label: 'R1',
      },
    },
    {
      id: r2Id,
      type: 'resistor',
      position: createPosition(300, 100),
      rotation: 0,
      selected: false,
      properties: {
        resistance: r2,
        label: 'R2',
      },
    },
    {
      id: groundId,
      type: 'ground',
      position: createPosition(200, 200),
      rotation: 0,
      selected: false,
    },
  ]

  const wires: Wire[] = [
    {
      id: 'W1',
      type: 'wire',
      position: createPosition(150, 100),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_positive`,
        endTerminal: `${r1Id}_1`,
        startPosition: createPosition(125, 100),
        endPosition: createPosition(175, 100),
      },
    },
    {
      id: 'W2',
      type: 'wire',
      position: createPosition(250, 100),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${r1Id}_2`,
        endTerminal: `${r2Id}_1`,
        startPosition: createPosition(225, 100),
        endPosition: createPosition(275, 100),
      },
    },
    {
      id: 'W3',
      type: 'wire',
      position: createPosition(325, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${r2Id}_2`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(325, 100),
        endPosition: createPosition(200, 175),
      },
    },
    {
      id: 'W4',
      type: 'wire',
      position: createPosition(100, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_negative`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(75, 100),
        endPosition: createPosition(200, 175),
      },
    },
  ]

  const circuit: Circuit = {
    id: 'test-voltage-divider',
    name: 'Voltage Divider Test Circuit',
    components,
    wires,
    probes: [],
    nodes: {},
  }

  const totalResistance = r1 + r2
  const circuitCurrent = vSource / totalResistance
  const middleVoltage = (vSource * r2) / totalResistance // Voltage divider formula

  const expectedResults: ExpectedResults = {
    voltages: {
      N1: vSource, // Voltage source positive terminal
      N2: middleVoltage, // Middle node between resistors
      N3: 0.0, // Ground node
      N0: 0.0, // Ground reference
    },
    currents: {
      [r1Id]: circuitCurrent,
      [r2Id]: circuitCurrent,
      [vsId]: circuitCurrent,
    },
    tolerances: Tolerances.STANDARD_LINEAR,
  }

  return {
    id: `functional-linear-voltage-divider-${r1}-${r2}`,
    description: `Voltage divider with R1=${r1}Ω, R2=${r2}Ω, V=${vSource}V for parameter independence testing`,
    category: 'functional',
    testType: 'linear',
    component: 'resistor',
    scenario: 'voltage-divider',
    variation: `${r1}ohm-${r2}ohm`,
    circuit,
    expectedResults,
    toleranceJustification:
      'Standard linear circuit should maintain good precision with realistic component tolerances',
  }
}

/**
 * Diode parameters for test circuits
 */
export interface DiodeParams {
  saturationCurrent: number // Is (A)
  thermalVoltage: number // Vt (V)
  seriesResistance?: number // Rs (Ω)
}

/**
 * Create a basic diode circuit for non-linear testing
 * Silicon diode with series resistor
 */
export function createDiodeCircuit(diodeParams: DiodeParams, seriesR: number): TestCircuitSpec {
  resetIdCounters()

  const vsId = nextComponentId('VS')
  const diodeId = nextComponentId('D')
  const resistorId = nextComponentId('R')
  const groundId = nextComponentId('GND')

  const components: CircuitComponent[] = [
    {
      id: vsId,
      type: 'voltage_source',
      position: createPosition(100, 100),
      rotation: 0,
      selected: false,
      properties: {
        voltage: 5.0,
        label: 'V1',
      },
    },
    {
      id: diodeId,
      type: 'diode',
      position: createPosition(200, 100),
      rotation: 0,
      selected: false,
      properties: {
        saturationCurrent: diodeParams.saturationCurrent,
        thermalVoltage: diodeParams.thermalVoltage,
        seriesResistance: diodeParams.seriesResistance || 0,
        label: 'D1',
      },
    },
    {
      id: resistorId,
      type: 'resistor',
      position: createPosition(300, 100),
      rotation: 0,
      selected: false,
      properties: {
        resistance: seriesR,
        label: 'R1',
      },
    },
    {
      id: groundId,
      type: 'ground',
      position: createPosition(200, 200),
      rotation: 0,
      selected: false,
    },
  ]

  const wires: Wire[] = [
    {
      id: nextWireId(),
      type: 'wire',
      position: createPosition(150, 100),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_positive`,
        endTerminal: `${diodeId}_anode`,
        startPosition: createPosition(125, 100),
        endPosition: createPosition(175, 100),
      },
    },
    {
      id: nextWireId(),
      type: 'wire',
      position: createPosition(250, 100),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${diodeId}_cathode`,
        endTerminal: `${resistorId}_1`,
        startPosition: createPosition(225, 100),
        endPosition: createPosition(275, 100),
      },
    },
    {
      id: nextWireId(),
      type: 'wire',
      position: createPosition(325, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${resistorId}_2`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(325, 100),
        endPosition: createPosition(200, 175),
      },
    },
    {
      id: nextWireId(),
      type: 'wire',
      position: createPosition(100, 150),
      rotation: 0,
      selected: false,
      properties: {
        startTerminal: `${vsId}_negative`,
        endTerminal: `${groundId}_terminal`,
        startPosition: createPosition(75, 100),
        endPosition: createPosition(200, 175),
      },
    },
  ]

  const circuit: Circuit = {
    id: 'test-diode-circuit',
    name: 'Basic Diode Test Circuit',
    components,
    wires,
    probes: [],
    nodes: {},
  }

  // Approximate diode forward voltage (will need Newton-Raphson to solve exactly)
  const vfApprox = 0.7 // Typical silicon diode forward voltage
  const currentApprox = (5.0 - vfApprox) / seriesR

  const expectedResults: ExpectedResults = {
    voltages: {
      N1: 5.0, // Voltage source positive
      N2: vfApprox, // Diode cathode voltage
      N3: 0.0, // Ground node
      N0: 0.0, // Ground reference
    },
    currents: {
      [diodeId]: currentApprox,
      [resistorId]: currentApprox,
      [vsId]: currentApprox,
    },
    tolerances: Tolerances.NONLINEAR_CONVERGED,
    convergence: {
      required: true,
      maxIterations: 50,
      finalResidual: 1e-6,
    },
  }

  return {
    id: `functional-nonlinear-diode-${diodeParams.saturationCurrent}-${seriesR}`,
    description: `Silicon diode with Is=${diodeParams.saturationCurrent}A, Rs=${seriesR}Ω for non-linear convergence testing`,
    category: 'functional',
    testType: 'nonlinear',
    component: 'diode',
    scenario: 'forward-bias',
    variation: `Is${diodeParams.saturationCurrent}-Rs${seriesR}`,
    circuit,
    expectedResults,
    toleranceJustification:
      'Non-linear diode circuit requires Newton-Raphson convergence, achieving moderate precision',
  }
}

/**
 * Create test circuits in bulk for parameter independence validation
 */
export function createParameterIndependenceTestSet(): TestCircuitSpec[] {
  const testCases: TestCircuitSpec[] = []

  // Resistor parameter independence - same topology, different values
  const resistorValues = [100, 1000, 10000]
  resistorValues.forEach((r) => {
    testCases.push(createBasicResistorCircuit(r))
  })

  // Voltage divider parameter independence
  const dividerConfigs = [
    { r1: 1000, r2: 1000 }, // Equal division
    { r1: 1000, r2: 2000 }, // 1:2 ratio
    { r1: 2000, r2: 1000 }, // 2:1 ratio
  ]
  dividerConfigs.forEach((config) => {
    testCases.push(createVoltageDividerCircuit(config.r1, config.r2, 5.0))
  })

  // Diode parameter independence - same topology, different saturation currents
  const diodeConfigs = [
    { saturationCurrent: 1e-6, thermalVoltage: 0.1 },
    { saturationCurrent: 1e-4, thermalVoltage: 0.1 },
    { saturationCurrent: 1e-2, thermalVoltage: 0.1 },
  ]
  diodeConfigs.forEach((params) => {
    testCases.push(createDiodeCircuit(params, 1000))
  })

  return testCases
}
