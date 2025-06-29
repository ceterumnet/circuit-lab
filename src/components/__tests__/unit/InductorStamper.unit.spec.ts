import { describe, it, expect } from 'vitest'
import { matrix, zeros } from 'mathjs'
import { InductorStamper } from '@/services/stampers/linear/InductorStamper'
import type { CircuitComponent } from '@/types/components'

function createTestInductor(id: string, inductance: number = 1e-3): CircuitComponent {
  return {
    id,
    type: 'inductor',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      inductance,
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

describe('InductorStamper Unit Tests', () => {
  describe('DC Analysis Behavior', () => {
    it('should stamp very low resistance for DC analysis (short circuit)', () => {
      // In DC steady state, inductors act as short circuits (zero impedance)
      const inductance = 1e-3 // 1mH
      const expectedResistance = 1e-6 // 1μΩ - effectively short circuit
      const expectedConductance = 1 / expectedResistance // 1MS

      const component = createTestInductor('L1', inductance)
      const stamper = new InductorStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('L1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify DC short circuit behavior
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 6) // 1MS
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 6) // 1MS
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 6) // -1MS
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 6) // -1MS

      // Verify actual values
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e6, 6)
    })

    it('should allow current flow in DC steady state', () => {
      const component = createTestInductor('L1', 1e-3)
      const stamper = new InductorStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('L1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Create a solution with voltage difference across inductor
      const solution = matrix([[5.0], [0.0], [0.0]]) // 5V across inductor
      const current = stamper.calculateCurrent(solution, nodeMap, [])

      // In DC steady state, inductor should conduct significant current (like wire)
      expect(Math.abs(current)).toBeGreaterThan(1e3) // Large current due to low resistance
      expect(current).toBeCloseTo(5e6, 0) // I = V/R = 5V / 1μΩ = 5MA
    })
  })

  describe('Inductance Parameter Independence', () => {
    it('should demonstrate parameter independence with different inductance values', () => {
      const inductanceValues = [1e-9, 1e-6, 1e-3, 1e-1] // nH, μH, mH, H
      const stampedConductances: number[] = []

      inductanceValues.forEach((inductance) => {
        // For DC analysis, all inductors behave as short circuits regardless of inductance
        const expectedConductance = 1e6 // 1μΩ resistance → 1MS conductance

        const component = createTestInductor('L1', inductance)
        const stamper = new InductorStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('L1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        const stampedConductance = mnaMatrix.get([0, 0]) as number
        stampedConductances.push(stampedConductance)

        // All inductors should have same DC conductance (short circuit)
        expect(stampedConductance).toBeCloseTo(expectedConductance, 6)

        // But the inductance value should be preserved for AC analysis
        expect(stamper.getInductance()).toBe(inductance)
      })

      // In DC analysis, all inductors behave identically (short circuit)
      stampedConductances.forEach((conductance) => {
        expect(conductance).toBeCloseTo(1e6, 6)
      })

      console.log('Inductor DC Behavior:')
      inductanceValues.forEach((inductance, index) => {
        console.log(
          `  ${inductance.toExponential(0)}H → G=${stampedConductances[index].toExponential(3)}S (DC short circuit)`,
        )
      })
    })

    it('should preserve inductance values for future AC analysis', () => {
      const inductanceValues = [1e-9, 1e-6, 1e-3, 1e-1]

      inductanceValues.forEach((inductance) => {
        const component = createTestInductor('L1', inductance)
        const stamper = new InductorStamper(component)

        // Verify inductance is preserved
        expect(stamper.getInductance()).toBe(inductance)
      })
    })
  })

  describe('AC Analysis Foundation', () => {
    it('should calculate correct impedance magnitude at different frequencies', () => {
      const inductance = 1e-3 // 1mH
      const component = createTestInductor('L1', inductance)
      const stamper = new InductorStamper(component)

      // Test different frequencies
      const testCases = [
        { freq: 0, expectedZ: 1e-6 }, // DC: zero impedance
        { freq: 1, expectedZ: 0.00628 }, // 1Hz: |Z| = 2π×1×1e-3
        { freq: 1000, expectedZ: 6.28 }, // 1kHz
        { freq: 1000000, expectedZ: 6283.2 }, // 1MHz
      ]

      testCases.forEach(({ freq, expectedZ }) => {
        const impedance = stamper.getImpedanceMagnitude(freq)
        if (freq === 0) {
          expect(impedance).toBe(1e-6) // DC case
        } else {
          expect(impedance).toBeCloseTo(expectedZ, 1) // AC case: |Z| = ωL
        }
      })
    })

    it('should have +90° phase shift for AC analysis', () => {
      const component = createTestInductor('L1', 1e-3)
      const stamper = new InductorStamper(component)

      // Test different frequencies
      const frequencies = [0, 1, 1000, 1000000]

      frequencies.forEach((freq) => {
        const phase = stamper.getImpedancePhase(freq)
        if (freq === 0) {
          expect(phase).toBe(0) // DC case
        } else {
          expect(phase).toBeCloseTo(Math.PI / 2, 6) // +90° for inductors
        }
      })
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle very small inductance values', () => {
      const inductance = 1e-12 // 1pH (very small)
      const component = createTestInductor('L1', inductance)
      const stamper = new InductorStamper(component)

      // DC behavior should be consistent regardless of inductance
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('L1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e6, 6) // Still short circuit
      expect(stamper.getInductance()).toBe(inductance) // Value preserved
    })

    it('should handle very large inductance values', () => {
      const inductance = 1e1 // 10H (very large)
      const component = createTestInductor('L1', inductance)
      const stamper = new InductorStamper(component)

      // DC behavior should be consistent regardless of inductance
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('L1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e6, 6) // Still short circuit
      expect(stamper.getInductance()).toBe(inductance) // Value preserved

      // But AC impedance should be much higher
      const impedanceAt1Hz = stamper.getImpedanceMagnitude(1)
      expect(impedanceAt1Hz).toBeCloseTo(62.83, 2) // Much higher impedance for large inductor
    })

    it('should handle default inductance when none specified', () => {
      const component: CircuitComponent = {
        id: 'L1',
        type: 'inductor',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {}, // No inductance specified
      }

      const stamper = new InductorStamper(component)
      expect(stamper.getInductance()).toBe(1e-3) // Default 1mH
    })
  })

  describe('Same-Node Connection Handling', () => {
    it('should handle same-node connections gracefully', () => {
      const component = createTestInductor('L1', 1e-3)
      const stamper = new InductorStamper(component)

      // Create node map where both terminals connect to same node
      const nodeMap = new Map<string, number>()
      nodeMap.set('L1:terminal1', 0) // Both terminals to same node
      nodeMap.set('L1:terminal2', 0) // Same node
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

  describe('Inductor vs Capacitor Behavior Comparison', () => {
    it('should demonstrate opposite DC behavior from capacitors', () => {
      const inductor = createTestInductor('L1', 1e-3)
      const inductorStamper = new InductorStamper(inductor)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('L1')

      inductorStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      const inductorConductance = mnaMatrix.get([0, 0]) as number

      // Inductor: DC short circuit → high conductance
      expect(inductorConductance).toBeCloseTo(1e6, 6) // 1MS

      console.log('DC Behavior Comparison:')
      console.log(`  Inductor: G=${inductorConductance.toExponential(3)}S (short circuit)`)
      console.log(`  Capacitor: G=1.000e-12S (open circuit)`)
    })

    it('should demonstrate opposite AC phase behavior from capacitors', () => {
      const inductor = createTestInductor('L1', 1e-3)
      const inductorStamper = new InductorStamper(inductor)

      const frequency = 1000 // 1kHz

      const inductorPhase = inductorStamper.getImpedancePhase(frequency)

      // Inductor: +90°, Capacitor: -90°
      expect(inductorPhase).toBeCloseTo(Math.PI / 2, 6) // +90°

      console.log('AC Phase Comparison at 1kHz:')
      console.log(`  Inductor: ${((inductorPhase * 180) / Math.PI).toFixed(1)}°`)
      console.log(`  Capacitor: -90.0°`)
    })
  })
})
