import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from '@/services/stampers/shared'
import { getComponentDefinition } from '@/registry/components'
import type { Matrix } from 'mathjs'
import type { StampResult } from '@/services/stampers/shared'

/**
 * AC Current Source component stamper
 * Implements ComponentStamper with AC-specific parameters
 *
 * For DC analysis: Uses 0A (AC sources have no DC component)
 * For AC analysis: Uses amplitude, frequency, and phase for phasor analysis
 */
export class ACCurrentSourceStamper implements ComponentStamper {
  public id: string
  public type: string
  private amplitude: number
  private frequency: number
  private phase: number // in degrees

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
    this.amplitude = (component.properties?.amplitude as number) || 0.001
    this.frequency = (component.properties?.frequency as number) || 1000
    this.phase = (component.properties?.phase as number) || 0
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  private getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const definition = getComponentDefinition(this.component.type)!
    let n1 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[0].id))! // Positive (current flows out)
    let n2 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[1].id))! // Negative (current flows in)

    // Account for component rotation
    if (this.component.rotation === 180) {
      ;[n1, n2] = [n2, n1]
    }

    return [n1, n2]
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
   * I = A * e^(jφ) where A is amplitude and φ is phase
   */
  public getPhasor(): { magnitude: number; phase: number } {
    return {
      magnitude: this.amplitude,
      phase: (this.phase * Math.PI) / 180, // Convert degrees to radians
    }
  }

  /**
   * Get the effective DC current for DC analysis
   * For AC sources in DC analysis, we typically use 0A
   */
  public getDCCurrent(): number {
    return 0 // AC sources have no DC component
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    _nextBranchIndex: number,
  ): StampResult {
    const [n1, n2] = this.getNodeIndices(nodeMap)
    const dcCurrent = this.getDCCurrent()

    // Current source MNA stamp - inject current into RHS vector
    // Current flows from n1 to n2 (out of positive terminal, into negative terminal)
    // KCL: I_out = -I_in, so we add current to positive node and subtract from negative node

    // Add current injection to positive terminal (current flows out)
    rhsVector.set([n1, 0], (rhsVector.get([n1, 0]) as number) + dcCurrent)

    // Subtract current injection from negative terminal (current flows in)
    rhsVector.set([n2, 0], (rhsVector.get([n2, 0]) as number) - dcCurrent)

    console.log(
      `AC Current Source ${this.id}: DC I=${dcCurrent}A, AC I=${this.amplitude}A@${this.frequency}Hz, nodes ${n1}-${n2}`,
    )
    return { branchCurrents: [] } // Current sources don't introduce branch current variables
  }

  calculateCurrent(
    _solution: Matrix,
    _nodeMap: Map<string, number>,
    _branchCurrents: number[],
    _allStampers?: ComponentStamper[],
  ): number {
    // For DC analysis, return the DC current (0 for AC sources)
    // For AC analysis, this would return the phasor magnitude
    return this.getDCCurrent()
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
    return 'ac_current'
  }
}
