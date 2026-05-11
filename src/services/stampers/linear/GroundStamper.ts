import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from '@/services/stampers/shared'
import type { Matrix } from 'mathjs'
import type { StampResult } from '@/services/stampers/shared'

/**
 * Ground component stamper
 */
export class GroundStamper implements ComponentStamper {
  public id: string
  public type: string

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
  }

  stampDC(
    _mnaMatrix: Matrix,
    _rhsVector: Matrix,
    _nodeMap: Map<string, number>,
    _nextBranchIndex: number,
  ): StampResult {
    // Ground doesn't stamp anything - it's handled by setting ground node voltage to 0
    return { branchCurrents: [] }
  }

  calculateCurrent(
    _solution: Matrix,
    _nodeMap: Map<string, number>,
    _branchCurrents: number[],
    _allStampers?: ComponentStamper[],
  ): number {
    return 0 // Ground doesn't have current
  }
}
