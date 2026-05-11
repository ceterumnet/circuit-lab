import { describe, it, expect } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit, CircuitComponent } from '@/types/components'

describe('LED Simulation', () => {
  // Function to create a fresh circuit for each test to prevent contamination
  const createTestCircuit = (): Circuit => ({
    id: 'led-test',
    name: 'LED Test Circuit',
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
  })

  describe('LED Forward Bias Test', () => {
    it('should simulate LED circuit with reasonable current', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()
      expect(result!.currents['LED1']).toBeDefined()

      const ledCurrent = Math.abs(result!.currents['LED1'])
      console.log(
        `LED Current: ${ledCurrent.toExponential(3)}A (${(ledCurrent * 1000).toFixed(2)}mA)`,
      )

      // LED should conduct somewhere between 0.5mA and 10mA for this circuit
      // This is a reasonable range for a blue LED with 5V supply and 1kΩ resistor
      expect(ledCurrent).toBeGreaterThan(0.0005) // > 0.5mA
      expect(ledCurrent).toBeLessThan(0.01) // < 10mA
    })

    it('should have LED current approximately equal to resistor current (series circuit)', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()

      const ledCurrent = Math.abs(result!.currents['LED1'])
      const resistorCurrent = Math.abs(result!.currents['R1'])

      console.log(`LED: ${ledCurrent.toExponential(3)}A, R1: ${resistorCurrent.toExponential(3)}A`)

      // In a series circuit, currents should be equal (within 1% tolerance)
      const currentDifference = Math.abs(ledCurrent - resistorCurrent)
      const averageCurrent = (ledCurrent + resistorCurrent) / 2
      const percentError = (currentDifference / averageCurrent) * 100

      expect(percentError).toBeLessThan(1) // Less than 1% difference
    })

    it('should have reasonable LED voltage drop', async () => {
      const result = await solveDC(createTestCircuit(), true)

      expect(result).not.toBeNull()

      // Find LED nodes to calculate voltage drop
      const termToNode = result!.termToNodeIndex
      const anodeNode = termToNode.get('LED1:anode')!
      const cathodeNode = termToNode.get('LED1:cathode')!

      const anodeVoltage = result!.voltages[anodeNode]
      const cathodeVoltage = result!.voltages[cathodeNode]
      const ledVoltage = anodeVoltage - cathodeVoltage

      console.log(`LED Voltage: ${ledVoltage.toFixed(3)}V`)

      // Blue LED should have forward voltage between 2.5V and 3.5V when conducting
      expect(ledVoltage).toBeGreaterThan(2.5)
      expect(ledVoltage).toBeLessThan(3.5)
    })

    it("should satisfy Kirchhoff's voltage law", async () => {
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const result = await solveDC(freshCircuit, true)

      expect(result).not.toBeNull()

      // Get node voltages
      const termToNode = result!.termToNodeIndex
      const vSourcePos = result!.voltages[termToNode.get('V1:positive')!]
      const ledAnode = result!.voltages[termToNode.get('LED1:anode')!]
      const ledCathode = result!.voltages[termToNode.get('LED1:cathode')!]
      const resistorEnd = result!.voltages[termToNode.get('R1:terminal2')!]

      console.log(
        `Voltages: V+ = ${vSourcePos.toFixed(3)}V, LED anode = ${ledAnode.toFixed(3)}V, LED cathode = ${ledCathode.toFixed(3)}V, R end = ${resistorEnd.toFixed(3)}V`,
      )

      // Verify KVL: V_source = V_LED + V_resistor
      const ledVoltage = ledAnode - ledCathode
      const resistorVoltage = ledCathode - resistorEnd // resistorEnd should be ~0V (ground)
      const totalDrop = ledVoltage + resistorVoltage

      console.log(
        `KVL Check: LED = ${ledVoltage.toFixed(3)}V + R = ${resistorVoltage.toFixed(3)}V = ${totalDrop.toFixed(3)}V (should be ~5V)`,
      )

      // Should sum to ~5V (within 1% tolerance)
      expect(Math.abs(totalDrop - 5.0)).toBeLessThan(0.05)
    })
  })

  describe('LED Model Edge Cases', () => {
    it('should handle reverse bias correctly', async () => {
      // Create circuit with LED reversed (cathode to positive)
      // Use fresh copy to avoid contaminating the base testCircuit
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
                endComponentId: 'LED1',
                endTerminal: 'cathode', // Reversed!
              },
            }
          }
          if (comp.id === 'W2') {
            return {
              ...comp,
              properties: {
                startComponentId: 'LED1',
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

      const ledCurrent = Math.abs(result!.currents['LED1'])
      console.log(`Reverse LED Current: ${ledCurrent.toExponential(3)}A`)

      // Reverse current should be very small (< 1μA)
      expect(ledCurrent).toBeLessThan(1e-6)
    })

    it('should handle low voltage correctly', async () => {
      // Test with 1V supply (below LED turn-on)
      const freshCircuit = JSON.parse(JSON.stringify(createTestCircuit()))
      const lowVoltageCircuit = {
        ...freshCircuit,
        components: freshCircuit.components.map((comp: CircuitComponent) => {
          if (comp.id === 'V1') {
            return { ...comp, properties: { voltage: 1 } }
          }
          return comp
        }),
      }

      const result = await solveDC(lowVoltageCircuit, true)

      expect(result).not.toBeNull()

      const ledCurrent = Math.abs(result!.currents['LED1'])
      console.log(`Low voltage LED Current: ${ledCurrent.toExponential(3)}A`)

      // At 1V, LED should barely conduct (< 1μA)
      expect(ledCurrent).toBeLessThan(1e-6)
    })
  })
})
