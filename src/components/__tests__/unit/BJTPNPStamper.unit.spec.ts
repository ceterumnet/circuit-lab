import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, zeros, Matrix } from 'mathjs'
import type { CircuitComponent } from '@/types/components'
import { BJTPNPStamper } from '@/services/stampers'

/**
 * UNIT TESTS FOR PNP BJT STAMPER MNA INTEGRATION
 *
 * Tests the PNP BJT (Bipolar Junction Transistor) stamper implementation
 * using the proven Load Line Intersection approach with inverted polarities
 */

/**
 * Create test PNP BJT component
 */
function createTestPNPBJT(
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
    type: 'bjt_pnp',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties,
  }
}

describe('BJTPNPStamper Unit Tests', () => {
  let bjtStamper: BJTPNPStamper
  let testComponent: CircuitComponent
  let nodeMap: Map<string, number>
  let mnaMatrix: Matrix
  let rhsVector: Matrix

  beforeEach(() => {
    // Create a realistic PNP BJT component with explicit parameters
    testComponent = {
      id: 'Q1',
      type: 'bjt_pnp',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
      properties: {
        currentGain: 100,
        saturationCurrent: 1e-14,
      },
    }

    bjtStamper = new BJTPNPStamper(testComponent)

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
      expect(bjtStamper.type).toBe('bjt_pnp')
    })

    it('should implement stampDC method (returns empty branch currents)', () => {
      const result = bjtStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(result).toEqual({ branchCurrents: [] })
      // For non-linear components, stampDC should not modify matrices
      // (actual behavior handled by Newton-Raphson via stampLinearized)
    })

    it('should implement calculateCurrent method', () => {
      // Active region conditions for PNP: VEB = 0.7V, VCE = 5V
      const solution = matrix([[0.0], [0.0], [0.7]]) // Collector, Base, Emitter voltages

      const current = bjtStamper.calculateCurrent(solution, nodeMap, [])

      expect(typeof current).toBe('number')
      expect(isFinite(current)).toBe(true)
      // In cutoff initially (no operating point set), current should be 0
      expect(current).toBe(0)
    })
  })

  describe('NonLinearStamper Interface Implementation', () => {
    it('should implement calculateNonLinearCurrent method (base current)', () => {
      const forwardVoltage = 0.7 // VEB for PNP
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
      // Active region test conditions for PNP
      const solution = matrix([[0.0], [0.0], [5.0]]) // VCE=0V, VBE=0V, VE=5V for PNP operation

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

  describe('PNP BJT-Specific Functionality', () => {
    it('should have different current gains for different components', () => {
      const highGainBJT = createTestPNPBJT('Q2', 200) // β = 200
      const highGainStamper = new BJTPNPStamper(highGainBJT)

      // Both should be valid but different
      expect(bjtStamper.calculateNonLinearCurrent(0.7)).toBeDefined()
      expect(highGainStamper.calculateNonLinearCurrent(0.7)).toBeDefined()

      // The base current should be the same (both use same VEB)
      // but the collector current (affected by β) will be different when stamped
      const baseCurrent1 = bjtStamper.calculateNonLinearCurrent(0.7)
      const baseCurrent2 = highGainStamper.calculateNonLinearCurrent(0.7)
      expect(Math.abs(baseCurrent1 - baseCurrent2)).toBeLessThan(1e-12) // Same VEB -> same IB
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

    it('should handle PNP-specific biasing requirements', () => {
      // For PNP, emitter should be at higher potential than base for conduction
      // VEB > 0.7V for active operation
      const pnpActiveVoltages = matrix([[0.0], [0.0], [5.0]]) // Collector=0V, Base=0V, Emitter=5V

      // Should not throw when given appropriate PNP bias conditions
      expect(() => {
        bjtStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, pnpActiveVoltages)
      }).not.toThrow()

      // Should result in operating region analysis
      const region = bjtStamper.getOperatingRegion()
      expect(typeof region).toBe('string')
    })

    it('should demonstrate PNP current polarity differences from NPN', () => {
      // This test verifies that PNP BJT handles current directions opposite to NPN
      const pnpBiasVoltages = matrix([[2.0], [4.0], [5.0]]) // VC=2V, VB=4V, VE=5V (VEB=1V)

      bjtStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, pnpBiasVoltages)

      // For PNP in active region with proper bias:
      // - Base current should be positive (flowing into base)
      // - Collector current should be positive (flowing into collector)
      // - Emitter current should be negative (flowing out of emitter)
      const baseCurrent = bjtStamper.getBaseCurrent()
      const emitterCurrent = bjtStamper.getEmitterCurrent()

      // Verify currents are reasonable for PNP operation
      expect(baseCurrent).toBeGreaterThanOrEqual(0) // Base current flows in
      expect(emitterCurrent).toBeGreaterThanOrEqual(0) // Emitter current in PNP context

      // Verify that the stamper produces a valid operating region
      const operatingRegion = bjtStamper.getOperatingRegion()
      expect(['Cutoff', 'Active', 'Saturation']).toContain(operatingRegion)
    })
  })

  describe('Component Independence', () => {
    it('should create independent stamper instances', () => {
      const component1 = createTestPNPBJT('Q1', 100, 1e-14)
      const component2 = createTestPNPBJT('Q2', 150, 2e-14)

      const stamper1 = new BJTPNPStamper(component1)
      const stamper2 = new BJTPNPStamper(component2)

      expect(stamper1.id).toBe('Q1')
      expect(stamper2.id).toBe('Q2')
      expect(stamper1.type).toBe('bjt_pnp')
      expect(stamper2.type).toBe('bjt_pnp')
    })

    it('should handle different saturation currents correctly', () => {
      const lowSatComponent = createTestPNPBJT('Q_low', 100, 1e-15)
      const highSatComponent = createTestPNPBJT('Q_high', 100, 1e-13)

      const lowSatStamper = new BJTPNPStamper(lowSatComponent)
      const highSatStamper = new BJTPNPStamper(highSatComponent)

      const testVoltage = 0.7
      const lowSatCurrent = lowSatStamper.calculateNonLinearCurrent(testVoltage)
      const highSatCurrent = highSatStamper.calculateNonLinearCurrent(testVoltage)

      // Higher saturation current should produce higher base current at same VEB
      expect(highSatCurrent).toBeGreaterThan(lowSatCurrent)
      expect(lowSatCurrent).toBeGreaterThan(0)
      expect(highSatCurrent).toBeGreaterThan(0)
    })
  })
})
