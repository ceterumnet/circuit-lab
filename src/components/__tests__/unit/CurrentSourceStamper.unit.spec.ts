import { describe, it, expect } from 'vitest'
import { matrix, Matrix, zeros } from 'mathjs'
import type { CircuitComponent } from '../../../types/components'
import { CurrentSourceStamper } from '../../../services/stampers'

/**
 * UNIT TESTS FOR CURRENT SOURCE STAMPER
 *
 * These tests verify the CurrentSourceStamper building block works correctly:
 * 1. RHS vector injection (current injection into nodes)
 * 2. Node index mapping with rotation handling
 * 3. Fixed current calculation (independent of node voltages)
 * 4. Parameter independence
 *
 * Tests the ACTUAL CurrentSourceStamper class implementation.
 */

/**
 * Create a test current source component
 */
function createTestCurrentSource(
  id: string,
  current: number,
  rotation: number = 0,
): CircuitComponent {
  return {
    id,
    type: 'current_source',
    position: { x: 100, y: 200 },
    rotation,
    selected: false,
    properties: {
      current: current,
    },
  }
}

/**
 * Create a test node mapping for a 2-terminal current source
 */
function createTestNodeMap(componentId: string): Map<string, number> {
  const nodeMap = new Map<string, number>()
  nodeMap.set(`${componentId}:positive`, 0) // Positive terminal (current flows out)
  nodeMap.set(`${componentId}:negative`, 1) // Negative terminal (current flows in)
  nodeMap.set('ground', 2) // Ground reference
  return nodeMap
}

describe('CurrentSourceStamper Unit Tests', () => {
  describe('RHS Vector Injection Operations', () => {
    it('should inject positive current correctly into RHS vector', () => {
      // Test Case: 5mA current source, current flows from positive to negative terminal
      const current = 0.005 // 5mA

      // Create test current source and stamper
      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      // Create test matrices
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      // Use the ACTUAL CurrentSourceStamper to stamp the matrix
      const result = stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify RHS vector injection (KCL: +I at positive node, -I at negative node)
      expect(rhsVector.get([0, 0]) as number).toBeCloseTo(current, 12) // +5mA at positive
      expect(rhsVector.get([1, 0]) as number).toBeCloseTo(-current, 12) // -5mA at negative
      expect(rhsVector.get([2, 0]) as number).toBe(0) // Ground unaffected

      // Verify G-matrix is not modified (current sources don't add conductance)
      expect(mnaMatrix.get([0, 0]) as number).toBe(0)
      expect(mnaMatrix.get([1, 1]) as number).toBe(0)
      expect(mnaMatrix.get([0, 1]) as number).toBe(0)
      expect(mnaMatrix.get([1, 0]) as number).toBe(0)

      // Verify no branch currents introduced
      expect(result.branchCurrents).toEqual([])
    })

    it('should handle negative current correctly', () => {
      // Test Case: -3mA current source (reverse direction)
      const current = -0.003 // -3mA

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify RHS vector injection for negative current
      expect(rhsVector.get([0, 0]) as number).toBeCloseTo(current, 12) // -3mA at positive
      expect(rhsVector.get([1, 0]) as number).toBeCloseTo(-current, 12) // +3mA at negative
      expect(rhsVector.get([2, 0]) as number).toBe(0)
    })

    it('should demonstrate parameter independence with different current values', () => {
      const currentValues = [0.001, 0.01, 0.1] // 1mA, 10mA, 100mA
      const injectedCurrents: number[] = []

      currentValues.forEach((current) => {
        // Create actual CurrentSourceStamper with this current
        const component = createTestCurrentSource('I1', current)
        const stamper = new CurrentSourceStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('I1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        const injectedCurrent = rhsVector.get([0, 0]) as number
        injectedCurrents.push(injectedCurrent)

        // Verify correct current injection
        expect(injectedCurrent).toBeCloseTo(current, 12)
      })

      // Verify parameter independence: different currents → different injections
      expect(injectedCurrents[0]).not.toBeCloseTo(injectedCurrents[1], 6)
      expect(injectedCurrents[1]).not.toBeCloseTo(injectedCurrents[2], 6)
      expect(injectedCurrents[0]).not.toBeCloseTo(injectedCurrents[2], 6)

      console.log('Parameter Independence Results:')
      currentValues.forEach((current, index) => {
        console.log(`  ${current}A → RHS=${injectedCurrents[index].toExponential(3)}A`)
      })
    })

    it('should handle component rotation correctly', () => {
      // Test Case: 2mA current source rotated 180 degrees (terminals swapped)
      const current = 0.002 // 2mA

      // Create rotated current source
      const component = createTestCurrentSource('I1', current, 180)
      const stamper = new CurrentSourceStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // With 180-degree rotation, terminals are swapped, so current direction reverses
      expect(rhsVector.get([0, 0]) as number).toBeCloseTo(-current, 12) // -2mA at node 0
      expect(rhsVector.get([1, 0]) as number).toBeCloseTo(current, 12) // +2mA at node 1
    })
  })

  describe('Current Calculation', () => {
    it('should return fixed current value regardless of node voltages', () => {
      // Test Case: Current source provides fixed current independent of terminal voltages
      const current = 0.007 // 7mA

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      // Create solution vector with arbitrary voltages
      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], 5.0) // Positive terminal = 5V
      solution.set([1, 0], 2.0) // Negative terminal = 2V
      solution.set([2, 0], 0) // Ground reference

      const nodeMap = createTestNodeMap('I1')

      // Use ACTUAL CurrentSourceStamper to calculate current
      const calculatedCurrent = stamper.calculateCurrent(solution, nodeMap, [])

      // Current source current is fixed by definition, independent of voltages
      expect(calculatedCurrent).toBeCloseTo(current, 12)
      expect(calculatedCurrent).toBeCloseTo(0.007, 12) // 7mA
    })

    it('should maintain constant current with different voltage conditions', () => {
      const current = 0.015 // 15mA

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      const nodeMap = createTestNodeMap('I1')

      // Test multiple voltage scenarios
      const voltageScenarios = [
        [0, 0], // 0V across source
        [10, 5], // 5V across source
        [3, 8], // -5V across source (reverse voltage)
        [100, 0], // 100V across source
      ]

      voltageScenarios.forEach(([v1, v2]) => {
        const solution = matrix(zeros(3, 1))
        solution.set([0, 0], v1)
        solution.set([1, 0], v2)
        solution.set([2, 0], 0)

        const calculatedCurrent = stamper.calculateCurrent(solution, nodeMap, [])

        // Current should remain constant regardless of terminal voltages
        expect(calculatedCurrent).toBeCloseTo(current, 12)
      })
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle zero current source', () => {
      const current = 0 // 0A current source

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify zero injection
      expect(rhsVector.get([0, 0]) as number).toBe(0)
      expect(rhsVector.get([1, 0]) as number).toBe(0)
      expect(rhsVector.get([2, 0]) as number).toBe(0)
    })

    it('should handle very large current values', () => {
      const current = 100 // 100A (very large)

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(rhsVector.get([0, 0]) as number).toBeCloseTo(100, 6)
      expect(rhsVector.get([1, 0]) as number).toBeCloseTo(-100, 6)
    })

    it('should handle very small current values', () => {
      const current = 1e-12 // 1pA (very small)

      const component = createTestCurrentSource('I1', current)
      const stamper = new CurrentSourceStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('I1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(rhsVector.get([0, 0]) as number).toBeCloseTo(1e-12, 18)
      expect(rhsVector.get([1, 0]) as number).toBeCloseTo(-1e-12, 18)
    })

    it('should not modify G-matrix for any current value', () => {
      const currents = [0, 0.001, -0.05, 10]

      currents.forEach((current) => {
        const component = createTestCurrentSource('I1', current)
        const stamper = new CurrentSourceStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('I1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        // G-matrix should remain zero (current sources add no conductance)
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            expect(mnaMatrix.get([i, j]) as number).toBe(0)
          }
        }
      })
    })
  })
})

describe('CurrentSourceStamper Integration Validation', () => {
  it('should use actual CurrentSourceStamper class from stampers module', () => {
    // Verify we're testing the ACTUAL CurrentSourceStamper implementation
    const testCurrentSource = createTestCurrentSource('I1', 0.005)
    const stamper = new CurrentSourceStamper(testCurrentSource)

    // Verify the stamper has the expected properties
    expect(stamper.id).toBe('I1')
    expect(stamper.type).toBe('current_source')

    const nodeMap = createTestNodeMap('I1')
    expect(nodeMap.get('I1:positive')).toBe(0)
    expect(nodeMap.get('I1:negative')).toBe(1)

    console.log('✅ CurrentSourceStamper tests now use ACTUAL CurrentSourceStamper class')
    console.log('✅ All RHS injection operations tested with real stamper calls')
    console.log('✅ Tests will catch real bugs in CurrentSourceStamper implementation')
  })
})
