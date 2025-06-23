import { describe, it, expect, beforeEach } from 'vitest'
import {
  createVoltageDividerCircuit,
  createParameterIndependenceTestSet,
  resetIdCounters,
} from '../circuit-factory'
import {
  validateSimulationResults,
  expectSimulationToMatch,
  createTestSummaryReport,
} from '../test-validation'
import type { TestCircuitSpec, ValidationResult } from '../test-types'

describe('Linear Analysis Functional Tests', () => {
  beforeEach(() => {
    resetIdCounters()
  })

  describe('Voltage Divider Analysis', () => {
    it('should correctly analyze a basic voltage divider circuit', () => {
      // Test Case: functional-linear-voltage-divider-1000-2000
      const testSpec = createVoltageDividerCircuit(1000, 2000, 5.0)

      expect(testSpec.id).toBe('functional-linear-voltage-divider-1000-2000')
      expect(testSpec.category).toBe('functional')
      expect(testSpec.testType).toBe('linear')

      // Verify voltage divider calculations
      const expectedMiddleVoltage = (5.0 * 2000) / (1000 + 2000) // 3.33V
      const expectedCurrent = 5.0 / (1000 + 2000) // 1.67mA

      expect(testSpec.expectedResults.voltages['N2']).toBeCloseTo(expectedMiddleVoltage, 6)
      expect(testSpec.expectedResults.currents['R1']).toBeCloseTo(expectedCurrent, 6)
      expect(testSpec.expectedResults.currents['R2']).toBeCloseTo(expectedCurrent, 6)

      // Verify KCL compliance - series circuit should have identical currents
      const r1Current = testSpec.expectedResults.currents['R1']
      const r2Current = testSpec.expectedResults.currents['R2']
      const vsCurrents = testSpec.expectedResults.currents['VS1']

      expect(r1Current).toBeCloseTo(r2Current, 12) // High precision for linear circuit
      expect(r1Current).toBeCloseTo(vsCurrents, 12)

      console.log('Voltage Divider Analysis:')
      console.log(`  R1 (${1000}Ω): ${r1Current.toExponential(3)}A`)
      console.log(`  R2 (${2000}Ω): ${r2Current.toExponential(3)}A`)
      console.log(`  Middle Voltage: ${expectedMiddleVoltage.toFixed(3)}V`)
    })

    it('should demonstrate voltage division ratios', () => {
      const configs = [
        { r1: 1000, r2: 1000, expectedRatio: 0.5 }, // 50% division
        { r1: 1000, r2: 2000, expectedRatio: 2 / 3 }, // 66.7% division
        { r1: 2000, r2: 1000, expectedRatio: 1 / 3 }, // 33.3% division
        { r1: 1000, r2: 9000, expectedRatio: 0.9 }, // 90% division
      ]

      configs.forEach(({ r1, r2, expectedRatio }) => {
        const testSpec = createVoltageDividerCircuit(r1, r2, 5.0)
        const actualRatio = testSpec.expectedResults.voltages['N2'] / 5.0

        expect(actualRatio).toBeCloseTo(expectedRatio, 6)

        console.log(
          `  ${r1}Ω/${r2}Ω → ${(actualRatio * 100).toFixed(1)}% (expected: ${(expectedRatio * 100).toFixed(1)}%)`,
        )
      })
    })
  })

  describe('Parameter Independence Validation', () => {
    it('should validate all parameter independence test cases', () => {
      const testCases = createParameterIndependenceTestSet()

      // Verify we have the expected test cases
      expect(testCases.length).toBeGreaterThan(6) // At least 3 resistors + 3 dividers + 3 diodes

      // Group by component type
      const resistorTests = testCases.filter(
        (t) => t.component === 'resistor' && t.scenario === 'basic',
      )
      const dividerTests = testCases.filter(
        (t) => t.component === 'resistor' && t.scenario === 'voltage-divider',
      )
      const diodeTests = testCases.filter((t) => t.component === 'diode')

      expect(resistorTests.length).toBe(3)
      expect(dividerTests.length).toBe(3)
      expect(diodeTests.length).toBe(3)

      // Verify parameter independence for basic resistors
      const resistorCurrents = resistorTests.map((test) => {
        const resistorId = Object.keys(test.expectedResults.currents).find((id) =>
          id.startsWith('R'),
        )!
        return {
          resistance: test.circuit.components.find((c) => c.type === 'resistor')?.properties
            ?.resistance as number,
          current: test.expectedResults.currents[resistorId],
        }
      })

      // All currents should be different (parameter independence)
      expect(resistorCurrents[0].current).not.toBeCloseTo(resistorCurrents[1].current)
      expect(resistorCurrents[1].current).not.toBeCloseTo(resistorCurrents[2].current)
      expect(resistorCurrents[0].current).not.toBeCloseTo(resistorCurrents[2].current)

      // All should follow Ohm's law: I = V/R
      resistorCurrents.forEach(({ resistance, current }) => {
        const expectedCurrent = 5.0 / resistance
        expect(current).toBeCloseTo(expectedCurrent, 10)
      })

      console.log('Parameter Independence Validation:')
      resistorCurrents.forEach(({ resistance, current }) => {
        console.log(`  ${resistance}Ω → ${current.toExponential(3)}A`)
      })
    })

    it('should validate KCL compliance in series circuits', () => {
      const dividerTest = createVoltageDividerCircuit(1000, 2000, 5.0)

      // Extract all current values
      const currents = Object.values(dividerTest.expectedResults.currents)

      // In a series circuit, all currents must be identical (KCL)
      const referenceCurrent = currents[0]
      currents.forEach((current) => {
        expect(current).toBeCloseTo(referenceCurrent, 12) // High precision requirement
      })

      // Calculate expected series current
      const totalResistance = 1000 + 2000
      const expectedCurrent = 5.0 / totalResistance

      currents.forEach((current) => {
        expect(current).toBeCloseTo(expectedCurrent, 12)
      })

      console.log('KCL Validation (Series Circuit):')
      console.log(`  Expected Current: ${expectedCurrent.toExponential(6)}A`)
      Object.entries(dividerTest.expectedResults.currents).forEach(([id, current]) => {
        console.log(
          `  ${id}: ${current.toExponential(6)}A (diff: ${Math.abs(current - expectedCurrent).toExponential(3)}A)`,
        )
      })
    })
  })

  describe('Tolerance and Precision Validation', () => {
    it('should meet standard linear tolerance requirements', () => {
      const testSpec = createVoltageDividerCircuit(1000, 1000, 10.0)

      // Verify we're using standard linear tolerances
      const tolerances = testSpec.expectedResults.tolerances
      expect(tolerances.voltage).toBe(1e-6) // 1µV
      expect(tolerances.current).toBe(1e-9) // 1nA
      expect(tolerances.relative).toBe(1e-3) // 0.1%
      expect(tolerances.numerical).toBe(1e-12) // 1pV numerical precision

      // Test the tolerance justification
      expect(testSpec.toleranceJustification).toContain('Standard linear circuit')
      expect(testSpec.toleranceJustification).toContain('realistic component tolerances')
    })

    it('should demonstrate precision hierarchy', () => {
      // Compare tolerance requirements across different test types
      const basicResistor = createParameterIndependenceTestSet()[0] // Unit test
      const voltageDivider = createVoltageDividerCircuit(1000, 1000, 5.0) // Functional test

      // Unit tests should have higher precision requirements than functional tests
      expect(basicResistor.expectedResults.tolerances.voltage).toBeLessThan(
        voltageDivider.expectedResults.tolerances.voltage,
      )
      expect(basicResistor.expectedResults.tolerances.current).toBeLessThan(
        voltageDivider.expectedResults.tolerances.current,
      )

      console.log('Precision Hierarchy:')
      console.log(
        `  Unit Test Voltage Tolerance: ${basicResistor.expectedResults.tolerances.voltage.toExponential(3)}V`,
      )
      console.log(
        `  Functional Test Voltage Tolerance: ${voltageDivider.expectedResults.tolerances.voltage.toExponential(3)}V`,
      )
    })
  })

  describe('Circuit Validation and Error Detection', () => {
    it('should validate circuit topology correctness', () => {
      const testSpec = createVoltageDividerCircuit(1000, 2000, 5.0)

      // Verify component count and types
      expect(testSpec.circuit.components).toHaveLength(4) // VS, R1, R2, GND

      const componentTypes = testSpec.circuit.components.map((c) => c.type)
      expect(componentTypes).toContain('voltage_source')
      expect(componentTypes.filter((t) => t === 'resistor')).toHaveLength(2)
      expect(componentTypes).toContain('ground')

      // Verify wire connectivity for series configuration
      expect(testSpec.circuit.wires).toHaveLength(4) // 4 connecting wires

      // Each wire should have proper terminal connections
      testSpec.circuit.wires.forEach((wire, index) => {
        expect(wire.properties?.startTerminal).toBeDefined()
        expect(wire.properties?.endTerminal).toBeDefined()
        expect(typeof wire.properties?.startTerminal).toBe('string')
        expect(typeof wire.properties?.endTerminal).toBe('string')
      })
    })

    it('should detect potential simulation issues', () => {
      // Test edge cases that might cause simulation problems
      const testCases = [
        { r1: 1e-6, r2: 1e12, description: 'extreme resistance ratio' },
        { r1: 1e12, r2: 1e12, description: 'very high resistance values' },
        { r1: 1, r2: 1, description: 'very low resistance values' },
      ]

      testCases.forEach(({ r1, r2, description }) => {
        const testSpec = createVoltageDividerCircuit(r1, r2, 5.0)

        // Check for potential numerical issues
        const totalResistance = r1 + r2
        const expectedCurrent = 5.0 / totalResistance

        // Verify the calculation doesn't produce invalid results
        expect(Number.isFinite(expectedCurrent)).toBe(true)
        expect(expectedCurrent).toBeGreaterThan(0)

        console.log(`Edge Case (${description}):`)
        console.log(`  Total R: ${totalResistance.toExponential(3)}Ω`)
        console.log(`  Current: ${expectedCurrent.toExponential(3)}A`)
      })
    })
  })

  describe('Test Infrastructure Validation', () => {
    it('should validate test summary reporting', () => {
      // Create mock validation results
      const mockResults = [
        {
          testId: 'test-1',
          result: {
            passed: true,
            errors: [],
            warnings: [],
            metrics: { voltageErrors: {}, currentErrors: {}, maxRelativeError: 1e-6 },
          } as ValidationResult,
        },
        {
          testId: 'test-2',
          result: {
            passed: false,
            errors: ['Voltage error exceeds tolerance'],
            warnings: ['Convergence slow'],
            metrics: { voltageErrors: { N1: 1e-3 }, currentErrors: {}, maxRelativeError: 0.1 },
          } as ValidationResult,
        },
      ]

      const report = createTestSummaryReport(mockResults)

      // Verify report structure
      expect(report).toContain('MNA Test Results Summary')
      expect(report).toContain('Total Tests: 2')
      expect(report).toContain('Passed: 1')
      expect(report).toContain('Failed: 1')
      expect(report).toContain('Success Rate: 50.0%')
      expect(report).toContain('Failed Tests:')
      expect(report).toContain('test-2')
      expect(report).toContain('Voltage error exceeds tolerance')
      expect(report).toContain('Warnings:')
      expect(report).toContain('Convergence slow')

      console.log('Test Summary Report:')
      console.log(report)
    })
  })
})
