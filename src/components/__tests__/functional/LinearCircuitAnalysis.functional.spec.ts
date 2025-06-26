import { describe, it, expect } from 'vitest'
import { loadCircuitFile, loadCircuitsByCategory } from '../circuit-loader'

describe('Linear Circuit Analysis Functional Tests', () => {
  describe('Voltage Divider Circuit Analysis', () => {
    it('should load and analyze voltage divider circuit from file', () => {
      // Test Case: functional-linear-voltage-divider-1k-2k.json
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      expect(testSpec.id).toBe('functional-linear-voltage-divider-1k-2k')
      expect(testSpec.category).toBe('functional')
      expect(testSpec.testType).toBe('linear')
      expect(testSpec.component).toBe('resistor')
      expect(testSpec.scenario).toBe('voltage-divider')
      expect(testSpec.variation).toBe('1k-2k')

      // Verify this is a more complex circuit than unit tests
      expect(testSpec.circuit.components).toHaveLength(4) // VS, R1, R2, GND
      expect(testSpec.circuit.wires).toHaveLength(4) // 4 connecting wires

      // Find the resistors
      const r1 = testSpec.circuit.components.find((c) => c.id === 'R1')
      const r2 = testSpec.circuit.components.find((c) => c.id === 'R2')

      expect(r1).toBeDefined()
      expect(r2).toBeDefined()
      expect(r1?.properties?.resistance).toBe(1000)
      expect(r2?.properties?.resistance).toBe(2000)

      // Verify voltage divider calculations
      const expectedMiddleVoltage = (5.0 * 2000) / (1000 + 2000) // 3.33V
      const expectedCurrent = 5.0 / (1000 + 2000) // 1.67mA

      expect(testSpec.expectedResults.voltages['N2']).toBeCloseTo(expectedMiddleVoltage, 10)
      expect(testSpec.expectedResults.currents['R1']).toBeCloseTo(expectedCurrent, 10)
      expect(testSpec.expectedResults.currents['R2']).toBeCloseTo(expectedCurrent, 10)
    })

    it('should validate KCL compliance in series circuits', () => {
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // In a series circuit, all currents must be identical (KCL)
      const currents = Object.values(testSpec.expectedResults.currents)
      const referenceCurrent = currents[0]

      currents.forEach((current) => {
        expect(current).toBeCloseTo(referenceCurrent, 12) // High precision requirement
      })

      console.log('KCL Validation (Functional Test):')
      console.log(`  Expected Current: ${referenceCurrent.toExponential(6)}A`)
      Object.entries(testSpec.expectedResults.currents).forEach(([id, current]) => {
        console.log(`  ${id}: ${current.toExponential(6)}A`)
      })
    })

    it('should use appropriate tolerances for functional testing', () => {
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // Functional tests should use STANDARD_LINEAR tolerances (less strict than unit tests)
      const tolerances = testSpec.expectedResults.tolerances
      expect(tolerances.voltage).toBe(1e-6) // 1µV (vs 1nV for unit tests)
      expect(tolerances.current).toBe(1e-9) // 1nA (vs 1pA for unit tests)
      expect(tolerances.relative).toBe(1e-3) // 0.1% (vs 0.0001% for unit tests)
      expect(tolerances.numerical).toBe(1e-12) // 1pV

      // Verify tolerance justification
      expect(testSpec.toleranceJustification).toContain('Standard linear circuit')
      expect(testSpec.toleranceJustification).toContain('realistic component tolerances')
    })
  })

  describe('Circuit Loading and Validation', () => {
    it('should load multiple circuit files by category', () => {
      const functionalCircuits = loadCircuitsByCategory('functional')

      // Should load all functional test circuits
      expect(functionalCircuits.length).toBeGreaterThanOrEqual(1)

      // All should be functional category
      functionalCircuits.forEach((circuit) => {
        expect(circuit.category).toBe('functional')
        expect(circuit.id).toMatch(/^functional-/)
      })

      console.log('Loaded Functional Circuits:')
      functionalCircuits.forEach((circuit) => {
        console.log(`  ${circuit.id}: ${circuit.description}`)
      })
    })

    it('should demonstrate circuit complexity progression', () => {
      // Load unit and functional circuits to compare complexity
      const unitCircuits = loadCircuitsByCategory('unit')
      const functionalCircuits = loadCircuitsByCategory('functional')

      expect(unitCircuits.length).toBeGreaterThan(0)
      expect(functionalCircuits.length).toBeGreaterThan(0)

      // Functional circuits should be more complex than unit circuits
      const avgUnitComponents =
        unitCircuits.reduce((sum, c) => sum + c.circuit.components.length, 0) / unitCircuits.length
      const avgFunctionalComponents =
        functionalCircuits.reduce((sum, c) => sum + c.circuit.components.length, 0) /
        functionalCircuits.length

      expect(avgFunctionalComponents).toBeGreaterThan(avgUnitComponents)

      console.log('Circuit Complexity Comparison:')
      console.log(`  Unit Tests: ${avgUnitComponents.toFixed(1)} components average`)
      console.log(`  Functional Tests: ${avgFunctionalComponents.toFixed(1)} components average`)
    })

    it('should validate tolerance hierarchy across test types', () => {
      const unitSpec = loadCircuitFile('unit-resistor-basic-1k.json')
      const functionalSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // Unit tests should have stricter tolerances than functional tests
      expect(unitSpec.expectedResults.tolerances.voltage).toBeLessThan(
        functionalSpec.expectedResults.tolerances.voltage,
      )
      expect(unitSpec.expectedResults.tolerances.current).toBeLessThan(
        functionalSpec.expectedResults.tolerances.current,
      )
      expect(unitSpec.expectedResults.tolerances.relative).toBeLessThan(
        functionalSpec.expectedResults.tolerances.relative,
      )

      console.log('Tolerance Hierarchy:')
      console.log(
        `  Unit Test Voltage: ${unitSpec.expectedResults.tolerances.voltage.toExponential(3)}V`,
      )
      console.log(
        `  Functional Test Voltage: ${functionalSpec.expectedResults.tolerances.voltage.toExponential(3)}V`,
      )
      console.log(
        `  Unit Test Current: ${unitSpec.expectedResults.tolerances.current.toExponential(3)}A`,
      )
      console.log(
        `  Functional Test Current: ${functionalSpec.expectedResults.tolerances.current.toExponential(3)}A`,
      )
    })
  })

  describe('Functional Test Characteristics', () => {
    it('should test complete workflows not isolated components', () => {
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // Functional tests should involve multiple interacting components
      const resistors = testSpec.circuit.components.filter((c) => c.type === 'resistor')
      expect(resistors.length).toBeGreaterThan(1) // Multiple components interacting

      // Should test complete electrical behavior, not just stamping
      expect(testSpec.testType).toBe('linear') // Tests full linear analysis workflow

      // Should validate system-level properties like voltage division
      expect(Object.keys(testSpec.expectedResults.voltages).length).toBeGreaterThan(2) // Multiple voltage nodes
    })

    it('should validate naming convention for functional tests', () => {
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // Verify naming convention: {test-type}-{testType}-{scenario}-{variation}
      expect(testSpec.id).toMatch(/^functional-linear-voltage-divider-\w+-\w+$/)

      // Verify category classification
      expect(testSpec.category).toBe('functional')
      expect(testSpec.testType).toBe('linear')
      expect(testSpec.component).toBe('resistor')
      expect(testSpec.scenario).toBe('voltage-divider')
      expect(testSpec.variation).toBe('1k-2k')
    })

    it('should test electrical physics compliance', () => {
      const testSpec = loadCircuitFile('functional-linear-voltage-divider-1k-2k.json')

      // Verify voltage division physics
      const v1 = testSpec.expectedResults.voltages['N1'] // Source voltage
      const v2 = testSpec.expectedResults.voltages['N2'] // Middle node
      const v3 = testSpec.expectedResults.voltages['N3'] // Ground

      expect(v1).toBe(5.0) // Source voltage
      expect(v3).toBe(0.0) // Ground reference
      expect(v2).toBeGreaterThan(v3) // Middle voltage between source and ground
      expect(v2).toBeLessThan(v1)

      // Verify the division ratio matches resistor ratio
      const r1 = 1000
      const r2 = 2000
      const expectedRatio = r2 / (r1 + r2)
      const actualRatio = v2 / v1

      expect(actualRatio).toBeCloseTo(expectedRatio, 10)
    })
  })
})
