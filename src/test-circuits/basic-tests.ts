import type { TestCircuit } from './types'
import type { Circuit } from '@/types/components'

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
      // Corrected node indices based on actual simulation results
      '0': 5.0, // V+ terminal
      '1': 0.0, // Ground node
      '2': 2.5, // Between R1 and R2
    },
    currents: {
      V1: -0.0025, // 2.5mA flowing out of voltage source
      R1: 0.0025, // 2.5mA through R1
      R2: 0.0025, // 2.5mA through R2
    },
    tolerance: 0.001, // 0.1% tolerance
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
      '0': 5.0, // V+
      '1': 0.0, // Ground node
      '2': 3.0, // At junction (voltage divider: 5V * 1500/(1000+1500))
    },
    currents: {
      V1: -0.002, // 2mA from voltage source
      R1: 0.002, // 2mA through R1
      R2: 0.002, // 2mA through R2
      W4: 0.002, // 🎯 CRITICAL: Wire W4 should show 2mA, NOT 0mA!
    },
    tolerance: 0.001,
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
    // Expected values for series opposition circuit:
    // V1 = 5V, V2 = 3V in series opposition
    // Net voltage: 5V - 3V = 2V
    // Total resistance: 1000Ω + 2000Ω = 3000Ω
    // Current: 2V / 3000Ω = 0.667mA (V1 to V2 direction)
    voltages: {
      '0': 5.0, // V1 positive terminal
      '1': 0.0, // Ground (shared by both voltage source negatives)
      '2': 3.0, // V2 positive terminal (fixed at 3V)
      '3': 4.33, // Between R1 and R2: 5V - (0.667mA * 1000Ω) = 4.33V
    },
    currents: {
      V1: -0.000667, // 0.67mA out of V1
      V2: 0.000667, // 0.67mA into V2 (opposing V1)
      R1: 0.000667, // 0.67mA through R1
      R2: 0.000667, // 0.67mA through R2
    },
    tolerance: 0.01, // Higher tolerance for multi-source analysis
  },
}

/**
 * All basic test circuits
 */
export const basicTests: TestCircuit[] = [voltageDivider, wireCurrentRegression, multiVoltageSource]
