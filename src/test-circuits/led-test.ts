import type { Circuit } from '@/types/components'
import type { TestCircuit } from './types'

export const ledForwardTest: TestCircuit = {
  name: 'LED Forward Bias Test',
  description: 'Blue LED forward-biased with 5V supply and 1kΩ resistor',
  category: 'non-linear',
  tags: ['led', 'forward-bias', 'nonlinear'],
  circuit: {
    id: 'led-forward-test',
    name: 'LED Forward Test',
    components: [
      // 5V voltage source
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 200 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      // Blue LED (3.0V forward voltage)
      {
        id: 'LED1',
        type: 'led',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { color: 'blue' },
      },
      // 1kΩ current limiting resistor
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1000 },
      },
      // Ground
      {
        id: 'GND1',
        type: 'ground',
        position: { x: 100, y: 300 },
        rotation: 0,
        selected: false,
      },
      // Wires
      {
        id: 'W1',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'LED1',
          endTerminal: 'anode',
        },
      },
      {
        id: 'W2',
        type: 'wire',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'LED1',
          startTerminal: 'cathode',
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
      // Expected node voltages for forward-biased blue LED
      // V1+ should be ~5V, LED cathode should be ~2V, ground should be 0V
    },
    currents: {
      // Blue LED: Realistic exponential I-V curve model
      // With 3V forward voltage, the actual current will be determined by
      // the intersection of LED curve and load line
      // Expect around 1-5mA depending on exact LED parameters
      LED1: 0.002, // Target ~2mA (will depend on LED model)
      R1: 0.002, // Same as LED current (series circuit)
      V1: -0.002, // Same magnitude, opposite direction
    },
    tolerance: 0.8, // 80% tolerance for realistic exponential LED model
  },
}
