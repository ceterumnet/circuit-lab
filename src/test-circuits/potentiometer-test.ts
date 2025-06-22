import type { Circuit } from '@/types/components'

/**
 * Test circuits for potentiometer and variable resistor components
 * These tests validate:
 * 1. Variable resistor basic operation
 * 2. Potentiometer voltage divider operation
 * 3. Real-time adjustment functionality
 * 4. Simulation accuracy
 */

export const variableResistorBasicTest: Circuit = {
  id: 'variable-resistor-basic',
  name: 'Variable Resistor Basic Test',
  components: [
    // 5V voltage source
    {
      id: 'V1',
      type: 'voltage_source',
      position: { x: 100, y: 200 },
      rotation: 0,
      label: 'V1',
      selected: false,
      properties: { voltage: 5 },
    },
    // Variable resistor (0-10kΩ, set to 5kΩ)
    {
      id: 'VR1',
      type: 'variable_resistor',
      position: { x: 200, y: 150 },
      rotation: 0,
      label: 'VR1',
      selected: false,
      properties: {
        resistance: 5000,
        minResistance: 0,
        maxResistance: 10000,
      },
    },
    // Ground
    {
      id: 'GND1',
      type: 'ground',
      position: { x: 100, y: 250 },
      rotation: 0,
      label: 'GND1',
      selected: false,
      properties: {},
    },
    // Wire: V1 positive to VR1 terminal1
    {
      id: 'W1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W1',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'VR1',
        endTerminal: 'terminal1',
        resistance: 1e-6,
      },
    },
    // Wire: VR1 terminal2 to GND1
    {
      id: 'W2',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W2',
      selected: false,
      properties: {
        startComponentId: 'VR1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
    // Wire: V1 negative to GND1
    {
      id: 'W3',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W3',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
  ],
  wires: [],
  probes: [],
  nodes: {},
}

export const potentiometerVoltageDividerTest: Circuit = {
  id: 'potentiometer-voltage-divider',
  name: 'Potentiometer Voltage Divider Test',
  components: [
    // 10V voltage source
    {
      id: 'V1',
      type: 'voltage_source',
      position: { x: 100, y: 200 },
      rotation: 0,
      label: 'V1',
      selected: false,
      properties: { voltage: 10 },
    },
    // Potentiometer (10kΩ total, wiper at 50%)
    {
      id: 'POT1',
      type: 'potentiometer',
      position: { x: 250, y: 150 },
      rotation: 0,
      label: 'POT1',
      selected: false,
      properties: {
        totalResistance: 10000,
        wiperPosition: 50, // 50% = 5V expected at wiper
      },
    },
    // Ground
    {
      id: 'GND1',
      type: 'ground',
      position: { x: 100, y: 250 },
      rotation: 0,
      label: 'GND1',
      selected: false,
      properties: {},
    },
    // Wire: V1 positive to POT1 terminal1
    {
      id: 'W1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W1',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'POT1',
        endTerminal: 'terminal1',
        resistance: 1e-6,
      },
    },
    // Wire: POT1 terminal2 to GND1
    {
      id: 'W2',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W2',
      selected: false,
      properties: {
        startComponentId: 'POT1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
    // Wire: V1 negative to GND1
    {
      id: 'W3',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W3',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
  ],
  wires: [],
  probes: [],
  nodes: {},
}

export const potentiometerWithLoadTest: Circuit = {
  id: 'potentiometer-with-load',
  name: 'Potentiometer with Load Test',
  components: [
    // 12V voltage source
    {
      id: 'V1',
      type: 'voltage_source',
      position: { x: 100, y: 200 },
      rotation: 0,
      label: 'V1',
      selected: false,
      properties: { voltage: 12 },
    },
    // Potentiometer (1kΩ total, wiper at 25%)
    {
      id: 'POT1',
      type: 'potentiometer',
      position: { x: 250, y: 150 },
      rotation: 0,
      label: 'POT1',
      selected: false,
      properties: {
        totalResistance: 1000,
        wiperPosition: 25, // 25% = 3V unloaded, less with load
      },
    },
    // Load resistor
    {
      id: 'R1',
      type: 'resistor',
      position: { x: 350, y: 150 },
      rotation: 90,
      label: 'R1',
      selected: false,
      properties: { resistance: 1000 },
    },
    // Ground
    {
      id: 'GND1',
      type: 'ground',
      position: { x: 100, y: 250 },
      rotation: 0,
      label: 'GND1',
      selected: false,
      properties: {},
    },
    // Wire: V1 positive to POT1 terminal1
    {
      id: 'W1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W1',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'POT1',
        endTerminal: 'terminal1',
        resistance: 1e-6,
      },
    },
    // Wire: POT1 terminal2 to GND1
    {
      id: 'W2',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W2',
      selected: false,
      properties: {
        startComponentId: 'POT1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
    // Wire: POT1 wiper to R1 terminal1
    {
      id: 'W3',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W3',
      selected: false,
      properties: {
        startComponentId: 'POT1',
        startTerminal: 'wiper',
        endComponentId: 'R1',
        endTerminal: 'terminal1',
        resistance: 1e-6,
      },
    },
    // Wire: R1 terminal2 to GND1
    {
      id: 'W4',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W4',
      selected: false,
      properties: {
        startComponentId: 'R1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
    // Wire: V1 negative to GND1
    {
      id: 'W5',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      label: 'W5',
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
        resistance: 1e-6,
      },
    },
  ],
  wires: [],
  probes: [],
  nodes: {},
}

/**
 * Expected results for test validation:
 *
 * Variable Resistor Basic Test:
 * - Current through VR1: 5V / 5000Ω = 1mA
 * - Power dissipation: I²R = (0.001)² × 5000 = 5mW
 *
 * Potentiometer Voltage Divider Test:
 * - Voltage at wiper: 10V × (50/100) = 5V
 * - Current through POT1: 10V / 10000Ω = 1mA
 * - Wiper acts as ideal voltage divider when no load
 *
 * Potentiometer with Load Test:
 * - Voltage at wiper (loaded): calculated by parallel resistance
 * - R_lower = 250Ω (25% of 1kΩ)
 * - R_upper = 750Ω (75% of 1kΩ)
 * - R_parallel = (250Ω || 1000Ω) = 200Ω
 * - Voltage divider: 12V × (200Ω / (750Ω + 200Ω)) = 12V × (200/950) ≈ 2.53V
 */
