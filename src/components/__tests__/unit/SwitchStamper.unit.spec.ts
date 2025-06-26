import { describe, it, expect } from 'vitest'
import { matrix, zeros } from 'mathjs'
import type { CircuitComponent } from '@/types/components'
import { SwitchStamper } from '@/services/stampers'

/**
 * UNIT TESTS FOR SWITCH STAMPER
 *
 * These tests verify the SwitchStamper building block works correctly:
 * 1. Variable resistance stamping (closed = 1mΩ, open = 1GΩ)
 * 2. G-matrix stamping operations for both states
 * 3. Current calculation for open and closed states
 * 4. State independence validation
 *
 * Tests the ACTUAL SwitchStamper class implementation.
 */

/**
 * Create a test switch component
 */
function createTestSwitch(id: string, isOpen: boolean): CircuitComponent {
  return {
    id,
    type: 'switch',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      isOpen: isOpen,
    },
  }
}

/**
 * Create a test node mapping for a 2-terminal switch
 */
function createTestNodeMap(componentId: string): Map<string, number> {
  const nodeMap = new Map<string, number>()
  nodeMap.set(`${componentId}:terminal1`, 0) // Terminal 1
  nodeMap.set(`${componentId}:terminal2`, 1) // Terminal 2
  nodeMap.set('ground', 2) // Ground reference
  return nodeMap
}

describe('SwitchStamper Unit Tests', () => {
  describe('Closed Switch G-Matrix Stamping', () => {
    it('should stamp very low resistance for closed switch (1mΩ)', () => {
      // Test Case: Closed switch has very low resistance (1mΩ)
      const isOpen = false
      const expectedResistance = 1e-3 // 1mΩ
      const expectedConductance = 1 / expectedResistance // 1000 S

      // Create test switch and stamper
      const component = createTestSwitch('SW1', isOpen)
      const stamper = new SwitchStamper(component)

      // Create test matrices
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('SW1')

      // Use the ACTUAL SwitchStamper to stamp the matrix
      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify the stamped conductance values for closed switch
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 6) // G = 1000S
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 6) // G = 1000S
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 6) // -G = -1000S
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 6) // -G = -1000S

      // Verify unused positions remain zero
      expect(mnaMatrix.get([2, 2]) as number).toBe(0)
      expect(mnaMatrix.get([0, 2]) as number).toBe(0)
      expect(mnaMatrix.get([2, 0]) as number).toBe(0)
    })

    it('should calculate current correctly for closed switch', () => {
      // Test Case: Closed switch with 5V across it should allow significant current
      const isOpen = false
      const voltage1 = 5.0 // Terminal 1 voltage
      const voltage2 = 0.0 // Terminal 2 voltage
      const expectedResistance = 1e-3 // 1mΩ
      const expectedCurrent = (voltage1 - voltage2) / expectedResistance // 5000A

      const component = createTestSwitch('SW1', isOpen)
      const stamper = new SwitchStamper(component)

      // Create solution vector
      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], voltage1)
      solution.set([1, 0], voltage2)
      solution.set([2, 0], 0)

      const nodeMap = createTestNodeMap('SW1')

      // Use ACTUAL SwitchStamper to calculate current
      const calculatedCurrent = stamper.calculateCurrent(solution, nodeMap, [])

      expect(calculatedCurrent).toBeCloseTo(expectedCurrent, 6) // 5000A
    })
  })

  describe('Open Switch G-Matrix Stamping', () => {
    it('should stamp very high resistance for open switch (1GΩ)', () => {
      // Test Case: Open switch has very high resistance (1GΩ)
      const isOpen = true
      const expectedResistance = 1e9 // 1GΩ
      const expectedConductance = 1 / expectedResistance // 1nS

      const component = createTestSwitch('SW1', isOpen)
      const stamper = new SwitchStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('SW1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Verify the stamped conductance values for open switch
      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(expectedConductance, 15) // G = 1nS
      expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(expectedConductance, 15) // G = 1nS
      expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-expectedConductance, 15) // -G = -1nS
      expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-expectedConductance, 15) // -G = -1nS

      expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(1e-9, 15)
    })

    it('should calculate very small current for open switch', () => {
      // Test Case: Open switch with 5V across it should allow minimal current
      const isOpen = true
      const voltage1 = 5.0
      const voltage2 = 0.0
      const expectedResistance = 1e9 // 1GΩ
      const expectedCurrent = (voltage1 - voltage2) / expectedResistance // 5nA

      const component = createTestSwitch('SW1', isOpen)
      const stamper = new SwitchStamper(component)

      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], voltage1)
      solution.set([1, 0], voltage2)
      solution.set([2, 0], 0)

      const nodeMap = createTestNodeMap('SW1')

      const calculatedCurrent = stamper.calculateCurrent(solution, nodeMap, [])

      expect(calculatedCurrent).toBeCloseTo(expectedCurrent, 15) // 5nA
      expect(calculatedCurrent).toBeCloseTo(5e-9, 15)
    })
  })

  describe('State Independence and Switching Behavior', () => {
    it('should demonstrate state independence with different switch positions', () => {
      const switchStates = [true, false] // Open, Closed
      const expectedResistances = [1e9, 1e-3] // 1GΩ, 1mΩ
      const stampedConductances: number[] = []

      switchStates.forEach((isOpen, index) => {
        const expectedConductance = 1 / expectedResistances[index]

        // Create actual SwitchStamper with this state
        const component = createTestSwitch('SW1', isOpen)
        const stamper = new SwitchStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('SW1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        const stampedConductance = mnaMatrix.get([0, 0]) as number
        stampedConductances.push(stampedConductance)

        // Verify correct conductance for this state
        expect(stampedConductance).toBeCloseTo(expectedConductance, 12)
      })

      // Verify state independence: different states → vastly different conductances
      const ratio = stampedConductances[1] / stampedConductances[0] // Closed / Open
      // TODO: Review this test. Is this accurate enough?
      expect(ratio).toBeCloseTo(1e12, 3) // Should be ~1 trillion times different

      console.log('State Independence Results:')
      console.log(`  OPEN: G=${stampedConductances[0].toExponential(3)}S (${1e9}Ω)`)
      console.log(`  CLOSED: G=${stampedConductances[1].toExponential(3)}S (${1e-3}Ω)`)
      console.log(`  Ratio (Closed/Open): ${ratio.toExponential(3)}`)
    })

    it('should maintain matrix symmetry for both states', () => {
      const switchStates = [true, false]

      switchStates.forEach((isOpen) => {
        const component = createTestSwitch('SW1', isOpen)
        const stamper = new SwitchStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('SW1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        // Verify matrix symmetry (passive components should create symmetric matrices)
        expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(mnaMatrix.get([1, 0]) as number, 15)
        expect(mnaMatrix.get([0, 0]) as number).toBeCloseTo(mnaMatrix.get([1, 1]) as number, 15)

        // Verify the symmetric pattern
        const g = mnaMatrix.get([0, 0]) as number
        expect(mnaMatrix.get([1, 1]) as number).toBeCloseTo(g, 15)
        expect(mnaMatrix.get([0, 1]) as number).toBeCloseTo(-g, 15)
        expect(mnaMatrix.get([1, 0]) as number).toBeCloseTo(-g, 15)
      })
    })

    it('should demonstrate current blocking behavior', () => {
      const voltage = 10.0 // 10V across switch
      const currentResults: number[] = []

      const switchStates = [true, false] // Open, Closed

      switchStates.forEach((isOpen) => {
        const component = createTestSwitch('SW1', isOpen)
        const stamper = new SwitchStamper(component)

        const solution = matrix(zeros(3, 1))
        solution.set([0, 0], voltage)
        solution.set([1, 0], 0)
        solution.set([2, 0], 0)

        const nodeMap = createTestNodeMap('SW1')
        const current = stamper.calculateCurrent(solution, nodeMap, [])
        currentResults.push(current)
      })

      // Open switch should have much smaller current than closed switch
      const openCurrent = currentResults[0] // nA range
      const closedCurrent = currentResults[1] // kA range

      expect(openCurrent).toBeLessThan(1e-6) // Less than 1µA
      expect(closedCurrent).toBeGreaterThan(1000) // Greater than 1kA
      expect(Math.abs(closedCurrent / openCurrent)).toBeGreaterThan(1e9) // Ratio > 1 billion

      console.log('Current Blocking Results:')
      console.log(`  OPEN: I=${openCurrent.toExponential(3)}A`)
      console.log(`  CLOSED: I=${closedCurrent.toExponential(3)}A`)
    })
  })

  describe('Default State and Edge Cases', () => {
    it('should default to closed state when isOpen property is missing', () => {
      // Test Case: Switch without isOpen property should default to closed (safer)
      const component: CircuitComponent = {
        id: 'SW1',
        type: 'switch',
        position: { x: 100, y: 200 },
        rotation: 0,
        selected: false,
        properties: {}, // No isOpen property
      }

      const stamper = new SwitchStamper(component)

      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('SW1')

      stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Should behave like closed switch (high conductance)
      const conductance = mnaMatrix.get([0, 0]) as number
      expect(conductance).toBeCloseTo(1000, 6) // 1000S = 1/1mΩ
    })

    it('should not modify RHS vector for any switch state', () => {
      const switchStates = [true, false]

      switchStates.forEach((isOpen) => {
        const component = createTestSwitch('SW1', isOpen)
        const stamper = new SwitchStamper(component)

        const mnaMatrix = matrix(zeros(3, 3))
        const rhsVector = matrix(zeros(3, 1))
        const nodeMap = createTestNodeMap('SW1')

        stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

        // RHS should remain zero for passive switch
        expect(rhsVector.get([0, 0]) as number).toBe(0)
        expect(rhsVector.get([1, 0]) as number).toBe(0)
        expect(rhsVector.get([2, 0]) as number).toBe(0)
      })
    })

    it('should handle reverse voltage correctly for both states', () => {
      const voltage1 = 0.0 // Lower voltage on terminal 1
      const voltage2 = 3.0 // Higher voltage on terminal 2

      const switchStates = [true, false]

      switchStates.forEach((isOpen) => {
        const component = createTestSwitch('SW1', isOpen)
        const stamper = new SwitchStamper(component)

        const solution = matrix(zeros(3, 1))
        solution.set([0, 0], voltage1)
        solution.set([1, 0], voltage2)
        solution.set([2, 0], 0)

        const nodeMap = createTestNodeMap('SW1')
        const current = stamper.calculateCurrent(solution, nodeMap, [])

        // Current should be negative (reverse direction)
        expect(current).toBeLessThan(0)

        // Magnitude should match expected values
        const expectedResistance = isOpen ? 1e9 : 1e-3
        const expectedCurrent = (voltage1 - voltage2) / expectedResistance
        expect(current).toBeCloseTo(expectedCurrent, 12)
      })
    })
  })
})

describe('SwitchStamper Integration Validation', () => {
  it('should use actual SwitchStamper class from stampers module', () => {
    // Verify we're testing the ACTUAL SwitchStamper implementation
    const testSwitch = createTestSwitch('SW1', false)
    const stamper = new SwitchStamper(testSwitch)

    // Verify the stamper has the expected properties
    expect(stamper.id).toBe('SW1')
    expect(stamper.type).toBe('switch')

    const nodeMap = createTestNodeMap('SW1')
    expect(nodeMap.get('SW1:terminal1')).toBe(0)
    expect(nodeMap.get('SW1:terminal2')).toBe(1)

    console.log('✅ SwitchStamper tests now use ACTUAL SwitchStamper class')
    console.log('✅ All variable resistance stamping operations tested with real stamper calls')
    console.log('✅ Tests will catch real bugs in SwitchStamper implementation')
  })
})
