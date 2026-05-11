/**
 * Complex MNA Solver - Extends Enhanced MNA Solver for AC Analysis
 * Handles complex number matrices for frequency domain circuit analysis
 * while maintaining compatibility with existing DC solver architecture
 */

import { Complex, ComplexMatrix } from './complex-math'
import type { SolverOptions } from './numerical-solver'
import { lusolve, matrix, Matrix, multiply, subtract, add } from 'mathjs'

/**
 * Complex solver result extending the existing SolverResult interface
 */
export interface ComplexSolverResult {
  /** Complex solution vector */
  solution: ComplexMatrix
  /** Condition number estimate */
  conditionNumber?: number
  /** Number of refinement iterations used */
  refinementIterations?: number
  /** Precision metrics */
  precisionMetrics?: {
    residualNorm: number
    relativeError: number
    significantDigits: number
  }
  /** Solve time in milliseconds */
  solveTime?: number
}

/**
 * Enhanced Complex MNA Solver
 * Solves complex linear systems Ax = b for AC circuit analysis
 * Uses decomposition approach: solve real and imaginary parts separately
 */
export class ComplexMNASolver {
  private options: Required<SolverOptions>

  constructor(options: SolverOptions = {}) {
    this.options = {
      tolerance: options.tolerance ?? 1e-12,
      useMatrixConditioning: options.useMatrixConditioning ?? true,
      useIterativeRefinement: options.useIterativeRefinement ?? true,
      maxRefinementIterations: options.maxRefinementIterations ?? 3,
      enablePrecisionMonitoring: options.enablePrecisionMonitoring ?? true,
    }
  }

  /**
   * Solve complex linear system Ax = b using decomposition method
   *
   * For complex system: (A_real + j*A_imag)(x_real + j*x_imag) = (b_real + j*b_imag)
   * Decompose into two real systems:
   * [A_real  -A_imag] [x_real]   [b_real]
   * [A_imag   A_real] [x_imag] = [b_imag]
   */
  solve(A: ComplexMatrix, b: ComplexMatrix): ComplexSolverResult {
    const startTime = performance.now()

    if (this.options.enablePrecisionMonitoring) {
      console.log('🔍 Complex MNA Solver - AC Analysis:')
      console.log(`  Matrix size: ${A.rows}x${A.cols}`)
      console.log(`  Complex decomposition method`)
    }

    // Extract real and imaginary parts
    const A_real = A.toRealArray()
    const A_imag = A.toImagArray()
    const b_real = b.toRealArray().map((row) => row[0]) // Convert to vector
    const b_imag = b.toImagArray().map((row) => row[0]) // Convert to vector

    const n = A.rows

    // Build decomposed real system: 2n x 2n
    // [A_real  -A_imag] [x_real]   [b_real]
    // [A_imag   A_real] [x_imag] = [b_imag]
    const decomposedMatrix: number[][] = Array(2 * n)
      .fill(null)
      .map(() => Array(2 * n).fill(0))
    const decomposedRHS: number[] = Array(2 * n).fill(0)

    // Fill the decomposed matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Top-left: A_real
        decomposedMatrix[i][j] = A_real[i][j]
        // Top-right: -A_imag
        decomposedMatrix[i][j + n] = -A_imag[i][j]
        // Bottom-left: A_imag
        decomposedMatrix[i + n][j] = A_imag[i][j]
        // Bottom-right: A_real
        decomposedMatrix[i + n][j + n] = A_real[i][j]
      }
    }

    // Fill the decomposed RHS
    for (let i = 0; i < n; i++) {
      decomposedRHS[i] = b_real[i]
      decomposedRHS[i + n] = b_imag[i]
    }

    // Solve the real system using mathjs
    let realSolution: number[]
    let conditionNumber: number | undefined
    let refinementIterations = 0

    try {
      const matrixMath = matrix(decomposedMatrix)
      const rhsMath = matrix(decomposedRHS.map((val) => [val])) // Column vector

      // Apply matrix conditioning if enabled
      if (this.options.useMatrixConditioning) {
        conditionNumber = this.estimateConditionNumber(matrixMath)
        if (this.options.enablePrecisionMonitoring) {
          console.log(`  Estimated condition number: ${conditionNumber?.toExponential(2)}`)
        }
      }

      // Solve using LU decomposition
      const solutionMath = lusolve(matrixMath, rhsMath) as Matrix
      realSolution = (solutionMath.toArray() as number[][]).map((row) => row[0])

      // Apply iterative refinement if enabled
      if (this.options.useIterativeRefinement) {
        const refinementResult = this.applyIterativeRefinement(
          matrixMath,
          rhsMath,
          matrix(realSolution.map((val) => [val])),
        )
        realSolution = (refinementResult.solution.toArray() as number[][]).map((row) => row[0])
        refinementIterations = refinementResult.iterations
      }
    } catch (error) {
      console.error('❌ Complex system solve failed:', error)
      throw new Error('Complex matrix is singular or ill-conditioned')
    }

    // Reconstruct complex solution
    const complexSolution = ComplexMatrix.zeros(n, 1)
    for (let i = 0; i < n; i++) {
      const real = realSolution[i]
      const imag = realSolution[i + n]
      complexSolution.set(i, 0, new Complex(real, imag))
    }

    // Calculate precision metrics
    let precisionMetrics: ComplexSolverResult['precisionMetrics']
    if (this.options.enablePrecisionMonitoring) {
      precisionMetrics = this.analyzePrecision(A, b, complexSolution)
    }

    const solveTime = performance.now() - startTime

    if (this.options.enablePrecisionMonitoring) {
      console.log(`  Refinement iterations: ${refinementIterations}`)
      console.log(`  Solve time: ${solveTime.toFixed(2)}ms`)
      if (precisionMetrics) {
        console.log(`  Complex residual norm: ${precisionMetrics.residualNorm.toExponential(2)}`)
        console.log(`  Significant digits: ~${precisionMetrics.significantDigits.toFixed(1)}`)
      }
    }

    return {
      solution: complexSolution,
      conditionNumber,
      refinementIterations,
      precisionMetrics,
      solveTime,
    }
  }

  /**
   * Alternative solve method using direct complex arithmetic
   * More accurate but slower than decomposition method
   */
  solveDirect(A: ComplexMatrix, b: ComplexMatrix): ComplexSolverResult {
    const startTime = performance.now()

    if (this.options.enablePrecisionMonitoring) {
      console.log('🔍 Complex MNA Solver - Direct Method:')
      console.log(`  Matrix size: ${A.rows}x${A.cols}`)
    }

    // Implement Gaussian elimination with partial pivoting for complex matrices
    const n = A.rows
    const augmented = this.createAugmentedMatrix(A, b)

    // Forward elimination with partial pivoting
    for (let k = 0; k < n; k++) {
      // Find pivot
      let maxRow = k
      let maxVal = augmented.get(k, k).magnitude()

      for (let i = k + 1; i < n; i++) {
        const val = augmented.get(i, k).magnitude()
        if (val > maxVal) {
          maxVal = val
          maxRow = i
        }
      }

      // Swap rows if needed
      if (maxRow !== k) {
        this.swapRows(augmented, k, maxRow)
      }

      // Check for singular matrix
      if (augmented.get(k, k).magnitude() < 1e-15) {
        throw new Error('Complex matrix is singular')
      }

      // Eliminate column
      for (let i = k + 1; i < n; i++) {
        const factor = augmented.get(i, k).divide(augmented.get(k, k))
        for (let j = k; j <= n; j++) {
          const newVal = augmented.get(i, j).subtract(factor.multiply(augmented.get(k, j)))
          augmented.set(i, j, newVal)
        }
      }
    }

    // Back substitution
    const solution = ComplexMatrix.zeros(n, 1)
    for (let i = n - 1; i >= 0; i--) {
      let sum = augmented.get(i, n) // RHS value
      for (let j = i + 1; j < n; j++) {
        sum = sum.subtract(augmented.get(i, j).multiply(solution.get(j, 0)))
      }
      solution.set(i, 0, sum.divide(augmented.get(i, i)))
    }

    const solveTime = performance.now() - startTime

    return {
      solution,
      solveTime,
    }
  }

  /**
   * Apply ground constraints to complex matrix system
   * Same logic as DC solver but for complex matrices
   */
  static applyGroundConstraints(
    mnaMatrix: ComplexMatrix,
    rhsVector: ComplexMatrix,
    groundNodeIndices: number[],
  ): void {
    for (const groundIndex of groundNodeIndices) {
      // Set ground node row to identity
      for (let j = 0; j < mnaMatrix.cols; j++) {
        if (j === groundIndex) {
          mnaMatrix.set(groundIndex, j, Complex.one())
        } else {
          mnaMatrix.set(groundIndex, j, Complex.zero())
        }
      }
      // Set ground node RHS to zero
      rhsVector.set(groundIndex, 0, Complex.zero())
    }
  }

  /**
   * Estimate condition number for complex matrix
   */
  private estimateConditionNumber(matrix: Matrix): number {
    const matrixArray = matrix.toArray() as number[][]
    const n = matrixArray.length

    // Simple row/column norm ratio estimate
    let maxRow = 0
    let minRow = Infinity

    for (let i = 0; i < n; i++) {
      const rowNorm = matrixArray[i].reduce((sum, val) => sum + Math.abs(val), 0)
      if (rowNorm > maxRow) maxRow = rowNorm
      if (rowNorm > 0 && rowNorm < minRow) minRow = rowNorm
    }

    return maxRow / (minRow || 1e-15)
  }

  /**
   * Apply iterative refinement to improve solution accuracy
   */
  private applyIterativeRefinement(
    A: Matrix,
    b: Matrix,
    initialSolution: Matrix,
  ): { solution: Matrix; iterations: number } {
    let solution = initialSolution
    let iterations = 0

    for (let iter = 0; iter < this.options.maxRefinementIterations; iter++) {
      // Calculate residual: r = b - A*x
      const Ax = multiply(A, solution) as Matrix
      const residual = subtract(b, Ax) as Matrix

      // Check convergence
      const residualNorm = this.calculateVectorNorm(residual)
      if (residualNorm < this.options.tolerance) {
        break
      }

      // Solve for correction: A*dx = r
      try {
        const correction = lusolve(A, residual) as Matrix
        solution = add(solution, correction) as Matrix
        iterations++
      } catch (_error) {
        // Refinement failed, return current solution
        break
      }
    }

    return { solution, iterations }
  }

  /**
   * Analyze precision of complex solution
   */
  private analyzePrecision(
    A: ComplexMatrix,
    b: ComplexMatrix,
    solution: ComplexMatrix,
  ): ComplexSolverResult['precisionMetrics'] {
    // Calculate residual: r = b - A*x
    const Ax = A.multiply(solution)
    const residual = ComplexMatrix.zeros(b.rows, 1)

    for (let i = 0; i < b.rows; i++) {
      residual.set(i, 0, b.get(i, 0).subtract(Ax.get(i, 0)))
    }

    // Calculate norms
    const residualNorm = this.calculateComplexVectorNorm(residual)
    const _solutionNorm = this.calculateComplexVectorNorm(solution)
    const rhsNorm = this.calculateComplexVectorNorm(b)

    const relativeError = rhsNorm > 0 ? residualNorm / rhsNorm : residualNorm
    const significantDigits = relativeError > 0 ? -Math.log10(relativeError) : 15

    return {
      residualNorm,
      relativeError,
      significantDigits: Math.max(0, Math.min(15, significantDigits)),
    }
  }

  /**
   * Calculate norm of complex vector
   */
  private calculateComplexVectorNorm(vector: ComplexMatrix): number {
    let sum = 0
    for (let i = 0; i < vector.rows; i++) {
      sum += vector.get(i, 0).magnitudeSquared()
    }
    return Math.sqrt(sum)
  }

  /**
   * Calculate norm of real vector (for compatibility)
   */
  private calculateVectorNorm(vector: Matrix): number {
    const vectorArray = vector.toArray() as number[][]
    let sum = 0
    for (let i = 0; i < vectorArray.length; i++) {
      sum += vectorArray[i][0] * vectorArray[i][0]
    }
    return Math.sqrt(sum)
  }

  /**
   * Create augmented matrix [A|b] for direct solving
   */
  private createAugmentedMatrix(A: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
    const augmented = new ComplexMatrix(A.rows, A.cols + 1)

    // Copy A
    for (let i = 0; i < A.rows; i++) {
      for (let j = 0; j < A.cols; j++) {
        augmented.set(i, j, A.get(i, j))
      }
    }

    // Copy b
    for (let i = 0; i < b.rows; i++) {
      augmented.set(i, A.cols, b.get(i, 0))
    }

    return augmented
  }

  /**
   * Swap two rows in matrix
   */
  private swapRows(matrix: ComplexMatrix, row1: number, row2: number): void {
    if (row1 === row2) return

    for (let j = 0; j < matrix.cols; j++) {
      const temp = matrix.get(row1, j)
      matrix.set(row1, j, matrix.get(row2, j))
      matrix.set(row2, j, temp)
    }
  }
}

/**
 * Complex matrix utilities for interfacing with existing stamper system
 */
export class ComplexMatrixUtils {
  /**
   * Convert real matrix to complex matrix (for DC components in AC analysis)
   */
  static realToComplex(realMatrix: Matrix | number[][]): ComplexMatrix {
    let arrayData: number[][]

    if (Array.isArray(realMatrix)) {
      arrayData = realMatrix
    } else {
      arrayData = realMatrix.toArray() as number[][]
    }

    return ComplexMatrix.fromRealMatrix(arrayData)
  }

  /**
   * Add complex impedance to existing real matrix
   * Used when stamping reactive components into MNA matrix
   */
  static stampComplexImpedance(
    matrix: ComplexMatrix,
    row: number,
    col: number,
    impedance: Complex,
  ): void {
    if (impedance.isZero()) return

    const admittance = Complex.one().divide(impedance)
    const existing = matrix.get(row, col)
    matrix.set(row, col, existing.add(admittance))
  }

  /**
   * Check if complex matrix is approximately real (for validation)
   */
  static isApproximatelyReal(matrix: ComplexMatrix, tolerance: number = 1e-12): boolean {
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        if (Math.abs(matrix.get(i, j).imag) > tolerance) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Extract DC solution from AC solution at f=0
   * Useful for verifying AC solver against DC solver
   */
  static extractDCResult(acResult: ComplexMatrix): Matrix {
    const dcArray: number[][] = []
    for (let i = 0; i < acResult.rows; i++) {
      dcArray.push([acResult.get(i, 0).real])
    }
    return matrix(dcArray)
  }
}
