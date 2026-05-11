import { describe, it, expect, beforeEach } from 'vitest'
import { matrix, zeros, Matrix } from 'mathjs'
import type { CircuitComponent } from '@/types/components'
import { PMOSStamper } from '@/services/stampers'

function createTestPMOS(
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
    type: 'mosfet_p',
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties,
  }
}

describe('PMOSStamper Unit Tests', () => {
  let pmosStamper: PMOSStamper
  let testComponent: CircuitComponent
  let nodeMap: Map<string, number>
  let mnaMatrix: Matrix
  let rhsVector: Matrix

  beforeEach(() => {
    testComponent = {
      id: 'M1',
      type: 'mosfet_p',
      position: { x: 100, y: 100 },
      rotation: 0,
      selected: false,
      properties: {
        vThreshold: 1.0,
        kP: 200e-6,
        lambda: 0.01,
      },
    }

    pmosStamper = new PMOSStamper(testComponent)

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
      expect(pmosStamper.id).toBe('M1')
      expect(pmosStamper.type).toBe('mosfet_p')
    })

    it('should return empty branch currents from stampDC', () => {
      const result = pmosStamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)
      expect(result).toEqual({ branchCurrents: [] })
    })

    it('should return 0 from calculateCurrent before stampLinearized', () => {
      const solution = matrix([[0.0], [0.0], [0.0]])
      const current = pmosStamper.calculateCurrent(solution, nodeMap, [])
      expect(current).toBe(0)
    })
  })

  describe('NonLinearStamper Interface Implementation', () => {
    it('should return 0 from calculateNonLinearCurrent (gate has no current)', () => {
      const current = pmosStamper.calculateNonLinearCurrent(2.0)
      expect(current).toBe(0)
    })

    it('should return GMIN from calculateConductance', () => {
      const g = pmosStamper.calculateConductance(2.0)
      expect(g).toBe(1e-12)
    })

    it('should return [gateNode, sourceNode] from getNodeIndices', () => {
      const [gateNode, sourceNode] = pmosStamper.getNodeIndices(nodeMap)
      expect(gateNode).toBe(1)
      expect(sourceNode).toBe(2)
    })
  })

  describe('Cutoff Behavior', () => {
    it('should not inject current when Vsg < Vth', () => {
      const solution = matrix([[0.0], [5.0], [3.0]]) // Vd=0, Vg=5, Vs=3 → Vsg = -2V < Vth=1V
      const originalRhs = rhsVector.toArray() as number[][]

      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const rhsArr = rhsVector.toArray() as number[][]
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(rhsArr[i][0] - originalRhs[i][0])).toBeLessThan(1e-15)
      }
    })

    it('should set operatingPoint with id=0 and gm=0 in cutoff', () => {
      const solution = matrix([[0.0], [5.0], [3.0]]) // Vsg = -2V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getDrainCurrent()).toBe(0)
      expect(pmosStamper.getTransconductance()).toBe(0)
    })

    it('should report Cutoff region when Vsg < Vth', () => {
      const solution = matrix([[0.0], [5.0], [3.0]])
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getOperatingRegion()).toBe('Cutoff')
    })
  })

  describe('Saturation Behavior', () => {
    it('should produce positive Id when Vsg > Vth and Vsd > (Vsg - Vth)', () => {
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vd=0, Vg=3, Vs=5 → Vsg=2V, Vsd=5V, overdrive=1V, Vsd=5 > 1
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()
      expect(id).toBeGreaterThan(0)
      expect(isFinite(id)).toBe(true)
    })

    it('should report Saturation region when Vsd >= (Vsg - Vth)', () => {
      const solution = matrix([[0.0], [3.0], [5.0]])
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getOperatingRegion()).toBe('Saturation')
    })

    it('should produce expected saturation current value', () => {
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vsg=2V, Vsd=5V, Vth=1V, Kp=200e-6, lambda=0.01
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()

      const vOv = 2.0 - 1.0
      const channelMod = 1 + 0.01 * 5
      const expectedId = 0.5 * 200e-6 * vOv * vOv * channelMod
      expect(id).toBeCloseTo(expectedId, 6)
    })
  })

  describe('Triode Behavior', () => {
    it('should produce positive Id when Vsg > Vth and Vsd < (Vsg - Vth)', () => {
      const solution = matrix([[4.0], [3.0], [5.0]]) // Vd=4, Vg=3, Vs=5 → Vsg=2V, Vsd=1V, overdrive=1V, Vsd=1 ≈ 1 (at boundary)
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()
      expect(id).toBeGreaterThanOrEqual(0)
      expect(isFinite(id)).toBe(true)
    })

    it('should report Triode region when Vsd < (Vsg - Vth)', () => {
      const solution = matrix([[4.5], [3.0], [5.0]]) // Vd=4.5, Vg=3, Vs=5 → Vsg=2V, Vsd=0.5V, overdrive=1V, Vsd=0.5 < 1
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getOperatingRegion()).toBe('Triode')
    })

    it('should produce expected triode current value', () => {
      const solution = matrix([[4.5], [3.0], [5.0]]) // Vsg=2V, Vsd=0.5V, Vth=1V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()

      const vOv = 2.0 - 1.0
      const clampedMod = 1 + 0.01 * 0.5
      const expectedId = (200e-6 * (vOv * 0.5 - 0.5 * 0.5 * 0.5)) / clampedMod
      expect(id).toBeCloseTo(expectedId, 6)
    })
  })

  describe('Current Polarity (PMOS specific)', () => {
    it('should inject negative Id at source node and positive Id at drain node in rhs', () => {
      rhsVector = matrix(zeros(3, 1))
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vsg=2V, Vsd=5V → saturation, positive Id
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()
      expect(id).toBeGreaterThan(0)

      const rhsArr = rhsVector.toArray() as number[][]
      expect(rhsArr[2][0]).toBeCloseTo(-id, 6) // source node (index 2) gets -id
      expect(rhsArr[0][0]).toBeCloseTo(id, 6) // drain node (index 0) gets +id
    })

    it('should have opposite polarity from NMOS (source negative, drain positive for PMOS)', () => {
      const solution = matrix([[1.0], [3.0], [5.0]]) // Vsg=2V, Vsd=4V → saturation
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const id = pmosStamper.getDrainCurrent()
      const rhsArr = rhsVector.toArray() as number[][]

      expect(rhsArr[2][0]).toBeLessThan(0) // source: current injected (negative)
      expect(rhsArr[0][0]).toBeGreaterThan(0) // drain: current extracted (positive)
    })
  })

  describe('PMOS Voltage Polarities', () => {
    it('should compute Vsg = Vs - Vg', () => {
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vg=3, Vs=5
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getDrainCurrent()).toBeGreaterThan(0)
    })

    it('should compute Vsd = Vs - Vd', () => {
      const solution = matrix([[1.0], [3.0], [5.0]]) // Vd=1, Vs=5 → Vsd=4V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const region = pmosStamper.getOperatingRegion()
      expect(region).toBe('Saturation') // Vsg=2V, Vsd=4V > overdrive=1V
    })

    it('should treat Vs > Vg as active (opposite of NMOS)', () => {
      const solution = matrix([[0.0], [2.0], [5.0]]) // Vs=5 > Vg=2 → Vsg=3V > Vth=1V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const region = pmosStamper.getOperatingRegion()
      expect(region).not.toBe('Cutoff')
    })

    it('should treat Vs < Vg as cutoff (opposite of NMOS)', () => {
      const solution = matrix([[0.0], [5.0], [3.0]]) // Vs=3 < Vg=5 → Vsg=-2V < Vth=1V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getOperatingRegion()).toBe('Cutoff')
      expect(pmosStamper.getDrainCurrent()).toBe(0)
    })
  })

  describe('Parameter Variations', () => {
    it('should produce different results for different Vth', () => {
      const comp1 = createTestPMOS('M1', 0.5)
      const comp2 = createTestPMOS('M2', 1.5)
      const s1 = new PMOSStamper(comp1)
      const s2 = new PMOSStamper(comp2)

      const nodeMap1 = new Map([['M1:drain', 0], ['M1:gate', 1], ['M1:source', 2]])
      const nodeMap2 = new Map([['M2:drain', 0], ['M2:gate', 1], ['M2:source', 2]])

      const solution = matrix([[0.0], [2.0], [5.0]]) // Vsg=3V
      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      s1.stampLinearized(m1, r1, nodeMap1, solution)
      s2.stampLinearized(m2, r2, nodeMap2, solution)

      expect(s1.getDrainCurrent()).not.toBeCloseTo(s2.getDrainCurrent(), 4)
    })

    it('should produce different results for different Kp', () => {
      const comp1 = createTestPMOS('M1', 1.0, 100e-6)
      const comp2 = createTestPMOS('M2', 1.0, 400e-6)
      const s1 = new PMOSStamper(comp1)
      const s2 = new PMOSStamper(comp2)

      const nodeMap1 = new Map([['M1:drain', 0], ['M1:gate', 1], ['M1:source', 2]])
      const nodeMap2 = new Map([['M2:drain', 0], ['M2:gate', 1], ['M2:source', 2]])

      const solution = matrix([[0.0], [2.0], [5.0]]) // Vsg=3V
      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      s1.stampLinearized(m1, r1, nodeMap1, solution)
      s2.stampLinearized(m2, r2, nodeMap2, solution)

      expect(s2.getDrainCurrent()).toBeGreaterThan(s1.getDrainCurrent())
    })

    it('should produce different results for different lambda', () => {
      const comp1 = createTestPMOS('M1', 1.0, 200e-6, 0.0)
      const comp2 = createTestPMOS('M2', 1.0, 200e-6, 0.05)
      const s1 = new PMOSStamper(comp1)
      const s2 = new PMOSStamper(comp2)

      const nodeMap1 = new Map([['M1:drain', 0], ['M1:gate', 1], ['M1:source', 2]])
      const nodeMap2 = new Map([['M2:drain', 0], ['M2:gate', 1], ['M2:source', 2]])

      const solution = matrix([[0.0], [2.0], [5.0]]) // Vsd=5V in saturation, lambda amplifies
      const m1 = matrix(zeros(3, 3))
      const r1 = matrix(zeros(3, 1))
      const m2 = matrix(zeros(3, 3))
      const r2 = matrix(zeros(3, 1))

      s1.stampLinearized(m1, r1, nodeMap1, solution)
      s2.stampLinearized(m2, r2, nodeMap2, solution)

      expect(s2.getDrainCurrent()).toBeGreaterThan(s1.getDrainCurrent())
    })
  })

  describe('Numerical Stability', () => {
    it('should handle extreme positive voltages without throwing', () => {
      const solution = matrix([[0.0], [-100.0], [200.0]])
      expect(() => {
        pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()

      expect(isFinite(pmosStamper.getDrainCurrent())).toBe(true)
    })

    it('should handle extreme negative voltages without throwing', () => {
      const solution = matrix([[200.0], [100.0], [0.0]])
      expect(() => {
        pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()

      expect(isFinite(pmosStamper.getDrainCurrent())).toBe(true)
    })

    it('should return finite numbers for extreme Vsd', () => {
      const solution = matrix([[-100.0], [0.0], [0.0]]) // Vsg=0, Vsd=100 → cutoff
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(isFinite(pmosStamper.getDrainCurrent())).toBe(true)
      expect(pmosStamper.getDrainCurrent()).toBe(0)
    })

    it('should handle zero voltages without error', () => {
      const solution = matrix([[0.0], [0.0], [0.0]])
      expect(() => {
        pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)
      }).not.toThrow()

      expect(pmosStamper.getOperatingRegion()).toBe('Cutoff')
    })
  })

  describe('Transconductance', () => {
    it('should return positive gm in saturation', () => {
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vsg=2V, Vsd=5V → saturation
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = pmosStamper.getTransconductance()
      expect(gm).toBeGreaterThan(0)
      expect(isFinite(gm)).toBe(true)
    })

    it('should return positive gm in triode', () => {
      const solution = matrix([[4.5], [3.0], [5.0]]) // Vsg=2V, Vsd=0.5V → triode
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const gm = pmosStamper.getTransconductance()
      expect(gm).toBeGreaterThan(0)
      expect(isFinite(gm)).toBe(true)
    })

    it('should return 0 gm in cutoff', () => {
      const solution = matrix([[0.0], [5.0], [3.0]]) // Vsg=-2V → cutoff
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      expect(pmosStamper.getTransconductance()).toBe(0)
    })

    it('should return positive gm value consistent with saturation formula', () => {
      const solution = matrix([[0.0], [3.0], [5.0]]) // Vsg=2V, Vsd=5V, Vth=1V
      pmosStamper.stampLinearized(mnaMatrix, rhsVector, nodeMap, solution)

      const vOv = 2.0 - 1.0
      const channelMod = Math.max(1 + 0.01 * 5, 0.5)
      const expectedGm = 200e-6 * vOv * channelMod

      expect(pmosStamper.getTransconductance()).toBeCloseTo(expectedGm, 6)
    })
  })
})
