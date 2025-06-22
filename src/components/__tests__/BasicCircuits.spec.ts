import { describe, it, expect } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit } from '@/types/components'

describe('Basic Circuit Simulation', () => {
  describe('Voltage Divider', () => {
    const createVoltageDivider = (): Circuit => ({
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
    })

    it('should divide voltage correctly between equal resistors', async () => {
      const result = await solveDC(createVoltageDivider())

      expect(result).not.toBeNull()

      // Get the voltage at the junction between R1 and R2
      const termToNode = result!.termToNodeIndex
      const r1Terminal2Node = termToNode.get('R1:terminal2')!
      const junctionVoltage = result!.voltages[r1Terminal2Node]

      console.log(`Junction voltage: ${junctionVoltage.toFixed(3)}V`)

      // Should be 2.5V (half of 5V)
      expect(junctionVoltage).toBeCloseTo(2.5, 2)
    })

    it('should have correct currents through components', async () => {
      const result = await solveDC(createVoltageDivider())

      expect(result).not.toBeNull()

      const voltageCurrent = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])
      const r2Current = Math.abs(result!.currents['R2'])

      console.log(
        `Currents - V1: ${voltageCurrent * 1000}mA, R1: ${r1Current * 1000}mA, R2: ${r2Current * 1000}mA`,
      )

      // All currents should be 2.5mA (5V / 2000Ω total)
      expect(voltageCurrent).toBeCloseTo(0.0025, 4)
      expect(r1Current).toBeCloseTo(0.0025, 4)
      expect(r2Current).toBeCloseTo(0.0025, 4)
    })
  })

  describe('Current Source', () => {
    const createCurrentSource = (): Circuit => ({
      id: 'basic-current-source-test',
      name: 'Basic Current Source Test',
      components: [
        {
          id: 'I1',
          type: 'current_source',
          position: { x: 100, y: 100 },
          rotation: 0,
          selected: false,
          properties: { current: 0.001 }, // 1mA
        },
        {
          id: 'R1',
          type: 'resistor',
          position: { x: 200, y: 100 },
          rotation: 0,
          selected: false,
          properties: { resistance: 1000 }, // 1kΩ
        },
        {
          id: 'GND1',
          type: 'ground',
          position: { x: 150, y: 200 },
          rotation: 0,
          selected: false,
        },
        {
          id: 'W1',
          type: 'wire',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: {
            startComponentId: 'I1',
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
            startComponentId: 'I1',
            startTerminal: 'negative',
            endComponentId: 'GND1',
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
            startComponentId: 'R1',
            startTerminal: 'terminal2',
            endComponentId: 'GND1',
            endTerminal: 'terminal',
          },
        },
      ],
      wires: [],
      probes: [],
      nodes: {},
    })

    it('should maintain constant current through circuit', async () => {
      const result = await solveDC(createCurrentSource())

      expect(result).not.toBeNull()

      const sourceCurrent = Math.abs(result!.currents['I1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      console.log(
        `Current source: ${sourceCurrent * 1000}mA, Resistor: ${resistorCurrent * 1000}mA`,
      )

      // Both should be 1mA
      expect(sourceCurrent).toBeCloseTo(0.001, 5)
      expect(resistorCurrent).toBeCloseTo(0.001, 5)
    })

    it('should create correct voltage across resistor', async () => {
      const result = await solveDC(createCurrentSource())

      expect(result).not.toBeNull()

      // Get voltage at current source positive terminal
      const termToNode = result!.termToNodeIndex
      const sourcePositiveNode = termToNode.get('I1:positive')!
      const sourceVoltage = result!.voltages[sourcePositiveNode]

      console.log(`Voltage across resistor: ${sourceVoltage.toFixed(3)}V`)

      // V = I * R = 0.001A * 1000Ω = 1V
      expect(sourceVoltage).toBeCloseTo(1.0, 2)
    })
  })

  describe('Switch Circuits', () => {
    const createSwitchCircuit = (switchOpen: boolean): Circuit => ({
      id: `basic-switch-${switchOpen ? 'open' : 'closed'}`,
      name: `Basic Switch Test (${switchOpen ? 'Open' : 'Closed'})`,
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
          properties: { isOpen: switchOpen },
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
    })

    it('should conduct current when switch is closed', async () => {
      const result = await solveDC(createSwitchCircuit(false)) // closed

      expect(result).not.toBeNull()

      const switchCurrent = Math.abs(result!.currents['SW1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      console.log(`Switch closed - Current: ${switchCurrent * 1000}mA`)

      // Should have ~5mA flowing (5V / 1000Ω ≈ 5mA)
      expect(switchCurrent).toBeGreaterThan(0.004) // > 4mA
      expect(switchCurrent).toBeLessThan(0.006) // < 6mA
      expect(resistorCurrent).toBeCloseTo(switchCurrent, 4)
    })

    it('should block current when switch is open', async () => {
      const result = await solveDC(createSwitchCircuit(true)) // open

      expect(result).not.toBeNull()

      const switchCurrent = Math.abs(result!.currents['SW1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      console.log(`Switch open - Current: ${switchCurrent * 1e6}μA`)

      // Should have very small leakage current (< 1μA)
      expect(switchCurrent).toBeLessThan(1e-6)
      expect(resistorCurrent).toBeCloseTo(switchCurrent, 8)
    })
  })

  describe('Wire Current Detection', () => {
    const createWireCurrentTest = (): Circuit => ({
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
    })

    it('should correctly calculate wire currents in series circuit', async () => {
      const result = await solveDC(createWireCurrentTest())

      expect(result).not.toBeNull()

      const w4Current = Math.abs(result!.currents['W4'])
      const r1Current = Math.abs(result!.currents['R1'])
      const r2Current = Math.abs(result!.currents['R2'])

      console.log(`Wire W4 current: ${w4Current * 1000}mA`)
      console.log(`R1 current: ${r1Current * 1000}mA, R2 current: ${r2Current * 1000}mA`)

      // W4 should show actual current, not 0mA (this was the critical bug)
      expect(w4Current).toBeGreaterThan(0.001) // > 1mA
      expect(w4Current).toBeCloseTo(r1Current, 4) // Should match series current
      expect(w4Current).toBeCloseTo(r2Current, 4) // Should match series current
    })
  })

  describe('Multiple Voltage Sources', () => {
    const createMultiVoltageCircuit = (): Circuit => ({
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
    })

    it('should handle opposing voltage sources correctly', async () => {
      const result = await solveDC(createMultiVoltageCircuit())

      expect(result).not.toBeNull()

      const v1Current = Math.abs(result!.currents['V1'])
      const v2Current = Math.abs(result!.currents['V2'])

      console.log(`V1 current: ${v1Current * 1000}mA, V2 current: ${v2Current * 1000}mA`)

      // Net voltage: 5V - 3V = 2V, Total resistance: 3000Ω
      // Expected current: 2V / 3000Ω ≈ 0.667mA
      expect(v1Current).toBeCloseTo(0.000667, 4)
      expect(v2Current).toBeCloseTo(0.000667, 4)
    })
  })
})
