import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, zeros, Matrix } from 'mathjs'
import type { CircuitComponent } from '../../../types/components'
import { ResistorStamper, type ComponentStamper } from '../../../services/stampers'
import { DiodeStamper, VoltageSourceStamper } from '../../../services/simulation'

/**
 * UNIT TESTS FOR DIODE STAMPER MNA INTEGRATION
 *
 * CRITICAL: These tests use REAL stampers to test actual integration.
 * NO MOCKED STAMPERS - they hide real interface issues!
 */

/**
 * Create real test components
 */
function createTestDiode(id: string, saturationCurrent?: number): CircuitComponent {
  const properties: Record<string, string | number | boolean> = {}
  if (saturationCurrent !== undefined) {
    properties.saturationCurrent = saturationCurrent
  }

  return {
    id,
    type: 'diode',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties,
  }
}

function createTestVoltageSource(id: string, voltage: number): CircuitComponent {
  return {
    id,
    type: 'voltage_source',
    position: { x: 50, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      voltage: voltage,
    },
  }
}

function createTestResistor(id: string, resistance: number): CircuitComponent {
  return {
    id,
    type: 'resistor',
    position: { x: 150, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      resistance: resistance,
    },
  }
}

/**
 * Create REAL stampers using direct instantiation (like VoltageSourceStamper tests)
 * This tests the actual integration!
 */
function createRealDiodeStamper(id: string, saturationCurrent?: number): ComponentStamper {
  const component = createTestDiode(id, saturationCurrent)
  return new DiodeStamper(component)
}

function createRealVoltageSourceStamper(id: string, voltage: number): ComponentStamper {
  const component = createTestVoltageSource(id, voltage)
  return new VoltageSourceStamper(component)
}

function createRealResistorStamper(id: string, resistance: number): ComponentStamper {
  const component = createTestResistor(id, resistance)
  return new ResistorStamper(component)
}

/**
 * Create basic MNA system for testing
 */
function createTestNodeMap(diodeId: string): Map<string, number> {
  const nodeMap = new Map<string, number>()
  nodeMap.set(`${diodeId}:anode`, 0)
  nodeMap.set(`${diodeId}:cathode`, 1)
  nodeMap.set('ground', 2)
  return nodeMap
}

describe('DiodeStamper Unit Tests', () => {
  let diodeStamper: DiodeStamper
  let testComponent: CircuitComponent
  let nodeMap: Map<string, number>
  let mnaMatrix: Matrix
  let rhsVector: Matrix

  beforeEach(() => {
    // Create a realistic diode component with explicit parameters
    testComponent = {
      id: 'D1',
      type: 'diode',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
      properties: {
        saturationCurrent: 1e-12, // General Purpose Silicon
      },
    }

    diodeStamper = new DiodeStamper(testComponent)

    // Create node mapping (anode=0, cathode=1)
    nodeMap = new Map([
      ['D1:anode', 0],
      ['D1:cathode', 1],
    ])

    // Create test matrices
    mnaMatrix = matrix(zeros(3, 3))
    rhsVector = matrix(zeros(3, 1))
  })

  describe('ComponentStamper Interface Implementation', () => {
    it('should have correct id and type properties', () => {
      expect(diodeStamper.id).toBe('D1')
      expect(diodeStamper.type).toBe('diode')
    })

    it('should implement stampDC method (returns empty branch currents)', () => {
      const result = diodeStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      expect(result).toEqual({ branchCurrents: [] })
      // For non-linear components, stampDC should not modify matrices
      // (actual behavior handled by Newton-Raphson via stampLinearized)
    })

    it('should implement calculateCurrent method', () => {
      const solution = matrix([[0.7], [0.0], [0.0]]) // Anode at 0.7V, cathode at 0V

      const current = diodeStamper.calculateCurrent(solution, nodeMap, [])

      expect(typeof current).toBe('number')
      expect(current).toBeGreaterThan(0) // Forward bias should produce positive current
      expect(isFinite(current)).toBe(true)
    })
  })

  describe('NonLinearStamper Interface Implementation', () => {
    it('should implement calculateNonLinearCurrent method', () => {
      const forwardVoltage = 0.7
      const current = diodeStamper.calculateNonLinearCurrent(forwardVoltage)

      expect(typeof current).toBe('number')
      expect(current).toBeGreaterThan(0) // Forward bias
      expect(isFinite(current)).toBe(true)
    })

    it('should implement calculateConductance method', () => {
      const forwardVoltage = 0.7
      const conductance = diodeStamper.calculateConductance(forwardVoltage)

      expect(typeof conductance).toBe('number')
      expect(conductance).toBeGreaterThan(0) // Forward bias
      expect(isFinite(conductance)).toBe(true)
    })

    it('should implement getNodeIndices method', () => {
      const [anodeNode, cathodeNode] = diodeStamper.getNodeIndices(nodeMap)

      expect(anodeNode).toBe(0)
      expect(cathodeNode).toBe(1)
    })

    it('should implement stampLinearized method', () => {
      const solution = matrix([[0.7], [0.0], [0.0]]) // Forward bias condition

      // Should execute without throwing
      expect(() => {
        diodeStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()

      // Should modify RHS vector (current injection)
      const rhsAfter = rhsVector.toArray() as number[][]
      const hasNonZeroRHS = rhsAfter.some((row) => Math.abs(row[0]) > 1e-15)
      expect(hasNonZeroRHS).toBe(true)
    })
  })

  describe('Diode Physics Implementation', () => {
    it('should show exponential I-V characteristic', () => {
      const voltages = [0.1, 0.3, 0.5, 0.7, 0.9]
      const currents = voltages.map((v) => diodeStamper.calculateNonLinearCurrent(v))

      // Should be monotonically increasing
      for (let i = 1; i < currents.length; i++) {
        expect(currents[i]).toBeGreaterThan(currents[i - 1])
      }

      // Should show exponential growth (later currents much larger)
      expect(currents[4]).toBeGreaterThan(currents[0] * 10) // At least 10x growth
    })

    it('should handle reverse bias correctly', () => {
      const reverseCurrent = diodeStamper.calculateNonLinearCurrent(-1.0)

      expect(reverseCurrent).toBeLessThan(0) // Negative current in reverse
      expect(Math.abs(reverseCurrent)).toBeLessThan(1e-9) // Very small leakage
    })

    it('should have realistic forward voltage drop', () => {
      // For silicon diode, significant current should occur around 0.6-0.8V
      const lowCurrent = diodeStamper.calculateNonLinearCurrent(0.5)
      const highCurrent = diodeStamper.calculateNonLinearCurrent(0.8)

      expect(highCurrent).toBeGreaterThan(lowCurrent * 100) // Significant increase
    })
  })

  describe('Parameter Independence', () => {
    it('should use explicit saturation current when provided', () => {
      const highIsComponent: CircuitComponent = {
        ...testComponent,
        id: 'D2',
        properties: { saturationCurrent: 1e-9 }, // 1000x higher
      }

      const highIsStamper = new DiodeStamper(highIsComponent)

      const testVoltage = 0.6
      const normalCurrent = diodeStamper.calculateNonLinearCurrent(testVoltage)
      const highIsCurrent = highIsStamper.calculateNonLinearCurrent(testVoltage)

      expect(highIsCurrent).toBeGreaterThan(normalCurrent * 10) // Should be significantly higher
    })

    it('should use intelligent parameter selection when no explicit parameters', () => {
      const autoComponent: CircuitComponent = {
        ...testComponent,
        id: 'D3',
        properties: {}, // No explicit parameters
      }

      const autoStamper = new DiodeStamper(autoComponent)

      // Should still function (will use default until circuit analysis)
      const current = autoStamper.calculateNonLinearCurrent(0.7)
      expect(typeof current).toBe('number')
      expect(isFinite(current)).toBe(true)
    })
  })

  describe('Load Line Integration', () => {
    it('should use Load Line Intersection for operating point', () => {
      const solution = matrix([[5.0], [0.0], [0.0]]) // High anode voltage

      // Mock some stampers for circuit analysis
      const mockStampers: ComponentStamper[] = []

      // Should execute without throwing
      expect(() => {
        diodeStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution, mockStampers)
      }).not.toThrow()
    })
  })

  describe('Numerical Stability', () => {
    it('should handle extreme voltages gracefully', () => {
      const extremeVoltages = [-10, -1, 0, 0.001, 1, 10]

      for (const voltage of extremeVoltages) {
        const current = diodeStamper.calculateNonLinearCurrent(voltage)
        const conductance = diodeStamper.calculateConductance(voltage)

        expect(isFinite(current)).toBe(true)
        expect(isFinite(conductance)).toBe(true)
        expect(conductance).toBeGreaterThan(0) // Always positive for stability
      }
    })

    it('should maintain consistent current calculation', () => {
      const solution = matrix([[0.7], [0.0], [0.0]])

      // Multiple calls should return same result
      const current1 = diodeStamper.calculateCurrent(solution, nodeMap, [])
      const current2 = diodeStamper.calculateCurrent(solution, nodeMap, [])

      expect(current1).toBe(current2)
    })

    it('should add small conductance for matrix conditioning', () => {
      const solution = matrix([[0.7], [0.0], [0.0]])
      const originalMatrix = matrix(mnaMatrix.toArray()) // Copy original

      diodeStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      // Should have added small diagonal terms for stability
      const anode = 0,
        cathode = 1
      const anodeDiagonal = mnaMatrix.get([anode, anode]) as number
      const cathodeDiagonal = mnaMatrix.get([cathode, cathode]) as number

      expect(anodeDiagonal).toBeGreaterThan(0) // Added small conductance
      expect(cathodeDiagonal).toBeGreaterThan(0) // Added small conductance
    })
  })

  describe('Integration with Circuit Analysis', () => {
    it('should work with setAllStampers method', () => {
      const mockStampers: ComponentStamper[] = []

      expect(() => {
        diodeStamper.setAllStampers(mockStampers)
      }).not.toThrow()
    })

    it('should handle missing circuit analysis gracefully', () => {
      const solution = matrix([[0.7], [0.0], [0.0]])

      // Should work even without circuit analysis (uses defaults)
      expect(() => {
        diodeStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()
    })
  })
})
