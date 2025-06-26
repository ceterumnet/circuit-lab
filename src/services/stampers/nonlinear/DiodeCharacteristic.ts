/**
 * Diode I-V characteristic model for educational and analysis purposes
 * This class provides accurate diode behavior without the numerical issues
 * of integrating complex models directly into the MNA matrix
 */
export class DiodeCharacteristic {
  private saturationCurrent: number
  private thermalVoltage: number
  private emissionCoefficient: number

  constructor(saturationCurrent: number = 1e-15, emissionCoefficient: number = 1) {
    this.saturationCurrent = saturationCurrent
    this.thermalVoltage = 0.026 // 26mV at room temperature
    this.emissionCoefficient = emissionCoefficient
  }

  /**
   * Calculate diode current using Shockley equation
   * I = Is * (exp(V/(n*Vt)) - 1)
   */
  getCurrent(voltage: number): number {
    if (voltage < 0) {
      return -this.saturationCurrent // Simple reverse current
    }

    const expArg = voltage / (this.emissionCoefficient * this.thermalVoltage)

    // Clamp to prevent overflow, but use a much higher limit
    if (expArg > 50) {
      // For very large expArg, current is essentially (Is * exp(expArg))
      // Use a high but finite current to avoid infinity
      return this.saturationCurrent * Math.exp(50)
    }

    return this.saturationCurrent * (Math.exp(expArg) - 1)
  }

  /**
   * Calculate diode conductance (derivative of current)
   * dI/dV = (Is/(n*Vt)) * exp(V/(n*Vt))
   */
  getConductance(voltage: number): number {
    if (voltage < 0) {
      return 1e-12 // Small conductance in reverse bias
    }

    const expArg = voltage / (this.emissionCoefficient * this.thermalVoltage)

    // Clamp to prevent overflow, but use a much higher limit
    if (expArg > 50) {
      return (
        (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) * Math.exp(50)
      )
    }

    const conductance =
      (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) * Math.exp(expArg)
    return Math.max(conductance, 1e-12)
  }

  /**
   * Public getter for saturation current (for debugging and validation)
   */
  getSaturationCurrent(): number {
    return this.saturationCurrent
  }
}
