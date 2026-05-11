import { describe, it, expect, vi } from 'vitest'
import { Complex, ComplexImpedance, ComplexMatrix, ComplexUnits } from '../complex-math'

vi.mock('@/registry/components', () => ({
  getComponentDefinition: vi.fn(() => null),
}))

describe('Complex', () => {
  describe('magnitudeSquared()', () => {
    it('returns the sum of squares of real and imaginary parts', () => {
      const c = new Complex(3, 4)
      expect(c.magnitudeSquared()).toBe(25)
    })

    it('returns 0 for the zero complex', () => {
      expect(Complex.zero().magnitudeSquared()).toBe(0)
    })

    it('handles negative components', () => {
      const c = new Complex(-3, -4)
      expect(c.magnitudeSquared()).toBe(25)
    })
  })

  describe('toEngineering()', () => {
    it('formats 3+4j in exponential/polar notation', () => {
      const c = new Complex(3, 4)
      expect(c.toEngineering()).toBe('5.000e+0 \u2220 53.1\u00B0')
    })

    it('formats a pure real number', () => {
      const c = Complex.fromReal(100)
      expect(c.toEngineering()).toBe('1.000e+2 \u2220 0.0\u00B0')
    })

    it('formats a pure real number', () => {
      const c = Complex.fromReal(100)
      expect(c.toEngineering()).toBe('1.000e+2 \u2220 0.0\u00B0')
    })

    it('formats a pure real number', () => {
      const c = Complex.fromReal(100)
      expect(c.toEngineering()).toBe('1.000e+2 \u2220 0.0\u00B0')
    })

    it('handles negative phase angles', () => {
      const c = new Complex(1, -1)
      const result = c.toEngineering()
      expect(result).toContain('-45.0\u00B0')
    })
  })
})

describe('ComplexImpedance', () => {
  describe('capacitor()', () => {
    it('calculates impedance for normal frequency', () => {
      const C = 1e-6
      const f = 1000
      const Z = ComplexImpedance.capacitor(C, f)
      expect(Z.real).toBeCloseTo(0, 10)
      expect(Z.imag).toBeCloseTo(-1 / (2 * Math.PI * f * C), 10)
    })

    it('returns near-infinite impedance at DC (frequency=0)', () => {
      const Z = ComplexImpedance.capacitor(1e-6, 0)
      expect(Z.real).toBe(0)
      expect(Z.imag).toBe(-1e12)
    })

    it('returns near-infinite impedance for negative frequency', () => {
      const Z = ComplexImpedance.capacitor(1e-6, -100)
      expect(Z.real).toBe(0)
      expect(Z.imag).toBe(-1e12)
    })
  })

  describe('inductor()', () => {
    it('calculates impedance for normal frequency', () => {
      const L = 1e-3
      const f = 1000
      const Z = ComplexImpedance.inductor(L, f)
      expect(Z.real).toBeCloseTo(0, 10)
      expect(Z.imag).toBeCloseTo(2 * Math.PI * f * L, 10)
    })

    it('returns zero impedance at DC (frequency=0)', () => {
      const Z = ComplexImpedance.inductor(1e-3, 0)
      expect(Z.equals(Complex.zero())).toBe(true)
    })

    it('returns zero impedance for negative frequency', () => {
      const Z = ComplexImpedance.inductor(1e-3, -100)
      expect(Z.equals(Complex.zero())).toBe(true)
    })
  })

  describe('resistor()', () => {
    it('returns a pure real impedance equal to the resistance', () => {
      const Z = ComplexImpedance.resistor(470)
      expect(Z.real).toBe(470)
      expect(Z.imag).toBe(0)
      expect(Z.isReal()).toBe(true)
    })
  })

  describe('parallel()', () => {
    it('calculates parallel impedance of two impedances', () => {
      const Z1 = Complex.fromReal(100)
      const Z2 = Complex.fromReal(100)
      const Zp = ComplexImpedance.parallel([Z1, Z2])
      expect(Zp.real).toBeCloseTo(50, 10)
      expect(Zp.imag).toBeCloseTo(0, 10)
    })

    it('handles mixed real/imaginary impedances', () => {
      const Zr = Complex.fromReal(100)
      const Zc = new Complex(0, -100)
      const Zp = ComplexImpedance.parallel([Zr, Zc])
      const expected = Complex.one().divide(
        Complex.one().divide(Zr).add(Complex.one().divide(Zc)),
      )
      expect(Zp.equals(expected, 1e-10)).toBe(true)
    })

    it('returns zero for an empty array', () => {
      const Zp = ComplexImpedance.parallel([])
      expect(Zp.equals(Complex.zero())).toBe(true)
    })

    it('skips zero impedances without throwing', () => {
      const Zr = Complex.fromReal(50)
      const Zzero = Complex.zero()
      const Zp = ComplexImpedance.parallel([Zr, Zzero])
      expect(Zp.equals(Zr, 1e-10)).toBe(true)
    })

    it('returns zero when all impedances are zero', () => {
      const Zp = ComplexImpedance.parallel([Complex.zero(), Complex.zero()])
      expect(Zp.equals(Complex.zero())).toBe(true)
    })
  })

  describe('series()', () => {
    it('adds impedances together', () => {
      const Z1 = new Complex(100, 50)
      const Z2 = new Complex(200, -30)
      const Zs = ComplexImpedance.series([Z1, Z2])
      expect(Zs.real).toBeCloseTo(300, 10)
      expect(Zs.imag).toBeCloseTo(20, 10)
    })

    it('returns zero for an empty array', () => {
      const Zs = ComplexImpedance.series([])
      expect(Zs.equals(Complex.zero())).toBe(true)
    })

    it('handles a single impedance', () => {
      const Z1 = new Complex(42, 17)
      const Zs = ComplexImpedance.series([Z1])
      expect(Zs.equals(Z1)).toBe(true)
    })
  })
})

describe('ComplexUnits', () => {
  describe('formatVoltage()', () => {
    it('formats in kV for magnitudes >= 1000', () => {
      const v = Complex.fromPolar(5000, 0)
      expect(ComplexUnits.formatVoltage(v)).toBe('5.000 kV ∠ 0.0°')
    })

    it('formats in V for magnitudes >= 1', () => {
      const v = Complex.fromPolar(5, Math.PI / 3)
      const result = ComplexUnits.formatVoltage(v)
      expect(result).toContain(' V ∠')
      expect(result).toMatch(/^\d+\.\d{3}/)
    })

    it('formats in mV for magnitudes >= 0.001', () => {
      const v = Complex.fromPolar(0.003, -Math.PI / 4)
      expect(ComplexUnits.formatVoltage(v)).toContain('mV')
    })

    it('formats in μV for magnitudes < 0.001', () => {
      const v = Complex.fromPolar(0.00005, 0)
      expect(ComplexUnits.formatVoltage(v)).toContain('μV')
    })
  })

  describe('formatCurrent()', () => {
    it('formats in A for magnitudes >= 1', () => {
      const i = Complex.fromPolar(2, Math.PI / 6)
      expect(ComplexUnits.formatCurrent(i)).toContain(' A ∠')
    })

    it('formats in mA for magnitudes >= 0.001', () => {
      const i = Complex.fromPolar(0.005, 0)
      expect(ComplexUnits.formatCurrent(i)).toContain('mA')
    })

    it('formats in μA for magnitudes >= 1e-6', () => {
      const i = Complex.fromPolar(1e-5, Math.PI / 2)
      expect(ComplexUnits.formatCurrent(i)).toContain('μA')
    })

    it('formats in nA for magnitudes < 1e-6', () => {
      const i = Complex.fromPolar(1e-9, 0)
      expect(ComplexUnits.formatCurrent(i)).toContain('nA')
    })
  })

  describe('formatImpedance()', () => {
    it('formats in MΩ for magnitudes >= 1e6', () => {
      const Z = Complex.fromPolar(2e6, Math.PI / 4)
      expect(ComplexUnits.formatImpedance(Z)).toContain('MΩ')
    })

    it('formats in kΩ for magnitudes >= 1000', () => {
      const Z = Complex.fromPolar(5000, 0)
      expect(ComplexUnits.formatImpedance(Z)).toContain('kΩ')
    })

    it('formats in Ω for magnitudes >= 1', () => {
      const Z = Complex.fromPolar(470, -Math.PI / 6)
      const result = ComplexUnits.formatImpedance(Z)
      expect(result).toContain('Ω ∠')
      expect(result).not.toContain('kΩ')
      expect(result).not.toContain('mΩ')
    })

    it('formats in mΩ for magnitudes < 1', () => {
      const Z = Complex.fromPolar(0.05, 0)
      expect(ComplexUnits.formatImpedance(Z)).toContain('mΩ')
    })
  })
})

describe('ComplexMatrix', () => {
  describe('constructor', () => {
    it('creates a zero matrix', () => {
      const m = new ComplexMatrix(2, 3)
      expect(m.rows).toBe(2)
      expect(m.cols).toBe(3)
      expect(m.get(0, 0).isZero()).toBe(true)
      expect(m.get(1, 2).isZero()).toBe(true)
    })

    it('creates a matrix with initial value', () => {
      const init = new Complex(5, 6)
      const m = new ComplexMatrix(2, 2, init)
      expect(m.get(0, 0).equals(init)).toBe(true)
      expect(m.get(1, 1).equals(init)).toBe(true)
    })

    it('creates independent copies of initial value', () => {
      const init = new Complex(5, 6)
      const m = new ComplexMatrix(2, 2, init)
      init.real = 0
      expect(m.get(0, 0).real).toBe(5)
    })
  })

  describe('zeros()', () => {
    it('creates a zero-filled matrix', () => {
      const m = ComplexMatrix.zeros(2, 2)
      expect(m.rows).toBe(2)
      expect(m.cols).toBe(2)
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          expect(m.get(i, j).isZero()).toBe(true)
        }
      }
    })
  })

  describe('identity()', () => {
    it('creates an identity matrix', () => {
      const m = ComplexMatrix.identity(3)
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const val = i === j ? Complex.one() : Complex.zero()
          expect(m.get(i, j).equals(val)).toBe(true)
        }
      }
    })
  })

  describe('fromRealMatrix()', () => {
    it('converts a real 2D array to a complex matrix', () => {
      const m = ComplexMatrix.fromRealMatrix([
        [1, 2],
        [3, 4],
      ])
      expect(m.rows).toBe(2)
      expect(m.cols).toBe(2)
      expect(m.get(0, 0).real).toBe(1)
      expect(m.get(0, 1).real).toBe(2)
      expect(m.get(1, 0).real).toBe(3)
      expect(m.get(1, 1).real).toBe(4)
    })

    it('handles undefined values by treating them as 0', () => {
      const arr = [[1, undefined], [undefined, 4]] as unknown as number[][]
      const m = ComplexMatrix.fromRealMatrix(arr)
      expect(m.get(0, 1).real).toBe(0)
      expect(m.get(1, 0).real).toBe(0)
    })
  })

  describe('get() and set()', () => {
    it('sets and retrieves values correctly', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 1, new Complex(3, 4))
      const val = m.get(0, 1)
      expect(val.real).toBe(3)
      expect(val.imag).toBe(4)
    })

    it('clones values on set so internal data stays independent', () => {
      const m = new ComplexMatrix(2, 2)
      const val = new Complex(3, 4)
      m.set(0, 0, val)
      val.real = 999
      expect(m.get(0, 0).real).toBe(3)
    })

    it('get returns a reference that mutating it does not affect matrix', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(1, 1, new Complex(10, 20))
      const val = m.get(1, 1)
      expect(val.real).toBe(10)
    })

    it('throws on out-of-bounds get row', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.get(2, 0)).toThrow('Matrix index out of bounds')
    })

    it('throws on out-of-bounds get col', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.get(0, 2)).toThrow('Matrix index out of bounds')
    })

    it('throws on negative index get', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.get(-1, 0)).toThrow('Matrix index out of bounds')
    })

    it('throws on out-of-bounds set row', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.set(2, 0, Complex.one())).toThrow('Matrix index out of bounds')
    })

    it('throws on out-of-bounds set col', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.set(0, 2, Complex.one())).toThrow('Matrix index out of bounds')
    })

    it('throws on negative index set', () => {
      const m = new ComplexMatrix(2, 2)
      expect(() => m.set(-1, 0, Complex.one())).toThrow('Matrix index out of bounds')
    })
  })

  describe('add()', () => {
    it('adds two matrices of the same dimensions', () => {
      const a = new ComplexMatrix(2, 2)
      a.set(0, 0, new Complex(1, 2))
      a.set(0, 1, new Complex(3, 4))
      a.set(1, 0, new Complex(5, 6))
      a.set(1, 1, new Complex(7, 8))

      const b = new ComplexMatrix(2, 2)
      b.set(0, 0, new Complex(10, 20))
      b.set(0, 1, new Complex(30, 40))
      b.set(1, 0, new Complex(50, 60))
      b.set(1, 1, new Complex(70, 80))

      const c = a.add(b)
      expect(c.get(0, 0).equals(new Complex(11, 22))).toBe(true)
      expect(c.get(0, 1).equals(new Complex(33, 44))).toBe(true)
      expect(c.get(1, 0).equals(new Complex(55, 66))).toBe(true)
      expect(c.get(1, 1).equals(new Complex(77, 88))).toBe(true)
    })

    it('does not mutate the original matrices', () => {
      const a = new ComplexMatrix(2, 2)
      a.set(0, 0, new Complex(1, 2))
      const b = new ComplexMatrix(2, 2)
      b.set(0, 0, new Complex(3, 4))
      const c = a.add(b)
      expect(a.get(0, 0).real).toBe(1)
      expect(b.get(0, 0).real).toBe(3)
      expect(c.get(0, 0).real).toBe(4)
    })

    it('throws on dimension mismatch (different rows)', () => {
      const a = new ComplexMatrix(2, 2)
      const b = new ComplexMatrix(3, 2)
      expect(() => a.add(b)).toThrow('Matrix dimensions must match for addition')
    })

    it('throws on dimension mismatch (different cols)', () => {
      const a = new ComplexMatrix(2, 2)
      const b = new ComplexMatrix(2, 3)
      expect(() => a.add(b)).toThrow('Matrix dimensions must match for addition')
    })
  })

  describe('multiply()', () => {
    it('multiplies two compatible matrices', () => {
      const a = new ComplexMatrix(2, 3)
      a.set(0, 0, new Complex(1, 0))
      a.set(0, 1, new Complex(2, 0))
      a.set(0, 2, new Complex(3, 0))
      a.set(1, 0, new Complex(4, 0))
      a.set(1, 1, new Complex(5, 0))
      a.set(1, 2, new Complex(6, 0))

      const b = new ComplexMatrix(3, 2)
      b.set(0, 0, new Complex(7, 0))
      b.set(0, 1, new Complex(8, 0))
      b.set(1, 0, new Complex(9, 0))
      b.set(1, 1, new Complex(10, 0))
      b.set(2, 0, new Complex(11, 0))
      b.set(2, 1, new Complex(12, 0))

      const c = a.multiply(b)
      expect(c.rows).toBe(2)
      expect(c.cols).toBe(2)
      expect(c.get(0, 0).real).toBe(58)
      expect(c.get(0, 1).real).toBe(64)
      expect(c.get(1, 0).real).toBe(139)
      expect(c.get(1, 1).real).toBe(154)
    })

    it('multiplies complex-valued matrices', () => {
      const a = new ComplexMatrix(2, 2)
      a.set(0, 0, new Complex(1, 1))
      a.set(0, 1, Complex.zero())
      a.set(1, 0, Complex.zero())
      a.set(1, 1, new Complex(1, 1))

      const b = new ComplexMatrix(2, 2)
      b.set(0, 0, new Complex(2, -1))
      b.set(0, 1, Complex.zero())
      b.set(1, 0, Complex.zero())
      b.set(1, 1, new Complex(2, -1))

      const c = a.multiply(b)
      expect(c.get(0, 0).equals(new Complex(3, 1))).toBe(true)
      expect(c.get(1, 1).equals(new Complex(3, 1))).toBe(true)
      expect(c.get(0, 1).isZero()).toBe(true)
    })

    it('multiplies with identity matrix', () => {
      const a = new ComplexMatrix(2, 2)
      a.set(0, 0, new Complex(1, 2))
      a.set(0, 1, new Complex(3, 4))
      a.set(1, 0, new Complex(5, 6))
      a.set(1, 1, new Complex(7, 8))

      const I = ComplexMatrix.identity(2)
      const c = a.multiply(I)
      expect(c.get(0, 0).equals(new Complex(1, 2))).toBe(true)
      expect(c.get(1, 1).equals(new Complex(7, 8))).toBe(true)
    })

    it('throws on incompatible dimensions', () => {
      const a = new ComplexMatrix(2, 3)
      const b = new ComplexMatrix(2, 2)
      expect(() => a.multiply(b)).toThrow('Matrix dimensions incompatible for multiplication')
    })
  })

  describe('multiplyVector()', () => {
    it('multiplies matrix by a column vector', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, Complex.fromReal(1))
      m.set(0, 1, Complex.fromReal(2))
      m.set(1, 0, Complex.fromReal(3))
      m.set(1, 1, Complex.fromReal(4))

      const v = new ComplexMatrix(2, 1)
      v.set(0, 0, Complex.fromReal(5))
      v.set(1, 0, Complex.fromReal(6))

      const result = m.multiplyVector(v)
      expect(result.rows).toBe(2)
      expect(result.cols).toBe(1)
      expect(result.get(0, 0).real).toBe(17)
      expect(result.get(1, 0).real).toBe(39)
    })

    it('throws when operand is not a column vector', () => {
      const m = new ComplexMatrix(2, 2)
      const v = new ComplexMatrix(2, 2)
      expect(() => m.multiplyVector(v)).toThrow('Second operand must be a column vector')
    })
  })

  describe('clone()', () => {
    it('creates a deep copy of the matrix', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      m.set(1, 1, new Complex(3, 4))

      const c = m.clone()
      expect(c.get(0, 0).equals(new Complex(1, 2))).toBe(true)
      expect(c.get(1, 1).equals(new Complex(3, 4))).toBe(true)
      expect(c !== m).toBe(true)
    })

    it('cloned matrix is independent of the original', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      const c = m.clone()
      c.set(0, 0, new Complex(99, 99))
      expect(m.get(0, 0).real).toBe(1)
      expect(m.get(0, 0).imag).toBe(2)
      expect(c.get(0, 0).real).toBe(99)
    })
  })

  describe('toArray()', () => {
    it('returns a 2D array of complex values', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      m.set(0, 1, new Complex(3, 4))
      m.set(1, 0, new Complex(5, 6))
      m.set(1, 1, new Complex(7, 8))

      const arr = m.toArray()
      expect(arr.length).toBe(2)
      expect(arr[0].length).toBe(2)
      expect(arr[0][0].equals(new Complex(1, 2))).toBe(true)
      expect(arr[1][1].equals(new Complex(7, 8))).toBe(true)
    })

    it('returns a deep clone — mutations on the returned array do not affect the matrix', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      const arr = m.toArray()
      arr[0][0] = new Complex(99, 99)
      expect(m.get(0, 0).real).toBe(1)
    })

    it('returns cloned Complex instances so mutating them does not affect the matrix', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      const arr = m.toArray()
      arr[0][0].real = 999
      expect(m.get(0, 0).real).toBe(1)
    })
  })

  describe('toRealArray()', () => {
    it('extracts real parts into a 2D number array', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      m.set(0, 1, new Complex(3, 4))
      m.set(1, 0, new Complex(5, 6))
      m.set(1, 1, new Complex(7, 8))

      const arr = m.toRealArray()
      expect(arr[0][0]).toBe(1)
      expect(arr[0][1]).toBe(3)
      expect(arr[1][0]).toBe(5)
      expect(arr[1][1]).toBe(7)
    })
  })

  describe('toImagArray()', () => {
    it('extracts imaginary parts into a 2D number array', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, new Complex(1, 2))
      m.set(0, 1, new Complex(3, 4))
      m.set(1, 0, new Complex(5, 6))
      m.set(1, 1, new Complex(7, 8))

      const arr = m.toImagArray()
      expect(arr[0][0]).toBe(2)
      expect(arr[0][1]).toBe(4)
      expect(arr[1][0]).toBe(6)
      expect(arr[1][1]).toBe(8)
    })
  })

  describe('toString()', () => {
    it('returns a formatted string representation', () => {
      const m = new ComplexMatrix(2, 2)
      m.set(0, 0, Complex.fromReal(1))
      m.set(0, 1, Complex.fromReal(2))
      m.set(1, 0, Complex.fromReal(3))
      m.set(1, 1, Complex.fromReal(4))

      const s = m.toString()
      expect(s).toContain('1.000000')
      expect(s).toContain('2.000000')
      expect(s).toContain('3.000000')
      expect(s).toContain('4.000000')
      expect(s[0]).toBe('[')
      expect(s[s.length - 1]).toBe(']')
    })

    it('includes commas between elements', () => {
      const m = new ComplexMatrix(1, 3)
      m.set(0, 0, Complex.fromReal(1))
      m.set(0, 1, Complex.fromReal(2))
      m.set(0, 2, Complex.fromReal(3))

      const s = m.toString()
      expect(s).toMatch(/1\.000000,\s*2\.000000,\s*3\.000000/)
      expect(s).toContain(',')
    })

    it('formats newline separated rows', () => {
      const m = new ComplexMatrix(3, 1)
      m.set(0, 0, Complex.fromReal(1))
      m.set(1, 0, Complex.fromReal(2))
      m.set(2, 0, Complex.fromReal(3))

      const s = m.toString()
      const lines = s.split('\n')
      const innerRows = lines.filter((r) => r.startsWith('  ['))
      expect(innerRows.length).toBe(3)
    })

    it('handles complex values in string output', () => {
      const m = new ComplexMatrix(1, 1)
      m.set(0, 0, new Complex(1, -2))

      const s = m.toString()
      expect(s).toContain('j')
    })
  })
})
