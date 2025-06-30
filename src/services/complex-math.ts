/**
 * Complex Number Mathematics for AC Circuit Analysis
 * Provides comprehensive complex number operations and matrix support
 * for frequency domain analysis in the MNA solver system
 */

export class Complex {
  public real: number
  public imag: number

  constructor(real: number = 0, imag: number = 0) {
    this.real = real
    this.imag = imag
  }

  // Static factory methods
  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase))
  }

  static fromReal(real: number): Complex {
    return new Complex(real, 0)
  }

  static fromImaginary(imag: number): Complex {
    return new Complex(0, imag)
  }

  static zero(): Complex {
    return new Complex(0, 0)
  }

  static one(): Complex {
    return new Complex(1, 0)
  }

  static j(): Complex {
    return new Complex(0, 1)
  }

  // Basic operations
  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag)
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag)
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real,
    )
  }

  divide(other: Complex): Complex {
    const denominator = other.real * other.real + other.imag * other.imag
    if (Math.abs(denominator) < 1e-15) {
      throw new Error('Division by zero in complex arithmetic')
    }
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator,
    )
  }

  // Scalar operations
  multiplyScalar(scalar: number): Complex {
    return new Complex(this.real * scalar, this.imag * scalar)
  }

  divideScalar(scalar: number): Complex {
    if (Math.abs(scalar) < 1e-15) {
      throw new Error('Division by zero in complex scalar arithmetic')
    }
    return new Complex(this.real / scalar, this.imag / scalar)
  }

  // Mathematical functions
  conjugate(): Complex {
    return new Complex(this.real, -this.imag)
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag)
  }

  phase(): number {
    return Math.atan2(this.imag, this.real)
  }

  magnitudeSquared(): number {
    return this.real * this.real + this.imag * this.imag
  }

  // Utility methods
  clone(): Complex {
    return new Complex(this.real, this.imag)
  }

  isReal(): boolean {
    return Math.abs(this.imag) < 1e-15
  }

  isImaginary(): boolean {
    return Math.abs(this.real) < 1e-15
  }

  isZero(): boolean {
    return Math.abs(this.real) < 1e-15 && Math.abs(this.imag) < 1e-15
  }

  equals(other: Complex, tolerance: number = 1e-12): boolean {
    return (
      Math.abs(this.real - other.real) < tolerance && Math.abs(this.imag - other.imag) < tolerance
    )
  }

  toString(): string {
    if (this.isReal()) return this.real.toFixed(6)
    if (this.isImaginary()) return `${this.imag.toFixed(6)}j`

    const sign = this.imag >= 0 ? '+' : '-'
    return `${this.real.toFixed(6)}${sign}${Math.abs(this.imag).toFixed(6)}j`
  }

  toEngineering(): string {
    const mag = this.magnitude()
    const phase = (this.phase() * 180) / Math.PI
    return `${mag.toExponential(3)} ∠ ${phase.toFixed(1)}°`
  }
}

/**
 * Complex Matrix operations for MNA system
 */
export class ComplexMatrix {
  private data: Complex[][]
  public readonly rows: number
  public readonly cols: number

  constructor(rows: number, cols: number, initialValue?: Complex) {
    this.rows = rows
    this.cols = cols
    this.data = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => initialValue?.clone() || Complex.zero()),
      )
  }

  // Factory methods
  static zeros(rows: number, cols: number): ComplexMatrix {
    return new ComplexMatrix(rows, cols, Complex.zero())
  }

  static identity(size: number): ComplexMatrix {
    const matrix = ComplexMatrix.zeros(size, size)
    for (let i = 0; i < size; i++) {
      matrix.set(i, i, Complex.one())
    }
    return matrix
  }

  static fromRealMatrix(realData: number[][]): ComplexMatrix {
    const rows = realData.length
    const cols = realData[0]?.length || 0
    const matrix = new ComplexMatrix(rows, cols)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        matrix.set(i, j, Complex.fromReal(realData[i][j] || 0))
      }
    }
    return matrix
  }

  // Access methods
  get(row: number, col: number): Complex {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Matrix index out of bounds: (${row}, ${col})`)
    }
    return this.data[row][col]
  }

  set(row: number, col: number, value: Complex): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Matrix index out of bounds: (${row}, ${col})`)
    }
    this.data[row][col] = value.clone()
  }

  // Mathematical operations
  add(other: ComplexMatrix): ComplexMatrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition')
    }

    const result = new ComplexMatrix(this.rows, this.cols)
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j).add(other.get(i, j)))
      }
    }
    return result
  }

  multiply(other: ComplexMatrix): ComplexMatrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication')
    }

    const result = new ComplexMatrix(this.rows, other.cols)
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = Complex.zero()
        for (let k = 0; k < this.cols; k++) {
          sum = sum.add(this.get(i, k).multiply(other.get(k, j)))
        }
        result.set(i, j, sum)
      }
    }
    return result
  }

  // Vector operations (for MNA RHS)
  multiplyVector(vector: ComplexMatrix): ComplexMatrix {
    if (vector.cols !== 1) {
      throw new Error('Second operand must be a column vector')
    }
    return this.multiply(vector)
  }

  // Utility methods
  clone(): ComplexMatrix {
    const result = new ComplexMatrix(this.rows, this.cols)
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j))
      }
    }
    return result
  }

  toArray(): Complex[][] {
    return this.data.map((row) => row.map((val) => val.clone()))
  }

  // Extract real and imaginary parts for interfacing with mathjs
  toRealArray(): number[][] {
    return this.data.map((row) => row.map((val) => val.real))
  }

  toImagArray(): number[][] {
    return this.data.map((row) => row.map((val) => val.imag))
  }

  toString(): string {
    let result = '[\n'
    for (let i = 0; i < this.rows; i++) {
      result += '  ['
      for (let j = 0; j < this.cols; j++) {
        result += this.get(i, j).toString()
        if (j < this.cols - 1) result += ', '
      }
      result += ']\n'
    }
    result += ']'
    return result
  }
}

/**
 * Complex impedance calculations for circuit components
 */
export class ComplexImpedance {
  /**
   * Calculate capacitor impedance: Z_C = 1/(jωC) = -j/(ωC)
   */
  static capacitor(capacitance: number, frequency: number): Complex {
    if (frequency <= 0) return new Complex(0, -1e12) // DC: infinite impedance
    const omega = 2 * Math.PI * frequency
    const reactance = -1 / (omega * capacitance)
    return new Complex(0, reactance)
  }

  /**
   * Calculate inductor impedance: Z_L = jωL
   */
  static inductor(inductance: number, frequency: number): Complex {
    if (frequency <= 0) return Complex.zero() // DC: zero impedance
    const omega = 2 * Math.PI * frequency
    const reactance = omega * inductance
    return new Complex(0, reactance)
  }

  /**
   * Calculate resistor impedance: Z_R = R (frequency independent)
   */
  static resistor(resistance: number): Complex {
    return Complex.fromReal(resistance)
  }

  /**
   * Calculate parallel impedance combination: 1/Z_total = 1/Z1 + 1/Z2 + ...
   */
  static parallel(impedances: Complex[]): Complex {
    if (impedances.length === 0) return Complex.zero()

    let admittanceSum = Complex.zero()
    for (const Z of impedances) {
      if (!Z.isZero()) {
        admittanceSum = admittanceSum.add(Complex.one().divide(Z))
      }
    }

    return admittanceSum.isZero() ? Complex.zero() : Complex.one().divide(admittanceSum)
  }

  /**
   * Calculate series impedance combination: Z_total = Z1 + Z2 + ...
   */
  static series(impedances: Complex[]): Complex {
    return impedances.reduce((sum, Z) => sum.add(Z), Complex.zero())
  }
}

/**
 * Engineering unit formatting for AC analysis results
 */
export class ComplexUnits {
  static formatVoltage(voltage: Complex): string {
    const mag = voltage.magnitude()
    const phase = (voltage.phase() * 180) / Math.PI

    if (mag >= 1000) return `${(mag / 1000).toFixed(3)} kV ∠ ${phase.toFixed(1)}°`
    if (mag >= 1) return `${mag.toFixed(3)} V ∠ ${phase.toFixed(1)}°`
    if (mag >= 0.001) return `${(mag * 1000).toFixed(3)} mV ∠ ${phase.toFixed(1)}°`
    return `${(mag * 1000000).toFixed(3)} μV ∠ ${phase.toFixed(1)}°`
  }

  static formatCurrent(current: Complex): string {
    const mag = current.magnitude()
    const phase = (current.phase() * 180) / Math.PI

    if (mag >= 1) return `${mag.toFixed(3)} A ∠ ${phase.toFixed(1)}°`
    if (mag >= 0.001) return `${(mag * 1000).toFixed(3)} mA ∠ ${phase.toFixed(1)}°`
    if (mag >= 0.000001) return `${(mag * 1000000).toFixed(3)} μA ∠ ${phase.toFixed(1)}°`
    return `${(mag * 1000000000).toFixed(3)} nA ∠ ${phase.toFixed(1)}°`
  }

  static formatImpedance(impedance: Complex): string {
    const mag = impedance.magnitude()
    const phase = (impedance.phase() * 180) / Math.PI

    if (mag >= 1000000) return `${(mag / 1000000).toFixed(3)} MΩ ∠ ${phase.toFixed(1)}°`
    if (mag >= 1000) return `${(mag / 1000).toFixed(3)} kΩ ∠ ${phase.toFixed(1)}°`
    if (mag >= 1) return `${mag.toFixed(3)} Ω ∠ ${phase.toFixed(1)}°`
    return `${(mag * 1000).toFixed(3)} mΩ ∠ ${phase.toFixed(1)}°`
  }
}
