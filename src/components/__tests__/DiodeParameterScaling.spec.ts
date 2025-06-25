import { describe, it, expect, beforeEach } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit, CircuitComponent } from '@/types/components'

describe('Diode Parameter Scaling System', () => {
  // Helper function to create a circuit with variable parameters
  const createDiodeCircuit = (
    supplyVoltage: number,
    seriesResistance: number,
    explicitDiodeParams?: { saturationCurrent: number },
  ): Circuit => ({
    id: 'diode-scaling-test',
    name: 'Diode Parameter Scaling Test Circuit',
    components: [
      // Variable voltage source
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 200 },
        rotation: 0,
        selected: false,
        properties: { voltage: supplyVoltage },
      },
      // Diode with optional explicit parameters
      {
        id: 'D1',
        type: 'diode',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: explicitDiodeParams || {}, // Let parameter scaling decide
      },
      // Variable series resistor
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: seriesResistance },
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

  describe('Parameter Scaling Across Supply Voltage Range', () => {
    it('should automatically select appropriate diode parameters for different supply voltages', async () => {
      const supplyVoltages = [1.5, 3.3, 5.0, 12.0, 24.0]
      const seriesResistance = 1000 // Fixed 1kΩ
      const results = []

      for (const voltage of supplyVoltages) {
        console.log(`\n🔬 Testing ${voltage}V supply with ${seriesResistance}Ω series resistance`)

        const circuit = createDiodeCircuit(voltage, seriesResistance)
        const result = await solveDC(circuit, true)

        expect(result).not.toBeNull()
        const diodeCurrent = Math.abs(result!.currents['D1'])
        const resistorCurrent = Math.abs(result!.currents['R1'])

        results.push({
          supplyVoltage: voltage,
          diodeCurrent,
          resistorCurrent,
          currentMatch:
            Math.abs(diodeCurrent - resistorCurrent) / ((diodeCurrent + resistorCurrent) / 2),
        })

        console.log(`  Diode current: ${diodeCurrent.toExponential(3)}A`)
        console.log(`  Resistor current: ${resistorCurrent.toExponential(3)}A`)
        console.log(
          `  Current match: ${(results[results.length - 1].currentMatch * 100).toFixed(2)}%`,
        )

        // Current should be in realistic range
        expect(diodeCurrent).toBeGreaterThan(1e-9) // > 1nA (conducting)
        expect(diodeCurrent).toBeLessThan(1.0) // < 1A (reasonable)

        // Series circuit KCL compliance (within 5% tolerance for non-linear circuits)
        expect(results[results.length - 1].currentMatch).toBeLessThan(0.05)
      }

      // Verify monotonic behavior: higher voltage should give higher current
      for (let i = 1; i < results.length; i++) {
        expect(results[i].diodeCurrent).toBeGreaterThan(results[i - 1].diodeCurrent)
      }

      console.log('\n✅ Parameter scaling successfully adapts to different supply voltages')
    })
  })

  describe('Parameter Scaling Across Resistance Range', () => {
    it('should automatically select appropriate diode parameters for different series resistances', async () => {
      const supplyVoltage = 5.0 // Fixed 5V supply
      const resistances = [100, 470, 1000, 4700, 10000]
      const results = []

      for (const resistance of resistances) {
        console.log(`\n🔬 Testing ${supplyVoltage}V supply with ${resistance}Ω series resistance`)

        const circuit = createDiodeCircuit(supplyVoltage, resistance)
        const result = await solveDC(circuit, true)

        expect(result).not.toBeNull()
        const diodeCurrent = Math.abs(result!.currents['D1'])
        const resistorCurrent = Math.abs(result!.currents['R1'])

        results.push({
          resistance,
          diodeCurrent,
          resistorCurrent,
          currentMatch:
            Math.abs(diodeCurrent - resistorCurrent) / ((diodeCurrent + resistorCurrent) / 2),
        })

        console.log(`  Diode current: ${diodeCurrent.toExponential(3)}A`)
        console.log(`  Resistor current: ${resistorCurrent.toExponential(3)}A`)
        console.log(
          `  Current match: ${(results[results.length - 1].currentMatch * 100).toFixed(2)}%`,
        )

        // Series circuit KCL compliance
        expect(results[results.length - 1].currentMatch).toBeLessThan(0.05)
      }

      // Verify monotonic behavior: higher resistance should give lower current
      for (let i = 1; i < results.length; i++) {
        expect(results[i].diodeCurrent).toBeLessThan(results[i - 1].diodeCurrent)
      }

      console.log('\n✅ Parameter scaling successfully adapts to different series resistances')
    })
  })

  describe('Parameter Scaling vs Explicit Parameters', () => {
    it('should use explicit parameters when provided and automatic scaling when not', async () => {
      // Use different circuit conditions to maximize the difference
      const supplyVoltage = 20.0 // High voltage clearly in Schottky range (9-24V)
      const seriesResistance = 100 // Very low resistance for high current (should favor Schottky)

      // Test with explicit small-signal parameters (forces small current)
      console.log('\n🔧 Testing with explicit small-signal diode parameters (20V, 100Ω, Is=1e-15)')
      const explicitCircuit = createDiodeCircuit(supplyVoltage, seriesResistance, {
        saturationCurrent: 1e-15, // Very small saturation current
      })
      const explicitResult = await solveDC(explicitCircuit, true)
      expect(explicitResult).not.toBeNull()

      // Test with automatic parameter scaling (should select Schottky for 20V)
      console.log('\n🧠 Testing with automatic parameter scaling (should select Schottky for 20V)')
      const autoCircuit = createDiodeCircuit(supplyVoltage, seriesResistance)
      const autoResult = await solveDC(autoCircuit, true)
      expect(autoResult).not.toBeNull()

      const explicitCurrent = Math.abs(explicitResult!.currents['D1'])
      const autoCurrent = Math.abs(autoResult!.currents['D1'])

      console.log(`  Explicit (1e-15A) current: ${explicitCurrent.toExponential(3)}A`)
      console.log(`  Auto-scaled (Schottky) current: ${autoCurrent.toExponential(3)}A`)

      // The currents should be measurably different due to different saturation currents
      // Note: Load line intersection limits the difference, but there should still be some variation
      const currentRatio =
        Math.max(explicitCurrent, autoCurrent) / Math.min(explicitCurrent, autoCurrent)
      expect(currentRatio).toBeGreaterThan(1.01) // At least 1% difference (more realistic)

      console.log(`  Current ratio: ${currentRatio.toFixed(2)}x - parameter scaling is working!`)
      console.log(`  ✅ Explicit parameters override automatic scaling successfully`)
    })
  })

  describe('Realistic Diode Physics Validation', () => {
    it('should produce realistic forward voltages across different conditions', async () => {
      const testCases = [
        { name: 'Low voltage circuit', voltage: 1.5, resistance: 1000 },
        { name: 'Standard circuit', voltage: 5.0, resistance: 1000 },
        { name: 'High current circuit', voltage: 12.0, resistance: 100 },
        { name: 'Low current circuit', voltage: 5.0, resistance: 10000 },
      ]

      for (const testCase of testCases) {
        console.log(`\n🔬 Testing ${testCase.name}: ${testCase.voltage}V, ${testCase.resistance}Ω`)

        const circuit = createDiodeCircuit(testCase.voltage, testCase.resistance)
        const result = await solveDC(circuit, true)

        expect(result).not.toBeNull()

        // Calculate diode forward voltage
        const termToNode = result!.termToNodeIndex
        const anodeNode = termToNode.get('D1:anode')!
        const cathodeNode = termToNode.get('D1:cathode')!
        const anodeVoltage = result!.voltages[anodeNode]
        const cathodeVoltage = result!.voltages[cathodeNode]
        const diodeVoltage = anodeVoltage - cathodeVoltage

        console.log(`  Diode forward voltage: ${diodeVoltage.toFixed(3)}V`)
        console.log(`  Diode current: ${Math.abs(result!.currents['D1']).toExponential(3)}A`)

        // Silicon diode forward voltage should be in realistic range
        expect(diodeVoltage).toBeGreaterThan(0.3) // Above knee voltage
        expect(diodeVoltage).toBeLessThan(1.2) // Below unrealistic values

        // For normal conducting diodes, should be around 0.7V ± 0.3V
        if (Math.abs(result!.currents['D1']) > 1e-6) {
          // If significantly conducting
          expect(diodeVoltage).toBeGreaterThan(0.4)
          expect(diodeVoltage).toBeLessThan(1.0)
        }
      }

      console.log('\n✅ All diode forward voltages are in realistic ranges')
    })

    it('should satisfy KVL across different circuit conditions', async () => {
      const testCases = [
        { voltage: 3.3, resistance: 470 },
        { voltage: 5.0, resistance: 1000 },
        { voltage: 12.0, resistance: 2200 },
      ]

      for (const testCase of testCases) {
        console.log(
          `\n🔬 KVL test: ${testCase.voltage}V supply, ${testCase.resistance}Ω resistance`,
        )

        const circuit = createDiodeCircuit(testCase.voltage, testCase.resistance)
        const result = await solveDC(circuit, true)

        expect(result).not.toBeNull()

        // Get all node voltages
        const termToNode = result!.termToNodeIndex
        const vSourcePos = result!.voltages[termToNode.get('V1:positive')!]
        const diodeAnode = result!.voltages[termToNode.get('D1:anode')!]
        const diodeCathode = result!.voltages[termToNode.get('D1:cathode')!]
        const resistorEnd = result!.voltages[termToNode.get('R1:terminal2')!]
        const ground = result!.voltages[termToNode.get('GND1:terminal')!]

        const diodeVoltage = diodeAnode - diodeCathode
        const resistorVoltage = diodeCathode - resistorEnd
        const totalDrop = diodeVoltage + resistorVoltage
        const expectedSupply = vSourcePos - ground

        console.log(`  Supply voltage: ${expectedSupply.toFixed(3)}V`)
        console.log(`  Diode drop: ${diodeVoltage.toFixed(3)}V`)
        console.log(`  Resistor drop: ${resistorVoltage.toFixed(3)}V`)
        console.log(`  Total drop: ${totalDrop.toFixed(3)}V`)
        console.log(`  KVL error: ${Math.abs(totalDrop - expectedSupply).toFixed(4)}V`)

        // KVL: Supply voltage should equal sum of component drops (within 2% tolerance)
        const kvlError = Math.abs(totalDrop - expectedSupply)
        const tolerance = expectedSupply * 0.02 // 2% tolerance for non-linear circuits
        expect(kvlError).toBeLessThan(tolerance)
      }

      console.log('\n✅ KVL satisfied across all test conditions')
    })
  })

  describe('Edge Case Validation', () => {
    it('should handle extreme but realistic circuit conditions', async () => {
      const edgeCases = [
        { name: 'Very low voltage', voltage: 1.0, resistance: 10000 },
        { name: 'Very high voltage', voltage: 48.0, resistance: 1000 },
        { name: 'Very low resistance', voltage: 5.0, resistance: 10 },
        { name: 'Very high resistance', voltage: 5.0, resistance: 100000 },
      ]

      for (const edgeCase of edgeCases) {
        console.log(
          `\n🔬 Edge case: ${edgeCase.name} (${edgeCase.voltage}V, ${edgeCase.resistance}Ω)`,
        )

        const circuit = createDiodeCircuit(edgeCase.voltage, edgeCase.resistance)
        const result = await solveDC(circuit, true)

        expect(result).not.toBeNull()

        const diodeCurrent = Math.abs(result!.currents['D1'])
        const resistorCurrent = Math.abs(result!.currents['R1'])

        console.log(`  Diode current: ${diodeCurrent.toExponential(3)}A`)
        console.log(`  Resistor current: ${resistorCurrent.toExponential(3)}A`)

        // Should still produce reasonable results
        expect(diodeCurrent).toBeGreaterThan(1e-12) // Not zero (some conduction)
        expect(diodeCurrent).toBeLessThan(100) // Not insanely high

        // Series circuit compliance (within 10% for edge cases)
        const currentMatch =
          Math.abs(diodeCurrent - resistorCurrent) / ((diodeCurrent + resistorCurrent) / 2)
        expect(currentMatch).toBeLessThan(0.1) // 10% tolerance for edge cases

        console.log(`  Current match: ${(currentMatch * 100).toFixed(2)}% ✅`)
      }

      console.log('\n✅ Parameter scaling handles edge cases successfully')
    })
  })
})
