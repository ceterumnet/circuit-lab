import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from '@/services/stampers/shared'
import { getComponentDefinition } from '@/registry/components'
import type { Matrix } from 'mathjs'
import type { StampResult } from '@/services/stampers/shared'

/**
 * Current source component stamper
 */
export class CurrentSourceStamper implements ComponentStamper {
  private current: number
  public id: string
  public type: string

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
    this.current = (component.properties?.current as number) || 0
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

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    _nextBranchIndex: number,
  ): StampResult {
    const [n1, n2] = this.getNodeIndices(nodeMap)

    // Current source MNA stamp - inject current into RHS vector
    // Current flows from n1 to n2 (out of positive terminal, into negative terminal)
    // KCL: I_out = -I_in, so we add current to positive node and subtract from negative node
    const _currentRhs = rhsVector.size()[0] as number

    // Add current injection to positive terminal (current flows out)
    rhsVector.set([n1, 0], (rhsVector.get([n1, 0]) as number) + this.current)

    // Subtract current injection from negative terminal (current flows in)
    rhsVector.set([n2, 0], (rhsVector.get([n2, 0]) as number) - this.current)

    console.log(`Current Source ${this.id}: I=${this.current}A, nodes ${n1}-${n2}, injected to RHS`)
    return { branchCurrents: [] } // Current sources don't introduce branch current variables
  }

  calculateCurrent(
    _solution: Matrix,
    _nodeMap: Map<string, number>,
    _branchCurrents: number[],
    _allStampers?: ComponentStamper[],
  ): number {
    // Current source current is fixed by definition
    return this.current
  }
}
