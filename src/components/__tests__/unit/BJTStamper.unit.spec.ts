import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, zeros, Matrix } from 'mathjs'
import type { CircuitComponent } from '@/types/components'
import { BJTStamper, type ComponentStamper } from '@/services/stampers'

/**
 * UNIT TESTS FOR BJT STAMPER MNA INTEGRATION
 *
 * Tests the BJT (Bipolar Junction Transistor) stamper implementation
 * using the proven Load Line Intersection approach
 */

/**
 * Create test BJT component
 */
function createTestBJT(
  id: string,
  currentGain?: number,
  saturationCurrent?: number,
): CircuitComponent {
  const properties: Record<string, string | number | boolean> = {}
  if (currentGain !== undefined) {
    properties.currentGain = currentGain
  }
  if (saturationCurrent !== undefined) {
    properties.saturationCurrent = saturationCurrent
  }

  return {
    id,
    type: 'bjt_npn',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties,
  }
}

describe('BJTStamper Unit Tests', () => {
  let bjtStamper: BJTStamper
  let testComponent: CircuitComponent
  let nodeMap: Map<string, number>
  let mnaMatrix: Matrix
  let rhsVector: Matrix

  beforeEach(() => {
    // Create a realistic BJT component with explicit parameters
    testComponent = {
      id: 'Q1',
      type: 'bjt_npn',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
      properties: {
        currentGain: 100,
        saturationCurrent: 1e-14,
      },
    }

    bjtStamper = new BJTStamper(testComponent)

    // Create node mapping (collector=0, base=1, emitter=2)
    nodeMap = new Map([
      ['Q1:collector', 0],
      ['Q1:base', 1],
      ['Q1:emitter', 2],
    ])

    // Create test matrices (3x3 for three terminals)
    mnaMatrix = matrix(zeros(3, 3))
    rhsVector = matrix(zeros(3, 1))
  })

  describe('ComponentStamper Interface Implementation', () => {
    it('should have correct id and type properties', () => {
      expect(bjtStamper.id).toBe('Q1')
      expect(bjtStamper.type).toBe('bjt_npn')
    })

    it('should implement stampDC method (returns empty branch currents)', () => {
      const result = bjtStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(result).toEqual({ branchCurrents: [] })
      // For non-linear components, stampDC should not modify matrices
      // (actual behavior handled by Newton-Raphson via stampLinearized)
    })

    it('should implement calculateCurrent method', () => {
      // Active region conditions: VBE = 0.7V, VCE = 5V
      const solution = matrix([[5.0], [0.7], [0.0]]) // Collector, Base, Emitter voltages

      const current = bjtStamper.calculateCurrent(solution, nodeMap, [])

      expect(typeof current).toBe('number')
      expect(isFinite(current)).toBe(true)
      // In cutoff initially (no operating point set), current should be 0
      expect(current).toBe(0)
    })
  })

  describe('NonLinearStamper Interface Implementation', () => {
    it('should implement calculateNonLinearCurrent method (base current)', () => {
      const forwardVoltage = 0.7 // VBE
      const baseCurrent = bjtStamper.calculateNonLinearCurrent(forwardVoltage)

      expect(typeof baseCurrent).toBe('number')
      expect(baseCurrent).toBeGreaterThan(0) // Forward bias should produce positive base current
      expect(isFinite(baseCurrent)).toBe(true)
    })

    it('should implement calculateConductance method (base-emitter conductance)', () => {
      const forwardVoltage = 0.7
      const conductance = bjtStamper.calculateConductance(forwardVoltage)

      expect(typeof conductance).toBe('number')
      expect(conductance).toBeGreaterThan(0) // Forward bias should have positive conductance
      expect(isFinite(conductance)).toBe(true)
    })

    it('should implement getNodeIndices method (returns base and emitter for NonLinearStamper)', () => {
      const [baseNode, emitterNode] = bjtStamper.getNodeIndices(nodeMap)

      expect(baseNode).toBe(1) // Base node
      expect(emitterNode).toBe(2) // Emitter node
    })

    it('should implement stampLinearized method', () => {
      // Active region test conditions
      const solution = matrix([[5.0], [0.7], [0.0]]) // VCE=5V, VBE=0.7V, VE=0V

      // Should execute without throwing
      expect(() => {
        bjtStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()

      // Should modify RHS vector (current injection)
      const rhsAfter = rhsVector.toArray() as number[][]
      const hasNonZeroRHS = rhsAfter.some((row) => Math.abs(row[0]) > 1e-15)
      expect(hasNonZeroRHS).toBe(true)
    })
  })

  describe('BJT-Specific Functionality', () => {
    it('should have different current gains for different components', () => {
      const highGainBJT = createTestBJT('Q2', 200) // β = 200
      const highGainStamper = new BJTStamper(highGainBJT)

      // Both should be valid but different
      expect(bjtStamper.calculateNonLinearCurrent(0.7)).toBeDefined()
      expect(highGainStamper.calculateNonLinearCurrent(0.7)).toBeDefined()

      // The base current should be the same (both use same VBE)
      // but the collector current (affected by β) will be different when stamped
      const baseCurrent1 = bjtStamper.calculateNonLinearCurrent(0.7)
      const baseCurrent2 = highGainStamper.calculateNonLinearCurrent(0.7)
      expect(Math.abs(baseCurrent1 - baseCurrent2)).toBeLessThan(1e-12) // Same VBE -> same IB
    })

    it('should provide educational operating region information', () => {
      const region = bjtStamper.getOperatingRegion()
      expect(typeof region).toBe('string')
      expect(['Cutoff', 'Active', 'Saturation']).toContain(region)
    })

    it('should provide base and emitter current for educational analysis', () => {
      const baseCurrent = bjtStamper.getBaseCurrent()
      const emitterCurrent = bjtStamper.getEmitterCurrent()

      expect(typeof baseCurrent).toBe('number')
      expect(typeof emitterCurrent).toBe('number')
      expect(isFinite(baseCurrent)).toBe(true)
      expect(isFinite(emitterCurrent)).toBe(true)
    })
  })

  describe('Load Line Integration', () => {
    it('should use Load Line Intersection for operating point determination', () => {
      const solution = matrix([[5.0], [0.7], [0.0]]) // Active region conditions

      // Mock some stampers for circuit analysis
      const mockStampers: ComponentStamper[] = []

      // Should execute without throwing
      expect(() => {
        bjtStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution, mockStampers)
      }).not.toThrow()

      // After stamping, should have an operating region
      const region = bjtStamper.getOperatingRegion()
      expect(region).toBeDefined()
      expect(region.length).toBeGreaterThan(0)
    })

    it('should handle cutoff conditions properly', () => {
      const solution = matrix([[5.0], [0.0], [0.0]]) // VBE = 0V (cutoff)

      bjtStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution, [])

      const region = bjtStamper.getOperatingRegion()
      expect(region).toBe('Cutoff')

      const collectorCurrent = bjtStamper.calculateCurrent(solution, nodeMap, [])
      expect(collectorCurrent).toBe(0) // No collector current in cutoff
    })
  })
})

describe('BJTStamper - Base-Emitter Circuit Analysis', () => {
  describe('analyzeBaseEmitterCircuit', () => {
    it('should correctly analyze simple base bias circuit', () => {
      // Test circuit: VIN (2V) → RB (470kΩ) → Q1 base → Q1 emitter → ground
      const mockComponent: CircuitComponent = {
        id: 'Q1',
        type: 'bjt_npn',
        position: { x: 300, y: 200 },
        rotation: 0,
        selected: false,
        properties: {
          saturationCurrent: 1e-14,
          currentGain: 100,
          label: 'Q1',
        },
      }

      const bjtStamper = new BJTStamper(mockComponent)

      // Create mock stampers for base-emitter circuit
      const mockStampers = [
        // VIN - voltage source in base circuit
        {
          type: 'voltage_source',
          component: {
            id: 'VIN',
            type: 'voltage_source',
            properties: { voltage: 2.0 },
          },
        },
        // RB - base resistor in base circuit
        {
          type: 'resistor',
          component: {
            id: 'RB',
            type: 'resistor',
            properties: { resistance: 470000 },
          },
        },
        // VCC - voltage source NOT in base circuit (should be ignored)
        {
          type: 'voltage_source',
          component: {
            id: 'VCC',
            type: 'voltage_source',
            properties: { voltage: 12.0 },
          },
        },
        // RC - collector resistor NOT in base circuit (should be ignored)
        {
          type: 'resistor',
          component: {
            id: 'RC',
            type: 'resistor',
            properties: { resistance: 2200 },
          },
        },
      ]

      // Mock the method to make it accessible for testing
      const analyzeMethod = (
        bjtStamper as {
          analyzeBaseEmitterCircuit: (
            solution: Matrix,
            nodeMap: Map<string, number>,
            stampers: ComponentStamper[],
          ) => { theveninVoltage: number; theveninResistance: number }
        }
      ).analyzeBaseEmitterCircuit.bind(bjtStamper)

      // Create dummy solution and nodeMap
      const solution = matrix([[0], [0], [0]])
      const nodeMap = new Map([
        ['Q1:base', 1],
        ['Q1:emitter', 2],
        ['Q1:collector', 3],
      ])

      const result = analyzeMethod(solution, nodeMap, mockStampers)

      // Expected: Only VIN and RB should be considered for base-emitter circuit
      expect(result.theveninVoltage).toBe(2.0) // VIN only, not VCC
      expect(result.theveninResistance).toBe(470000) // RB only, not RC
    })

    it('should correctly analyze voltage divider bias circuit', () => {
      // Test circuit: VCC → R1 → base → R2 → ground, emitter → RE → ground
      const mockComponent = {
        id: 'Q1',
        type: 'bjt_npn',
        position: { x: 300, y: 200 },
        rotation: 0,
        properties: {
          saturationCurrent: 1e-14,
          currentGain: 100,
          label: 'Q1',
        },
      }

      const bjtStamper = new BJTStamper(mockComponent)

      // Create mock stampers for voltage divider bias circuit
      const mockStampers = [
        // VCC - in base circuit through voltage divider
        {
          type: 'voltage_source',
          component: {
            id: 'VCC',
            type: 'voltage_source',
            properties: { voltage: 12.0 },
          },
        },
        // R1 - upper voltage divider resistor
        {
          type: 'resistor',
          component: {
            id: 'R1',
            type: 'resistor',
            properties: { resistance: 10000 },
          },
        },
        // R2 - lower voltage divider resistor
        {
          type: 'resistor',
          component: {
            id: 'R2',
            type: 'resistor',
            properties: { resistance: 2200 },
          },
        },
        // RE - emitter resistor
        {
          type: 'resistor',
          component: {
            id: 'RE',
            type: 'resistor',
            properties: { resistance: 1000 },
          },
        },
        // RC - collector resistor NOT in base circuit (should be ignored)
        {
          type: 'resistor',
          component: {
            id: 'RC',
            type: 'resistor',
            properties: { resistance: 4700 },
          },
        },
      ]

      const analyzeMethod = (bjtStamper as any).analyzeBaseEmitterCircuit.bind(bjtStamper)

      const solution = matrix([[0], [0], [0]])
      const nodeMap = new Map([
        ['Q1:base', 1],
        ['Q1:emitter', 2],
        ['Q1:collector', 3],
      ])

      const result = analyzeMethod(solution, nodeMap, mockStampers)

      // Expected: Voltage divider gives ~2.15V, equivalent resistance includes R1||R2 + RE
      const expectedVth = (12.0 * 2200) / (10000 + 2200) // ~2.15V
      const expectedRth = (10000 * 2200) / (10000 + 2200) + 1000 // ~2.8kΩ

      expect(result.theveninVoltage).toBeCloseTo(expectedVth, 2)
      expect(result.theveninResistance).toBeCloseTo(expectedRth, 0)
    })

    it('should handle multiple voltage sources correctly', () => {
      // Test circuit with multiple voltage sources in base circuit
      const mockComponent = {
        id: 'Q1',
        type: 'bjt_npn',
        position: { x: 300, y: 200 },
        rotation: 0,
        properties: {
          saturationCurrent: 1e-14,
          currentGain: 100,
          label: 'Q1',
        },
      }

      const bjtStamper = new BJTStamper(mockComponent)

      const mockStampers = [
        // VIN - signal voltage source
        {
          type: 'voltage_source',
          component: {
            id: 'VIN',
            type: 'voltage_source',
            properties: { voltage: 0.5 },
          },
        },
        // VBIAS - DC bias voltage source
        {
          type: 'voltage_source',
          component: {
            id: 'VBIAS',
            type: 'voltage_source',
            properties: { voltage: 2.0 },
          },
        },
        // RB - base resistor
        {
          type: 'resistor',
          component: {
            id: 'RB',
            type: 'resistor',
            properties: { resistance: 100000 },
          },
        },
      ]

      const analyzeMethod = (bjtStamper as any).analyzeBaseEmitterCircuit.bind(bjtStamper)

      const solution = matrix([[0], [0], [0]])
      const nodeMap = new Map([
        ['Q1:base', 1],
        ['Q1:emitter', 2],
        ['Q1:collector', 3],
      ])

      const result = analyzeMethod(solution, nodeMap, mockStampers)

      // Expected: Should handle superposition or use dominant voltage source
      expect(result.theveninVoltage).toBeGreaterThan(0)
      expect(result.theveninResistance).toBeGreaterThan(0)
    })

    it('should provide defaults when no components found', () => {
      const mockComponent: CircuitComponent = {
        id: 'Q1',
        type: 'bjt_npn',
        position: { x: 300, y: 200 },
        rotation: 0,
        selected: false,
        properties: {
          saturationCurrent: 1e-14,
          currentGain: 100,
          label: 'Q1',
        },
      }

      const bjtStamper = new BJTStamper(mockComponent)

      const mockStampers: ComponentStamper[] = [] // Empty stampers array

      const analyzeMethod = (
        bjtStamper as {
          analyzeBaseEmitterCircuit: (
            solution: Matrix,
            nodeMap: Map<string, number>,
            stampers: ComponentStamper[],
          ) => { theveninVoltage: number; theveninResistance: number }
        }
      ).analyzeBaseEmitterCircuit.bind(bjtStamper)

      const solution = matrix([[0], [0], [0]])
      const nodeMap = new Map([
        ['Q1:base', 1],
        ['Q1:emitter', 2],
        ['Q1:collector', 3],
      ])

      const result = analyzeMethod(solution, nodeMap, mockStampers)

      // Expected: No components found should result in cutoff conditions
      expect(result.theveninVoltage).toBe(0.0) // Cutoff voltage
      expect(result.theveninResistance).toBe(1000000.0) // High resistance for cutoff
    })
  })
})
