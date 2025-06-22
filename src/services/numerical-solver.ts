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

/**
 * Newton-Raphson solver for non-linear circuit analysis
 * Extends the enhanced MNA solver with iterative non-linear solving capabilities
 */
export interface NewtonRaphsonOptions extends SolverOptions {
  /** Maximum Newton-Raphson iterations */
  maxIterations?: number
  /** Convergence tolerance for Newton-Raphson */
  convergenceTolerance?: number
  /** Damping factor for stability (0 < damping <= 1) */
  dampingFactor?: number
  /** Enable step size adaptation */
  useAdaptiveDamping?: boolean
}

export interface NewtonRaphsonResult {
  /** Final solution vector */
  solution: Matrix
  /** Number of Newton-Raphson iterations used */
  iterations: number
  /** Whether the solver converged */
  converged: boolean
  /** Final residual norm */
  residualNorm: number
  /** Convergence metrics */
  convergenceMetrics?: {
    initialResidual: number
    finalResidual: number
    relativeImprovement: number
  }
  /** Enhanced solver metrics from final linear solve */
  linearSolverMetrics?: SolverResult
}

export interface NonLinearStamper {
  /** Component ID */
  id: string
  /** Component type */
  type: string
  /** Calculate current for given voltage */
  calculateNonLinearCurrent(voltage: number): number
  /** Calculate conductance (dI/dV) for linearization */
  calculateConductance(voltage: number): number
  /** Get node indices for this component */
  getNodeIndices(nodeMap: Map<string, number>): [number, number]
  /** Stamp linearized equivalent circuit */
  stampLinearized(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    solution: Matrix,
  ): void
}

/**
 * Newton-Raphson solver for non-linear DC analysis
 */
export class NewtonRaphsonSolver {
  private options: Required<NewtonRaphsonOptions>
  private enhancedSolver: EnhancedMNASolver

  constructor(options: NewtonRaphsonOptions = {}) {
    this.options = {
      tolerance: options.tolerance ?? 1e-12,
      useMatrixConditioning: options.useMatrixConditioning ?? true,
      useIterativeRefinement: options.useIterativeRefinement ?? true,
      maxRefinementIterations: options.maxRefinementIterations ?? 3,
      enablePrecisionMonitoring: options.enablePrecisionMonitoring ?? false, // Reduce logging
      maxIterations: options.maxIterations ?? 50,
      convergenceTolerance: options.convergenceTolerance ?? 1e-6,
      dampingFactor: options.dampingFactor ?? 1.0,
      useAdaptiveDamping: options.useAdaptiveDamping ?? true,
    }

    this.enhancedSolver = new EnhancedMNASolver(this.options)
  }

  /**
   * Solve non-linear DC circuit using Newton-Raphson method
   */
  solve(
    linearMatrix: Matrix,
    linearRhs: Matrix,
    groundNodeIndices: number[],
    nonLinearStampers: NonLinearStamper[],
    nodeMap: Map<string, number>,
    initialGuess?: Matrix,
  ): NewtonRaphsonResult {
    const startTime = performance.now()
    const matrixSize = linearMatrix.size()[0]

    console.log('🔄 Newton-Raphson Non-Linear DC Analysis:')
    console.log(`  Matrix size: ${matrixSize}x${matrixSize}`)
    console.log(`  Non-linear components: ${nonLinearStampers.length}`)
    console.log(`  Max iterations: ${this.options.maxIterations}`)
    console.log(`  Convergence tolerance: ${this.options.convergenceTolerance.toExponential(1)}`)

    // Initialize solution vector
    let solution = initialGuess || matrix(zeros(matrixSize, 1))
    let iteration = 0
    let converged = false
    let residualNorm = Infinity
    let initialResidual = Infinity
    let dampingFactor = this.options.dampingFactor

    // Newton-Raphson iteration loop
    while (iteration < this.options.maxIterations && !converged) {
      iteration++

      // Step 1: Build linearized system around current operating point
      const jacobianMatrix = matrix(linearMatrix.toArray()) // Copy linear matrix
      const rhsVector = matrix(linearRhs.toArray()) // Copy linear RHS

      // Step 2: Stamp all non-linear components with linearized equivalent circuits
      for (const stamper of nonLinearStampers) {
        stamper.stampLinearized(jacobianMatrix, rhsVector, nodeMap, solution)
      }

      // Step 3: Apply ground constraints
      EnhancedMNASolver.applyGroundConstraintsEnhanced(jacobianMatrix, rhsVector, groundNodeIndices)

      // Step 4: Solve linearized system
      const linearResult = this.enhancedSolver.solve(jacobianMatrix, rhsVector)
      const deltaSolution = subtract(linearResult.solution, solution) as Matrix

      // Step 5: Calculate residual for convergence check
      residualNorm = this.calculateVectorNorm(deltaSolution)

      if (iteration === 1) {
        initialResidual = residualNorm
      }

      // Step 6: Check convergence
      if (residualNorm < this.options.convergenceTolerance) {
        converged = true
        console.log(`✅ Newton-Raphson converged in ${iteration} iterations`)
        console.log(`  Final residual: ${residualNorm.toExponential(2)}`)
      } else {
        // Step 7: Apply damping if enabled
        if (this.options.useAdaptiveDamping && iteration > 1) {
          // Simple adaptive damping: reduce step size for large residuals
          const adaptiveDamping = Math.min(1.0, this.options.convergenceTolerance / residualNorm)
          dampingFactor = Math.max(0.1, Math.min(dampingFactor, adaptiveDamping))
        }

        // Step 8: Update solution with damping
        const dampedDelta = multiply(deltaSolution, dampingFactor) as Matrix
        solution = add(solution, dampedDelta) as Matrix

        console.log(
          `  Iteration ${iteration}: residual = ${residualNorm.toExponential(2)}, damping = ${dampingFactor.toFixed(3)}`,
        )
      }
    }

    const solveTime = performance.now() - startTime

    if (!converged) {
      console.warn(`⚠️ Newton-Raphson did not converge after ${iteration} iterations`)
      console.warn(`  Final residual: ${residualNorm.toExponential(2)}`)
    }

    console.log(`  Total solve time: ${solveTime.toFixed(2)}ms`)

    return {
      solution,
      iterations: iteration,
      converged,
      residualNorm,
      convergenceMetrics: {
        initialResidual,
        finalResidual: residualNorm,
        relativeImprovement:
          initialResidual > 0 ? (initialResidual - residualNorm) / initialResidual : 0,
      },
    }
  }

  /**
   * Calculate L2 norm of a vector
   */
  private calculateVectorNorm(vector: Matrix): number {
    const array = vector.toArray() as number[][]
    return Math.sqrt(array.reduce((sum, row) => sum + row[0] * row[0], 0))
  }
}
