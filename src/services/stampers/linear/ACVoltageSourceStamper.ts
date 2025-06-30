import type { CircuitComponent } from '@/types/components'
import { VoltageSourceStamper } from './VoltageSourceStamper'
import type { Matrix } from 'mathjs'

/**
 * AC Voltage Source component stamper
 * Extends VoltageSourceStamper with AC-specific parameters
 *
 * For DC analysis: Uses amplitude as DC voltage value
 * For AC analysis: Uses amplitude, frequency, and phase for phasor analysis
 */
export class ACVoltageSourceStamper extends VoltageSourceStamper {
  private amplitude: number
  private frequency: number
  private phase: number // in degrees

  constructor(component: CircuitComponent) {
    const amplitude = (component.properties?.amplitude as number) || 5
    const frequency = (component.properties?.frequency as number) || 1000
    const phase = (component.properties?.phase as number) || 0

    // For DC analysis, use amplitude as the DC voltage
    super({ ...component, properties: { ...component.properties, voltage: amplitude } })

    this.amplitude = amplitude
    this.frequency = frequency
    this.phase = phase
  }

  /**
   * Get AC source parameters for AC analysis
   */
  public getACParameters(): {
    amplitude: number
    frequency: number
    phase: number
  } {
    return {
      amplitude: this.amplitude,
      frequency: this.frequency,
      phase: this.phase,
    }
  }

  /**
   * Get the phasor representation for AC analysis
   * V = A * e^(jφ) where A is amplitude and φ is phase
   */
  public getPhasor(): { magnitude: number; phase: number } {
    return {
      magnitude: this.amplitude,
      phase: (this.phase * Math.PI) / 180, // Convert degrees to radians
    }
  }

  /**
   * Get the effective DC voltage for DC analysis
   * For AC sources in DC analysis, we typically use 0V or the DC offset
   */
  public getDCVoltage(): number {
    // In DC analysis, AC sources typically have no DC component
    // Unless there's a DC offset (which we could add as a future enhancement)
    return 0
  }

  /**
   * Override stamp method to use DC voltage for DC analysis
   */
  public stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ) {
    // For DC analysis, temporarily set voltage to DC value
    const originalVoltage = this.voltage
    this.voltage = this.getDCVoltage()

    // Call parent stamping method
    const result = super.stampDC(mnaMatrix, rhsVector, nodeMap, nextBranchIndex)

    // Restore original voltage
    this.voltage = originalVoltage

    return result
  }

  /**
   * Check if this is an AC source (always true for AC sources)
   */
  public isACSource(): boolean {
    return true
  }

  /**
   * Get source type identifier
   */
  public getSourceType(): string {
    return 'ac_voltage'
  }
}
