import type { TestCircuit } from './types'
import type { Circuit } from '@/types/components'

/**
 * Switch test circuits for validating switch functionality
 */

export const basicSwitchClosed: TestCircuit = {
  name: 'Basic Switch Circuit (Closed)',
  description: 'V1=5V, R1=1kΩ, Switch=CLOSED - Tests switch as closed conductor',
  category: 'basic',
  tags: ['switch', 'basic', 'closed'],
  circuit: {
    id: 'basic-switch-closed',
    name: 'Basic Switch Test (Closed)',
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
        id: 'SW1',
        type: 'switch',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { isOpen: false }, // Closed switch
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 400, y: 150 },
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
          endComponentId: 'SW1',
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
          startComponentId: 'SW1',
          startTerminal: 'terminal2',
          endComponentId: 'R1',
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
          startComponentId: 'R1',
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
      // With closed switch (1mΩ), current flows: I ≈ 5V/(1000Ω + 0.005Ω total resistance) ≈ 4.9975mA
      // Small voltage drops due to 1mΩ wire resistances and 1mΩ closed switch
      '0': 4.9999975, // V1:positive terminal (~5V with small wire drop)
      '2': 4.999995, // SW1:terminal1 (small drop from wire W1: 1mΩ × 5mA)
      '3': 4.999985, // SW1:terminal2 (additional drop from closed switch: 1mΩ × 5mA)
      '4': 4.99998, // R1:terminal1 (small drop from wire W2: 1mΩ × 5mA)
      '5': 0.000005, // R1:terminal2 (small rise from wire W3 to ground: 1mΩ × 5mA)
    },
    currents: {
      V1: -0.004999975, // ~5mA flowing out of voltage source
      SW1: 0.004999975, // ~5mA through closed switch
      R1: 0.004999975, // ~5mA through resistor
    },
    tolerance: 0.01, // 1% tolerance for wire resistance effects
  },
}

export const basicSwitchOpen: TestCircuit = {
  name: 'Basic Switch Circuit (Open)',
  description: 'V1=5V, R1=1kΩ, Switch=OPEN - Tests switch as open circuit',
  category: 'basic',
  tags: ['switch', 'basic', 'open'],
  circuit: {
    id: 'basic-switch-open',
    name: 'Basic Switch Test (Open)',
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
        id: 'SW1',
        type: 'switch',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { isOpen: true }, // Open switch
      },
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 400, y: 150 },
        rotation: 0,
        selected: false,
      },
      // Same wiring as closed switch test
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'SW1',
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
          startComponentId: 'SW1',
          startTerminal: 'terminal2',
          endComponentId: 'R1',
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
          startComponentId: 'R1',
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
      // With open switch (1GΩ), minimal leakage current flows: I ≈ 5V/(1GΩ + 1kΩ) ≈ 5nA
      // Very small voltage drops due to nA currents through mΩ resistances
      '0': 5.0, // V1:positive terminal (~5V with tiny wire drop)
      '2': 5.0, // SW1:terminal1 (tiny drop from wire W1: 1mΩ × 5nA ≈ 5pV)
      '3': 0.000005, // SW1:terminal2 (small voltage due to current through resistor path)
      '4': 0.000005, // R1:terminal1 (same as SW1 terminal2, tiny wire drop)
      '5': 5e-12, // R1:terminal2 (tiny wire rise: 1mΩ × 5nA ≈ 5fV)
    },
    currents: {
      V1: -5e-9, // ~5nA leakage current through open circuit
      SW1: 5e-9, // ~5nA leakage current through open switch (1GΩ)
      R1: 5e-9, // ~5nA leakage current through resistor
    },
    tolerance: 0.1, // 10% tolerance for small leakage currents
  },
}

export const switchTests: TestCircuit[] = [basicSwitchClosed, basicSwitchOpen]
