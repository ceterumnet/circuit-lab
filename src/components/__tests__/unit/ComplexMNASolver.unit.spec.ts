/**
 * Complex MNA Solver Unit Tests
 * Validates complex number mathematics and AC circuit analysis capabilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Complex, ComplexMatrix, ComplexImpedance } from '@/services/complex-math'
import { ComplexMNASolver, ComplexMatrixUtils } from '@/services/complex-mna-solver'

describe('Complex Number Mathematics', () => {
  describe('Complex Class', () => {
    it('should create complex numbers correctly', () => {
      const z1 = new Complex(3, 4)
      expect(z1.real).toBe(3)
      expect(z1.imag).toBe(4)

      const z2 = Complex.fromPolar(5, Math.PI / 2)
      expect(z2.real).toBeCloseTo(0, 10)
      expect(z2.imag).toBeCloseTo(5, 10)
    })

    it('should perform basic complex arithmetic', () => {
      const z1 = new Complex(3, 4)
      const z2 = new Complex(1, 2)

      // Addition: (3+4j) + (1+2j) = (4+6j)
      const sum = z1.add(z2)
      expect(sum.real).toBe(4)
      expect(sum.imag).toBe(6)

      // Multiplication: (3+4j)(1+2j) = 3+6j+4j+8j² = -5+10j
      const product = z1.multiply(z2)
      expect(product.real).toBe(-5)
      expect(product.imag).toBe(10)

      // Division: (3+4j)/(1+2j)
      const quotient = z1.divide(z2)
      expect(quotient.real).toBeCloseTo(2.2, 10)
      expect(quotient.imag).toBeCloseTo(-0.4, 10)
    })

    it('should calculate magnitude and phase correctly', () => {
      const z = new Complex(3, 4)
      expect(z.magnitude()).toBe(5) // √(3²+4²) = 5
      expect(z.phase()).toBeCloseTo(Math.atan2(4, 3), 10)

      const zPure = Complex.j()
      expect(zPure.magnitude()).toBe(1)
      expect(zPure.phase()).toBeCloseTo(Math.PI / 2, 10)
    })
  })

  describe('Complex Impedance Calculations', () => {
    it('should calculate capacitor impedance correctly', () => {
      const capacitance = 1e-6 // 1μF
      const frequency = 1000 // 1kHz

      const Z_C = ComplexImpedance.capacitor(capacitance, frequency)

      // Z_C = 1/(j*2π*f*C) = -j/(2π*1000*1e-6) ≈ -j159.15
      expect(Z_C.real).toBeCloseTo(0, 10)
      expect(Z_C.imag).toBeCloseTo(-159.15, 1)
    })

    it('should calculate inductor impedance correctly', () => {
      const inductance = 1e-3 // 1mH
      const frequency = 1000 // 1kHz

      const Z_L = ComplexImpedance.inductor(inductance, frequency)

      // Z_L = j*2π*f*L = j*2π*1000*1e-3 ≈ j6.28
      expect(Z_L.real).toBeCloseTo(0, 10)
      expect(Z_L.imag).toBeCloseTo(6.28, 2)
    })
  })
})

describe('Complex MNA Solver', () => {
  let solver: ComplexMNASolver

  beforeEach(() => {
    solver = new ComplexMNASolver({
      enablePrecisionMonitoring: false, // Reduce console output during tests
    })
  })

  describe('Basic Solver Operations', () => {
    it('should solve simple real system (DC validation)', () => {
      // Test with real-only system to validate against DC solver
      // Simple resistor divider: [2 -1][V1] = [5]
      //                          [-1 1][V2]   [0]

      const A = ComplexMatrix.zeros(2, 2)
      A.set(0, 0, Complex.fromReal(2))
      A.set(0, 1, Complex.fromReal(-1))
      A.set(1, 0, Complex.fromReal(-1))
      A.set(1, 1, Complex.fromReal(1))

      const b = ComplexMatrix.zeros(2, 1)
      b.set(0, 0, Complex.fromReal(5))
      b.set(1, 0, Complex.fromReal(0))

      const result = solver.solve(A, b)

      // Expected: V1 = 5V, V2 = 5V (voltage divider)
      expect(result.solution.get(0, 0).real).toBeCloseTo(5, 6)
      expect(result.solution.get(1, 0).real).toBeCloseTo(5, 6)

      // Imaginary parts should be zero
      expect(result.solution.get(0, 0).imag).toBeCloseTo(0, 10)
      expect(result.solution.get(1, 0).imag).toBeCloseTo(0, 10)
    })

    it('should solve complex AC system', () => {
      // Simple AC circuit: R-C series with AC source
      // At 1kHz: R=100Ω, C=1μF → Z_C ≈ -j159Ω
      // Total impedance ≈ 100-j159Ω

      const R = 100
      const Z_C_imag = -159.15

      // Single node equation
      const A = ComplexMatrix.zeros(1, 1)
      const totalZ = new Complex(R, Z_C_imag)
      A.set(0, 0, Complex.one().divide(totalZ))

      const b = ComplexMatrix.zeros(1, 1)
      b.set(0, 0, Complex.fromReal(1)) // 1A current source

      const result = solver.solve(A, b)

      // Voltage should have both real and imaginary components
      const voltage = result.solution.get(0, 0)
      expect(voltage.magnitude()).toBeGreaterThan(0)
      expect(Math.abs(voltage.imag)).toBeGreaterThan(0) // Should have reactive component
    })
  })

  describe('Ground Constraints', () => {
    it('should apply ground constraints correctly', () => {
      const A = ComplexMatrix.identity(3)
      const b = ComplexMatrix.zeros(3, 1)
      b.set(0, 0, Complex.fromReal(5))
      b.set(1, 0, Complex.fromReal(3))
      b.set(2, 0, Complex.fromReal(1))

      // Apply ground constraint to node 1 (middle node)
      ComplexMNASolver.applyGroundConstraints(A, b, [1])

      // Check that row 1 is now [0 1 0] and RHS[1] = 0
      expect(A.get(1, 0).isZero()).toBe(true)
      expect(A.get(1, 1).equals(Complex.one())).toBe(true)
      expect(A.get(1, 2).isZero()).toBe(true)
      expect(b.get(1, 0).isZero()).toBe(true)
    })
  })
})

describe('Complex Matrix Utilities', () => {
  it('should convert real matrices to complex', () => {
    const realMatrix = [
      [1, 2],
      [3, 4],
    ]
    const complexMatrix = ComplexMatrixUtils.realToComplex(realMatrix)

    expect(complexMatrix.get(0, 0).real).toBe(1)
    expect(complexMatrix.get(0, 0).imag).toBe(0)
    expect(complexMatrix.get(1, 1).real).toBe(4)
    expect(complexMatrix.get(1, 1).imag).toBe(0)
  })

  it('should detect approximately real matrices', () => {
    const realMatrix = ComplexMatrix.fromRealMatrix([
      [1, 2],
      [3, 4],
    ])
    expect(ComplexMatrixUtils.isApproximatelyReal(realMatrix)).toBe(true)

    const complexMatrix = ComplexMatrix.zeros(2, 2)
    complexMatrix.set(0, 0, new Complex(1, 0.1))
    expect(ComplexMatrixUtils.isApproximatelyReal(complexMatrix)).toBe(false)
  })
})
