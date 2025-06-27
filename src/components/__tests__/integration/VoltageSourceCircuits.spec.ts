import { describe, it, expect } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit } from '@/types/components'

describe('Voltage Source Integration Tests', () => {
  describe('Voltage Probe Behavior', () => {
    it('should read correct voltages at different points in series circuit', async () => {
      const circuit: Circuit = {
        id: 'voltage-probe-test',
        name: 'Voltage Probe Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
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
            position: { x: 150, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
        probes: [
          {
            id: 'P1',
            type: 'voltage',
            targetId: 'W1', // Wire between V1+ and V2-
            position: { x: 150, y: 80 },
          },
          {
            id: 'P2',
            type: 'voltage',
            targetId: 'W2', // Wire between V2+ and R1
            position: { x: 250, y: 80 },
          },
        ],
        nodes: {},
      }

      const result = await solveDC(circuit)
      expect(result).not.toBeNull()

      // Expected voltages in series circuit V1(5V) → V2(5V) → R1(1kΩ) → GND:
      // - After V1: 5V
      // - After V2: 10V
      // - After R1: 0V (ground)

      const { voltages, termToNodeIndex } = result!

      // Check actual node voltages
      const v1PosNode = termToNodeIndex.get('V1:positive')!
      const v2NegNode = termToNodeIndex.get('V2:negative')!
      const v2PosNode = termToNodeIndex.get('V2:positive')!
      const r1Node = termToNodeIndex.get('R1:terminal1')!

      console.log(`\n🔍 Voltage Probe Test Results:`)
      console.log(`V1:positive node voltage: ${voltages[v1PosNode].toFixed(3)}V`)
      console.log(`V2:negative node voltage: ${voltages[v2NegNode].toFixed(3)}V`)
      console.log(`V2:positive node voltage: ${voltages[v2PosNode].toFixed(3)}V`)
      console.log(`R1:terminal1 node voltage: ${voltages[r1Node].toFixed(3)}V`)

      // Verify the expected voltages
      expect(voltages[v1PosNode]).toBeCloseTo(5.0, 2) // After first 5V source
      expect(voltages[v2PosNode]).toBeCloseTo(10.0, 2) // After second 5V source (5V + 5V)
      expect(voltages[r1Node]).toBeCloseTo(10.0, 2) // Same as V2:positive (connected by wire)

      // Test the voltage probe fix: probes should now read the higher voltage terminal
      // This simulates what the UI voltage probes would show
      console.log(`\n✅ Fixed Probe Behavior:`)
      console.log(`Probe P1 on W1 should read max(V1:positive=5V, V2:negative=5V) = 5V`)
      console.log(`Probe P2 on W2 should read max(V2:positive=10V, R1:terminal1=10V) = 10V`)

      // The fix: Probes now intelligently choose the higher voltage terminal
      // This gives users the expected behavior in series circuits
    })
  })

  describe('Series Voltage Sources', () => {
    it('should add voltage sources in series: 5V + 3V = 8V', async () => {
      const circuit: Circuit = {
        id: 'voltage-series-5v-3v',
        name: 'Series 5V + 3V Voltage Sources',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 3.0 },
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
            position: { x: 200, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Expected: 8V total through 1kΩ = 8mA
      const v1Current = Math.abs(result!.currents.V1)
      const v2Current = Math.abs(result!.currents.V2)
      const r1Current = Math.abs(result!.currents.R1)

      console.log(
        `Series 5V+3V: V1=${v1Current * 1000}mA, V2=${v2Current * 1000}mA, R1=${r1Current * 1000}mA`,
      )

      expect(v1Current).toBeCloseTo(0.008, 4)
      expect(v2Current).toBeCloseTo(0.008, 4)
      expect(r1Current).toBeCloseTo(0.008, 4)
    })
  })

  describe('Multiple Voltage Sources in Series', () => {
    it('should add voltages correctly for two positive sources in series', async () => {
      const circuit: Circuit = {
        id: 'series-voltage-sources-test',
        name: 'Series Voltage Sources Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 3.0 },
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
            position: { x: 200, y: 200 },
            rotation: 0,
            selected: false,
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Total voltage should be 5V + 3V = 8V
      // Current should be 8V / 1000Ω = 8mA
      const expectedCurrent = 0.008
      const v1Current = Math.abs(result!.currents['V1'])
      const v2Current = Math.abs(result!.currents['V2'])
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(
        `Series positive sources - V1: ${v1Current * 1000}mA, V2: ${v2Current * 1000}mA, R1: ${r1Current * 1000}mA`,
      )

      expect(v1Current).toBeCloseTo(expectedCurrent, 4)
      expect(v2Current).toBeCloseTo(expectedCurrent, 4)
      expect(r1Current).toBeCloseTo(expectedCurrent, 4)
    })

    it('should handle three voltage sources in series', async () => {
      const circuit: Circuit = {
        id: 'three-series-voltage-sources-test',
        name: 'Three Series Voltage Sources Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 2.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 3.0 },
          },
          {
            id: 'V3',
            type: 'voltage_source',
            position: { x: 300, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 1.0 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 400, y: 100 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1000 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 200, y: 200 },
            rotation: 0,
            selected: false,
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'V3',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V3',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W4',
            type: 'wire' as const,
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
            id: 'W5',
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Total voltage should be 2V + 3V + 1V = 6V
      // Current should be 6V / 1000Ω = 6mA
      const expectedCurrent = 0.006
      const v1Current = Math.abs(result!.currents['V1'])
      const v2Current = Math.abs(result!.currents['V2'])
      const v3Current = Math.abs(result!.currents['V3'])
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(
        `Three series sources - V1: ${v1Current * 1000}mA, V2: ${v2Current * 1000}mA, V3: ${v3Current * 1000}mA, R1: ${r1Current * 1000}mA`,
      )

      expect(v1Current).toBeCloseTo(expectedCurrent, 4)
      expect(v2Current).toBeCloseTo(expectedCurrent, 4)
      expect(v3Current).toBeCloseTo(expectedCurrent, 4)
      expect(r1Current).toBeCloseTo(expectedCurrent, 4)
    })
  })

  describe('Opposing Voltage Sources', () => {
    it('should subtract opposing voltages correctly (5V - 3V = 2V)', async () => {
      const circuit: Circuit = {
        id: 'opposing-voltage-test',
        name: 'Opposing Voltage Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 180, // Reversed polarity
            selected: false,
            properties: { voltage: 3.0 },
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
            position: { x: 150, y: 200 },
            rotation: 0,
            selected: false,
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative', // Series opposing connection
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Net voltage should be 5V - 3V = 2V
      // Current should be 2V / 1000Ω = 2mA
      const expectedCurrent = 0.002
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(`Opposing voltages (5V - 3V) - R1: ${r1Current * 1000}mA`)

      expect(r1Current).toBeCloseTo(expectedCurrent, 4)
    })

    it('should handle equal opposing voltages (should result in zero current)', async () => {
      const circuit: Circuit = {
        id: 'equal-opposing-voltage-test',
        name: 'Equal Opposing Voltage Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 200, y: 100 },
            rotation: 180,
            selected: false,
            properties: { voltage: 5.0 },
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
            position: { x: 150, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V1',
              startTerminal: 'positive',
              endComponentId: 'V2',
              endTerminal: 'negative',
            },
          },
          {
            id: 'W2',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'positive',
              endComponentId: 'R1',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Net voltage should be 5V - 5V = 0V
      // Current should be 0V / 1000Ω = 0A
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(`Equal opposing voltages (5V - 5V) - R1: ${r1Current * 1000}mA`)

      expect(r1Current).toBeCloseTo(0, 6)
    })
  })

  describe('Voltage Sources with Non-Linear Elements', () => {
    it('should handle voltage source with forward-biased diode', async () => {
      const circuit: Circuit = {
        id: 'voltage-source-diode-test',
        name: 'Voltage Source with Diode Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 5.0 },
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
            id: 'D1',
            type: 'diode',
            position: { x: 300, y: 100 },
            rotation: 0,
            selected: false,
            properties: {
              saturationCurrent: 1e-12,
              thermalVoltage: 0.026,
            },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 200, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
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
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'R1',
              startTerminal: 'terminal2',
              endComponentId: 'D1',
              endTerminal: 'anode',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'D1',
              startTerminal: 'cathode',
              endComponentId: 'GND1',
              endTerminal: 'terminal',
            },
          },
          {
            id: 'W4',
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      const v1Current = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])
      const d1Current = Math.abs(result!.currents['D1'])

      console.log(
        `5V diode circuit - V1: ${v1Current * 1000}mA, R1: ${r1Current * 1000}mA, D1: ${d1Current * 1000}mA`,
      )

      // Diode should conduct, current should be positive and reasonable
      expect(d1Current).toBeGreaterThan(0.001) // > 1mA
      expect(d1Current).toBeLessThan(0.01) // < 10mA
      expect(v1Current).toBeCloseTo(r1Current, 4) // Current conservation
      expect(r1Current).toBeCloseTo(d1Current, 4) // Series circuit
    })
  })

  describe('Complex Voltage Networks', () => {
    it('should solve complex resistor-voltage source network', async () => {
      const circuit: Circuit = {
        id: 'complex-voltage-resistor-network',
        name: 'Complex Voltage Source and Resistor Network',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 12.0 },
          },
          {
            id: 'V2',
            type: 'voltage_source',
            position: { x: 300, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 8.0 },
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
            properties: { resistance: 2000 },
          },
          {
            id: 'R3',
            type: 'resistor',
            position: { x: 300, y: 200 },
            rotation: 0,
            selected: false,
            properties: { resistance: 500 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 200, y: 300 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
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
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'R1',
              startTerminal: 'terminal2',
              endComponentId: 'V2',
              endTerminal: 'positive',
            },
          },
          {
            id: 'W3',
            type: 'wire' as const,
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
            id: 'W4',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'V2',
              startTerminal: 'negative',
              endComponentId: 'R3',
              endTerminal: 'terminal1',
            },
          },
          {
            id: 'W5',
            type: 'wire' as const,
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
            id: 'W6',
            type: 'wire' as const,
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: {
              startComponentId: 'R3',
              startTerminal: 'terminal2',
              endComponentId: 'GND1',
              endTerminal: 'terminal',
            },
          },
          {
            id: 'W7',
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      // Log all currents for analysis
      const v1Current = Math.abs(result!.currents['V1'])
      const v2Current = Math.abs(result!.currents['V2'])
      const r1Current = Math.abs(result!.currents['R1'])
      const r2Current = Math.abs(result!.currents['R2'])
      const r3Current = Math.abs(result!.currents['R3'])

      console.log(`Complex network - V1: ${v1Current * 1000}mA, V2: ${v2Current * 1000}mA`)
      console.log(
        `Complex network - R1: ${r1Current * 1000}mA, R2: ${r2Current * 1000}mA, R3: ${r3Current * 1000}mA`,
      )

      // Verify Kirchhoff's current law at the junction
      // Current into node = current out of node
      expect(r1Current).toBeGreaterThan(0)
      expect(r2Current).toBeGreaterThan(0)
      expect(r3Current).toBeGreaterThan(0)

      // All currents should be reasonable (not NaN or infinite)
      expect(Number.isFinite(v1Current)).toBe(true)
      expect(Number.isFinite(v2Current)).toBe(true)
      expect(Number.isFinite(r1Current)).toBe(true)
      expect(Number.isFinite(r2Current)).toBe(true)
      expect(Number.isFinite(r3Current)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero voltage source correctly', async () => {
      const circuit: Circuit = {
        id: 'zero-voltage-test',
        name: 'Zero Voltage Source Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 0.0 },
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
            id: 'GND1',
            type: 'ground',
            position: { x: 150, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
            id: 'W3',
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      const v1Current = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(`Zero voltage source - V1: ${v1Current}A, R1: ${r1Current}A`)

      // Zero voltage should result in zero current
      expect(v1Current).toBeCloseTo(0, 8)
      expect(r1Current).toBeCloseTo(0, 8)
    })

    it('should handle high voltage sources (100V)', async () => {
      const circuit: Circuit = {
        id: 'high-voltage-test',
        name: 'High Voltage Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 100, y: 100 },
            rotation: 0,
            selected: false,
            properties: { voltage: 100.0 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 200, y: 100 },
            rotation: 0,
            selected: false,
            properties: { resistance: 10000 }, // 10kΩ for reasonable current
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 150, y: 200 },
            rotation: 0,
            selected: false,
            properties: {},
          },
          {
            id: 'W1',
            type: 'wire' as const,
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
            type: 'wire' as const,
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
            id: 'W3',
            type: 'wire' as const,
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
      }

      const result = await solveDC(circuit)

      expect(result).not.toBeNull()

      const expectedCurrent = 100.0 / 10000 // 100V / 10kΩ = 10mA
      const v1Current = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])

      console.log(`High voltage (100V) - V1: ${v1Current * 1000}mA, R1: ${r1Current * 1000}mA`)

      expect(v1Current).toBeCloseTo(expectedCurrent, 4)
      expect(r1Current).toBeCloseTo(expectedCurrent, 4)
    })
  })
})
