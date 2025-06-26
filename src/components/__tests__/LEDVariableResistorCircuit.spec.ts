import { describe, it, expect } from 'vitest'
import { solveDC } from '@/services/simulation'
import type { Circuit, CircuitComponent } from '@/types/components'

/**
 * LED CIRCUIT INTEGRATION TEST - COMPREHENSIVE BUG ANALYSIS
 *
 * PROBLEM: LED circuits generate non-physical voltages (LED cathode at 15.59V instead of ~3.3V)
 *
 * FINDINGS FROM SYSTEMATIC TESTING:
 * 1. ✅ MNA Foundation is PERFECT - Pure resistive circuits work flawlessly (exact voltage division, perfect current consistency)
 * 2. ❌ LED circuits show massive voltage bugs in BOTH variable resistor AND regular resistor configurations
 * 3. 🎯 ROOT CAUSE IDENTIFIED: Load Line circuit analysis fails to detect variable resistors as resistors
 *
 * SPECIFIC BUGS DISCOVERED:
 * - Variable Resistor + LED: Uses default 1000Ω instead of actual 3810Ω ("No resistors found, using default: 1000Ω")
 * - Regular Resistor + LED: Uses correct 3810Ω but still produces wrong LED cathode voltage (4.15V instead of ~3.3V)
 * - Load Line Intersection calculations are correct for the resistance they detect, but MNA integration is wrong
 *
 * EVIDENCE:
 * - Control circuit (1700Ω + 3810Ω resistors): Perfect results (1.543V + 3.457V = 5.000V, 0.907mA throughout)
 * - LED + Variable Resistor: 4.091mA current, LED cathode at 15.59V
 * - LED + Regular Resistor: 1.091mA current, LED cathode at 4.15V
 * - Both should have ~0.87mA current and LED cathode at ~3.3V
 *
 * NEXT STEPS:
 * 1. Fix Load Line circuit analysis to recognize variable_resistor components as resistors
 * 2. Fix Norton equivalent current injection polarity/magnitude in DiodeStamper.stampLinearized()
 *
 * ARCHITECTURE STATUS:
 * - ✅ Enhanced MNA Solver: Working perfectly (14.5 significant digits, proper conditioning)
 * - ✅ Stamper Architecture: All linear components work flawlessly
 * - ✅ Load Line Intersection: Mathematically correct for detected circuit parameters
 * - ❌ Load Line Circuit Analysis: Missing variable resistor detection
 * - ❌ Norton Current Injection: Wrong polarity/magnitude causing non-physical voltages
 */

describe('LED + Variable Resistor Circuit Integration', () => {
  /**
   * Test circuit matches the failing case from console output:
   * - 5V voltage source
   * - Red LED (expected Vf ~1.7V)
   * - Variable resistor set to 3810Ω (as shown in logs)
   * - Series connection
   */

  const createTestCircuit = (): Circuit => {
    const components: CircuitComponent[] = [
      // 5V voltage source
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5.0 },
      },
      // Red LED (should have ~1.7V forward drop)
      {
        id: 'L1',
        type: 'led',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: {
          color: 'red',
          // Use explicit saturation current to ensure consistent behavior
          saturationCurrent: 1e-9, // From console log: "Using explicit parameters Is=1.00e-9A"
        },
      },
      // Variable resistor set to 3810Ω (from console log)
      {
        id: 'V2',
        type: 'variable_resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: {
          resistance: 3810,
          minResistance: 0,
          maxResistance: 10000,
        },
      },
      // Connecting nodes
      {
        id: 'N1',
        type: 'node',
        position: { x: 150, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
      {
        id: 'N2',
        type: 'node',
        position: { x: 350, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
    ]

    // Series wiring: V+ → LED anode → LED cathode → Var Resistor → Ground → V-
    const wires = [
      // V1 positive to LED anode
      {
        id: 'W1',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'L1',
          endTerminal: 'anode',
        },
      },
      // LED cathode to Variable resistor terminal1
      {
        id: 'W2',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'L1',
          startTerminal: 'cathode',
          endComponentId: 'V2',
          endTerminal: 'terminal1',
        },
      },
      // Variable resistor terminal2 to node N2
      {
        id: 'W3',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V2',
          startTerminal: 'terminal2',
          endComponentId: 'N2',
          endTerminal: 'terminal',
        },
      },
      // N2 to N1 (ground return path)
      {
        id: 'W5',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N2',
          startTerminal: 'terminal',
          endComponentId: 'N1',
          endTerminal: 'terminal',
        },
      },
      // N1 to V1 negative (complete the circuit)
      {
        id: 'W4',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N1',
          startTerminal: 'terminal',
          endComponentId: 'V1',
          endTerminal: 'negative',
        },
      },
    ]

    return {
      id: 'led-variable-resistor-test',
      name: 'LED + Variable Resistor Test Circuit',
      components: [...components, ...wires], // Include wires in components array
      wires,
      probes: [],
      nodes: {},
    }
  }

  /**
   * Control circuit: Replace LED with regular resistor of same impedance
   * This verifies that the MNA foundation works correctly with pure resistive circuits
   */
  const createControlCircuit = (): Circuit => {
    const components: CircuitComponent[] = [
      // 5V voltage source (same as test circuit)
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5.0 },
      },
      // Regular resistor (1700Ω to simulate LED forward resistance)
      {
        id: 'R1',
        type: 'resistor',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 1700 },
      },
      // Variable resistor set to 3810Ω (same as LED test)
      {
        id: 'V2',
        type: 'variable_resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: {
          resistance: 3810,
          minResistance: 0,
          maxResistance: 10000,
        },
      },
      // Connecting nodes
      {
        id: 'N1',
        type: 'node',
        position: { x: 150, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
      {
        id: 'N2',
        type: 'node',
        position: { x: 350, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
    ]

    // Series wiring: V+ → R1 → Var Resistor → Ground → V-
    const wires = [
      // V1 positive to R1 terminal1
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
      // R1 terminal2 to Variable resistor terminal1
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
          endTerminal: 'terminal1',
        },
      },
      // Variable resistor terminal2 to node N2
      {
        id: 'W3',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V2',
          startTerminal: 'terminal2',
          endComponentId: 'N2',
          endTerminal: 'terminal',
        },
      },
      // N2 to N1 (ground return path)
      {
        id: 'W5',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N2',
          startTerminal: 'terminal',
          endComponentId: 'N1',
          endTerminal: 'terminal',
        },
      },
      // N1 to V1 negative (complete the circuit)
      {
        id: 'W4',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N1',
          startTerminal: 'terminal',
          endComponentId: 'V1',
          endTerminal: 'negative',
        },
      },
    ]

    return {
      id: 'resistor-control-test',
      name: 'Resistor Control Test Circuit',
      components: [...components, ...wires], // Include wires in components array
      wires,
      probes: [],
      nodes: {},
    }
  }

  /**
   * LED + Regular Resistor circuit: Same as main test but with regular resistor instead of variable resistor
   * This isolates whether the bug is specific to variable resistors or affects all LED circuits
   */
  const createLEDRegularResistorCircuit = (): Circuit => {
    const components: CircuitComponent[] = [
      // 5V voltage source (same as test circuit)
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5.0 },
      },
      // Red LED (same as main test)
      {
        id: 'L1',
        type: 'led',
        position: { x: 200, y: 100 },
        rotation: 0,
        selected: false,
        properties: {
          color: 'red',
          // Use explicit saturation current to ensure consistent behavior
          saturationCurrent: 1e-9, // From console log: "Using explicit parameters Is=1.00e-9A"
        },
      },
      // Regular resistor set to 3810Ω (same resistance as variable resistor)
      {
        id: 'R2',
        type: 'resistor',
        position: { x: 300, y: 100 },
        rotation: 0,
        selected: false,
        properties: { resistance: 3810 },
      },
      // Connecting nodes
      {
        id: 'N1',
        type: 'node',
        position: { x: 150, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
      {
        id: 'N2',
        type: 'node',
        position: { x: 350, y: 150 },
        rotation: 0,
        selected: false,
        properties: {},
      },
    ]

    // Series wiring: V+ → LED anode → LED cathode → Regular Resistor → Ground → V-
    const wires = [
      // V1 positive to LED anode
      {
        id: 'W1',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'V1',
          startTerminal: 'positive',
          endComponentId: 'L1',
          endTerminal: 'anode',
        },
      },
      // LED cathode to Regular resistor terminal1
      {
        id: 'W2',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'L1',
          startTerminal: 'cathode',
          endComponentId: 'R2',
          endTerminal: 'terminal1',
        },
      },
      // Regular resistor terminal2 to node N2
      {
        id: 'W3',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'R2',
          startTerminal: 'terminal2',
          endComponentId: 'N2',
          endTerminal: 'terminal',
        },
      },
      // N2 to N1 (ground return path)
      {
        id: 'W5',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N2',
          startTerminal: 'terminal',
          endComponentId: 'N1',
          endTerminal: 'terminal',
        },
      },
      // N1 to V1 negative (complete the circuit)
      {
        id: 'W4',
        type: 'wire' as const,
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {
          startComponentId: 'N1',
          startTerminal: 'terminal',
          endComponentId: 'V1',
          endTerminal: 'negative',
        },
      },
    ]

    return {
      id: 'led-regular-resistor-test',
      name: 'LED + Regular Resistor Test Circuit',
      components: [...components, ...wires], // Include wires in components array
      wires,
      probes: [],
      nodes: {},
    }
  }

  it('should have realistic LED forward voltage drop', async () => {
    const circuit = createTestCircuit()
    const result = await solveDC(circuit)

    expect(result).not.toBeNull()
    if (!result) return

    // Extract node voltages
    const voltages = result.voltages
    const ledAnodeVoltage = Object.values(voltages).find((v) => Math.abs(v - 5.0) < 0.1) || 0
    const ledCathodeVoltage =
      Object.values(voltages).find((v) => v > 0 && v < 5 && Math.abs(v - ledAnodeVoltage) > 1) || 0

    // Calculate LED voltage drop
    const ledVoltage = ledAnodeVoltage - ledCathodeVoltage

    console.log(`LED Analysis:`)
    console.log(`  LED anode: ${ledAnodeVoltage.toFixed(3)}V`)
    console.log(`  LED cathode: ${ledCathodeVoltage.toFixed(3)}V`)
    console.log(`  LED voltage drop: ${ledVoltage.toFixed(3)}V`)

    // Red LED should have forward voltage between 1.4V and 2.0V when conducting
    expect(ledVoltage).toBeGreaterThan(1.4)
    expect(ledVoltage).toBeLessThan(2.0)

    // LED cathode should be POSITIVE (not negative like the bug shows)
    expect(ledCathodeVoltage).toBeGreaterThan(0)
  })

  it('should satisfy Kirchhoffs voltage law', async () => {
    const circuit = createTestCircuit()
    const result = await solveDC(circuit)

    expect(result).not.toBeNull()
    if (!result) return

    const voltages = result.voltages

    // Find component voltages by identifying voltage levels
    const sortedVoltages = Object.values(voltages).sort((a, b) => b - a)
    const supplyPositive = sortedVoltages[0] // Highest voltage (~5V)
    const ledCathode = sortedVoltages.find((v) => v > 0 && v < supplyPositive - 1) || 0
    const ground = 0 // Reference

    // Calculate drops
    const ledDrop = supplyPositive - ledCathode
    const resistorDrop = ledCathode - ground
    const totalDrop = ledDrop + resistorDrop

    console.log(`KVL Analysis:`)
    console.log(`  Supply: ${supplyPositive.toFixed(3)}V`)
    console.log(`  LED drop: ${ledDrop.toFixed(3)}V`)
    console.log(`  Resistor drop: ${resistorDrop.toFixed(3)}V`)
    console.log(`  Total: ${totalDrop.toFixed(3)}V (should equal supply)`)

    // KVL: LED drop + Resistor drop = Supply voltage
    expect(totalDrop).toBeCloseTo(5.0, 1) // Within 0.1V tolerance
  })

  it('should have consistent current throughout series circuit', async () => {
    const circuit = createTestCircuit()
    const result = await solveDC(circuit)

    expect(result).not.toBeNull()
    if (!result) return

    const currents = result.currents

    // Extract currents (convert to absolute values for comparison)
    const ledCurrent = Math.abs(currents.L1 || 0)
    const resistorCurrent = Math.abs(currents.V2 || 0)
    const sourceCurrent = Math.abs(currents.V1 || 0)

    console.log(`Current Analysis:`)
    console.log(`  LED current: ${(ledCurrent * 1000).toFixed(3)}mA`)
    console.log(`  Resistor current: ${(resistorCurrent * 1000).toFixed(3)}mA`)
    console.log(`  Source current: ${(sourceCurrent * 1000).toFixed(3)}mA`)

    // In series circuit, all currents should be approximately equal
    expect(ledCurrent).toBeCloseTo(resistorCurrent, 3) // Within 0.001A
    expect(ledCurrent).toBeCloseTo(sourceCurrent, 3)

    // Current should be reasonable for this circuit
    // Expected: ~(5V - 1.7V) / 3810Ω ≈ 0.87mA
    expect(ledCurrent).toBeGreaterThan(0.0005) // > 0.5mA
    expect(ledCurrent).toBeLessThan(0.002) // < 2mA
  })

  it('should have expected current magnitude', async () => {
    const circuit = createTestCircuit()
    const result = await solveDC(circuit)

    expect(result).not.toBeNull()
    if (!result) return

    const currents = result.currents
    const current = Math.abs(currents.L1 || 0)

    // Theoretical calculation for red LED circuit:
    // Assume LED drop ≈ 1.7V, Resistor gets remaining 3.3V
    // I = 3.3V / 3810Ω ≈ 0.866mA
    const expectedCurrent = 3.3 / 3810 // ≈ 0.000866 A

    console.log(`Expected current: ${(expectedCurrent * 1000).toFixed(3)}mA`)
    console.log(`Actual current: ${(current * 1000).toFixed(3)}mA`)

    // Allow for some variation due to LED non-linearity
    expect(current).toBeCloseTo(expectedCurrent, 2) // Within 0.01A tolerance
  })

  // CONTROL TESTS: Verify MNA foundation works with pure resistive circuits
  describe('Control Circuit (Pure Resistive)', () => {
    it('should have correct voltage division', async () => {
      const circuit = createControlCircuit()
      const result = await solveDC(circuit)

      expect(result).not.toBeNull()
      if (!result) return

      const voltages = result.voltages

      // Expected voltage division: R1=1700Ω, V2=3810Ω, Total=5510Ω
      // V_R1 = 5V * (1700Ω / 5510Ω) = 1.543V
      // V_V2 = 5V * (3810Ω / 5510Ω) = 3.457V
      const expectedR1Voltage = 5.0 * (1700 / 5510) // ≈ 1.543V
      const expectedV2Voltage = 5.0 * (3810 / 5510) // ≈ 3.457V

      // Find voltage drops by examining node voltages
      const sortedVoltages = Object.values(voltages).sort((a, b) => b - a)
      const supplyPositive = sortedVoltages[0] // Should be ~5V
      const middleNode = sortedVoltages.find((v) => v > 0 && v < supplyPositive - 1) || 0
      const ground = 0

      const r1Drop = supplyPositive - middleNode
      const v2Drop = middleNode - ground

      console.log(`Control Circuit Analysis:`)
      console.log(`  Supply: ${supplyPositive.toFixed(3)}V`)
      console.log(`  R1 drop: ${r1Drop.toFixed(3)}V (expected: ${expectedR1Voltage.toFixed(3)}V)`)
      console.log(`  V2 drop: ${v2Drop.toFixed(3)}V (expected: ${expectedV2Voltage.toFixed(3)}V)`)

      // Verify voltage division is correct
      expect(r1Drop).toBeCloseTo(expectedR1Voltage, 2) // Within 0.01V
      expect(v2Drop).toBeCloseTo(expectedV2Voltage, 2) // Within 0.01V
      expect(r1Drop + v2Drop).toBeCloseTo(5.0, 2) // KVL check
    })

    it('should have consistent current throughout series circuit', async () => {
      const circuit = createControlCircuit()
      const result = await solveDC(circuit)

      expect(result).not.toBeNull()
      if (!result) return

      const currents = result.currents

      // Extract currents (convert to absolute values for comparison)
      const r1Current = Math.abs(currents.R1 || 0)
      const v2Current = Math.abs(currents.V2 || 0)
      const sourceCurrent = Math.abs(currents.V1 || 0)

      console.log(`Control Current Analysis:`)
      console.log(`  R1 current: ${(r1Current * 1000).toFixed(3)}mA`)
      console.log(`  V2 current: ${(v2Current * 1000).toFixed(3)}mA`)
      console.log(`  Source current: ${(sourceCurrent * 1000).toFixed(3)}mA`)

      // In series circuit, all currents should be exactly equal
      expect(r1Current).toBeCloseTo(v2Current, 6) // Within 0.000001A (very tight)
      expect(r1Current).toBeCloseTo(sourceCurrent, 6) // Within 0.000001A (very tight)

      // Expected current: I = 5V / (1700Ω + 3810Ω) = 5V / 5510Ω ≈ 0.908mA
      const expectedCurrent = 5.0 / (1700 + 3810)
      expect(r1Current).toBeCloseTo(expectedCurrent, 5) // Within 0.00001A
    })

    it('should demonstrate MNA solver accuracy', async () => {
      const circuit = createControlCircuit()
      const result = await solveDC(circuit)

      expect(result).not.toBeNull()
      if (!result) return

      // This test verifies that the MNA foundation is rock-solid
      // Any issues with the LED circuit are therefore diode-specific, not MNA-related

      const voltages = result.voltages
      const currents = result.currents

      // Verify Ohm's law for each component
      const sortedVoltages = Object.values(voltages).sort((a, b) => b - a)
      const supplyPositive = sortedVoltages[0]
      const middleNode = sortedVoltages.find((v) => v > 0 && v < supplyPositive - 1) || 0

      const r1Voltage = supplyPositive - middleNode
      const r1Current = Math.abs(currents.R1 || 0)
      const calculatedR1 = r1Voltage / r1Current

      const v2Voltage = middleNode - 0
      const v2Current = Math.abs(currents.V2 || 0)
      const calculatedV2 = v2Voltage / v2Current

      console.log(`MNA Accuracy Check:`)
      console.log(`  R1: ${calculatedR1.toFixed(1)}Ω (expected: 1700Ω)`)
      console.log(`  V2: ${calculatedV2.toFixed(1)}Ω (expected: 3810Ω)`)

      // Verify Ohm's law is satisfied exactly
      expect(calculatedR1).toBeCloseTo(1700, 0) // Within 1Ω
      expect(calculatedV2).toBeCloseTo(3810, 0) // Within 1Ω

      // If this passes, MNA solver is working perfectly
      // Any LED circuit issues are therefore diode-specific bugs
    })
  })

  // LED + REGULAR RESISTOR TESTS: Check if bug is specific to variable resistors
  describe('LED + Regular Resistor Circuit', () => {
    it('should have realistic LED forward voltage drop', async () => {
      const circuit = createLEDRegularResistorCircuit()
      const result = await solveDC(circuit)

      expect(result).not.toBeNull()
      if (!result) return

      // Extract node voltages
      const voltages = result.voltages
      const ledAnodeVoltage = Object.values(voltages).find((v) => Math.abs(v - 5.0) < 0.1) || 0
      const ledCathodeVoltage =
        Object.values(voltages).find((v) => v > 0 && v < 5 && Math.abs(v - ledAnodeVoltage) > 1) ||
        0

      // Calculate LED voltage drop
      const ledVoltage = ledAnodeVoltage - ledCathodeVoltage

      console.log(`LED + Regular Resistor Analysis:`)
      console.log(`  LED anode: ${ledAnodeVoltage.toFixed(3)}V`)
      console.log(`  LED cathode: ${ledCathodeVoltage.toFixed(3)}V`)
      console.log(`  LED voltage drop: ${ledVoltage.toFixed(3)}V`)

      // Red LED should have forward voltage between 1.4V and 2.0V when conducting
      expect(ledVoltage).toBeGreaterThan(1.4)
      expect(ledVoltage).toBeLessThan(2.0)

      // LED cathode should be POSITIVE (not negative like the bug shows)
      expect(ledCathodeVoltage).toBeGreaterThan(0)
    })

    it('should have consistent current throughout series circuit', async () => {
      const circuit = createLEDRegularResistorCircuit()
      const result = await solveDC(circuit)

      expect(result).not.toBeNull()
      if (!result) return

      const currents = result.currents

      // Extract currents (convert to absolute values for comparison)
      const ledCurrent = Math.abs(currents.L1 || 0)
      const resistorCurrent = Math.abs(currents.R2 || 0)
      const sourceCurrent = Math.abs(currents.V1 || 0)

      console.log(`LED + Regular Resistor Current Analysis:`)
      console.log(`  LED current: ${(ledCurrent * 1000).toFixed(3)}mA`)
      console.log(`  R2 current: ${(resistorCurrent * 1000).toFixed(3)}mA`)
      console.log(`  Source current: ${(sourceCurrent * 1000).toFixed(3)}mA`)

      // In series circuit, all currents should be approximately equal
      expect(ledCurrent).toBeCloseTo(resistorCurrent, 3) // Within 0.001A
      expect(ledCurrent).toBeCloseTo(sourceCurrent, 3)

      // Current should be reasonable for this circuit
      // Expected: ~(5V - 1.7V) / 3810Ω ≈ 0.87mA
      expect(ledCurrent).toBeGreaterThan(0.0005) // > 0.5mA
      expect(ledCurrent).toBeLessThan(0.002) // < 2mA
    })

    it('should compare behavior with variable resistor circuit', async () => {
      const ledVarResistorCircuit = createTestCircuit()
      const ledRegularResistorCircuit = createLEDRegularResistorCircuit()

      const varResult = await solveDC(ledVarResistorCircuit)
      const regResult = await solveDC(ledRegularResistorCircuit)

      expect(varResult).not.toBeNull()
      expect(regResult).not.toBeNull()
      if (!varResult || !regResult) return

      // Both circuits should behave identically since they have the same resistance
      const varLedCurrent = Math.abs(varResult.currents.L1 || 0)
      const regLedCurrent = Math.abs(regResult.currents.L1 || 0)

      console.log(`LED Circuit Comparison:`)
      console.log(`  Variable Resistor LED current: ${(varLedCurrent * 1000).toFixed(3)}mA`)
      console.log(`  Regular Resistor LED current: ${(regLedCurrent * 1000).toFixed(3)}mA`)

      // Both circuits should have nearly identical currents
      expect(varLedCurrent).toBeCloseTo(regLedCurrent, 4) // Within 0.0001A

      // If both show the same bug, it's LED-specific, not variable-resistor-specific
      // If only variable resistor shows the bug, it's variable-resistor-specific
    })
  })
})
