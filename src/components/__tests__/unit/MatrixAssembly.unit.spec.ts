import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, Matrix, zeros } from 'mathjs'
import type { CircuitComponent } from '../../../types/components'
// Import REAL stampers and simulation engine - NO MOCKS!
import { solveDC } from '../../../services/simulation'
import {
  ResistorStamper,
  type ComponentStamper,
  type StampResult,
} from '../../../services/stampers'
import { VoltageSourceStamper, WireStamper } from '../../../services/simulation'
import type { Circuit } from '../../../types/components'

/**
 * UNIT TESTS FOR MATRIX ASSEMBLY - REAL IMPLEMENTATION
 *
 * CRITICAL: These tests use REAL stampers to test actual matrix assembly.
 * NO MOCKED STAMPERS - they hide real integration issues!
 *
 * This validates that multiple REAL stampers work together correctly:
 * 1. Combined G-matrix and branch current stamping using actual ResistorStamper + VoltageSourceStamper
 * 2. Node mapping consistency across real components
 * 3. Matrix size calculation and structure from real stamping
 * 4. RHS vector assembly from real stampers
 * 5. Complete circuit matrix validation with actual simulation engine
 *
 * ARCHITECTURE: Tests the integration of REAL ResistorStamper + VoltageSourceStamper
 * to create complete MNA systems that can be solved by the real simulation engine
 */

/**
 * Create REAL test components using actual CircuitComponent interface
 */
function createRealTestResistor(id: string, resistance: number): CircuitComponent {
  return {
    id,
    type: 'resistor',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties: { resistance },
  }
}

function createRealTestVoltageSource(id: string, voltage: number): CircuitComponent {
  return {
    id,
    type: 'voltage_source',
    position: { x: 200, y: 200 },
    rotation: 0,
    selected: false,
    properties: { voltage },
  }
}

function createRealTestGround(id: string): CircuitComponent {
  return {
    id,
    type: 'ground',
    position: { x: 300, y: 200 },
    rotation: 0,
    selected: false,
    properties: {},
  }
}

/**
 * Create REAL stampers using direct instantiation (like successful ResistorStamper tests)
 * This tests the actual integration!
 */
function createRealResistorStamper(id: string, resistance: number): ComponentStamper {
  const component = createRealTestResistor(id, resistance)
  return new ResistorStamper(component)
}

function createRealVoltageSourceStamper(id: string, voltage: number): ComponentStamper {
  const component = createRealTestVoltageSource(id, voltage)
  return new VoltageSourceStamper(component)
}

/**
 * Create node mapping for simple series circuit
 * V1(+) -- R1 -- V1(-)
 */
function createSimpleSeriesNodeMap(): Map<string, number> {
  const nodeMap = new Map<string, number>()

  // Voltage source V1 terminals
  nodeMap.set('V1:positive', 0) // Node 0: V+ terminal
  nodeMap.set('V1:negative', 1) // Node 1: V- terminal (ground)

  // Resistor R1 terminals
  nodeMap.set('R1:terminal1', 0) // Node 0: Connected to V+
  nodeMap.set('R1:terminal2', 1) // Node 1: Connected to V- (ground)

  return nodeMap
}

/**
 * Create node mapping for voltage divider circuit
 * V1(+) -- R1 -- Node1 -- R2 -- V1(-)
 */
function createVoltageDividerNodeMap(): Map<string, number> {
  const nodeMap = new Map<string, number>()

  // Voltage source V1 terminals
  nodeMap.set('V1:positive', 0) // Node 0: V+ terminal
  nodeMap.set('V1:negative', 2) // Node 2: Ground/V- terminal

  // Resistor R1 terminals
  nodeMap.set('R1:terminal1', 0) // Node 0: Connected to V+
  nodeMap.set('R1:terminal2', 1) // Node 1: Middle node

  // Resistor R2 terminals
  nodeMap.set('R2:terminal1', 1) // Node 1: Middle node
  nodeMap.set('R2:terminal2', 2) // Node 2: Connected to ground

  return nodeMap
}

describe('Matrix Assembly REAL Implementation Unit Tests', () => {
  describe('REAL Single Component Stamping', () => {
    it('should stamp real ResistorStamper into MNA matrix correctly', () => {
      const resistance = 1000 // 1kΩ
      const resistorStamper = createRealResistorStamper('R1', resistance)

      // Verify this is the REAL ResistorStamper
      expect(resistorStamper).toBeInstanceOf(ResistorStamper)
      expect(resistorStamper.id).toBe('R1')
      expect(resistorStamper.type).toBe('resistor')

      // Create test matrices
      const mnaMatrix = matrix(zeros(2, 2))
      const rhsVector = matrix(zeros(2, 1))
      const nodeMap = createSimpleSeriesNodeMap()

      // Call REAL stampDC method
      const result = resistorStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify REAL G-matrix stamping
      const expectedConductance = 1 / resistance // 0.001 S
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 12)
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 12)
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 12)
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 12)

      // Verify no branch currents for resistor
      expect(result.branchCurrents).toEqual([])

      // Verify RHS vector unchanged (resistors don't modify RHS)
      expect(rhsVector.get([0, 0]) as number).toBe(0)
      expect(rhsVector.get([1, 0]) as number).toBe(0)

      console.log('✅ REAL ResistorStamper Matrix Assembly:')
      console.log(`  Stamper class: ${resistorStamper.constructor.name}`)
      console.log(`  Resistance: ${resistance}Ω, Conductance: ${expectedConductance}S`)
      console.log(`  G-matrix stamped correctly: ±${expectedConductance}S`)
    })

    it('should stamp real VoltageSourceStamper into MNA matrix correctly', () => {
      const voltage = 5.0 // 5V
      const branchIndex = 2
      const voltageStamper = createRealVoltageSourceStamper('V1', voltage)

      // Verify this is the REAL VoltageSourceStamper
      expect(voltageStamper).toBeInstanceOf(VoltageSourceStamper)
      expect(voltageStamper.id).toBe('V1')
      expect(voltageStamper.type).toBe('voltage_source')

      // Create test matrices (3x3 for 2 nodes + 1 branch current)
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createSimpleSeriesNodeMap()

      // Call REAL stampDC method
      const result = voltageStamper.stampDC(mnaMatrix, rhsVector, nodeMap, branchIndex)

      // Verify REAL branch current variable stamping
      expect(mnaMatrix.get([0, 2]) as number).toBe(1) // Branch current into node 0
      expect(mnaMatrix.get([1, 2]) as number).toBe(-1) // Branch current out of node 1

      // Verify REAL voltage constraint stamping
      expect(mnaMatrix.get([2, 0]) as number).toBe(1) // V0 - V1 = V
      expect(mnaMatrix.get([2, 1]) as number).toBe(-1)

      // Verify REAL RHS voltage injection
      expect(rhsVector.get([2, 0]) as number).toBe(voltage)

      // Verify branch current index returned
      expect(result.branchCurrents).toEqual([branchIndex])

      console.log('✅ REAL VoltageSourceStamper Matrix Assembly:')
      console.log(`  Stamper class: ${voltageStamper.constructor.name}`)
      console.log(`  Voltage: ${voltage}V`)
      console.log(`  Branch current variable: Index ${branchIndex}`)
      console.log(`  RHS injection: ${rhsVector.get([2, 0])}V`)
    })
  })

  describe('REAL Multi-Component Matrix Assembly', () => {
    it('should combine real ResistorStamper + VoltageSourceStamper correctly', () => {
      // Test Case: Simple series circuit V1-R1 using REAL stampers
      const voltage = 5.0 // 5V source
      const resistance = 1000 // 1kΩ resistor
      const expectedCurrent = voltage / resistance // 5mA

      // Create REAL stampers
      const voltageStamper = createRealVoltageSourceStamper('V1', voltage)
      const resistorStamper = createRealResistorStamper('R1', resistance)

      // Verify these are REAL implementations
      expect(voltageStamper).toBeInstanceOf(VoltageSourceStamper)
      expect(resistorStamper).toBeInstanceOf(ResistorStamper)

      // Create matrices (3x3: 2 nodes + 1 branch current)
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createSimpleSeriesNodeMap()

      // Stamp REAL components in sequence
      let nextBranchIndex = 2

      // 1. Stamp REAL resistor (G-matrix)
      const resistorResult = resistorStamper.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)
      nextBranchIndex += resistorResult.branchCurrents.length

      // 2. Stamp REAL voltage source (branch current + voltage constraint)
      const voltageResult = voltageStamper.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)

      // Verify combined matrix structure
      const expectedConductance = 1 / resistance

      // G-matrix portion (from resistor)
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 12)
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 12)
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 12)
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 12)

      // Branch current portion (from voltage source)
      expect(mnaMatrix.get([0, 2]) as number).toBe(1)
      expect(mnaMatrix.get([1, 2]) as number).toBe(-1)
      expect(mnaMatrix.get([2, 0]) as number).toBe(1)
      expect(mnaMatrix.get([2, 1]) as number).toBe(-1)

      // RHS vector (from voltage source)
      expect(rhsVector.get([2, 0]) as number).toBe(voltage)
      expect(rhsVector.get([0, 0]) as number).toBe(0)
      expect(rhsVector.get([1, 0]) as number).toBe(0)

      // Verify branch current tracking
      expect(resistorResult.branchCurrents).toEqual([])
      expect(voltageResult.branchCurrents).toEqual([2])

      console.log('✅ REAL Multi-Component Matrix Assembly:')
      console.log(`  ResistorStamper: ${resistorStamper.constructor.name}`)
      console.log(`  VoltageSourceStamper: ${voltageStamper.constructor.name}`)
      console.log(`  Combined matrix: G-matrix + branch variables`)
      console.log(`  Expected current: ${expectedCurrent * 1000}mA`)
    })

    it('should demonstrate parameter independence with real stampers', () => {
      const voltage = 12.0 // 12V source
      const resistanceValues = [100, 1000, 10000] // Different resistor values
      const stampedConductances: number[] = []

      resistanceValues.forEach((resistance) => {
        // Create REAL stampers for each test
        const voltageStamper = createRealVoltageSourceStamper('V1', voltage)
        const resistorStamper = createRealResistorStamper('R1', resistance)

        // Verify REAL implementations
        expect(voltageStamper).toBeInstanceOf(VoltageSourceStamper)
        expect(resistorStamper).toBeInstanceOf(ResistorStamper)

        // Create fresh matrices for each test
        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createSimpleSeriesNodeMap()

        // Stamp REAL components
        resistorStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 2)
        voltageStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 2)

        // Extract stamped conductance
        const stampedConductance = mnaMatrix.get([0, 0]) as number
        stampedConductances.push(stampedConductance)

        // Verify correct conductance for this resistance
        const expectedConductance = 1 / resistance
        expect(stampedConductance).toBeCloseTo(expectedConductance, 12)

        // Verify voltage stamping is consistent
        expect(rhsVector.get([2, 0]) as number).toBe(voltage)
      })

      // Verify parameter independence: different resistances → different conductances
      expect(stampedConductances[0]).not.toBeCloseTo(stampedConductances[1], 6)
      expect(stampedConductances[1]).not.toBeCloseTo(stampedConductances[2], 6)
      expect(stampedConductances[0]).not.toBeCloseTo(stampedConductances[2], 6)

      // Verify exact conductance values
      const expectedConductances = resistanceValues.map((r) => 1 / r)
      stampedConductances.forEach((stamped, index) => {
        expect(stamped).toBeCloseTo(expectedConductances[index], 12)
      })

      console.log('✅ REAL Parameter Independence Results:')
      resistanceValues.forEach((resistance, index) => {
        console.log(`  ${resistance}Ω → G=${stampedConductances[index].toExponential(3)}S`)
      })
    })

    it('should create correct voltage divider matrix with real stampers', () => {
      // Test Case: Voltage divider R1=1kΩ, R2=2kΩ, V=9V
      const voltage = 9.0
      const r1 = 1000 // 1kΩ
      const r2 = 2000 // 2kΩ

      // Create REAL stampers
      const voltageStamper = createRealVoltageSourceStamper('V1', voltage)
      const resistor1Stamper = createRealResistorStamper('R1', r1)
      const resistor2Stamper = createRealResistorStamper('R2', r2)

      // Verify REAL implementations
      expect(voltageStamper).toBeInstanceOf(VoltageSourceStamper)
      expect(resistor1Stamper).toBeInstanceOf(ResistorStamper)
      expect(resistor2Stamper).toBeInstanceOf(ResistorStamper)

      // Create matrices (4x4: 3 nodes + 1 branch current)
      const mnaMatrix = matrix(zeros(4, 4))
      const rhsVector = matrix(zeros(4, 1))
      const nodeMap = createVoltageDividerNodeMap()

      // Stamp REAL components
      const nextBranchIndex = 3

      resistor1Stamper.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)
      resistor2Stamper.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)
      voltageStamper.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)

      // Verify combined G-matrix (sum of both resistor stampings)
      const g1 = 1 / r1 // 0.001 S
      const g2 = 1 / r2 // 0.0005 S

      // Node 0: Connected to R1, V1+
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(g1, 12)
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-g1, 12)

      // Node 1: Connected to both R1 and R2 (middle node)
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(g1 + g2, 12)
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-g1, 12)
      expect(mnaMatrix.get([1, 2]) as number).toBeCloseTo(-g2, 12)

      // Node 2: Connected to R2, V1-
      expect(mnaMatrix.get([2, 2]) as number).toBeCloseTo(g2, 12)
      expect(mnaMatrix.get([2, 1]) as number).toBeCloseTo(-g2, 12)

      // Voltage source constraints
      expect(mnaMatrix.get([0, 3]) as number).toBe(1)
      expect(mnaMatrix.get([2, 3]) as number).toBe(-1)
      expect(mnaMatrix.get([3, 0]) as number).toBe(1)
      expect(mnaMatrix.get([3, 2]) as number).toBe(-1)

      // RHS vector
      expect(rhsVector.get([3, 0]) as number).toBe(voltage)

      console.log('✅ REAL Voltage Divider Matrix Assembly:')
      console.log(`  R1: ${r1}Ω (G1=${g1}S)`)
      console.log(`  R2: ${r2}Ω (G2=${g2}S)`)
      console.log(`  Middle node conductance: ${g1 + g2}S`)
      console.log(`  Voltage: ${voltage}V`)
    })
  })

  describe('REAL Simulation Engine Integration', () => {
    it('should solve complete circuit using real simulation engine', async () => {
      // Test Case: Simple series circuit that can be solved by real solveDC
      const voltage = 5.0
      const resistance = 1000
      const expectedCurrent = voltage / resistance // 5mA

      // Create a real circuit using actual Circuit interface
      const circuit: Circuit = {
        id: 'test-series-circuit',
        name: 'Real Series Circuit Test',
        components: [
          createRealTestVoltageSource('V1', voltage),
          createRealTestResistor('R1', resistance),
          createRealTestGround('GND1'),
          // Add wires as components (this is how the simulation engine expects them)
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
        wires: [], // Keep empty for now
        probes: [],
        nodes: {},
      }

      // Call REAL simulation engine
      const result = await solveDC(circuit, true) // Use enhanced solver

      // Verify simulation succeeded
      expect(result).not.toBeNull()
      expect(result!.voltages).toBeDefined()
      expect(result!.currents).toBeDefined()

      // Verify voltage results (account for 1mΩ wire resistance effects)
      expect(result!.voltages[0]).toBeCloseTo(voltage, 3) // Node 0: V+ (relaxed tolerance)
      expect(result!.voltages[1]).toBeCloseTo(0, 3) // Node 1: Ground (relaxed tolerance)

      // Verify current results (account for 1mΩ wire resistance effects)
      // V1 current is negative (flows out of positive terminal - correct physics)
      expect(result!.currents['V1']).toBeCloseTo(-expectedCurrent, 3)
      expect(result!.currents['R1']).toBeCloseTo(expectedCurrent, 3)

      // Verify KCL: voltage source and resistor currents should have equal magnitudes
      // V1 is negative (flows out), R1 is positive (flows through) - this is correct physics
      expect(
        Math.abs(Math.abs(result!.currents['V1']) - Math.abs(result!.currents['R1'])),
      ).toBeLessThan(1e-3)

      console.log('✅ REAL Simulation Engine Integration:')
      console.log(
        `  Circuit: ${circuit.components.length} components, ${circuit.wires.length} wires`,
      )
      console.log(`  V1 voltage: ${result!.voltages[0]}V`)
      console.log(`  Ground voltage: ${result!.voltages[1]}V`)
      console.log(`  V1 current: ${(result!.currents['V1'] * 1000).toFixed(3)}mA`)
      console.log(`  R1 current: ${(result!.currents['R1'] * 1000).toFixed(3)}mA`)
      console.log(`  KCL compliance: ✅`)
    })

    it('should handle parameter variations with real simulation engine', async () => {
      const voltage = 12.0
      const resistanceValues = [500, 1000, 2000] // Different resistor values
      const results: Array<{ resistance: number; current: number; voltage: number }> = []

      for (const resistance of resistanceValues) {
        // Create circuit with this resistance value
        const circuit: Circuit = {
          id: `test-circuit-${resistance}`,
          name: `Parameter Test ${resistance}Ω`,
          components: [
            createRealTestVoltageSource('V1', voltage),
            createRealTestResistor('R1', resistance),
            createRealTestGround('GND1'),
            // Add wires as components (this is how the simulation engine expects them)
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
          wires: [], // Keep empty for now
          probes: [],
          nodes: {},
        }

        // Solve with REAL simulation engine
        const result = await solveDC(circuit, true)
        expect(result).not.toBeNull()

        const current = result!.currents['R1']
        const nodeVoltage = result!.voltages[0]

        results.push({ resistance, current, voltage: nodeVoltage })

        // Verify Ohm's law: I = V/R (account for 1mΩ wire resistance effects)
        const expectedCurrent = voltage / resistance
        expect(current).toBeCloseTo(expectedCurrent, 3)
        expect(nodeVoltage).toBeCloseTo(voltage, 3)
      }

      // Verify parameter independence: different resistances → different currents
      expect(results[0].current).not.toBeCloseTo(results[1].current, 6)
      expect(results[1].current).not.toBeCloseTo(results[2].current, 6)
      expect(results[0].current).not.toBeCloseTo(results[2].current, 6)

      // Verify voltage remains constant (voltage source behavior, account for wire resistance)
      results.forEach(({ voltage: nodeVoltage }) => {
        expect(nodeVoltage).toBeCloseTo(voltage, 3)
      })

      console.log('✅ REAL Parameter Variation Results:')
      results.forEach(({ resistance, current, voltage: nodeVoltage }) => {
        console.log(
          `  ${resistance}Ω → I=${(current * 1000).toFixed(3)}mA, V=${nodeVoltage.toFixed(3)}V`,
        )
      })
    })
  })
})
