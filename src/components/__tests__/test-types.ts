import type { Circuit } from '@/types/components'

/**
 * Tolerance specifications for different types of testing
 * Based on the MNA Tests Plan tolerance standards
 */
export interface ToleranceSpec {
  voltage: number // Volts - absolute tolerance for voltage measurements
  current: number // Amperes - absolute tolerance for current measurements
  relative: number // Percentage (0.01 = 1%) - relative tolerance for comparisons
  numerical: number // For pure mathematical operations - matrix precision, etc.
}

/**
 * Pre-defined tolerance presets for different testing scenarios
 */
export const TolerancePresets = {
  /** High precision for linear circuits with enhanced numerical solver */
  HIGH_PRECISION_LINEAR: {
    voltage: 1e-9,
    current: 1e-12,
    relative: 1e-6,
    numerical: 1e-15,
  } as ToleranceSpec,

  /** Standard tolerance for typical linear circuit analysis */
  STANDARD_LINEAR: {
    voltage: 1e-6,
    current: 1e-9,
    relative: 1e-3,
    numerical: 1e-12,
  } as ToleranceSpec,

  /** Converged non-linear circuits (Newton-Raphson succeeded) */
  NONLINEAR_CONVERGED: {
    voltage: 1e-3,
    current: 1e-6,
    relative: 1e-2,
    numerical: 1e-9,
  } as ToleranceSpec,

  /** Approximate results for challenging non-linear circuits */
  NONLINEAR_APPROXIMATE: {
    voltage: 1e-2,
    current: 1e-5,
    relative: 5e-2,
    numerical: 1e-6,
  } as ToleranceSpec,
} as const

/**
 * Expected simulation results for validation
 */
export interface ExpectedResults {
  /** Expected node voltages by node ID */
  voltages: Record<string, number>

  /** Expected component currents by component ID */
  currents: Record<string, number>

  /** Tolerance specifications for this test */
  tolerances: ToleranceSpec

  /** Optional: expected power dissipations by component ID */
  powers?: Record<string, number>

  /** Optional: convergence requirements for non-linear circuits */
  convergence?: {
    required: boolean
    maxIterations?: number
    finalResidual?: number
  }
}

/**
 * Test circuit specification
 * Complete definition of a test case including circuit and expected results
 */
export interface TestCircuitSpec {
  /** Unique identifier for this test circuit */
  id: string

  /** Human-readable description of what this test validates */
  description: string

  /** Test category: unit, functional, or integration */
  category: 'unit' | 'functional' | 'integration'

  /** Test type: component class being tested */
  testType:
    | 'assembly'
    | 'solver'
    | 'ground'
    | 'stamper'
    | 'linear'
    | 'nonlinear'
    | 'mixed'
    | 'system'

  /** Component focus: primary component(s) being validated */
  component: string

  /** Scenario description: what electrical scenario is being tested */
  scenario: string

  /** Variation identifier: distinguishes multiple tests of same scenario */
  variation: string

  /** The circuit definition to simulate */
  circuit: Circuit

  /** Expected simulation results for validation */
  expectedResults: ExpectedResults

  /** Justification for chosen tolerance levels */
  toleranceJustification: string

  /** Optional: test-specific setup or teardown requirements */
  setup?: {
    preConditions?: string[]
    mockComponents?: string[]
    specialConfiguration?: Record<string, unknown>
  }
}

/**
 * Test result validation utilities
 */
export interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    voltageErrors: Record<string, number>
    currentErrors: Record<string, number>
    maxRelativeError: number
    convergenceInfo?: {
      converged: boolean
      iterations: number
      finalResidual: number
    }
  }
}
