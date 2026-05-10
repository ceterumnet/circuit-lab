import type { CircuitComponent } from '@/types/components'
import { Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'
import type { ComponentStamper, StampResult } from '../shared'
import type { NonLinearStamper } from '@/services/numerical-solver'
import { MOSFETCharacteristic } from './MOSFETCharacteristic'

/**
 * PMOS MOSFET stamper using simplified linearized approach
 * ARCHITECTURE: Gate draws ~0 current (infinite impedance), drain current computed
 * from Vsg/Vsd characteristics and stamped as a current source between source and drain
 *
 * Model: Shichman-Hodges square-law with channel length modulation (inverted polarities)
 * - Cutoff: Vsg < |Vth| → Id = 0
 * - Triode: Vsg >= |Vth|, Vsd < Vsg - |Vth| → Id = Kp * ((Vsg-|Vth|)*Vsd - 0.5*Vsd²) / (1 + λ*Vsd)
 * - Saturation: Vsg >= |Vth|, Vsd >= Vsg - |Vth| → Id = 0.5 * Kp * (Vsg-|Vth|)² * (1 + λ*Vsd)
 *
 * Current flows from source to drain (opposite of NMOS)
 */
export class PMOSStamper implements ComponentStamper, NonLinearStamper {
  public id: string
  public type: string
  protected mosfetCharacteristic: MOSFETCharacteristic
  protected operatingPoint: {
    vsg: number
    vsd: number
    id: number
    gm: number
  } | null = null
  protected cachedAllStampers: ComponentStamper[] | null = null
  protected parametersInitialized: boolean = false

  constructor(component: CircuitComponent) {
    this.id = component.id
    this.type = component.type

    const vThreshold = (component.properties?.vThreshold as number) || 1.0
    const kP = (component.properties?.kP as number) || 200e-6
    const lambda = (component.properties?.lambda as number) || 0.01

    this.mosfetCharacteristic = new MOSFETCharacteristic(vThreshold, kP, lambda)

    this.parametersInitialized = true
  }

  /**
   * Set reference to all circuit stampers for circuit analysis
   */
  setAllStampers(stampers: ComponentStamper[]): void {
    this.cachedAllStampers = stampers
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  /**
   * Get node indices for drain, gate, source
   */
  private getThreeTerminalNodes(nodeMap: Map<string, number>): [number, number, number] {
    const definition = getComponentDefinition(this.type)!
    const drainNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[0].id),
    )!
    const gateNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[1].id),
    )!
    const sourceNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[2].id),
    )!
    return [drainNode, gateNode, sourceNode]
  }

  /**
   * Two-terminal interface for NonLinearStamper compatibility
   * Gate draws ~0 current so we treat gate-source as the primary terminals
   */
  getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const [, gateNode, sourceNode] = this.getThreeTerminalNodes(nodeMap)
    return [gateNode, sourceNode]
  }

  /**
   * Calculate gate current (NonLinearStamper interface)
   * Gate current is ~0 for MOSFET (infinite impedance)
   */
  calculateNonLinearCurrent(_voltage: number): number {
    return 0
  }

  /**
   * Calculate gate-source conductance (NonLinearStamper interface)
   * Returns GMIN for numerical stability
   */
  calculateConductance(_voltage: number): number {
    return 1e-12
  }

  /**
   * Generate initial guess for gate-source voltage
   */
  generateInitialGuess(nodeMap: Map<string, number>): { voltage: number; current: number } | null {
    const [, _gateNode, _sourceNode] = this.getThreeTerminalNodes(nodeMap)

    if (nodeMap.has(this.getTerminalId({ id: this.id } as CircuitComponent, 'gate'))) {
      console.log(
        `🎯 PMOS ${this.id} Initial Guess: Vsg=0V (gate needs bias determination)`,
      )
      return { voltage: 0, current: 0 }
    }

    return null
  }

  /**
   * Main stamping method - reads Vsg/Vsd from solution and stamps drain current
   * For PMOS: Vsg = Vs - Vg, Vsd = Vs - Vd, current flows source → drain
   */
  stampLinearized(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    solution: Matrix,
    _allStampers?: ComponentStamper[],
  ): void {
    const [drainNode, gateNode, sourceNode] = this.getThreeTerminalNodes(nodeMap)

    const vG = solution.get([gateNode, 0]) as number
    const vS = solution.get([sourceNode, 0]) as number
    const vD = solution.get([drainNode, 0]) as number

    const vsg = vS - vG
    const vsd = vS - vD

    const id = this.mosfetCharacteristic.getDrainCurrent(vsg, vsd)
    const gm = this.mosfetCharacteristic.getTransconductance(vsg, vsd)
    const region = this.mosfetCharacteristic.getOperatingRegion(vsg, vsd)

    this.operatingPoint = { vsg, vsd, id, gm }

    // Cutoff: no current flows, skip stamping drain-source current source
    if (vsg < this.mosfetCharacteristic.Vth) {
      this.operatingPoint = { vsg, vsd, id: 0, gm: 0 }
      console.log(
        `PMOS ${this.id}: Cutoff detected (Vsg=${vsg.toFixed(4)}V < |Vth|=${this.mosfetCharacteristic.Vth}V)`,
      )

      // Still add GMIN for stability
      const GMIN = 1e-12
      mnaMatrix.set([gateNode, gateNode], (mnaMatrix.get([gateNode, gateNode]) as number) + GMIN)
      mnaMatrix.set(
        [sourceNode, sourceNode],
        (mnaMatrix.get([sourceNode, sourceNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [gateNode, sourceNode],
        (mnaMatrix.get([gateNode, sourceNode]) as number) - GMIN,
      )
      mnaMatrix.set(
        [sourceNode, gateNode],
        (mnaMatrix.get([sourceNode, gateNode]) as number) - GMIN,
      )
      mnaMatrix.set(
        [drainNode, drainNode],
        (mnaMatrix.get([drainNode, drainNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [sourceNode, sourceNode],
        (mnaMatrix.get([sourceNode, sourceNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [drainNode, sourceNode],
        (mnaMatrix.get([drainNode, sourceNode]) as number) - GMIN,
      )
      mnaMatrix.set(
        [sourceNode, drainNode],
        (mnaMatrix.get([sourceNode, drainNode]) as number) - GMIN,
      )

      return
    }

    // Stamp drain current as current source: for PMOS, current flows source → drain
    // Inject at source, extract at drain
    rhsVector.set([sourceNode, 0], (rhsVector.get([sourceNode, 0]) as number) - id)
    rhsVector.set([drainNode, 0], (rhsVector.get([drainNode, 0]) as number) + id)

    // Add GMIN conductance gate-to-source and drain-to-source for stability
    const GMIN = 1e-12

    mnaMatrix.set([gateNode, gateNode], (mnaMatrix.get([gateNode, gateNode]) as number) + GMIN)
    mnaMatrix.set(
      [sourceNode, sourceNode],
      (mnaMatrix.get([sourceNode, sourceNode]) as number) + GMIN,
    )
    mnaMatrix.set(
      [gateNode, sourceNode],
      (mnaMatrix.get([gateNode, sourceNode]) as number) - GMIN,
    )
    mnaMatrix.set(
      [sourceNode, gateNode],
      (mnaMatrix.get([sourceNode, gateNode]) as number) - GMIN,
    )

    mnaMatrix.set(
      [drainNode, drainNode],
      (mnaMatrix.get([drainNode, drainNode]) as number) + GMIN,
    )
    mnaMatrix.set(
      [sourceNode, sourceNode],
      (mnaMatrix.get([sourceNode, sourceNode]) as number) + GMIN,
    )
    mnaMatrix.set(
      [drainNode, sourceNode],
      (mnaMatrix.get([drainNode, sourceNode]) as number) - GMIN,
    )
    mnaMatrix.set(
      [sourceNode, drainNode],
      (mnaMatrix.get([sourceNode, drainNode]) as number) - GMIN,
    )

    console.log(
      `🔋 PMOS ${this.id}: ${region} - Vsg=${vsg.toFixed(4)}V, Vsd=${vsd.toFixed(4)}V, Id=${id.toExponential(3)}A, Gm=${gm.toExponential(3)}S`,
    )
  }

  /**
   * Linear DC stamping (unused for non-linear components)
   */
  stampDC(
    _mnaMatrix: Matrix,
    _rhsVector: Matrix,
    _nodeMap: Map<string, number>,
    _nextBranchIndex: number,
  ): StampResult {
    return { branchCurrents: [] }
  }

  /**
   * Calculate current from final solution
   * For PMOS, we return drain current as the main current
   */
  calculateCurrent(
    _solution: Matrix,
    _nodeMap: Map<string, number>,
    _branchCurrents: number[],
    _allStampers?: ComponentStamper[],
  ): number {
    return this.operatingPoint?.id || 0
  }

  /**
   * Get drain current for educational analysis
   */
  getDrainCurrent(): number {
    return this.operatingPoint?.id || 0
  }

  /**
   * Get operating region for educational display
   */
  getOperatingRegion(): string {
    if (!this.operatingPoint) return 'Cutoff'
    return this.mosfetCharacteristic.getOperatingRegion(
      this.operatingPoint.vsg,
      this.operatingPoint.vsd,
    )
  }

  /**
   * Get transconductance for educational analysis
   */
  getTransconductance(): number {
    return this.operatingPoint?.gm || 0
  }
}
