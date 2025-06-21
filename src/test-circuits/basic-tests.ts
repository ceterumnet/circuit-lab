import type { TestCircuit } from './types'
import type { Circuit } from '@/types/components'
import { basicCurrentSource } from './current-source-test'
import { switchTests } from './switch-test'

/**
 * Basic test circuits for validating core simulation functionality
 */

export const voltageDivider: TestCircuit = {
  name: 'Simple Voltage Divider',
  description: 'R1=1kΩ, R2=1kΩ, V1=5V - Basic nodal analysis validation',
  category: 'basic',
  tags: ['voltage-divider', 'basic', 'nodal-analysis'],
  circuit: {
    id: 'voltage-divider-test',
    name: 'Voltage Divider Test',
    components: [
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'R2',
        type: 'resistor',
        position: { x: 200, y: 200 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 100, y: 250 },
        rotation: 0,
        selected: false,
      },
      // Wires to connect the circuit
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'R1',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W2',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R1',
          startTerminal: 'terminal2',
          endComponentId: 'R2',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W3',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R2',
          startTerminal: 'terminal2',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
      {
        id: 'W4',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'negative',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
    ],
    wires: [],
    probes: [],
    nodes: {},
  } as Circuit,
  expected: {
    voltages: {
      // Extended MNA node indices from test output:
      '0': 5.0, // V1:positive terminal → 4.999997500005V ✓
      '3': 2.5, // R1:terminal2 ↔ R2:terminal1 junction → 2.4999999999999996V ✓
      '6': 0.0, // GND1:terminal → 0V ✓ (actual ground)
    },
    currents: {
      V1: -0.0025, // 2.5mA flowing out of voltage source
      R1: 0.0025, // 2.5mA through R1
      R2: 0.0025, // 2.5mA through R2
    },
    tolerance: 0.01, // 1% tolerance for wire resistance effects
  },
}

export const wireCurrentRegression: TestCircuit = {
  name: 'Wire Current Detection Regression',
  description: 'Tests the critical fix for same-node wire current detection',
  category: 'regression',
  tags: ['wire-current', 'regression', 'critical-fix'],
  circuit: {
    id: 'wire-current-test',
    name: 'Wire Current Test',
    components: [
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'N1',
        type: 'node',
        position: { x: 250, y: 100 },
        rotation: 0,
        selected: false,
      },
      {
        id: 'R2',
        type: 'resistor',
        position: { x: 300, y: 150 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1500 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 350, y: 200 },
        rotation: 0,
        selected: false,
      },
      // The critical wire W4 that was showing 0 current
      {
        id: 'W4',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R2',
          startTerminal: 'terminal2',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
      // Other connecting wires
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'R1',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W2',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R1',
          startTerminal: 'terminal2',
          endComponentId: 'N1',
          endTerminal: 'terminal',
        },
      },
      {
        id: 'W3',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N1',
          startTerminal: 'terminal',
          endComponentId: 'R2',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W5',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'negative',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
    ],
    wires: [],
    probes: [],
    nodes: {},
  } as Circuit,
  expected: {
    voltages: {
      // Extended MNA node indices from test output:
      '0': 5.0, // V1:positive → 4.999998000004V ✓
      '4': 3.0, // N1:terminal junction → 2.9999980000040005V ≈ 3V ✓
      '7': 0.0, // GND1:terminal → 0V ✓ (actual ground)
    },
    currents: {
      V1: -0.002, // 2mA from voltage source
      R1: 0.002, // 2mA through R1
      R2: 0.002, // 2mA through R2
      W4: 0.002, // 🎯 CRITICAL: Wire W4 should show 2mA, NOT 0mA!
    },
    tolerance: 0.01, // 1% tolerance for wire resistance effects
  },
}

export const multiVoltageSource: TestCircuit = {
  name: 'Dual Voltage Sources',
  description: 'V1=5V, V2=3V with shared ground - tests superposition principle',
  category: 'basic',
  tags: ['multi-source', 'superposition', 'shared-ground'],
  circuit: {
    id: 'dual-voltage-test',
    name: 'Dual Voltage Test',
    components: [
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      {
        id: 'V2',
        type: 'voltage_source',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 3 },
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 150, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'R2',
        type: 'resistor',
        position: { x: 200, y: 150 },
        rotation: 0,
        selected: false,
        properties: { resistance: 2000 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 200, y: 250 },
        rotation: 0,
        selected: false,
      },
      // Connecting wires to create actual circuit topology
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'R1',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W2',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R1',
          startTerminal: 'terminal2',
          endComponentId: 'R2',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W3',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R2',
          startTerminal: 'terminal2',
          endComponentId: 'V2',
          endTerminal: 'positive',
        },
      },
      {
        id: 'W4',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'negative',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
      {
        id: 'W5',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V2',
          startTerminal: 'negative',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
    ],
    wires: [],
    probes: [],
    nodes: {},
  } as Circuit,
  expected: {
    // Extended MNA node indices from test output:
    // V1 = 5V, V2 = 3V in series opposition
    // Net voltage: 5V - 3V = 2V, Total resistance: 1000Ω + 2000Ω = 3000Ω
    // Current: 2V / 3000Ω = 0.667mA (V1 to V2 direction)
    voltages: {
      '0': 5.0, // V1:positive → 4.999999333334444V ✓
      '2': 3.0, // V2:positive → 3.0000006666655556V ✓
      '5': 4.33, // R1:terminal2 ↔ R2:terminal1 junction → 4.333333111111482V ✓
      '8': 0.0, // GND1:terminal → 0V ✓ (actual ground)
    },
    currents: {
      V1: -0.000667, // 0.67mA out of V1
      V2: 0.000667, // 0.67mA into V2 (opposing V1)
      R1: 0.000667, // 0.67mA through R1
      R2: 0.000667, // 0.67mA through R2
    },
    tolerance: 0.01, // 1% tolerance for wire resistance and multi-source analysis
  },
}

export const isolatedCircuits: TestCircuit = {
  name: 'Two Isolated Circuits',
  description: 'Two completely separate circuits to test multi-ground handling',
  category: 'regression',
  tags: ['isolated-circuits', 'multi-ground', 'regression'],
  circuit: {
    id: 'isolated-circuits-test',
    name: 'Isolated Circuits Test',
    components: [
      // First isolated circuit: V1 + R1 + R2 + GND1
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'R2',
        type: 'resistor',
        position: { x: 200, y: 200 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 100, y: 250 },
        rotation: 0,
        selected: false,
      },
      // Second isolated circuit: V2 + R3 + R4 + GND2
      {
        id: 'V2',
        type: 'voltage_source',
        position: { x: 400, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      {
        id: 'R3',
        type: 'resistor',
        position: { x: 500, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'R4',
        type: 'resistor',
        position: { x: 500, y: 200 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'GND2',
        type: 'ground',
        position: { x: 400, y: 250 },
        rotation: 0,
        selected: false,
      },
      // Wires for first circuit
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'R1',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W2',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R1',
          startTerminal: 'terminal2',
          endComponentId: 'R2',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W3',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R2',
          startTerminal: 'terminal2',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
      {
        id: 'W4',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'negative',
          endComponentId: 'GND1',
          endTerminal: 'terminal',
        },
      },
      // Wires for second circuit
      {
        id: 'W5',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V2',
          startTerminal: 'positive',
          endComponentId: 'R3',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W6',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R3',
          startTerminal: 'terminal2',
          endComponentId: 'R4',
          endTerminal: 'terminal1',
        },
      },
      {
        id: 'W7',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R4',
          startTerminal: 'terminal2',
          endComponentId: 'GND2',
          endTerminal: 'terminal',
        },
      },
      {
        id: 'W8',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V2',
          startTerminal: 'negative',
          endComponentId: 'GND2',
          endTerminal: 'terminal',
        },
      },
    ],
    wires: [],
    probes: [],
    nodes: {},
  } as Circuit,
  expected: {
    voltages: {
      // Extended MNA node indices from test output:
      // First circuit nodes
      '0': 5.0, // V1:positive → 4.999997500005V ✓
      '3': 2.5, // R1:terminal2 ↔ R2:terminal1 → 2.4999999999999996V ✓
      // Second circuit nodes
      '6': 5.0, // V2:positive → 4.999997500005V ✓
      '9': 2.5, // R3:terminal2 ↔ R4:terminal1 → 2.4999999999999996V ✓
      // Shared ground
      '12': 0.0, // [GND1:terminal, GND2:terminal] → 0V ✓ (equipotential ground)
    },
    currents: {
      V1: -0.0025, // 2.5mA from first voltage source
      R1: 0.0025, // 2.5mA through R1
      R2: 0.0025, // 2.5mA through R2
      V2: -0.0025, // 2.5mA from second voltage source
      R3: 0.0025, // 2.5mA through R3
      R4: 0.0025, // 2.5mA through R4
    },
    tolerance: 0.01, // 1% tolerance for wire resistance effects
  },
}

/**
 * All basic test circuits
 */
export const basicTests: TestCircuit[] = [
  voltageDivider,
  wireCurrentRegression,
  multiVoltageSource,
  isolatedCircuits,
  basicCurrentSource,
  ...switchTests,
]
