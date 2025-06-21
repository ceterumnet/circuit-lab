import { solveDC } from '@/services/simulation'
import type { TestCircuit, TestResult, ValidationResult } from './types'

/**
 * Test circuit runner - validates simulation results against expected values
 */
export class TestCircuitRunner {
  private defaultTolerance = 0.001 // 0.1% default tolerance

  /**
   * Run a single test circuit and validate results
   */
  async runTest(test: TestCircuit): Promise<TestResult> {
    const startTime = performance.now()

    try {
      console.log(`🧪 Running test: ${test.name}`)

      // Run the simulation
      const result = await solveDC(test.circuit)

      if (!result) {
        return {
          name: test.name,
          passed: false,
          simulationSucceeded: false,
          validation: { voltages: [], currents: [] },
          error: 'Simulation failed to converge',
          executionTime: performance.now() - startTime,
        }
      }

      // Validate results
      const tolerance = test.expected.tolerance ?? this.defaultTolerance
      const voltageValidation = this.validateValues(
        test.expected.voltages || {},
        result.voltages,
        tolerance,
        'voltage',
      )

      const currentValidation = this.validateValues(
        test.expected.currents || {},
        result.currents,
        tolerance,
        'current',
      )

      const allPassed = [...voltageValidation, ...currentValidation].every((v) => v.passed)

      return {
        name: test.name,
        passed: allPassed,
        simulationSucceeded: true,
        validation: {
          voltages: voltageValidation,
          currents: currentValidation,
        },
        executionTime: performance.now() - startTime,
      }
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        simulationSucceeded: false,
        validation: { voltages: [], currents: [] },
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: performance.now() - startTime,
      }
    }
  }

  /**
   * Run multiple test circuits
   */
  async runTests(tests: TestCircuit[]): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const test of tests) {
      const result = await this.runTest(test)
      results.push(result)

      // Log result
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} ${test.name} (${result.executionTime.toFixed(1)}ms)`)

      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`)
      }

      // Log validation details for failed tests
      if (!result.passed && result.simulationSucceeded) {
        ;[...result.validation.voltages, ...result.validation.currents]
          .filter((v) => !v.passed)
          .forEach((v) => {
            console.log(
              `   ${v.property}: expected ${v.expected}, got ${v.actual} (${v.percentError.toFixed(2)}% error)`,
            )
          })
      }
    }

    // Summary
    const passed = results.filter((r) => r.passed).length
    const total = results.length
    console.log(`\n📊 Test Summary: ${passed}/${total} passed`)

    return results
  }

  /**
   * Validate actual values against expected values
   */
  private validateValues(
    expected: Record<string, number>,
    actual: Record<string, number>,
    tolerance: number,
    type: 'voltage' | 'current',
  ): ValidationResult[] {
    const results: ValidationResult[] = []

    for (const [property, expectedValue] of Object.entries(expected)) {
      const actualValue = actual[property]

      if (actualValue === undefined) {
        results.push({
          property,
          expected: expectedValue,
          actual: 0,
          difference: expectedValue,
          percentError: 100,
          passed: false,
        })
        continue
      }

      const difference = Math.abs(actualValue - expectedValue)
      const percentError =
        expectedValue !== 0
          ? (difference / Math.abs(expectedValue)) * 100
          : difference > 1e-12
            ? 100
            : 0

      const passed = percentError <= tolerance * 100

      results.push({
        property,
        expected: expectedValue,
        actual: actualValue,
        difference,
        percentError,
        passed,
      })
    }

    return results
  }

  /**
   * Generate a comprehensive test report
   */
  generateReport(results: TestResult[]): string {
    const passed = results.filter((r) => r.passed).length
    const failed = results.length - passed
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0)

    let report = `# Circuit Simulation Test Report\n\n`
    report += `**Summary:**\n`
    report += `- Total Tests: ${results.length}\n`
    report += `- Passed: ${passed}\n`
    report += `- Failed: ${failed}\n`
    report += `- Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`
    report += `- Total Execution Time: ${totalTime.toFixed(1)}ms\n\n`

    if (failed > 0) {
      report += `## Failed Tests\n\n`
      results
        .filter((r) => !r.passed)
        .forEach((result) => {
          report += `### ${result.name}\n`
          if (result.error) {
            report += `**Error:** ${result.error}\n\n`
          } else {
            report += `**Validation Failures:**\n`
            const failures = [...result.validation.voltages, ...result.validation.currents].filter(
              (v) => !v.passed,
            )
            failures.forEach((f) => {
              report += `- ${f.property}: expected ${f.expected}, got ${f.actual} (${f.percentError.toFixed(2)}% error)\n`
            })
            report += `\n`
          }
        })
    }

    return report
  }
}

/**
 * Global test runner instance
 */
export const testRunner = new TestCircuitRunner()
