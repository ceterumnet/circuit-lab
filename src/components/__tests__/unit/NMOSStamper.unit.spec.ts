import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, zeros, Matrix } from 'mathjs'
import type { CircuitComponent } from '@/types/components'
import { NMOSStamper } from '@/services/stampers'

function createTestNMOS(
  id: string,
  vThreshold?: number,
  kP?: number,
  lambda?: number,
): CircuitComponent {
  const properties: Record<string, string | number | boolean> = {}
  if (vThreshold !== undefined) {
    properties.vThreshold = vThreshold
  }
  if (kP !== undefined) {
    properties.kP = kP
  }
  if (lambda !== undefined) {
    properties.lambda = lambda
  }

  return {
    id,
    type: 'mosfet_n',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties,
  }
}

describe('NMOSStamper Unit Tests', () => {
  let nmosStamper: NMOSStamper
  let testComponent: CircuitComponent
  let nodeMap: Map<string, number>
  let mnaMatrix: Matrix
  let rhsVector: Matrix

  beforeEach(() => {
    testComponent = createTestNMOS('M1')
    nmosStamper = new NMOSStamper(testComponent)

    nodeMap = new Map([
      ['M1:drain', 0],
      ['M1:gate', 1],
      ['M1:source', 2],
    ])

    mnaMatrix = matrix(zeros(3, 3))
    rhsVector = matrix(zeros(3, 1))
  })

  describe('ComponentStamper Interface Implementation', () => {
    it('should have correct id and type properties', () => {
      expect(nmosStamper.id).toBe('M1')
      expect(nmosStamper.type).toBe('mosfet_n')
    })

    it('should implement stampDC method returning empty branch currents', () => {
      const result = nmosStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)
      expect(result).toEqual({ branchCurrents: [] })
    })

    it('should return 0 from calculateCurrent before stampLinearized is called', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])
      const current = nmosStamper.calculateCurrent(solution, nodeMap, [])
      expect(current).toBe(0)
    })
  })

  describe('NonLinearStamper Interface Implementation', () => {
    it('should return 0 from calculateNonLinearCurrent (gate has no current)', () => {
      const current = nmosStamper.calculateNonLinearCurrent(2.0)
      expect(current).toBe(0)
    })

    it('should return GMIN (1e-12) from calculateConductance', () => {
      const g = nmosStamper.calculateConductance(2.0)
      expect(g).toBe(1e-12)
    })

    it('should return [gateNode, sourceNode] from getNodeIndices', () => {
      const [gateNode, sourceNode] = nmosStamper.getNodeIndices(nodeMap)
      expect(gateNode).toBe(1)
      expect(sourceNode).toBe(2)
    })
  })

  describe('Cutoff Behavior', () => {
    it('should detect cutoff when Vgs < Vth', () => {
      const solution = matrix([[5.0], [0.5], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(nmosStamper.getOperatingRegion()).toBe('Cutoff')
    })

    it('should add only GMIN conductance in cutoff with no current injection', () => {
      const solution = matrix([[5.0], [0.5], [0.0]])

      const rhsBefore = rhsVector.toArray() as number[][]

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const rhsAfter = rhsVector.toArray() as number[][]
      for (let i = 0; i < 3; i++) {
        expect(rhsAfter[i][0]).toBeCloseTo(rhsBefore[i][0], 15)
      }
    })

    it('should set operatingPoint Id and gm to 0 in cutoff', () => {
      const solution = matrix([[5.0], [0.5], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      const gm = nmosStamper.getTransconductance()
      expect(id).toBe(0)
      expect(gm).toBe(0)
    })
  })

  describe('Saturation Behavior', () => {
    it('should detect saturation when Vgs > Vth and Vds > (Vgs - Vth)', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(nmosStamper.getOperatingRegion()).toBe('Saturation')
    })

    it('should inject current at drain and source nodes in saturation', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      expect(id).toBeGreaterThan(0)

      const rhsArr = rhsVector.toArray() as number[][]
      expect(rhsArr[0][0]).toBeLessThan(0)
      expect(rhsArr[2][0]).toBeGreaterThan(0)
    })

    it('should produce expected drain current for saturation conditions', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()

      const vOv = 3.0 - 1.0
      const clampedMod = 1 + 0.01 * 5.0
      const expectedId = 0.5 * 200e-6 * vOv * vOv * clampedMod
      expect(id).toBeCloseTo(expectedId, 6)
    })
  })

  describe('Triode Behavior', () => {
    it('should detect triode when Vgs > Vth and Vds < (Vgs - Vth)', () => {
      const solution = matrix([[0.5], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(nmosStamper.getOperatingRegion()).toBe('Triode')
    })

    it('should produce positive drain current in triode', () => {
      const solution = matrix([[0.5], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      expect(id).toBeGreaterThan(0)
    })

    it('should produce expected drain current for triode conditions', () => {
      const solution = matrix([[0.5], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()

      const vOv = 3.0 - 1.0
      const vds = 0.5
      const clampedMod = 1 + 0.01 * vds
      const expectedId = (200e-6 * (vOv * vds - 0.5 * vds * vds)) / clampedMod
      expect(id).toBeCloseTo(expectedId, 6)
    })
  })

  describe('Current Polarity', () => {
    it('should stamp negative Id at drain node rhs (current extracted)', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      const rhsArr = rhsVector.toArray() as number[][]
      expect(rhsArr[0][0]).toBeCloseTo(-id, 6)
    })

    it('should stamp positive Id at source node rhs (current injected)', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      const rhsArr = rhsVector.toArray() as number[][]
      expect(rhsArr[2][0]).toBeCloseTo(id, 6)
    })

    it('should not modify gate node rhs', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const rhsArr = rhsVector.toArray() as number[][]
      expect(rhsArr[1][0]).toBe(0)
    })
  })

  describe('Parameter Variations', () => {
    it('should produce different drain currents for different Vth', () => {
      const lowVth = new NMOSStamper(createTestNMOS('M2', 0.5, 200e-6, 0.01))
      const highVth = new NMOSStamper(createTestNMOS('M3', 1.5, 200e-6, 0.01))

      const nodeMap2 = new Map([
        ['M2:drain', 0],
        ['M2:gate', 1],
        ['M2:source', 2],
      ])
      const nodeMap3 = new Map([
        ['M3:drain', 0],
        ['M3:gate', 1],
        ['M3:source', 2],
      ])

      const solution = matrix([[5.0], [3.0], [0.0]])

      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      lowVth.stampLinearized(m1, r1, nodeMap2, solution)
      highVth.stampLinearized(m2, r2, nodeMap3, solution)

      expect(lowVth.getDrainCurrent()).toBeGreaterThan(highVth.getDrainCurrent())
    })

    it('should produce different drain currents for different Kp', () => {
      const lowKp = new NMOSStamper(createTestNMOS('M4', 1.0, 100e-6, 0.01))
      const highKp = new NMOSStamper(createTestNMOS('M5', 1.0, 500e-6, 0.01))

      const nodeMap4 = new Map([
        ['M4:drain', 0],
        ['M4:gate', 1],
        ['M4:source', 2],
      ])
      const nodeMap5 = new Map([
        ['M5:drain', 0],
        ['M5:gate', 1],
        ['M5:source', 2],
      ])

      const solution = matrix([[5.0], [3.0], [0.0]])

      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      lowKp.stampLinearized(m1, r1, nodeMap4, solution)
      highKp.stampLinearized(m2, r2, nodeMap5, solution)

      expect(highKp.getDrainCurrent()).toBeGreaterThan(lowKp.getDrainCurrent())
    })

    it('should produce different drain currents for different lambda', () => {
      const lowLambda = new NMOSStamper(createTestNMOS('M6', 1.0, 200e-6, 0.0))
      const highLambda = new NMOSStamper(createTestNMOS('M7', 1.0, 200e-6, 0.1))

      const nodeMap6 = new Map([
        ['M6:drain', 0],
        ['M6:gate', 1],
        ['M6:source', 2],
      ])
      const nodeMap7 = new Map([
        ['M7:drain', 0],
        ['M7:gate', 1],
        ['M7:source', 2],
      ])

      const solution = matrix([[5.0], [3.0], [0.0]])

      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      lowLambda.stampLinearized(m1, r1, nodeMap6, solution)
      highLambda.stampLinearized(m2, r2, nodeMap7, solution)

      expect(highLambda.getDrainCurrent()).toBeGreaterThan(lowLambda.getDrainCurrent())
    })
  })

  describe('Numerical Stability', () => {
    it('should not throw on extreme positive voltages', () => {
      const solution = matrix([[100.0], [100.0], [0.0]])

      expect(() => {
        nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()
    })

    it('should not throw on extreme negative voltages', () => {
      const solution = matrix([[-100.0], [-100.0], [0.0]])

      expect(() => {
        nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()
    })

    it('should return finite drain current for extreme voltages', () => {
      const solution = matrix([[1000.0], [1000.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = nmosStamper.getDrainCurrent()
      expect(isFinite(id)).toBe(true)
    })

    it('should return finite transconductance for extreme voltages', () => {
      const solution = matrix([[-1000.0], [-1000.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = nmosStamper.getTransconductance()
      expect(isFinite(gm)).toBe(true)
    })

    it('should not throw on very small voltages', () => {
      const solution = matrix([[1e-10], [1e-10], [0.0]])

      expect(() => {
        nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()
    })
  })

  describe('Transconductance', () => {
    it('should return positive transconductance in saturation', () => {
      const solution = matrix([[5.0], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = nmosStamper.getTransconductance()
      expect(gm).toBeGreaterThan(0)
    })

    it('should return positive transconductance in triode', () => {
      const solution = matrix([[0.5], [3.0], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = nmosStamper.getTransconductance()
      expect(gm).toBeGreaterThan(0)
    })

    it('should return 0 transconductance in cutoff', () => {
      const solution = matrix([[5.0], [0.5], [0.0]])

      nmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = nmosStamper.getTransconductance()
      expect(gm).toBe(0)
    })
  })
})
