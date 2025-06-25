import type { CircuitComponent } from '@/types/components'
import { Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'

/**
 * Result of component stamping operation
 */
export interface StampResult {
  branchCurrents: number[] // Indices of branch currents this component introduces
}

/**
 * Interface for component stamping into MNA matrices
 */
export interface ComponentStamper {
  id: string
  type: string
  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult
  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number
}

/**
 * Base class for resistive component stampers (resistors, wires)
 */
export abstract class ResistiveStamper implements ComponentStamper {
  constructor(
    public id: string,
    public type: string,
    public component: CircuitComponent,
    protected resistance: number,
  ) {}

  protected getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  protected getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const definition = getComponentDefinition(this.component.type)!
    const n1 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[0].id))!
    const n2 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[1].id))!
    return [n1, n2]
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    if (this.resistance <= 0) return { branchCurrents: [] }

    const [n1, n2] = this.getNodeIndices(nodeMap)

    // PURE MNA: Same-node connections don't need stamping (no voltage difference)
    if (n1 === n2) {
      console.log(`${this.type} ${this.id}: Same-node connection (${n1}-${n2}), no stamping needed`)
      return { branchCurrents: [] }
    }

    const g = 1 / this.resistance

    // Standard resistor stamp: G matrix modification
    mnaMatrix.set([n1, n1], (mnaMatrix.get([n1, n1]) as number) + g)
    mnaMatrix.set([n2, n2], (mnaMatrix.get([n2, n2]) as number) + g)
    mnaMatrix.set([n1, n2], (mnaMatrix.get([n1, n2]) as number) - g)
    mnaMatrix.set([n2, n1], (mnaMatrix.get([n2, n1]) as number) - g)

    console.log(`${this.type} ${this.id}: R=${this.resistance}Ω, G=${g}S, nodes ${n1}-${n2}`)
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    const [n1, n2] = this.getNodeIndices(nodeMap)

    // PURE MNA: Same-node connections carry zero current by definition
    if (n1 === n2) {
      console.log(`${this.type} ${this.id}: Same-node connection, current = 0A`)
      return 0
    }

    const v1 = solution.get([n1, 0]) as number
    const v2 = solution.get([n2, 0]) as number
    const current = (v1 - v2) / this.resistance
    console.log(
      `${this.type} ${this.id}: Pure MNA current = I = (${v1.toFixed(4)}V - ${v2.toFixed(4)}V) / ${this.resistance}Ω = ${current.toExponential(3)}A`,
    )
    return current
  }
}
