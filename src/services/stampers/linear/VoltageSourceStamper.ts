import type { CircuitComponent } from '../../../types/components'
import type { ComponentStamper } from '@/services/stampers/shared'
import type { Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'
import type { StampResult } from '@/services/stampers/shared'

/**
 * Voltage source component stamper
 */
export class VoltageSourceStamper implements ComponentStamper {
  public voltage: number
  private branchIndex: number = -1
  public id: string
  public type: string

  constructor(public component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
    this.voltage = (component.properties?.voltage as number) || 0
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  private getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const definition = getComponentDefinition(this.component.type)!
    let n1 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[0].id))! // Positive
    let n2 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[1].id))! // Negative

    // Account for component rotation
    if (this.component.rotation === 180) {
      ;[n1, n2] = [n2, n1]
    }

    return [n1, n2]
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    const [n1, n2] = this.getNodeIndices(nodeMap)
    this.branchIndex = nextBranchIndex

    // Standard voltage source MNA stamp
    // B matrix (node equations)
    mnaMatrix.set([n1, this.branchIndex], 1)
    mnaMatrix.set([n2, this.branchIndex], -1)

    // C matrix (branch equations)
    mnaMatrix.set([this.branchIndex, n1], 1)
    mnaMatrix.set([this.branchIndex, n2], -1)

    // z vector (voltage constraint)
    rhsVector.set([this.branchIndex, 0], this.voltage)

    console.log(
      `Voltage Source ${this.id}: V=${this.voltage}V, nodes ${n1}-${n2}, branch ${this.branchIndex}`,
    )
    return { branchCurrents: [this.branchIndex] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // For voltage sources, current comes from the branch current variable
    // Use the branchCurrents parameter if available, otherwise fall back to branchIndex
    if (branchCurrents && branchCurrents.length > 0) {
      // Use the first branch current index (voltage sources only have one branch current)
      const branchIndex = branchCurrents[0]
      return solution.get([branchIndex, 0]) as number
    } else if (this.branchIndex >= 0) {
      // Fall back to stored branchIndex if branchCurrents not provided
      return solution.get([this.branchIndex, 0]) as number
    } else {
      // If neither is available, we can't calculate current
      throw new Error(
        `VoltageSourceStamper ${this.id}: Cannot calculate current - no branch index available`,
      )
    }
  }
}
