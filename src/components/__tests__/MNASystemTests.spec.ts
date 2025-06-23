import { describe, it, expect, beforeEach } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit } from '@/types/components'

/**
 * MNA System Tests - Foundation Layer
 *
 * These tests validate the core MNA mathematical operations at a granular level
 * to catch regressions immediately and support safe refactoring of simulation.ts
 *
 * Test Philosophy:
 * 1. Test individual mathematical operations in isolation
 * 2. Verify parameter independence (different values = different results)
 * 3. Validate fundamental circuit laws (KVL, KCL)
 * 4. Test edge cases that reveal numerical issues
 * 5. Provide clear failure diagnostics
 */

describe('MNA System Foundation Tests', () => {
  describe('Basic Linear Matrix Operations', () => {
    it('should handle single resistor circuit correctly', async () => {
      const circuit: Circuit = {
        id: 'single-resistor',
        name: 'Single Resistor Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 12 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1200 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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

      // Test Ohm's Law: I = V/R = 12V/1200Ω = 0.01A
      const expectedCurrent = 12 / 1200
      const actualCurrent = Math.abs(result!.currents['V1'])

      expect(actualCurrent).toBeCloseTo(expectedCurrent, 6)
      expect(Math.abs(result!.currents['R1'])).toBeCloseTo(expectedCurrent, 6)

      // All components in series should have identical current
      const currentTolerance = expectedCurrent * 1e-6 // 1ppm tolerance
      expect(
        Math.abs(Math.abs(result!.currents['V1']) - Math.abs(result!.currents['R1'])),
      ).toBeLessThan(currentTolerance)
    })

    it('should demonstrate parameter independence - different resistances produce different currents', async () => {
      const createCircuit = (resistance: number): Circuit => ({
        id: `param-test-${resistance}`,
        name: `Parameter Test ${resistance}Ω`,
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 10 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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

      // Test different resistance values
      const resistances = [100, 1000, 10000]
      const results: { resistance: number; current: number }[] = []

      for (const resistance of resistances) {
        const result = await solveDC(createCircuit(resistance))
        expect(result).not.toBeNull()

        const current = Math.abs(result!.currents['V1'])
        const expectedCurrent = 10 / resistance

        expect(current).toBeCloseTo(expectedCurrent, 6)
        results.push({ resistance, current })
      }

      // CRITICAL: Verify parameter independence
      // Different resistances MUST produce different currents
      expect(results[0].current).not.toBeCloseTo(results[1].current, 3)
      expect(results[1].current).not.toBeCloseTo(results[2].current, 3)
      expect(results[0].current).not.toBeCloseTo(results[2].current, 3)

      // Verify inverse relationship: higher resistance = lower current
      expect(results[0].current).toBeGreaterThan(results[1].current)
      expect(results[1].current).toBeGreaterThan(results[2].current)

      console.log('Parameter Independence Verification:')
      results.forEach((r) => {
        console.log(`  ${r.resistance}Ω → ${r.current.toExponential(3)}A`)
      })
    })

    it('should correctly handle voltage divider mathematics', async () => {
      const circuit: Circuit = {
        id: 'voltage-divider-math',
        name: 'Voltage Divider Math Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 15 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 3000 },
          },
          {
            id: 'R2',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 2000 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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
      }

      const result = await solveDC(circuit)
      expect(result).not.toBeNull()

      // Calculate expected values
      const totalResistance = 3000 + 2000
      const expectedCurrent = 15 / totalResistance
      const expectedR2Voltage = expectedCurrent * 2000 // Voltage across R2

      // Verify current through series components
      const voltageCurrent = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])
      const r2Current = Math.abs(result!.currents['R2'])

      expect(voltageCurrent).toBeCloseTo(expectedCurrent, 6)
      expect(r1Current).toBeCloseTo(expectedCurrent, 6)
      expect(r2Current).toBeCloseTo(expectedCurrent, 6)

      // Verify voltage division
      const termToNode = result!.termToNodeIndex
      const r2Node1 = termToNode.get('R2:terminal1')!
      const actualR2Voltage = result!.voltages[r2Node1]

      expect(actualR2Voltage).toBeCloseTo(expectedR2Voltage, 6)

      console.log(
        `Voltage Divider: ${actualR2Voltage.toFixed(3)}V (expected ${expectedR2Voltage.toFixed(3)}V)`,
      )
    })
  })

  describe('Current Calculation Integrity', () => {
    it('should maintain KCL (Kirchhoff Current Law) in series circuits', async () => {
      const circuit: Circuit = {
        id: 'kcl-series-test',
        name: 'KCL Series Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 9 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1800 },
          },
          {
            id: 'R2',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1200 },
          },
          {
            id: 'R3',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1000 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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
              endComponentId: 'R3',
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
              startComponentId: 'R3',
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
      }

      const result = await solveDC(circuit)
      expect(result).not.toBeNull()

      // In a series circuit, all component currents must be identical
      const voltageSourceCurrent = Math.abs(result!.currents['V1'])
      const r1Current = Math.abs(result!.currents['R1'])
      const r2Current = Math.abs(result!.currents['R2'])
      const r3Current = Math.abs(result!.currents['R3'])

      const expectedCurrent = 9 / (1800 + 1200 + 1000)

      // Verify each component matches expected current
      expect(voltageSourceCurrent).toBeCloseTo(expectedCurrent, 6)
      expect(r1Current).toBeCloseTo(expectedCurrent, 6)
      expect(r2Current).toBeCloseTo(expectedCurrent, 6)
      expect(r3Current).toBeCloseTo(expectedCurrent, 6)

      // CRITICAL: Verify KCL compliance - all currents must be identical within numerical precision
      const currentTolerance = expectedCurrent * 1e-6 // 1ppm tolerance
      expect(Math.abs(voltageSourceCurrent - r1Current)).toBeLessThan(currentTolerance)
      expect(Math.abs(r1Current - r2Current)).toBeLessThan(currentTolerance)
      expect(Math.abs(r2Current - r3Current)).toBeLessThan(currentTolerance)

      console.log('KCL Verification (all should be identical):')
      console.log(`  V1: ${voltageSourceCurrent.toExponential(6)}A`)
      console.log(`  R1: ${r1Current.toExponential(6)}A`)
      console.log(`  R2: ${r2Current.toExponential(6)}A`)
      console.log(`  R3: ${r3Current.toExponential(6)}A`)
    })

    it('should calculate wire currents consistently with component currents', async () => {
      const circuit: Circuit = {
        id: 'wire-current-consistency',
        name: 'Wire Current Consistency Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 6 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 2400 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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

      const expectedCurrent = 6 / 2400

      // All elements in the series path should have identical currents
      const voltageCurrent = Math.abs(result!.currents['V1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])
      const wire1Current = Math.abs(result!.currents['W1'])
      const wire2Current = Math.abs(result!.currents['W2'])
      const wire3Current = Math.abs(result!.currents['W3'])

      expect(voltageCurrent).toBeCloseTo(expectedCurrent, 6)
      expect(resistorCurrent).toBeCloseTo(expectedCurrent, 6)
      expect(wire1Current).toBeCloseTo(expectedCurrent, 6)
      expect(wire2Current).toBeCloseTo(expectedCurrent, 6)
      expect(wire3Current).toBeCloseTo(expectedCurrent, 6)

      // CRITICAL: Wire currents must match component currents exactly
      const tolerance = expectedCurrent * 1e-6
      expect(Math.abs(voltageCurrent - wire1Current)).toBeLessThan(tolerance)
      expect(Math.abs(resistorCurrent - wire2Current)).toBeLessThan(tolerance)
      expect(Math.abs(voltageCurrent - wire3Current)).toBeLessThan(tolerance)

      console.log('Wire-Component Current Consistency:')
      console.log(
        `  V1: ${voltageCurrent.toExponential(6)}A, W1: ${wire1Current.toExponential(6)}A`,
      )
      console.log(
        `  R1: ${resistorCurrent.toExponential(6)}A, W2: ${wire2Current.toExponential(6)}A`,
      )
    })
  })

  describe('Voltage Calculation Integrity', () => {
    it('should maintain KVL (Kirchhoff Voltage Law) in series circuits', async () => {
      const circuit: Circuit = {
        id: 'kvl-series-test',
        name: 'KVL Series Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 24 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 4700 },
          },
          {
            id: 'R2',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 3300 },
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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
      }

      const result = await solveDC(circuit)
      expect(result).not.toBeNull()

      // Calculate expected values
      const current = 24 / (4700 + 3300)
      const expectedR1Voltage = current * 4700
      const expectedR2Voltage = current * 3300

      // Get actual voltages from node differences
      const termToNode = result!.termToNodeIndex

      const r1PosNode = termToNode.get('R1:terminal1')!
      const r1NegNode = termToNode.get('R1:terminal2')!
      const r2PosNode = termToNode.get('R2:terminal1')!
      const r2NegNode = termToNode.get('R2:terminal2')!

      const actualR1Voltage = result!.voltages[r1PosNode] - result!.voltages[r1NegNode]
      const actualR2Voltage = result!.voltages[r2PosNode] - result!.voltages[r2NegNode]

      // Verify individual voltage drops
      expect(actualR1Voltage).toBeCloseTo(expectedR1Voltage, 6)
      expect(actualR2Voltage).toBeCloseTo(expectedR2Voltage, 6)

      // CRITICAL: KVL compliance - voltage drops must sum to source voltage
      const totalVoltageDrop = actualR1Voltage + actualR2Voltage
      expect(totalVoltageDrop).toBeCloseTo(24, 6)

      const kvlError = Math.abs(totalVoltageDrop - 24)
      expect(kvlError).toBeLessThan(1e-6) // 1µV tolerance

      console.log('KVL Verification:')
      console.log(
        `  R1: ${actualR1Voltage.toFixed(6)}V (expected ${expectedR1Voltage.toFixed(6)}V)`,
      )
      console.log(
        `  R2: ${actualR2Voltage.toFixed(6)}V (expected ${expectedR2Voltage.toFixed(6)}V)`,
      )
      console.log(`  Sum: ${totalVoltageDrop.toFixed(6)}V (should be 24.000000V)`)
      console.log(`  KVL Error: ${kvlError.toExponential(2)}V`)
    })
  })

  describe('Edge Cases and Numerical Stability', () => {
    it('should handle very small resistance values without numerical issues', async () => {
      const circuit: Circuit = {
        id: 'small-resistance',
        name: 'Small Resistance Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 1 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1e-3 }, // 1mΩ
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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

      const expectedCurrent = 1 / 1e-3 // 1000A
      const actualCurrent = Math.abs(result!.currents['V1'])

      expect(actualCurrent).toBeCloseTo(expectedCurrent, 3)
      expect(result!.solverMetrics?.significantDigits).toBeGreaterThan(10)
    })

    it('should handle very large resistance values without numerical issues', async () => {
      const circuit: Circuit = {
        id: 'large-resistance',
        name: 'Large Resistance Test',
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { voltage: 100 },
          },
          {
            id: 'R1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            rotation: 0,
            selected: false,
            properties: { resistance: 1e9 }, // 1GΩ
          },
          {
            id: 'GND1',
            type: 'ground',
            position: { x: 0, y: 0 },
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

      const expectedCurrent = 100 / 1e9 // 100nA
      const actualCurrent = Math.abs(result!.currents['V1'])

      expect(actualCurrent).toBeCloseTo(expectedCurrent, 12)
      expect(result!.solverMetrics?.significantDigits).toBeGreaterThan(10)
    })
  })
})

describe('Current Source Foundation Tests', () => {
  it('should maintain constant current regardless of load resistance', async () => {
    const createCurrentSourceCircuit = (loadResistance: number): Circuit => ({
      id: `current-source-${loadResistance}`,
      name: `Current Source Test ${loadResistance}Ω`,
      components: [
        {
          id: 'I1',
          type: 'current_source',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: { current: 0.005 }, // 5mA constant
        },
        {
          id: 'R1',
          type: 'resistor',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: { resistance: loadResistance },
        },
        {
          id: 'GND1',
          type: 'ground',
          position: { x: 0, y: 0 },
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
            startComponentId: 'R1',
            startTerminal: 'terminal2',
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
            startComponentId: 'I1',
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

    // Test with different load resistances
    const loadResistances = [100, 1000, 10000]
    const currentResults: number[] = []
    const voltageResults: number[] = []

    for (const resistance of loadResistances) {
      const result = await solveDC(createCurrentSourceCircuit(resistance))
      expect(result).not.toBeNull()

      const currentSourceCurrent = Math.abs(result!.currents['I1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      // Current source should maintain constant 5mA regardless of load
      expect(currentSourceCurrent).toBeCloseTo(0.005, 6)
      expect(resistorCurrent).toBeCloseTo(0.005, 6)

      // Voltage should change according to Ohm's law: V = IR
      const termToNode = result!.termToNodeIndex
      const rPosNode = termToNode.get('R1:terminal1')!
      const rNegNode = termToNode.get('R1:terminal2')!
      const resistorVoltage = result!.voltages[rPosNode] - result!.voltages[rNegNode]
      const expectedVoltage = 0.005 * resistance

      expect(resistorVoltage).toBeCloseTo(expectedVoltage, 6)

      currentResults.push(currentSourceCurrent)
      voltageResults.push(resistorVoltage)
    }

    // CRITICAL: Current source maintains constant current
    expect(currentResults[0]).toBeCloseTo(currentResults[1], 6)
    expect(currentResults[1]).toBeCloseTo(currentResults[2], 6)

    // Voltage changes with load resistance
    expect(voltageResults[0]).not.toBeCloseTo(voltageResults[1], 3)
    expect(voltageResults[1]).not.toBeCloseTo(voltageResults[2], 3)

    console.log('Current Source Parameter Independence:')
    loadResistances.forEach((r, i) => {
      console.log(
        `  ${r}Ω → I=${currentResults[i].toExponential(3)}A, V=${voltageResults[i].toFixed(3)}V`,
      )
    })
  })
})
