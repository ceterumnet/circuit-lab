import { describe, it, expect, beforeEach } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit, CircuitComponent } from '@/types/components'

describe('Diode Simulation', () => {
  // Function to create a fresh circuit for each test to prevent contamination
  const createTestCircuit = (): Circuit => ({
    id: 'diode-test',
    name: 'Diode Test Circuit',
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
      // Standard silicon diode (default Is = 1e-12 A)
      {
        id: 'D1',
        type: 'diode',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { saturationCurrent: 1e-12 },
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
          endComponentId: 'D1',
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
          startComponentId: 'D1',
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
  })

  describe('Diode Forward Bias Test', () => {
    it('should simulate diode circuit with reasonable current', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()
      expect(result!.currents['D1']).toBeDefined()

      const diodeCurrent = Math.abs(result!.currents['D1'])
      console.log(
        `Diode Current: ${diodeCurrent.toExponential(3)}A (${(diodeCurrent * 1000).toFixed(2)}mA)`,
      )

      // Silicon diode should conduct reasonably with 5V supply and 1kΩ resistor
      // Forward current should be in the mA range for this circuit
      expect(diodeCurrent).toBeGreaterThan(1e-6) // > 1μA (conducting)
      expect(diodeCurrent).toBeLessThan(0.01) // < 10mA (reasonable for 5V/1kΩ)
    })

    it('should have diode current approximately equal to resistor current (series circuit)', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()

      const diodeCurrent = Math.abs(result!.currents['D1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      console.log(
        `Diode: ${diodeCurrent.toExponential(3)}A, R1: ${resistorCurrent.toExponential(3)}A`,
      )

      // In a series circuit, currents should be equal (within 1% tolerance)
      const currentDifference = Math.abs(diodeCurrent - resistorCurrent)
      const averageCurrent = (diodeCurrent + resistorCurrent) / 2
      const percentError = (currentDifference / averageCurrent) * 100

      expect(percentError).toBeLessThan(1) // Less than 1% difference
    })

    it('should have reasonable diode voltage drop', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()

      // Find diode nodes to calculate voltage drop
      const termToNode = result!.termToNodeIndex
      const anodeNode = termToNode.get('D1:anode')!
      const cathodeNode = termToNode.get('D1:cathode')!

      const anodeVoltage = result!.voltages[anodeNode]
      const cathodeVoltage = result!.voltages[cathodeNode]
      const diodeVoltage = anodeVoltage - cathodeVoltage

      console.log(`Diode Voltage: ${diodeVoltage.toFixed(3)}V`)

      // Silicon diode should have forward voltage between 0.3V and 1.0V when conducting
      // (less than LED forward voltage)
      expect(diodeVoltage).toBeGreaterThan(0.3)
      expect(diodeVoltage).toBeLessThan(1.0)
    })

    it("should satisfy Kirchhoff's voltage law", async () => {
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const result = await solveDC(freshCircuit, true)

      expect(result).not.toBeNull()

      // Get node voltages
      const termToNode = result!.termToNodeIndex
      const vSourcePos = result!.voltages[termToNode.get('V1:positive')!]
      const diodeAnode = result!.voltages[termToNode.get('D1:anode')!]
      const diodeCathode = result!.voltages[termToNode.get('D1:cathode')!]
      const resistorEnd = result!.voltages[termToNode.get('R1:terminal2')!]

      console.log(
        `Voltages: V+ = ${vSourcePos.toFixed(3)}V, Diode anode = ${diodeAnode.toFixed(3)}V, Diode cathode = ${diodeCathode.toFixed(3)}V, R end = ${resistorEnd.toFixed(3)}V`,
      )

      // Verify KVL: V_source = V_diode + V_resistor
      const diodeVoltage = diodeAnode - diodeCathode
      const resistorVoltage = diodeCathode - resistorEnd // resistorEnd should be ~0V (ground)
      const totalDrop = diodeVoltage + resistorVoltage

      console.log(
        `KVL Check: Diode = ${diodeVoltage.toFixed(3)}V + R = ${resistorVoltage.toFixed(3)}V = ${totalDrop.toFixed(3)}V (should be ~5V)`,
      )

      // Should sum to ~5V (within 1% tolerance)
      expect(Math.abs(totalDrop - 5.0)).toBeLessThan(0.05)
    })
  })

  describe('Diode Reverse Bias Test', () => {
    it('should handle reverse bias correctly (blocking behavior)', async () => {
      // Create circuit with diode reversed (cathode to positive)
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const reversedCircuit = {
        ...freshCircuit,
        components: freshCircuit.components.map((comp: CircuitComponent) => {
          if (comp.id === 'W1') {
            return {
              ...comp,
              properties: {
                startComponentId: 'V1',
                startTerminal: 'positive',
                endComponentId: 'D1',
                endTerminal: 'cathode', // Reversed!
              },
            }
          }
          if (comp.id === 'W2') {
            return {
              ...comp,
              properties: {
                startComponentId: 'D1',
                startTerminal: 'anode', // Reversed!
                endComponentId: 'R1',
                endTerminal: 'terminal1',
              },
            }
          }
          return comp
        }),
      }

      const result = await solveDC(reversedCircuit, true)

      expect(result).not.toBeNull()

      const diodeCurrent = Math.abs(result!.currents['D1'])
      console.log(`Reverse Diode Current: ${diodeCurrent.toExponential(3)}A`)

      // Reverse current should be very small (< 1nA for silicon diode)
      expect(diodeCurrent).toBeLessThan(1e-9)
    })

    it('should have negligible reverse current with reverse voltage', async () => {
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const reversedCircuit = {
        ...freshCircuit,
        components: freshCircuit.components.map((comp: CircuitComponent) => {
          if (comp.id === 'W1') {
            return {
              ...comp,
              properties: {
                startComponentId: 'V1',
                startTerminal: 'positive',
                endComponentId: 'D1',
                endTerminal: 'cathode', // Reversed!
              },
            }
          }
          if (comp.id === 'W2') {
            return {
              ...comp,
              properties: {
                startComponentId: 'D1',
                startTerminal: 'anode', // Reversed!
                endComponentId: 'R1',
                endTerminal: 'terminal1',
              },
            }
          }
          return comp
        }),
      }

      const result = await solveDC(reversedCircuit, true)

      expect(result).not.toBeNull()

      // Check diode voltage (should be negative)
      const termToNode = result!.termToNodeIndex
      const anodeNode = termToNode.get('D1:anode')!
      const cathodeNode = termToNode.get('D1:cathode')!

      const anodeVoltage = result!.voltages[anodeNode]
      const cathodeVoltage = result!.voltages[cathodeNode]
      const diodeVoltage = anodeVoltage - cathodeVoltage

      console.log(`Reverse Diode Voltage: ${diodeVoltage.toFixed(3)}V`)

      // In reverse bias, diode voltage should be negative
      expect(diodeVoltage).toBeLessThan(0)

      // Most of the supply voltage should appear across the diode (since current is negligible)
      expect(Math.abs(diodeVoltage)).toBeGreaterThan(4.5) // Should be close to -5V
    })
  })

  describe('Diode Model Edge Cases', () => {
    it('should handle low voltage correctly (circuit-realistic behavior)', async () => {
      // Test with 0.5V supply - CIRCUIT BEHAVIOR, not pure diode physics
      // In a 0.5V supply with 1kΩ resistor, Load Line intersection will find realistic operating point
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const lowVoltageCircuit = {
        ...freshCircuit,
        components: freshCircuit.components.map((comp: CircuitComponent) => {
          if (comp.id === 'V1') {
            return { ...comp, properties: { voltage: 0.5 } }
          }
          return comp
        }),
      }

      const result = await solveDC(lowVoltageCircuit, true)

      expect(result).not.toBeNull()

      const diodeCurrent = Math.abs(result!.currents['D1'])
      console.log(`Low voltage Circuit Current: ${diodeCurrent.toExponential(3)}A`)

      // CIRCUIT REALITY: Even at 0.5V, if diode conducts even slightly,
      // current is limited by Load Line: I = (0.5V - Vdiode) / 1000Ω
      // If Vdiode ≈ 0.1V, then I ≈ 0.4V / 1000Ω = 400µA
      // This is MUCH higher than pure diode physics, but physically correct for circuits

      expect(diodeCurrent).toBeGreaterThan(1e-6) // > 1µA (circuit-limited)
      expect(diodeCurrent).toBeLessThan(1e-3) // < 1mA (reasonable for 0.5V supply)

      // Verify KVL compliance
      const termToNode = result!.termToNodeIndex
      const anodeNode = termToNode.get('D1:anode')!
      const cathodeNode = termToNode.get('D1:cathode')!
      const resistorNode1 = termToNode.get('R1:terminal1')!
      const resistorNode2 = termToNode.get('R1:terminal2')!

      const diodeVoltage = result!.voltages[anodeNode] - result!.voltages[cathodeNode]
      const resistorVoltage = result!.voltages[resistorNode1] - result!.voltages[resistorNode2]
      const totalVoltage = diodeVoltage + resistorVoltage

      console.log(
        `  KVL Check: Vdiode=${diodeVoltage.toFixed(3)}V + Vresistor=${resistorVoltage.toFixed(3)}V = ${totalVoltage.toFixed(3)}V`,
      )
      expect(totalVoltage).toBeCloseTo(0.5, 2) // Should sum to supply voltage
    })

    it('should show circuit-realistic Load Line behavior (not pure exponential)', async () => {
      // Test at multiple voltage levels to verify CIRCUIT behavior, not pure diode exponential
      // In circuits, current is limited by Load Line: I = (Vsupply - Vdiode) / R
      // This creates LINEAR relationship with supply voltage, not exponential!
      const voltages = [1.0, 2.0, 3.0, 4.0, 5.0]
      const currents: number[] = []

      for (const voltage of voltages) {
        const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
        const testCircuit = {
          ...freshCircuit,
          components: freshCircuit.components.map((comp: CircuitComponent) => {
            if (comp.id === 'V1') {
              return { ...comp, properties: { voltage } }
            }
            return comp
          }),
        }

        const result = await solveDC(testCircuit, true)
        expect(result).not.toBeNull()

        const current = Math.abs(result!.currents['D1'])
        currents.push(current)

        console.log(`V=${voltage}V: I=${current.toExponential(3)}A (Load Line limited)`)
      }

      // CIRCUIT REALITY: Load Line limits current based on supply voltage
      // As supply voltage increases, more voltage is available to drive current through resistor
      // Current should increase roughly linearly with supply voltage (not exponentially)
      // I ≈ (Vsupply - Vdiode_fixed) / R, where Vdiode_fixed ≈ 0.6V for conducting silicon

      expect(currents[4]).toBeGreaterThan(currents[0]) // 5V > 1V current
      expect(currents[3]).toBeGreaterThan(currents[2]) // Monotonically increasing
      expect(currents[2]).toBeGreaterThan(currents[1]) // Monotonically increasing
      expect(currents[1]).toBeGreaterThan(currents[0]) // Monotonically increasing

      // But NOT exponential - should be roughly linear relationship
      // Check that increase is reasonable (not 100x, more like 4-5x for 5x voltage increase)
      const ratio_5V_to_1V = currents[4] / currents[0]
      console.log(`Current ratio (5V/1V): ${ratio_5V_to_1V.toFixed(1)}x`)

      expect(ratio_5V_to_1V).toBeGreaterThan(2) // Should increase significantly
      expect(ratio_5V_to_1V).toBeLessThan(20) // But not exponentially (not 100x+)

      // All currents should be in reasonable range for these supply voltages
      currents.forEach((current, i) => {
        expect(current).toBeGreaterThan(1e-6) // > 1µA (should conduct)
        expect(current).toBeLessThan(0.01) // < 10mA (reasonable for 1kΩ circuit)
      })
    })

    it('should handle different saturation currents', async () => {
      // Test with higher saturation current (worse diode)
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const highIsCircuit = {
        ...freshCircuit,
        components: freshCircuit.components.map((comp: CircuitComponent) => {
          if (comp.id === 'D1') {
            return { ...comp, properties: { saturationCurrent: 1e-9 } } // 1000x higher Is
          }
          return comp
        }),
      }

      const normalResult = await solveDC(createTestCircuit(), true)
      const highIsResult = await solveDC(highIsCircuit, true)

      expect(normalResult).not.toBeNull()
      expect(highIsResult).not.toBeNull()

      const normalCurrent = Math.abs(normalResult!.currents['D1'])
      const highIsCurrent = Math.abs(highIsResult!.currents['D1'])

      console.log(`Normal Is (1e-12): ${normalCurrent.toExponential(3)}A`)
      console.log(`High Is (1e-9): ${highIsCurrent.toExponential(3)}A`)

      // Higher saturation current should result in higher forward current
      expect(highIsCurrent).toBeGreaterThan(normalCurrent)
    })
  })

  describe('Diode Series Resistance Test', () => {
    it('should work with different resistor values', async () => {
      const resistorValues = [100, 1000, 10000] // 100Ω, 1kΩ, 10kΩ
      const currents: number[] = []

      for (const resistance of resistorValues) {
        const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
        const testCircuit = {
          ...freshCircuit,
          components: freshCircuit.components.map((comp: CircuitComponent) => {
            if (comp.id === 'R1') {
              return { ...comp, properties: { resistance } }
            }
            return comp
          }),
        }

        const result = await solveDC(testCircuit, true)
        expect(result).not.toBeNull()

        const current = Math.abs(result!.currents['D1'])
        currents.push(current)

        console.log(`R=${resistance}Ω: I=${current.toExponential(3)}A`)
      }

      // Higher resistance should result in lower current
      expect(currents[0]).toBeGreaterThan(currents[1]) // 100Ω > 1kΩ current
      expect(currents[1]).toBeGreaterThan(currents[2]) // 1kΩ > 10kΩ current

      // All currents should be reasonable (not zero, not excessive)
      for (const current of currents) {
        expect(current).toBeGreaterThan(1e-6) // > 1μA
        expect(current).toBeLessThan(0.1) // < 100mA
      }
    })
  })
})
