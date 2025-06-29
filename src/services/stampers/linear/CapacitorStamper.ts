import type { CircuitComponent } from '@/types/components'
import { ResistiveStamper } from '../shared'

/**
 * Capacitor component stamper for DC analysis
 * In DC steady state, capacitors act as open circuits (infinite impedance)
 * Uses very high resistance to model open circuit behavior
 */
export class CapacitorStamper extends ResistiveStamper {
  private capacitance: number

  constructor(component: CircuitComponent) {
    const capacitance = (component.properties?.capacitance as number) || 1e-6

    // For DC analysis, capacitors act as open circuits
    // Use very high resistance to approximate infinite impedance
    const dcResistance = 1e12 // 1TΩ - effectively open circuit

    super(component.id, component.type, component, dcResistance)
    this.capacitance = capacitance
  }

  /**
   * Get capacitance value for future AC analysis
   */
  public getCapacitance(): number {
    return this.capacitance
  }

  /**
   * Calculate impedance at given frequency (for future AC analysis)
   * Z_C = 1/(jωC) = -j/(ωC)
   * |Z_C| = 1/(ωC)
   */
  public getImpedanceMagnitude(frequency: number): number {
    if (frequency <= 0) return 1e12 // DC case: infinite impedance
    const omega = 2 * Math.PI * frequency
    return 1 / (omega * this.capacitance)
  }

  /**
   * Calculate impedance phase at given frequency (for future AC analysis)
   * Phase = -90° for capacitors
   */
  public getImpedancePhase(frequency: number): number {
    if (frequency <= 0) return 0 // DC case
    return -Math.PI / 2 // -90 degrees
  }
}
