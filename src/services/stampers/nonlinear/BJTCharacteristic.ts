/**
 * BJT (Bipolar Junction Transistor) characteristic model
 * Implements simplified Ebers-Moll model for educational circuit simulation
 *
 * ARCHITECTURE: Similar to DiodeCharacteristic but with three terminals and current gain
 */
export class BJTCharacteristic {
  private saturationCurrent: number // Is - Base-emitter junction saturation current
  private currentGain: number // β (beta) - Current gain hFE
  private thermalVoltage: number // Vt - Thermal voltage (≈26mV at room temp)
  private vCESat: number // VCE saturation voltage (≈0.2V for silicon)

  constructor(
    saturationCurrent: number = 1e-14, // Typical NPN BJT
    currentGain: number = 100, // Typical β value
    thermalVoltage: number = 0.026, // 25°C thermal voltage
  ) {
    this.saturationCurrent = saturationCurrent
    this.currentGain = currentGain
    this.thermalVoltage = thermalVoltage
    this.vCESat = 0.2 // Silicon BJT saturation voltage
  }

  /**
   * Calculate base current using diode equation (base-emitter junction)
   * Ib = Is * (exp(Vbe/Vt) - 1)
   */
  getBaseCurrent(vBE: number): number {
    if (vBE < -10 * this.thermalVoltage) {
      // Reverse bias - very small reverse saturation current
      return -this.saturationCurrent
    }

    // Forward bias - exponential characteristic
    const exponential = Math.exp(vBE / this.thermalVoltage)
    return this.saturationCurrent * (exponential - 1)
  }

  /**
   * Calculate collector current based on operating region
   * Active region: Ic = β * Ib
   * Saturation region: Ic limited by circuit conditions
   */
  getCollectorCurrent(vBE: number, vCE: number): number {
    const ib = this.getBaseCurrent(vBE)

    // Check for cutoff region (base not forward biased)
    if (vBE < 0.6) {
      return this.saturationCurrent // Minimal leakage current
    }

    // Check for saturation region (VCE < VCE_sat)
    if (vCE < this.vCESat) {
      // In saturation, collector current is limited by external circuit
      // Return a reasonable saturation current
      return ib * this.currentGain * 0.8 // Reduced gain in saturation
    }

    // Active region - normal amplification
    return Math.max(0, ib * this.currentGain)
  }

  /**
   * Calculate base-emitter conductance (dIb/dVbe) for linearization
   */
  getBaseConductance(vBE: number): number {
    if (vBE < -10 * this.thermalVoltage) {
      return 1e-15 // Very small conductance in reverse bias
    }

    const exponential = Math.exp(vBE / this.thermalVoltage)
    return (this.saturationCurrent * exponential) / this.thermalVoltage
  }

  /**
   * Calculate collector-emitter conductance (dIc/dVce) for linearization
   * In active region, this is very small (high output resistance)
   */
  getCollectorConductance(vBE: number, vCE: number): number {
    // Check operating region
    if (vBE < 0.6) {
      return 1e-12 // Cutoff - very small conductance
    }

    if (vCE < this.vCESat) {
      // Saturation region - higher conductance
      return 1e-3 // 1mS - reasonable saturation resistance
    }

    // Active region - very high output resistance (small conductance)
    return 1e-6 // 1µS - high output resistance characteristic
  }

  /**
   * Determine BJT operating region for educational display
   */
  getOperatingRegion(vBE: number, vCE: number): string {
    if (vBE < 0.6) {
      return 'Cutoff'
    } else if (vCE < this.vCESat) {
      return 'Saturation'
    } else {
      return 'Active'
    }
  }

  // Getters for component properties
  get beta(): number {
    return this.currentGain
  }
  get Is(): number {
    return this.saturationCurrent
  }
  get Vt(): number {
    return this.thermalVoltage
  }
  get VCEsat(): number {
    return this.vCESat
  }
}
