import type { Circuit } from '@/types/components'

/**
 * Test circuit definition with expected simulation results
 */
export interface TestCircuit {
  /** Human-readable name for the test */
  name: string

  /** Description of what this test validates */
  description: string

  /** The circuit configuration to test */
  circuit: Circuit

  /** Expected simulation results for validation */
  expected: {
    /** Expected node voltages (node index -> voltage) */
    voltages?: Record<string, number>

    /** Expected component currents (component ID -> current) */
    currents?: Record<string, number>

    /** Acceptable error percentage (default: 0.1%) */
    tolerance?: number
  }

  /** Test category for organization */
  category: 'basic' | 'regression' | 'edge-case' | 'performance' | 'non-linear'

  /** Tags for filtering tests */
  tags?: string[]
}

/**
 * Result of running a test circuit
 */
export interface TestResult {
  /** Test circuit name */
  name: string

  /** Whether the test passed */
  passed: boolean

  /** Simulation succeeded */
  simulationSucceeded: boolean

  /** Detailed validation results */
  validation: {
    voltages: ValidationResult[]
    currents: ValidationResult[]
  }

  /** Error message if test failed */
  error?: string

  /** Execution time in milliseconds */
  executionTime: number
}

/**
 * Individual validation result for a voltage or current
 */
export interface ValidationResult {
  /** Property being validated (e.g., "node_1", "R1") */
  property: string

  /** Expected value */
  expected: number

  /** Actual simulation result */
  actual: number

  /** Difference between expected and actual */
  difference: number

  /** Percentage error */
  percentError: number

  /** Whether this validation passed */
  passed: boolean
}

/**
 * Test suite configuration
 */
export interface TestSuite {
  /** Suite name */
  name: string

  /** Suite description */
  description: string

  /** List of test circuits */
  tests: TestCircuit[]
}
