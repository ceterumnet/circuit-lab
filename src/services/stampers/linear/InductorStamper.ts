import type { CircuitComponent } from '@/types/components'
import { ResistiveStamper } from '../shared'

/**
 * Inductor component stamper for DC analysis
 * In DC steady state, inductors act as short circuits (zero impedance)
 * Uses very low resistance to model short circuit behavior
 */
export class InductorStamper extends ResistiveStamper {
  private inductance: number

  constructor(component: CircuitComponent) {
    const inductance = (component.properties?.inductance as number) || 1e-3

    // For DC analysis, inductors act as short circuits
    // Use very low resistance to approximate zero impedance
    const dcResistance = 1e-6 // 1μΩ - effectively short circuit

    super(component.id, component.type, component, dcResistance)
    this.inductance = inductance
  }

  /**
   * Get inductance value for future AC analysis
   */
  public getInductance(): number {
    return this.inductance
  }

  /**
   * Calculate impedance at given frequency (for future AC analysis)
   * Z_L = jωL
   * |Z_L| = ωL
   */
  public getImpedanceMagnitude(frequency: number): number {
    if (frequency <= 0) return 1e-6 // DC case: zero impedance
    const omega = 2 * Math.PI * frequency
    return omega * this.inductance
  }

  /**
   * Calculate impedance phase at given frequency (for future AC analysis)
   * Phase = +90° for inductors
   */
  public getImpedancePhase(frequency: number): number {
    if (frequency <= 0) return 0 // DC case
    return Math.PI / 2 // +90 degrees
  }
}
