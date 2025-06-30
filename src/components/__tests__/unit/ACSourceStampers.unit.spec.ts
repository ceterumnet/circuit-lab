import { describe, it, expect } from 'vitest'
import { ComponentStamperFactory } from '@/services/stampers/ComponentStamperFactory'
import { ACVoltageSourceStamper } from '@/services/stampers/linear/ACVoltageSourceStamper'
import { ACCurrentSourceStamper } from '@/services/stampers/linear/ACCurrentSourceStamper'
import type { CircuitComponent } from '@/types/components'
import { matrix, zeros } from 'mathjs'

function createTestACVoltageSource(
  id: string,
  amplitude: number,
  frequency: number,
  phase: number,
): CircuitComponent {
  return {
    id,
    type: 'ac_voltage_source',
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: {
      amplitude,
      frequency,
      phase,
    },
  }
}

function createTestACCurrentSource(
  id: string,
  amplitude: number,
  frequency: number,
  phase: number,
): CircuitComponent {
  return {
    id,
    type: 'ac_current_source',
    position: { x: 0, y: 0 },
    rotation: 0,
    selected: false,
    properties: {
      amplitude,
      frequency,
      phase,
    },
  }
}

describe('AC Source Stampers Unit Tests', () => {
  describe('AC Voltage Source Stamper', () => {
    it('should create AC voltage source stamper from factory', () => {
      const component = createTestACVoltageSource('V1', 5, 1000, 0)
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeInstanceOf(ACVoltageSourceStamper)
      expect(stamper.id).toBe('V1')
      expect(stamper.type).toBe('ac_voltage_source')
    })

    it('should store AC parameters correctly', () => {
      const component = createTestACVoltageSource('V1', 3.3, 50000, 45)
      const stamper = new ACVoltageSourceStamper(component)

      const params = stamper.getACParameters()
      expect(params.amplitude).toBe(3.3)
      expect(params.frequency).toBe(50000)
      expect(params.phase).toBe(45)
    })

    it('should provide phasor representation', () => {
      const component = createTestACVoltageSource('V1', 5, 1000, 90)
      const stamper = new ACVoltageSourceStamper(component)

      const phasor = stamper.getPhasor()
      expect(phasor.magnitude).toBe(5)
      expect(phasor.phase).toBeCloseTo(Math.PI / 2, 6) // 90 degrees in radians
    })

    it('should use zero DC voltage for DC analysis', () => {
      const component = createTestACVoltageSource('V1', 10, 1000, 0)
      const stamper = new ACVoltageSourceStamper(component)

      expect(stamper.getDCVoltage()).toBe(0)
    })

    it('should stamp correctly for DC analysis', () => {
      const component = createTestACVoltageSource('V1', 5, 1000, 0)
      const stamper = new ACVoltageSourceStamper(component)

      // Create test matrices
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = new Map([
        ['V1:positive', 0],
        ['V1:negative', 1],
      ])

      const result = stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 2)

      // Should return branch current info
      expect(result.branchCurrents).toEqual([2])

      // Check voltage constraint is set to 0 (DC value)
      expect(rhsVector.get([2, 0])).toBe(0)
    })

    it('should identify as AC source', () => {
      const component = createTestACVoltageSource('V1', 5, 1000, 0)
      const stamper = new ACVoltageSourceStamper(component)

      expect(stamper.isACSource()).toBe(true)
      expect(stamper.getSourceType()).toBe('ac_voltage')
    })
  })

  describe('AC Current Source Stamper', () => {
    it('should create AC current source stamper from factory', () => {
      const component = createTestACCurrentSource('I1', 0.005, 1000, 0)
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeInstanceOf(ACCurrentSourceStamper)
      expect(stamper.id).toBe('I1')
      expect(stamper.type).toBe('ac_current_source')
    })

    it('should store AC parameters correctly', () => {
      const component = createTestACCurrentSource('I1', 0.001, 60, -30)
      const stamper = new ACCurrentSourceStamper(component)

      const params = stamper.getACParameters()
      expect(params.amplitude).toBe(0.001)
      expect(params.frequency).toBe(60)
      expect(params.phase).toBe(-30)
    })

    it('should provide phasor representation', () => {
      const component = createTestACCurrentSource('I1', 0.002, 1000, -90)
      const stamper = new ACCurrentSourceStamper(component)

      const phasor = stamper.getPhasor()
      expect(phasor.magnitude).toBe(0.002)
      expect(phasor.phase).toBeCloseTo(-Math.PI / 2, 6) // -90 degrees in radians
    })

    it('should use zero DC current for DC analysis', () => {
      const component = createTestACCurrentSource('I1', 0.005, 1000, 0)
      const stamper = new ACCurrentSourceStamper(component)

      expect(stamper.getDCCurrent()).toBe(0)
    })

    it('should stamp correctly for DC analysis', () => {
      const component = createTestACCurrentSource('I1', 0.003, 1000, 0)
      const stamper = new ACCurrentSourceStamper(component)

      // Create test matrices
      const mnaMatrix = matrix(zeros(2, 2))
      const rhsVector = matrix(zeros(2, 1))
      const nodeMap = new Map([
        ['I1:positive', 0],
        ['I1:negative', 1],
      ])

      const result = stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // Should not add branch currents (current sources don't use them)
      expect(result.branchCurrents).toEqual([])

      // Check that no current injection occurred (DC current is 0 for AC sources)
      expect(rhsVector.get([0, 0])).toBe(0)
      expect(rhsVector.get([1, 0])).toBe(0)
    })

    it('should identify as AC source', () => {
      const component = createTestACCurrentSource('I1', 0.005, 1000, 0)
      const stamper = new ACCurrentSourceStamper(component)

      expect(stamper.isACSource()).toBe(true)
      expect(stamper.getSourceType()).toBe('ac_current')
    })

    it('should calculate zero current for DC analysis', () => {
      const component = createTestACCurrentSource('I1', 0.005, 1000, 0)
      const stamper = new ACCurrentSourceStamper(component)

      const solution = matrix(zeros(3, 1))
      const nodeMap = new Map()
      const branchCurrents: number[] = []

      const current = stamper.calculateCurrent(solution, nodeMap, branchCurrents)
      expect(current).toBe(0) // DC current should be 0 for AC sources
    })
  })

  describe('AC Sources Integration', () => {
    it('should handle default parameter values', () => {
      // Test AC voltage source with minimal properties
      const vComponent: CircuitComponent = {
        id: 'V1',
        type: 'ac_voltage_source',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {},
      }

      const vStamper = new ACVoltageSourceStamper(vComponent)
      const vParams = vStamper.getACParameters()
      expect(vParams.amplitude).toBe(5) // Default amplitude
      expect(vParams.frequency).toBe(1000) // Default frequency
      expect(vParams.phase).toBe(0) // Default phase

      // Test AC current source with minimal properties
      const iComponent: CircuitComponent = {
        id: 'I1',
        type: 'ac_current_source',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {},
      }

      const iStamper = new ACCurrentSourceStamper(iComponent)
      const iParams = iStamper.getACParameters()
      expect(iParams.amplitude).toBe(0.001) // Default amplitude
      expect(iParams.frequency).toBe(1000) // Default frequency
      expect(iParams.phase).toBe(0) // Default phase
    })

    it('should be compatible with existing simulation infrastructure', () => {
      const vComponent = createTestACVoltageSource('V1', 5, 1000, 0)
      const iComponent = createTestACCurrentSource('I1', 0.001, 1000, 0)

      // Should create via factory without errors
      expect(() => ComponentStamperFactory.createStamper(vComponent)).not.toThrow()
      expect(() => ComponentStamperFactory.createStamper(iComponent)).not.toThrow()

      const vStamper = ComponentStamperFactory.createStamper(vComponent)
      const iStamper = ComponentStamperFactory.createStamper(iComponent)

      // Should have correct interface
      expect(typeof vStamper.stampDC).toBe('function')
      expect(typeof vStamper.calculateCurrent).toBe('function')
      expect(typeof iStamper.stampDC).toBe('function')
      expect(typeof iStamper.calculateCurrent).toBe('function')
    })
  })
})
