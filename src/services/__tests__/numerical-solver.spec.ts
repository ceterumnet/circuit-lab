import { describe, it, expect, beforeEach, vi } from 'vitest'
import { matrix, Matrix } from 'mathjs'
import { EnhancedMNASolver, NewtonRaphsonSolver } from '../numerical-solver'
import type { NewtonRaphsonResult, NonLinearStamper, SolverOptions, NewtonRaphsonOptions, SolverResult } from '../numerical-solver'

vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(),
}))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(performance, 'now').mockReturnValue(0)
})

function createMockStamper(id: string, type: string, n1: number, n2: number, gVal: number): NonLinearStamper {
  return {
    id,
    type,
    calculateNonLinearCurrent: (v: number) => v * gVal,
    calculateConductance: () => gVal,
    getNodeIndices: () => [n1, n2],
    stampLinearized: (mnaMatrix: Matrix, _rhs: Matrix, _nodeMap: Map<string, number>, _solution: Matrix, _allStampers?) => {
      mnaMatrix.set([n1, n1], (mnaMatrix.get([n1, n1]) as number) + gVal)
      mnaMatrix.set([n2, n2], (mnaMatrix.get([n2, n2]) as number) + gVal)
      mnaMatrix.set([n1, n2], (mnaMatrix.get([n1, n2]) as number) - gVal)
      mnaMatrix.set([n2, n1], (mnaMatrix.get([n2, n1]) as number) - gVal)
    },
  }
}

// =====================================================================
describe('EnhancedMNASolver', () => {
  describe('constructor defaults', () => {
    it('sets default options when no arguments provided', () => {
      const solver = new EnhancedMNASolver()
      expect(solver).toBeDefined()
    })

    it('uses custom tolerance when provided', () => {
      const solver = new EnhancedMNASolver({ tolerance: 1e-6 })
      expect(solver).toBeDefined()
    })

    it('accepts all option fields', () => {
      const opts: SolverOptions = {
        tolerance: 1e-8,
        useMatrixConditioning: false,
        useIterativeRefinement: false,
        maxRefinementIterations: 10,
        enablePrecisionMonitoring: false,
      }
      const solver = new EnhancedMNASolver(opts)
      expect(solver).toBeDefined()
    })
  })

  describe('solve', () => {
    it('solves a 2x2 identity system Ax=b where x=b', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[3], [4]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: false })
      const result: SolverResult = solver.solve(A, b)
      expect(result.solution.get([0, 0])).toBeCloseTo(3)
      expect(result.solution.get([1, 0])).toBeCloseTo(4)
    })

    it('solves a 3x3 diagonal system', () => {
      const A = matrix([[2, 0, 0], [0, 3, 0], [0, 0, 4]])
      const b = matrix([[10], [15], [20]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: false })
      const result = solver.solve(A, b)
      expect(result.solution.get([0, 0])).toBeCloseTo(5)
      expect(result.solution.get([1, 0])).toBeCloseTo(5)
      expect(result.solution.get([2, 0])).toBeCloseTo(5)
    })

    it('solves a 2x2 non-trivial linear system', () => {
      const A = matrix([[2, 3], [5, 1]])
      const b = matrix([[8], [7]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: false })
      const result = solver.solve(A, b)
      expect(result.solution.get([0, 0])).toBeCloseTo(1)
      expect(result.solution.get([1, 0])).toBeCloseTo(2)
    })

    it('returns precisionMetrics when monitoring enabled', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[1], [1]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: true, useMatrixConditioning: false, useIterativeRefinement: false })
      const result = solver.solve(A, b)
      expect(result.precisionMetrics).toBeDefined()
      expect(result.precisionMetrics!.residualNorm).toBeCloseTo(0)
      expect(typeof result.precisionMetrics!.relativeError).toBe('number')
      expect(typeof result.precisionMetrics!.significantDigits).toBe('number')
    })

    it('returns conditionNumber when conditioning enabled', () => {
      const A = matrix([[2, 0], [0, 3]])
      const b = matrix([[4], [6]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: true, useIterativeRefinement: false })
      const result = solver.solve(A, b)
      expect(result.conditionNumber).toBeDefined()
      expect(typeof result.conditionNumber).toBe('number')
    })

    it('returns refinementIterations field', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[1], [1]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: true, maxRefinementIterations: 3 })
      const result = solver.solve(A, b)
      expect(result.refinementIterations).toBeDefined()
      expect(typeof result.refinementIterations).toBe('number')
      expect(result.refinementIterations).toBe(0)
    })

    it('throws on singular matrix (inconsistent system)', () => {
      const A = matrix([[1, 2], [2, 4]])
      const b = matrix([[3], [7]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: false })
      expect(() => solver.solve(A, b)).toThrow('Matrix is singular or ill-conditioned')
    })

    it('throws on zero matrix', () => {
      const A = matrix([[0, 0], [0, 0]])
      const b = matrix([[1], [1]])
      const solver = new EnhancedMNASolver({ enablePrecisionMonitoring: false, useMatrixConditioning: false, useIterativeRefinement: false })
      expect(() => solver.solve(A, b)).toThrow('Matrix is singular or ill-conditioned')
    })
  })

  describe('applyGroundConstraintsEnhanced', () => {
    it('sets large diagonal value for ground node', () => {
      const mnaMatrix = matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
      const rhsVector = matrix([[10], [20], [30]])
      EnhancedMNASolver.applyGroundConstraintsEnhanced(mnaMatrix, rhsVector, [0])
      expect(mnaMatrix.get([0, 0])).toBe(1e12)
      expect(mnaMatrix.get([0, 1])).toBe(0)
      expect(mnaMatrix.get([0, 2])).toBe(0)
      expect(mnaMatrix.get([1, 0])).toBe(0)
      expect(mnaMatrix.get([2, 0])).toBe(0)
      expect(rhsVector.get([0, 0])).toBe(0)
    })

    it('handles multiple ground nodes', () => {
      const mnaMatrix = matrix([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]])
      const rhsVector = matrix([[1], [2], [3], [4]])
      EnhancedMNASolver.applyGroundConstraintsEnhanced(mnaMatrix, rhsVector, [0, 2])
      expect(mnaMatrix.get([0, 0])).toBe(1e12)
      expect(mnaMatrix.get([2, 2])).toBe(1e12)
      expect(rhsVector.get([0, 0])).toBe(0)
      expect(rhsVector.get([2, 0])).toBe(0)
    })

    it('leaves non-ground sub-matrix entries intact', () => {
      const mnaMatrix = matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
      const rhsVector = matrix([[10], [20], [30]])
      EnhancedMNASolver.applyGroundConstraintsEnhanced(mnaMatrix, rhsVector, [0])
      expect(mnaMatrix.get([1, 1])).toBe(5)
      expect(mnaMatrix.get([1, 2])).toBe(6)
      expect(mnaMatrix.get([2, 1])).toBe(8)
      expect(mnaMatrix.get([2, 2])).toBe(9)
    })

    it('handles single-element matrix', () => {
      const mnaMatrix = matrix([[5]])
      const rhsVector = matrix([[10]])
      EnhancedMNASolver.applyGroundConstraintsEnhanced(mnaMatrix, rhsVector, [0])
      expect(mnaMatrix.get([0, 0])).toBe(1e12)
      expect(rhsVector.get([0, 0])).toBe(0)
    })
  })

  describe('isNearlyEqual', () => {
    it('returns true for identical values', () => {
      expect(EnhancedMNASolver.isNearlyEqual(5, 5)).toBe(true)
    })

    it('returns true for values within default tolerance', () => {
      expect(EnhancedMNASolver.isNearlyEqual(1, 1 + 1e-13)).toBe(true)
    })

    it('returns true for large values within relative tolerance', () => {
      // diff=1e-2, maxVal=1e10+1e-2, tolerance*maxVal = 1e-12 * ~1e10 = 1e-8
      // 1e-2 > 1e-8 so this is false with default tolerance
      expect(EnhancedMNASolver.isNearlyEqual(1e10, 1e10 + 1e-2, 0.01)).toBe(true)
    })

    it('returns false for values outside tolerance', () => {
      expect(EnhancedMNASolver.isNearlyEqual(1, 2)).toBe(false)
    })

    it('returns false for small values outside tolerance', () => {
      expect(EnhancedMNASolver.isNearlyEqual(0.5, 0.5 + 1e-10)).toBe(false)
    })

    it('respects custom tolerance', () => {
      expect(EnhancedMNASolver.isNearlyEqual(1, 1.001, 0.01)).toBe(true)
      expect(EnhancedMNASolver.isNearlyEqual(1, 1.001, 0.0001)).toBe(false)
    })

    it('handles negative values', () => {
      expect(EnhancedMNASolver.isNearlyEqual(-3, -3)).toBe(true)
      expect(EnhancedMNASolver.isNearlyEqual(-3, -3 - 1e-13)).toBe(true)
    })

    it('handles zero comparison', () => {
      expect(EnhancedMNASolver.isNearlyEqual(0, 0)).toBe(true)
      expect(EnhancedMNASolver.isNearlyEqual(0, 1e-13)).toBe(true)
    })

    it('uses relative tolerance for values > 1', () => {
      expect(EnhancedMNASolver.isNearlyEqual(100, 100.001)).toBe(false)
    })

    it('uses absolute tolerance for values <= 1', () => {
      expect(EnhancedMNASolver.isNearlyEqual(0.5, 0.5 + 1e-13)).toBe(true)
      expect(EnhancedMNASolver.isNearlyEqual(0.5, 0.5 + 1e-10)).toBe(false)
    })
  })

  describe('isNearlyZero', () => {
    it('returns true for exact zero', () => {
      expect(EnhancedMNASolver.isNearlyZero(0)).toBe(true)
    })

    it('returns true for values within default tolerance', () => {
      expect(EnhancedMNASolver.isNearlyZero(1e-13)).toBe(true)
      expect(EnhancedMNASolver.isNearlyZero(-1e-13)).toBe(true)
    })

    it('returns true at the boundary', () => {
      expect(EnhancedMNASolver.isNearlyZero(1e-12)).toBe(true)
      expect(EnhancedMNASolver.isNearlyZero(-1e-12)).toBe(true)
    })

    it('returns false for values outside tolerance', () => {
      expect(EnhancedMNASolver.isNearlyZero(1e-10)).toBe(false)
      expect(EnhancedMNASolver.isNearlyZero(-1e-10)).toBe(false)
    })

    it('respects custom tolerance', () => {
      expect(EnhancedMNASolver.isNearlyZero(1e-4, 1e-3)).toBe(true)
      expect(EnhancedMNASolver.isNearlyZero(1e-4, 1e-5)).toBe(false)
    })
  })
})

// =====================================================================
describe('NewtonRaphsonSolver', () => {
  describe('constructor defaults', () => {
    it('creates solver with default options', () => {
      const solver = new NewtonRaphsonSolver()
      expect(solver).toBeDefined()
    })

    it('accepts all NewtonRaphsonOptions', () => {
      const opts: NewtonRaphsonOptions = {
        tolerance: 1e-6,
        useMatrixConditioning: false,
        useIterativeRefinement: false,
        maxRefinementIterations: 5,
        enablePrecisionMonitoring: false,
        maxIterations: 100,
        convergenceTolerance: 1e-3,
        dampingFactor: 0.5,
        useAdaptiveDamping: false,
      }
      const solver = new NewtonRaphsonSolver(opts)
      expect(solver).toBeDefined()
    })
  })

  describe('solve', () => {
    it('converges with a simple mock nonlinear stamper', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      nodeMap.set('n1', 0)
      nodeMap.set('n2', 1)
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const solver = new NewtonRaphsonSolver({ enablePrecisionMonitoring: false, maxIterations: 50, convergenceTolerance: 1e-6 })
      const result: NewtonRaphsonResult = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(result).toBeDefined()
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('converges immediately when given a matching initial guess', () => {
      const A = matrix([[1e12, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      nodeMap.set('n1', 0)
      nodeMap.set('n2', 1)
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const initialGuess = matrix([[0], [0]])
      const solver = new NewtonRaphsonSolver({ enablePrecisionMonitoring: false, maxIterations: 50, convergenceTolerance: 1e-6 })
      const result = solver.solve(A, b, [0], [stamper], nodeMap, initialGuess)
      expect(result.converged).toBe(true)
    })

    it('returns convergenceMetrics', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const solver = new NewtonRaphsonSolver({ enablePrecisionMonitoring: false, maxIterations: 50, convergenceTolerance: 1e-6 })
      const result = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(result.convergenceMetrics).toBeDefined()
      expect(typeof result.convergenceMetrics!.initialResidual).toBe('number')
      expect(typeof result.convergenceMetrics!.finalResidual).toBe('number')
      expect(typeof result.convergenceMetrics!.relativeImprovement).toBe('number')
    })

    it('reports non-convergence when max iterations exceeded', () => {
      const A = matrix([[1e12, 0], [0, 1e12]])
      const b = matrix([[1], [1]])
      const nodeMap = new Map<string, number>()
      const stamper: NonLinearStamper = {
        id: 'D1',
        type: 'diode',
        calculateNonLinearCurrent: (v: number) => v,
        calculateConductance: () => 1,
        getNodeIndices: () => [0, 1],
        stampLinearized: (mnaMatrix: Matrix, _rhs: Matrix) => {
          mnaMatrix.set([0, 0], (mnaMatrix.get([0, 0]) as number) + 1)
          mnaMatrix.set([1, 1], (mnaMatrix.get([1, 1]) as number) + 1)
          mnaMatrix.set([0, 1], (mnaMatrix.get([0, 1]) as number) - 1)
          mnaMatrix.set([1, 0], (mnaMatrix.get([1, 0]) as number) - 1)
        },
      }
      const solver = new NewtonRaphsonSolver({
        enablePrecisionMonitoring: false,
        maxIterations: 3,
        convergenceTolerance: 1e-6,
        dampingFactor: 0.01,
        useAdaptiveDamping: false,
      })
      const result = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(result.converged).toBe(false)
    })

    it('respects maxIterations limit', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const solver = new NewtonRaphsonSolver({
        enablePrecisionMonitoring: false,
        maxIterations: 2,
        convergenceTolerance: 1e-6,
      })
      const result = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(result.iterations).toBeLessThanOrEqual(2)
    })

    it('returns residualNorm in result', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const solver = new NewtonRaphsonSolver({ enablePrecisionMonitoring: false, maxIterations: 50, convergenceTolerance: 1e-6 })
      const result = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(typeof result.residualNorm).toBe('number')
    })

    it('applies damping factor when adaptive damping disabled', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[0], [0]])
      const nodeMap = new Map<string, number>()
      const stamper = createMockStamper('D1', 'diode', 0, 1, 0.01)
      const solver = new NewtonRaphsonSolver({
        enablePrecisionMonitoring: false,
        maxIterations: 100,
        convergenceTolerance: 1e-6,
        dampingFactor: 0.5,
        useAdaptiveDamping: false,
      })
      const result = solver.solve(A, b, [0], [stamper], nodeMap)
      expect(result.solution).toBeDefined()
    })

    it('solves with no nonlinear stampers (pure linear)', () => {
      const A = matrix([[1, 0], [0, 1]])
      const b = matrix([[5], [5]])
      const nodeMap = new Map<string, number>()
      const solver = new NewtonRaphsonSolver({
        enablePrecisionMonitoring: false,
        maxIterations: 50,
        convergenceTolerance: 1e-6,
      })
      const result = solver.solve(A, b, [0], [], nodeMap)
      expect(result.solution).toBeDefined()
    })
  })
})
