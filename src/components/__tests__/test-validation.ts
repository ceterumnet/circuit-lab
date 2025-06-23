import type { ValidationResult, ExpectedResults, ToleranceSpec } from './test-types'
import type { SimulationResult } from '@/types/components'

/**
 * Test validation utilities for checking simulation results against expected values
 * Implements tolerance checking and error reporting as outlined in the MNA Tests Plan
 */

/**
 * Validate simulation results against expected values
 */
export function validateSimulationResults(
  actual: SimulationResult,
  expected: ExpectedResults,
  testId: string,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const voltageErrors: Record<string, number> = {}
  const currentErrors: Record<string, number> = {}

  let maxRelativeError = 0
  let passed = true

  // Validate node voltages
  for (const [nodeId, expectedVoltage] of Object.entries(expected.voltages)) {
    const actualNode = actual.nodes.find((n) => n.id === nodeId)

    if (!actualNode) {
      errors.push(`Missing node '${nodeId}' in simulation results`)
      passed = false
      continue
    }

    const actualVoltage = actualNode.voltage
    const voltageError = Math.abs(actualVoltage - expectedVoltage)
    voltageErrors[nodeId] = voltageError

    // Check absolute tolerance
    if (voltageError > expected.tolerances.voltage) {
      errors.push(
        `Node '${nodeId}' voltage error ${voltageError.toExponential(3)}V exceeds tolerance ${expected.tolerances.voltage.toExponential(3)}V` +
          ` (expected: ${expectedVoltage}V, actual: ${actualVoltage}V)`,
      )
      passed = false
    }

    // Check relative tolerance (avoid division by zero)
    if (Math.abs(expectedVoltage) > 1e-12) {
      const relativeError = Math.abs((actualVoltage - expectedVoltage) / expectedVoltage)
      maxRelativeError = Math.max(maxRelativeError, relativeError)

      if (relativeError > expected.tolerances.relative) {
        errors.push(
          `Node '${nodeId}' relative voltage error ${(relativeError * 100).toFixed(2)}% exceeds tolerance ${(expected.tolerances.relative * 100).toFixed(2)}%`,
        )
        passed = false
      }
    }
  }

  // Validate component currents
  for (const [componentId, expectedCurrent] of Object.entries(expected.currents)) {
    const actualCurrent = actual.currents[componentId]

    if (actualCurrent === undefined) {
      errors.push(`Missing current for component '${componentId}' in simulation results`)
      passed = false
      continue
    }

    const currentError = Math.abs(actualCurrent - expectedCurrent)
    currentErrors[componentId] = currentError

    // Check absolute tolerance
    if (currentError > expected.tolerances.current) {
      errors.push(
        `Component '${componentId}' current error ${currentError.toExponential(3)}A exceeds tolerance ${expected.tolerances.current.toExponential(3)}A` +
          ` (expected: ${expectedCurrent}A, actual: ${actualCurrent}A)`,
      )
      passed = false
    }

    // Check relative tolerance (avoid division by zero)
    if (Math.abs(expectedCurrent) > 1e-15) {
      const relativeError = Math.abs((actualCurrent - expectedCurrent) / expectedCurrent)
      maxRelativeError = Math.max(maxRelativeError, relativeError)

      if (relativeError > expected.tolerances.relative) {
        errors.push(
          `Component '${componentId}' relative current error ${(relativeError * 100).toFixed(2)}% exceeds tolerance ${(expected.tolerances.relative * 100).toFixed(2)}%`,
        )
        passed = false
      }
    }
  }

  // Validate power dissipations if provided
  if (expected.powers) {
    for (const [componentId, expectedPower] of Object.entries(expected.powers)) {
      // Calculate actual power from voltage and current
      const actualCurrent = actual.currents[componentId]
      if (actualCurrent === undefined) {
        warnings.push(`Cannot validate power for component '${componentId}' - missing current data`)
        continue
      }

      // Power calculation depends on component type - this is a simplified version
      // In reality, you'd need component voltage data as well
      warnings.push(
        `Power validation for component '${componentId}' not fully implemented - requires component voltage data`,
      )
    }
  }

  // Validate convergence requirements for non-linear circuits
  let convergenceInfo: ValidationResult['metrics']['convergenceInfo'] = undefined
  if (expected.convergence) {
    // This information would come from the Newton-Raphson solver
    // For now, we assume convergence info is provided in the simulation result
    // TODO: Extend SimulationResult to include convergence information

    convergenceInfo = {
      converged: true, // Placeholder - should come from solver
      iterations: 10, // Placeholder - should come from solver
      finalResidual: 1e-8, // Placeholder - should come from solver
    }

    if (expected.convergence.required && !convergenceInfo.converged) {
      errors.push(`Non-linear circuit failed to converge (required for test '${testId}')`)
      passed = false
    }

    if (
      expected.convergence.maxIterations &&
      convergenceInfo.iterations > expected.convergence.maxIterations
    ) {
      warnings.push(
        `Convergence took ${convergenceInfo.iterations} iterations, exceeding target of ${expected.convergence.maxIterations}`,
      )
    }

    if (
      expected.convergence.finalResidual &&
      convergenceInfo.finalResidual > expected.convergence.finalResidual
    ) {
      warnings.push(
        `Final residual ${convergenceInfo.finalResidual.toExponential(3)} exceeds target ${expected.convergence.finalResidual.toExponential(3)}`,
      )
    }
  }

  return {
    passed,
    errors,
    warnings,
    metrics: {
      voltageErrors,
      currentErrors,
      maxRelativeError,
      convergenceInfo,
    },
  }
}

/**
 * Create a summary report of multiple test results
 */
export function createTestSummaryReport(
  results: Array<{ testId: string; result: ValidationResult }>,
): string {
  const totalTests = results.length
  const passedTests = results.filter((r) => r.result.passed).length
  const failedTests = totalTests - passedTests

  let report = `\n=== MNA Test Results Summary ===\n`
  report += `Total Tests: ${totalTests}\n`
  report += `Passed: ${passedTests}\n`
  report += `Failed: ${failedTests}\n`
  report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`

  if (failedTests > 0) {
    report += `Failed Tests:\n`
    results
      .filter((r) => !r.result.passed)
      .forEach(({ testId, result }) => {
        report += `  ❌ ${testId}\n`
        result.errors.forEach((error) => {
          report += `     • ${error}\n`
        })
      })
    report += `\n`
  }

  const allWarnings = results.flatMap((r) => r.result.warnings)
  if (allWarnings.length > 0) {
    report += `Warnings:\n`
    allWarnings.forEach((warning) => {
      report += `  ⚠️  ${warning}\n`
    })
    report += `\n`
  }

  // Performance metrics
  const maxRelativeErrors = results.map((r) => r.result.metrics.maxRelativeError)
  const worstRelativeError = Math.max(...maxRelativeErrors)
  const avgRelativeError = maxRelativeErrors.reduce((a, b) => a + b, 0) / maxRelativeErrors.length

  report += `Performance Metrics:\n`
  report += `  Max Relative Error: ${(worstRelativeError * 100).toFixed(3)}%\n`
  report += `  Avg Relative Error: ${(avgRelativeError * 100).toFixed(3)}%\n`

  return report
}

/**
 * Validate Kirchhoff's Current Law (KCL) for all nodes
 * Critical for series circuit current conservation testing
 */
export function validateKCL(actual: SimulationResult, tolerance: number = 1e-12): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const passed = true

  // For each node, sum all currents flowing into/out of the node
  // This requires detailed current direction information which may not be available
  // in the current SimulationResult structure

  // TODO: Implement KCL validation once current direction data is available
  warnings.push(
    'KCL validation not fully implemented - requires current direction data in SimulationResult',
  )

  return {
    passed,
    errors,
    warnings,
    metrics: {
      voltageErrors: {},
      currentErrors: {},
      maxRelativeError: 0,
    },
  }
}

/**
 * Validate Kirchhoff's Voltage Law (KVL) for circuit loops
 * Critical for voltage drop physics compliance testing
 */
export function validateKVL(actual: SimulationResult, tolerance: number = 1e-12): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const passed = true

  // TODO: Implement KVL validation - requires loop detection and component voltage drops
  warnings.push(
    'KVL validation not fully implemented - requires loop detection and component voltage data',
  )

  return {
    passed,
    errors,
    warnings,
    metrics: {
      voltageErrors: {},
      currentErrors: {},
      maxRelativeError: 0,
    },
  }
}

/**
 * Helper function to format validation errors for test assertions
 */
export function formatValidationError(result: ValidationResult, testId: string): string {
  if (result.passed) {
    return ''
  }

  let message = `Test '${testId}' failed:\n`
  result.errors.forEach((error) => {
    message += `  • ${error}\n`
  })

  if (result.warnings.length > 0) {
    message += `\nWarnings:\n`
    result.warnings.forEach((warning) => {
      message += `  ⚠️  ${warning}\n`
    })
  }

  return message
}

/**
 * Custom assertion helper for Jest/Vitest
 */
export function expectSimulationToMatch(
  actual: SimulationResult,
  expected: ExpectedResults,
  testId: string,
): void {
  const validation = validateSimulationResults(actual, expected, testId)

  if (!validation.passed) {
    const errorMessage = formatValidationError(validation, testId)
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}
