import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from '../shared'
import { getComponentDefinition } from '@/registry/components'
import type { Matrix } from 'mathjs'
import type { StampResult } from '../shared'

/**
 * Potentiometer component stamper - Models as two resistors in series with wiper tap
 */
export class PotentiometerStamper implements ComponentStamper {
  public id: string
  public type: string
  private totalResistance: number
  private wiperPosition: number // 0-100%
  private r1: number // Resistance from terminal1 to wiper
  private r2: number // Resistance from wiper to terminal2

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
    this.totalResistance = (component.properties?.totalResistance as number) || 10000
    this.wiperPosition = (component.properties?.wiperPosition as number) || 50 // Default to center

    // Calculate resistances: R1 = wiperPosition% of total, R2 = remaining
    this.r1 = (this.wiperPosition / 100) * this.totalResistance
    this.r2 = this.totalResistance - this.r1

    // Ensure minimum resistance to avoid numerical issues
    this.r1 = Math.max(this.r1, 1e-6)
    this.r2 = Math.max(this.r2, 1e-6)

    console.log(
      `Potentiometer ${this.id}: R1=${this.r1.toFixed(1)}Ω, R2=${this.r2.toFixed(1)}Ω (${this.wiperPosition}% position)`,
    )
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  private getNodeIndices(nodeMap: Map<string, number>): [number, number, number] {
    const definition = getComponentDefinition(this.component.type)!
    const n1 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[0].id))! // terminal1
    const n2 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[1].id))! // terminal2
    const nWiper = nodeMap.get(this.getTerminalId(this.component, definition.terminals[2].id))! // wiper
    return [n1, n2, nWiper]
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    const [n1, n2, nWiper] = this.getNodeIndices(nodeMap)

    // Stamp two resistors: R1 between terminal1 and wiper, R2 between wiper and terminal2
    const g1 = 1 / this.r1 // Conductance from terminal1 to wiper
    const g2 = 1 / this.r2 // Conductance from wiper to terminal2

    // R1 stamp: terminal1 to wiper
    mnaMatrix.set([n1, n1], (mnaMatrix.get([n1, n1]) as number) + g1)
    mnaMatrix.set([nWiper, nWiper], (mnaMatrix.get([nWiper, nWiper]) as number) + g1)
    mnaMatrix.set([n1, nWiper], (mnaMatrix.get([n1, nWiper]) as number) - g1)
    mnaMatrix.set([nWiper, n1], (mnaMatrix.get([nWiper, n1]) as number) - g1)

    // R2 stamp: wiper to terminal2
    mnaMatrix.set([nWiper, nWiper], (mnaMatrix.get([nWiper, nWiper]) as number) + g2)
    mnaMatrix.set([n2, n2], (mnaMatrix.get([n2, n2]) as number) + g2)
    mnaMatrix.set([nWiper, n2], (mnaMatrix.get([nWiper, n2]) as number) - g2)
    mnaMatrix.set([n2, nWiper], (mnaMatrix.get([n2, nWiper]) as number) - g2)

    console.log(
      `Potentiometer ${this.id}: G1=${g1.toExponential(3)}S, G2=${g2.toExponential(3)}S, nodes ${n1}-${nWiper}-${n2}`,
    )
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // Return current through R1 (terminal1 to wiper) as the main current
    const [n1, n2, nWiper] = this.getNodeIndices(nodeMap)
    const v1 = solution.get([n1, 0]) as number
    const vWiper = solution.get([nWiper, 0]) as number
    return (v1 - vWiper) / this.r1
  }
}
