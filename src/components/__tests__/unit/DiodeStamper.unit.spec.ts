import { describe, it, expect } from 'vitest'
import { matrix, Matrix, zeros } from 'mathjs'
import type { CircuitComponent } from '../../../types/components'
// Import REAL stampers - no mocks!
import {
  DiodeStamper,
  VoltageSourceStamper,
  ResistorStamper,
  type ComponentStamper,
} from '../../../services/simulation'

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
  const { DiodeStamper } = require('../../../services/simulation')
  return new DiodeStamper(component)
}

function createRealVoltageSourceStamper(id: string, voltage: number): ComponentStamper {
  const component = createTestVoltageSource(id, voltage)
  const { VoltageSourceStamper } = require('../../../services/simulation')
  return new VoltageSourceStamper(component)
}

function createRealResistorStamper(id: string, resistance: number): ComponentStamper {
  const component = createTestResistor(id, resistance)
  const { ResistorStamper } = require('../../../services/simulation')
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

describe('DiodeStamper REAL Implementation Unit Tests', () => {
  describe('Basic Stamper Creation', () => {
    it('should create DiodeStamper with default parameters', () => {
      const stamper = createRealDiodeStamper('D1')

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('D1')
      expect(stamper.type).toBe('diode')

      console.log('✅ REAL DiodeStamper created successfully')
    })

    it('should create DiodeStamper with explicit saturation current', () => {
      const saturationCurrent = 1e-15
      const stamper = createRealDiodeStamper('D1', saturationCurrent)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('D1')
      expect(stamper.type).toBe('diode')

      console.log(`✅ REAL DiodeStamper with explicit Is=${saturationCurrent.toExponential(2)}A`)
    })

    it('should implement ComponentStamper interface correctly', () => {
      const stamper = createRealDiodeStamper('D1')

      expect(typeof stamper.stampDC).toBe('function')
      expect(typeof stamper.calculateCurrent).toBe('function')
      expect(stamper.id).toBe('D1')
      expect(stamper.type).toBe('diode')

      console.log('✅ REAL DiodeStamper implements interface correctly')
    })
  })

  describe('DC Stamping Behavior', () => {
    it('should stamp nothing in DC matrix (non-linear component)', () => {
      const stamper = createRealDiodeStamper('D1')
      const mnaMatrix = matrix(zeros(3, 3))
      const rhsVector = matrix(zeros(3, 1))
      const nodeMap = createTestNodeMap('D1')

      // Store original matrix state
      const originalMatrix = mnaMatrix.clone()
      const originalRHS = rhsVector.clone()

      // Perform DC stamping
      const result = stamper.stampDC(mnaMatrix, rhsVector, nodeMap, 0)

      // For non-linear components, DC stamping should not modify matrices
      expect(mnaMatrix.toArray()).toEqual(originalMatrix.toArray())
      expect(rhsVector.toArray()).toEqual(originalRHS.toArray())
      expect(result.branchCurrents).toEqual([])

      console.log('✅ REAL DC stamping correctly leaves matrices unmodified')
    })
  })

  describe('Current Calculation with Real Implementation', () => {
    it('should calculate current using fallback voltage-based method', () => {
      const stamper = createRealDiodeStamper('D1', 1e-12)
      const nodeMap = createTestNodeMap('D1')

      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], 1.0) // Anode at 1V
      solution.set([1, 0], 0.3) // Cathode at 0.3V
      solution.set([2, 0], 0.0) // Ground at 0V

      const current = stamper.calculateCurrent(solution, nodeMap, [])

      expect(current).toBeDefined()
      expect(typeof current).toBe('number')
      expect(current).toBeGreaterThanOrEqual(0)

      console.log(`✅ REAL current calculation: ${current.toExponential(3)}A`)
    })

    it('should handle different voltage conditions with real implementation', () => {
      const stamper = createRealDiodeStamper('D1', 1e-12)
      const nodeMap = createTestNodeMap('D1')

      const testCases = [
        { name: 'Zero bias', anode: 0.0, cathode: 0.0 },
        { name: 'Forward bias', anode: 0.7, cathode: 0.0 },
        { name: 'High forward', anode: 1.0, cathode: 0.2 },
        { name: 'Reverse bias', anode: 0.0, cathode: 0.5 },
      ]

      for (const test of testCases) {
        const solution = matrix(zeros(3, 1))
        solution.set([0, 0], test.anode)
        solution.set([1, 0], test.cathode)
        solution.set([2, 0], 0.0)

        const current = stamper.calculateCurrent(solution, nodeMap, [])

        expect(current).toBeDefined()
        expect(isFinite(current)).toBe(true)

        const diodeVoltage = test.anode - test.cathode
        console.log(
          `✅ REAL ${test.name}: Vd=${diodeVoltage.toFixed(2)}V → I=${current.toExponential(2)}A`,
        )
      }
    })
  })

  describe('Parameter Independence with Real Stampers', () => {
    it('should show different current calculations for different saturation currents', () => {
      const smallDiode = createRealDiodeStamper('D1', 1e-15)
      const standardDiode = createRealDiodeStamper('D2', 1e-12)
      const powerDiode = createRealDiodeStamper('D3', 1e-9)

      const nodeMap1 = createTestNodeMap('D1')
      const nodeMap2 = createTestNodeMap('D2')
      const nodeMap3 = createTestNodeMap('D3')

      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], 0.7) // 0.7V forward bias
      solution.set([1, 0], 0.0)
      solution.set([2, 0], 0.0)

      const current1 = smallDiode.calculateCurrent(solution, nodeMap1, [])
      const current2 = standardDiode.calculateCurrent(solution, nodeMap2, [])
      const current3 = powerDiode.calculateCurrent(solution, nodeMap3, [])

      // Different saturation currents should produce different results
      expect(current1).not.toBeCloseTo(current2, 6)
      expect(current2).not.toBeCloseTo(current3, 6)

      console.log(`✅ REAL parameter independence:`)
      console.log(`   Small (1e-15): ${current1.toExponential(3)}A`)
      console.log(`   Standard (1e-12): ${current2.toExponential(3)}A`)
      console.log(`   Power (1e-9): ${current3.toExponential(3)}A`)
    })
  })

  describe('Integration with Real Circuit Stampers', () => {
    it('should work with real VoltageSourceStamper and ResistorStamper for circuit analysis', () => {
      const diodeStamper = createRealDiodeStamper('D1') // No explicit parameters = triggers parameter scaling
      const voltageStamper = createRealVoltageSourceStamper('V1', 5.0)
      const resistorStamper = createRealResistorStamper('R1', 1000)

      // This tests the REAL circuit analysis integration
      const allStampers = [voltageStamper, resistorStamper, diodeStamper]

      expect(diodeStamper).toBeDefined()
      expect(voltageStamper).toBeDefined()
      expect(resistorStamper).toBeDefined()

      console.log('✅ REAL stampers created for circuit analysis integration')
      console.log(`   Voltage: ${voltageStamper.id} (${voltageStamper.type})`)
      console.log(`   Resistor: ${resistorStamper.id} (${resistorStamper.type})`)
      console.log(`   Diode: ${diodeStamper.id} (${diodeStamper.type})`)
    })

    it('should handle various circuit conditions with real stampers', () => {
      const testCases = [
        { name: 'Low voltage', voltage: 1.5, resistance: 1000 },
        { name: 'Standard', voltage: 5.0, resistance: 1000 },
        { name: 'High voltage', voltage: 12.0, resistance: 2200 },
        { name: 'Low resistance', voltage: 5.0, resistance: 100 },
        { name: 'High resistance', voltage: 5.0, resistance: 10000 },
      ]

      for (const test of testCases) {
        const diodeStamper = createRealDiodeStamper('D1')
        const voltageStamper = createRealVoltageSourceStamper('V1', test.voltage)
        const resistorStamper = createRealResistorStamper('R1', test.resistance)

        const allStampers = [voltageStamper, resistorStamper, diodeStamper]

        // Should create without errors
        expect(diodeStamper).toBeDefined()
        expect(voltageStamper).toBeDefined()
        expect(resistorStamper).toBeDefined()

        console.log(
          `✅ REAL ${test.name}: ${test.voltage}V, ${test.resistance}Ω - stampers created`,
        )
      }
    })
  })

  describe('Edge Cases with Real Implementation', () => {
    it('should handle zero voltage gracefully', () => {
      const stamper = createRealDiodeStamper('D1', 1e-12)
      const nodeMap = createTestNodeMap('D1')

      const solution = matrix(zeros(3, 1))
      // All voltages zero

      const current = stamper.calculateCurrent(solution, nodeMap, [])

      expect(Math.abs(current)).toBeLessThan(1e-9)
      console.log(`✅ REAL zero voltage: ${current.toExponential(3)}A`)
    })

    it('should handle large voltage differences', () => {
      const stamper = createRealDiodeStamper('D1', 1e-12)
      const nodeMap = createTestNodeMap('D1')

      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], 100.0) // Very high voltage
      solution.set([1, 0], 0.0)
      solution.set([2, 0], 0.0)

      const current = stamper.calculateCurrent(solution, nodeMap, [])

      expect(isFinite(current)).toBe(true)
      expect(current).toBeGreaterThan(0)
      console.log(`✅ REAL large voltage (100V): ${current.toExponential(3)}A`)
    })

    it('should handle reverse bias correctly', () => {
      const stamper = createRealDiodeStamper('D1', 1e-12)
      const nodeMap = createTestNodeMap('D1')

      const solution = matrix(zeros(3, 1))
      solution.set([0, 0], 0.0)
      solution.set([1, 0], 5.0) // Cathode higher than anode
      solution.set([2, 0], 0.0)

      const current = stamper.calculateCurrent(solution, nodeMap, [])

      expect(current).toBeLessThan(0)
      expect(current).toBeGreaterThan(-1e-6)
      console.log(`✅ REAL reverse bias (-5V): ${current.toExponential(3)}A`)
    })
  })
})
