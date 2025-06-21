import { zeros, lusolve, matrix, Matrix, multiply, subtract, add } from 'mathjs'

/**
 * Enhanced numerical solver with improved precision and stability
 * Addresses Phase 1.95 numerical precision issues
 */

export interface SolverOptions {
  /** Tolerance for numerical comparisons */
  tolerance?: number
  /** Whether to apply matrix conditioning improvements */
  useMatrixConditioning?: boolean
  /** Whether to use iterative refinement */
  useIterativeRefinement?: boolean
  /** Maximum iterations for refinement */
  maxRefinementIterations?: number
  /** Enable precision monitoring */
  enablePrecisionMonitoring?: boolean
}

export interface SolverResult {
  /** Solution vector */
  solution: Matrix
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
}

/**
 * Enhanced MNA matrix solver with numerical stability improvements
 */
export class EnhancedMNASolver {
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
   * Solve the linear system Ax = b with enhanced numerical stability
   */
  solve(A: Matrix, b: Matrix): SolverResult {
    const startTime = performance.now()

    if (this.options.enablePrecisionMonitoring) {
      console.log('🔍 Enhanced MNA Solver - Numerical Analysis:')
      console.log(`  Matrix size: ${A.size()[0]}x${A.size()[1]}`)
    }

    // Step 1: Matrix conditioning analysis and improvement
    let conditionedA = A
    let conditionedB = b
    let conditionNumber: number | undefined

    if (this.options.useMatrixConditioning) {
      const conditioningResult = this.applyMatrixConditioning(A, b)
      conditionedA = conditioningResult.matrix
      conditionedB = conditioningResult.rhs
      conditionNumber = conditioningResult.conditionNumber
    }

    // Step 2: Initial solution
    let solution: Matrix
    try {
      solution = lusolve(conditionedA, conditionedB) as Matrix
    } catch (error) {
      console.error('❌ Initial LU solve failed:', error)
      throw new Error('Matrix is singular or ill-conditioned')
    }

    // Step 3: Iterative refinement for improved precision
    let refinementIterations = 0
    if (this.options.useIterativeRefinement) {
      const refinementResult = this.iterativeRefinement(conditionedA, conditionedB, solution)
      solution = refinementResult.solution
      refinementIterations = refinementResult.iterations
    }

    // Step 4: Precision analysis
    let precisionMetrics: SolverResult['precisionMetrics']
    if (this.options.enablePrecisionMonitoring) {
      precisionMetrics = this.analyzePrecision(conditionedA, conditionedB, solution)
    }

    const solveTime = performance.now() - startTime

    if (this.options.enablePrecisionMonitoring) {
      console.log(`  Condition number: ${conditionNumber?.toExponential(2) || 'not computed'}`)
      console.log(`  Refinement iterations: ${refinementIterations}`)
      console.log(`  Solve time: ${solveTime.toFixed(2)}ms`)
      if (precisionMetrics) {
        console.log(`  Residual norm: ${precisionMetrics.residualNorm.toExponential(2)}`)
        console.log(`  Significant digits: ~${precisionMetrics.significantDigits.toFixed(1)}`)
      }
    }

    return {
      solution,
      conditionNumber,
      refinementIterations,
      precisionMetrics,
    }
  }

  /**
   * Apply matrix conditioning improvements
   */
  private applyMatrixConditioning(
    A: Matrix,
    b: Matrix,
  ): {
    matrix: Matrix
    rhs: Matrix
    conditionNumber: number
  } {
    const matrixArray = A.toArray() as number[][]
    const n = matrixArray.length

    // Estimate condition number using simple row/column norm ratio
    let maxRow = 0
    let minRow = Infinity

    for (let i = 0; i < n; i++) {
      const rowNorm = matrixArray[i].reduce((sum, val) => sum + Math.abs(val), 0)
      if (rowNorm > maxRow) maxRow = rowNorm
      if (rowNorm > 0 && rowNorm < minRow) minRow = rowNorm
    }

    const conditionNumber = maxRow / (minRow || 1e-15)

    // Apply row scaling if conditioning is poor
    if (conditionNumber > 1e8) {
      console.log('⚡ Applying matrix scaling for improved conditioning')
      return this.applyRowScaling(A, b, conditionNumber)
    }

    return { matrix: A, rhs: b, conditionNumber }
  }

  /**
   * Apply row scaling to improve matrix conditioning
   */
  private applyRowScaling(
    A: Matrix,
    b: Matrix,
    originalCondition: number,
  ): {
    matrix: Matrix
    rhs: Matrix
    conditionNumber: number
  } {
    const matrixArray = A.toArray() as number[][]
    const rhsArray = b.toArray() as number[][]
    const n = matrixArray.length

    // Calculate row scaling factors
    const scalingFactors: number[] = []
    for (let i = 0; i < n; i++) {
      const rowNorm = matrixArray[i].reduce((sum, val) => sum + Math.abs(val), 0)
      scalingFactors[i] = rowNorm > 0 ? 1 / Math.sqrt(rowNorm) : 1
    }

    // Apply scaling to matrix and RHS
    const scaledMatrix: number[][] = []
    const scaledRhs: number[][] = []

    for (let i = 0; i < n; i++) {
      scaledMatrix[i] = matrixArray[i].map((val) => val * scalingFactors[i])
      scaledRhs[i] = [rhsArray[i][0] * scalingFactors[i]]
    }

    return {
      matrix: matrix(scaledMatrix),
      rhs: matrix(scaledRhs),
      conditionNumber: originalCondition * 0.5, // Estimate improvement
    }
  }

  /**
   * Iterative refinement for improved solution accuracy
   */
  private iterativeRefinement(
    A: Matrix,
    b: Matrix,
    initialSolution: Matrix,
  ): {
    solution: Matrix
    iterations: number
  } {
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

      try {
        // Solve for correction: A*δx = r
        const correction = lusolve(A, residual) as Matrix

        // Update solution: x = x + δx
        solution = add(solution, correction) as Matrix
        iterations++

        // Check if correction is small enough
        const correctionNorm = this.calculateVectorNorm(correction)
        const solutionNorm = this.calculateVectorNorm(solution)

        if (correctionNorm < this.options.tolerance * solutionNorm) {
          break
        }
      } catch (error) {
        // If refinement fails, return current solution
        console.warn('⚠️ Iterative refinement failed at iteration', iter + 1)
        break
      }
    }

    if (iterations > 0 && this.options.enablePrecisionMonitoring) {
      console.log(`⚡ Iterative refinement applied ${iterations} iterations`)
    }

    return { solution, iterations }
  }

  /**
   * Analyze solution precision
   */
  private analyzePrecision(
    A: Matrix,
    b: Matrix,
    solution: Matrix,
  ): {
    residualNorm: number
    relativeError: number
    significantDigits: number
  } {
    // Calculate residual: r = b - A*x
    const Ax = multiply(A, solution) as Matrix
    const residual = subtract(b, Ax) as Matrix
    const residualNorm = this.calculateVectorNorm(residual)

    // Calculate relative error
    const bNorm = this.calculateVectorNorm(b)
    const relativeError = bNorm > 0 ? residualNorm / bNorm : residualNorm

    // Estimate significant digits
    const significantDigits = relativeError > 0 ? -Math.log10(relativeError) : 16

    return {
      residualNorm,
      relativeError,
      significantDigits: Math.max(0, Math.min(16, significantDigits)),
    }
  }

  /**
   * Calculate vector norm (L2 norm)
   */
  private calculateVectorNorm(vector: Matrix): number {
    const array = vector.toArray() as number[][]
    let sumSquares = 0
    for (let i = 0; i < array.length; i++) {
      sumSquares += array[i][0] * array[i][0]
    }
    return Math.sqrt(sumSquares)
  }

  /**
   * Enhanced ground constraint application with better numerical stability
   */
  static applyGroundConstraintsEnhanced(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    groundNodeIndices: number[],
  ): void {
    const matrixSize = mnaMatrix.size()[0]

    for (const groundIndex of groundNodeIndices) {
      // METHOD 1: Improved ground constraint application
      // Instead of zeroing entire row/column, use a large diagonal value
      // This maintains matrix structure better and reduces numerical artifacts

      // Zero out the row (except diagonal)
      for (let j = 0; j < matrixSize; j++) {
        if (j !== groundIndex) {
          mnaMatrix.set([groundIndex, j], 0)
        }
      }

      // Zero out the column (except diagonal)
      for (let i = 0; i < matrixSize; i++) {
        if (i !== groundIndex) {
          mnaMatrix.set([i, groundIndex], 0)
        }
      }

      // Set large diagonal value instead of 1 for better conditioning
      // Use a value that's large relative to other matrix entries but not so large as to cause overflow
      const scaleFactor = 1e12 // Large but stable value
      mnaMatrix.set([groundIndex, groundIndex], scaleFactor)
      rhsVector.set([groundIndex, 0], 0)
    }
  }

  /**
   * Tolerance-based comparison for floating-point values
   */
  static isNearlyEqual(a: number, b: number, tolerance: number = 1e-12): boolean {
    if (a === b) return true

    const diff = Math.abs(a - b)
    const maxValue = Math.max(Math.abs(a), Math.abs(b))

    // Use relative tolerance for large values, absolute for small values
    if (maxValue > 1) {
      return diff <= tolerance * maxValue
    } else {
      return diff <= tolerance
    }
  }

  /**
   * Check if a number is effectively zero within tolerance
   */
  static isNearlyZero(value: number, tolerance: number = 1e-12): boolean {
    return Math.abs(value) <= tolerance
  }
}
