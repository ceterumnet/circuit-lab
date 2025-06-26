import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper, StampResult } from '../shared'
import type { Matrix } from 'mathjs'

/**
 * Node component stamper - purely for connectivity, no electrical behavior
 */
export class NodeStamper implements ComponentStamper {
  public id: string
  public type: string

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    // Nodes are purely for connectivity - no stamping needed
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    return 0 // Nodes don't have current
  }
}
