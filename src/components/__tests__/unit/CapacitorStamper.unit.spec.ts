import { describe, it, expect } from 'vitest'
import { matrix, zeros } from 'mathjs'
import { CapacitorStamper } from '@/services/stampers/linear/CapacitorStamper'
import type { CircuitComponent } from '@/types/components'

function createTestCapacitor(id: string, capacitance: number = 1e-6): CircuitComponent {
  return {
    id,
    type: 'capacitor',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      capacitance,
    },
  }
}

function createTestNodeMap(componentId: string): Map<string, number> {
  const nodeMap = new Map<string, number>()
  nodeMap.set(`${componentId}:terminal1`, 0) // First terminal
  nodeMap.set(`${componentId}:terminal2`, 1) // Second terminal
  nodeMap.set('ground', 2) // Ground reference
  return nodeMap
}

describe('CapacitorStamper Unit Tests', () => {
  describe('DC Analysis Behavior', () => {
    it('should stamp very high resistance for DC analysis (open circuit)', () => {
      // In DC steady state, capacitors act as open circuits (infinite impedance)
      const capacitance = 1e-6 // 1μF
      const expectedResistance = 1e12 // 1TΩ - effectively open circuit
      const expectedConductance = 1 / expectedResistance // 1pS

      const component = createTestCapacitor('C1', capacitance)
      const stamper = new CapacitorStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('C1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify DC open circuit behavior
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 18) // 1pS
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 18) // 1pS
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 18) // -1pS
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 18) // -1pS

      // Verify actual values
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e-12, 18)
    })

    it('should calculate zero current in DC steady state', () => {
      const component = createTestCapacitor('C1', 1e-6)
      const stamper = new CapacitorStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('C1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Create a solution with voltage difference across capacitor
      const solution = matrix([[5.0], [0.0], [0.0]]) // 5V across capacitor
      const current = stamper.calculateCurrent(solution, nodeMap, [])

      // In DC steady state, capacitor current should be essentially zero
      expect(Math.abs(current)).toBeLessThan(1e-6) // Very small current due to high resistance
    })
  })

  describe('Capacitance Parameter Independence', () => {
    it('should demonstrate parameter independence with different capacitance values', () => {
      const capacitanceValues = [1e-12, 1e-9, 1e-6, 1e-3] // pF, nF, μF, mF
      const stampedConductances: number[] = []

      capacitanceValues.forEach((capacitance) => {
        // For DC analysis, all capacitors behave as open circuits regardless of capacitance
        const expectedConductance = 1e-12 // 1TΩ resistance → 1pS conductance

        const component = createTestCapacitor('C1', capacitance)
        const stamper = new CapacitorStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('C1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        const stampedConductance = mnaMatrix.get([0, 0]) as number
        stampedConductances.push(stampedConductance)

        // All capacitors should have same DC conductance (open circuit)
        expect(stampedConductance).toBeCloseTo(expectedConductance, 18)

        // But the capacitance value should be preserved for AC analysis
        expect(stamper.getCapacitance()).toBe(capacitance)
      })

      // In DC analysis, all capacitors behave identically (open circuit)
      stampedConductances.forEach((conductance) => {
        expect(conductance).toBeCloseTo(1e-12, 18)
      })

      console.log('Capacitor DC Behavior:')
      capacitanceValues.forEach((capacitance, index) => {
        console.log(
          `  ${capacitance.toExponential(0)}F → G=${stampedConductances[index].toExponential(3)}S (DC open circuit)`,
        )
      })
    })

    it('should preserve capacitance values for future AC analysis', () => {
      const capacitanceValues = [1e-12, 1e-9, 1e-6, 1e-3]

      capacitanceValues.forEach((capacitance) => {
        const component = createTestCapacitor('C1', capacitance)
        const stamper = new CapacitorStamper(component)

        // Verify capacitance is preserved
        expect(stamper.getCapacitance()).toBe(capacitance)
      })
    })
  })

  describe('AC Analysis Foundation', () => {
    it('should calculate correct impedance magnitude at different frequencies', () => {
      const capacitance = 1e-6 // 1μF
      const component = createTestCapacitor('C1', capacitance)
      const stamper = new CapacitorStamper(component)

      // Test different frequencies
      const testCases = [
        { freq: 0, expectedZ: 1e12 }, // DC: infinite impedance
        { freq: 1, expectedZ: 159154.94 }, // 1Hz: |Z| = 1/(2π×1×1e-6)
        { freq: 1000, expectedZ: 159.15 }, // 1kHz
        { freq: 1000000, expectedZ: 0.159 }, // 1MHz
      ]

      testCases.forEach(({ freq, expectedZ }) => {
        const impedance = stamper.getImpedanceMagnitude(freq)
        if (freq === 0) {
          expect(impedance).toBe(1e12) // DC case
        } else {
          expect(impedance).toBeCloseTo(expectedZ, 1) // AC case: |Z| = 1/(ωC)
        }
      })
    })

    it('should have -90° phase shift for AC analysis', () => {
      const component = createTestCapacitor('C1', 1e-6)
      const stamper = new CapacitorStamper(component)

      // Test different frequencies
      const frequencies = [0, 1, 1000, 1000000]

      frequencies.forEach((freq) => {
        const phase = stamper.getImpedancePhase(freq)
        if (freq === 0) {
          expect(phase).toBe(0) // DC case
        } else {
          expect(phase).toBeCloseTo(-Math.PI / 2, 6) // -90° for capacitors
        }
      })
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle very small capacitance values', () => {
      const capacitance = 1e-15 // 1fF (very small)
      const component = createTestCapacitor('C1', capacitance)
      const stamper = new CapacitorStamper(component)

      // DC behavior should be consistent regardless of capacitance
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('C1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e-12, 18) // Still open circuit
      expect(stamper.getCapacitance()).toBe(capacitance) // Value preserved
    })

    it('should handle very large capacitance values', () => {
      const capacitance = 1e-1 // 0.1F (very large)
      const component = createTestCapacitor('C1', capacitance)
      const stamper = new CapacitorStamper(component)

      // DC behavior should be consistent regardless of capacitance
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('C1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e-12, 18) // Still open circuit
      expect(stamper.getCapacitance()).toBe(capacitance) // Value preserved

      // But AC impedance should be much lower
      const impedanceAt1Hz = stamper.getImpedanceMagnitude(1)
      expect(impedanceAt1Hz).toBeCloseTo(1.59, 2) // Much lower impedance for large cap
    })

    it('should handle default capacitance when none specified', () => {
      const component: CircuitComponent = {
        id: 'C1',
        type: 'capacitor',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {}, // No capacitance specified
      }

      const stamper = new CapacitorStamper(component)
      expect(stamper.getCapacitance()).toBe(1e-6) // Default 1μF
    })
  })

  describe('Same-Node Connection Handling', () => {
    it('should handle same-node connections gracefully', () => {
      const component = createTestCapacitor('C1', 1e-6)
      const stamper = new CapacitorStamper(component)

      // Create node map where both terminals connect to same node
      const nodeMap = new Map<string, number>()
      nodeMap.set('C1:terminal1', 0) // Both terminals to same node
      nodeMap.set('C1:terminal2', 0) // Same node
      nodeMap.set('ground', 1)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))

      const result = stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Should return empty branch currents and not stamp anything
      expect(result.branchCurrents).toEqual([])

      // Current should be zero (no voltage difference)
      const solution = matrix([[5.0], [0.0], [0.0]])
      const current = stamper.calculateCurrent(solution, nodeMap, [])
      expect(current).toBe(0)
    })
  })
})
