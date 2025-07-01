import type { CircuitComponent } from '@/types/components'
import { Matrix, matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'
import type { ComponentStamper, StampResult } from '../shared'
import type { NonLinearStamper } from '@/services/numerical-solver'
import { BJTCharacteristic } from './BJTCharacteristic'
import { DiodeCharacteristic } from './DiodeCharacteristic'
import { LoadLineIntersection } from './LoadLineIntersection'

/**
 * NPN BJT stamper using Load Line Intersection approach
 * ARCHITECTURE: Extends proven diode approach to three-terminal transistor
 *
 * Model: Base-emitter junction as diode + Current controlled collector current
 * Uses load line intersection for base-emitter, then calculates collector current
 */
export class BJTStamper implements ComponentStamper, NonLinearStamper {
  public id: string
  public type: string
  protected bjtCharacteristic: BJTCharacteristic
  protected baseEmitterDiode: DiodeCharacteristic
  protected operatingPoint: {
    vBE: number
    vCE: number
    ib: number
    ic: number
    ie: number
  } | null = null
  protected cachedAllStampers: ComponentStamper[] | null = null
  protected parametersInitialized: boolean = false

  constructor(component: CircuitComponent) {
    this.id = component.id
    this.type = component.type

    // Extract BJT parameters with realistic defaults
    const saturationCurrent = (component.properties?.saturationCurrent as number) || 1e-14
    const currentGain = (component.properties?.currentGain as number) || 100

    // Initialize BJT characteristic model
    this.bjtCharacteristic = new BJTCharacteristic(saturationCurrent, currentGain)

    // Create base-emitter diode characteristic for load line intersection
    // Base-emitter junction behaves like a diode
    this.baseEmitterDiode = new DiodeCharacteristic(saturationCurrent, 1.0)

    this.parametersInitialized = true // BJTs use explicit parameters
  }

  /**
   * Set reference to all circuit stampers for circuit analysis
   */
  setAllStampers(stampers: ComponentStamper[]): void {
    this.cachedAllStampers = stampers
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  /**
   * Get node indices for collector, base, emitter (internal method)
   */
  private getThreeTerminalNodes(nodeMap: Map<string, number>): [number, number, number] {
    const definition = getComponentDefinition(this.type)!
    const collectorNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[0].id),
    )!
    const baseNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[1].id),
    )!
    const emitterNode = nodeMap.get(
      this.getTerminalId({ id: this.id } as CircuitComponent, definition.terminals[2].id),
    )!
    return [collectorNode, baseNode, emitterNode]
  }

  /**
   * Two-terminal interface for NonLinearStamper compatibility
   * Treats base-emitter as the primary non-linear element
   */
  getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const [, baseNode, emitterNode] = this.getThreeTerminalNodes(nodeMap)
    return [baseNode, emitterNode]
  }

  /**
   * Calculate base current (NonLinearStamper interface)
   */
  calculateNonLinearCurrent(vBE: number): number {
    return this.bjtCharacteristic.getBaseCurrent(vBE)
  }

  /**
   * Calculate base-emitter conductance (NonLinearStamper interface)
   */
  calculateConductance(vBE: number): number {
    return this.bjtCharacteristic.getBaseConductance(vBE)
  }

  /**
   * Generate initial guess using Load Line Intersection on base-emitter junction
   */
  generateInitialGuess(nodeMap: Map<string, number>): { voltage: number; current: number } | null {
    if (!this.cachedAllStampers) {
      return null
    }

    // Analyze base-emitter circuit for load line intersection
    const dummySolution = matrix([[0], [0], [0]]) // Minimal matrix for type compliance
    const { theveninVoltage, theveninResistance } = this.analyzeBaseEmitterCircuit(
      dummySolution,
      nodeMap,
      this.cachedAllStampers,
    )

    if (theveninVoltage > 0 && theveninResistance > 0) {
      const loadLineResult = LoadLineIntersection.solve(
        this.baseEmitterDiode,
        theveninVoltage,
        theveninResistance,
      )

      console.log(
        `🎯 BJT ${this.id} Load Line Initial Guess: VBE=${loadLineResult.voltage.toFixed(4)}V, IB=${loadLineResult.current.toExponential(3)}A`,
      )

      return loadLineResult
    }

    return null
  }

  /**
   * Analyze base-emitter circuit for Thevenin equivalent
   * Similar to diode analysis but focused on base-emitter path
   */
  private analyzeBaseEmitterCircuit(
    solution: Matrix,
    nodeMap: Map<string, number>,
    allStampers?: ComponentStamper[],
  ): { theveninVoltage: number; theveninResistance: number } {
    console.log(`🔍 BJT ${this.id} Base-Emitter Circuit Analysis:`)

    const stampersToUse = allStampers || this.cachedAllStampers

    if (!stampersToUse) {
      console.log(`  No stampers provided, using defaults: Vth=5V, Rth=10000Ω`)
      return { theveninVoltage: 5.0, theveninResistance: 10000.0 }
    }

    let theveninVoltage = 0.0
    let theveninResistance = 0.0

    // Find voltage sources and resistors connected to base circuit
    const voltageSources: { voltage: number; component: CircuitComponent }[] = []
    const resistors: { resistance: number; component: CircuitComponent }[] = []

    for (const stamper of stampersToUse) {
      if (stamper.type === 'voltage_source' && 'component' in stamper) {
        const component = (stamper as { component: CircuitComponent }).component
        const voltage = (component.properties?.voltage as number) || 0
        voltageSources.push({ voltage, component })
        console.log(`  Found voltage source: ${voltage}V`)
      } else if (stamper.type === 'resistor' && 'component' in stamper) {
        const component = (stamper as { component: CircuitComponent }).component
        const resistance = (component.properties?.resistance as number) || 1000
        resistors.push({ resistance, component })
        console.log(`  Found resistor: ${resistance}Ω`)
      }
    }

    // Calculate Thevenin equivalent (simplified approach)
    if (voltageSources.length > 0) {
      // Use the highest voltage source as dominant
      theveninVoltage = Math.max(...voltageSources.map((vs) => vs.voltage))
      console.log(`  Thevenin voltage: ${theveninVoltage}V`)
    } else {
      theveninVoltage = 5.0 // Default base bias voltage
    }

    if (resistors.length > 0) {
      // For base bias, typically use series resistance to base
      theveninResistance = resistors.reduce((sum, r) => sum + r.resistance, 0)
      console.log(`  Thevenin resistance: ${theveninResistance}Ω`)
    } else {
      theveninResistance = 10000.0 // Default base bias resistance
    }

    console.log(
      `  Final Base-Emitter Thevenin: Vth=${theveninVoltage}V, Rth=${theveninResistance}Ω`,
    )
    return { theveninVoltage, theveninResistance }
  }

  /**
   * Main stamping method - uses Load Line Intersection for stability
   */
  stampLinearized(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    solution: Matrix,
    allStampers?: ComponentStamper[],
  ): void {
    const [collectorNode, baseNode, emitterNode] = this.getThreeTerminalNodes(nodeMap)

    // FIRST: Check actual VBE from solution for cutoff detection
    const vB = solution.get([baseNode, 0]) as number
    const vE = solution.get([emitterNode, 0]) as number
    const actualVBE = vB - vE

    // If VBE is clearly in cutoff region, don't use load line analysis
    if (actualVBE < 0.5) {
      this.operatingPoint = { vBE: actualVBE, vCE: 0, ib: 0, ic: 0, ie: 0 }
      console.log(`BJT ${this.id}: Cutoff detected (VBE=${actualVBE.toFixed(3)}V < 0.5V)`)
      return
    }

    // SECOND: Analyze base-emitter circuit using Load Line Intersection
    const { theveninVoltage, theveninResistance } = this.analyzeBaseEmitterCircuit(
      solution,
      nodeMap,
      allStampers,
    )

    if (theveninVoltage > 0 && theveninResistance > 0) {
      // Use Load Line Intersection for base-emitter junction
      const loadLineResult = LoadLineIntersection.solve(
        this.baseEmitterDiode,
        theveninVoltage,
        theveninResistance,
      )

      const vBE = loadLineResult.voltage
      const ib = loadLineResult.current

      // Get collector-emitter voltage from current solution
      const vC = solution.get([collectorNode, 0]) as number
      const vE = solution.get([emitterNode, 0]) as number
      const vCE = vC - vE

      // Calculate collector current based on BJT model
      const ic = this.bjtCharacteristic.getCollectorCurrent(vBE, vCE)
      const ie = ib + ic // Emitter current = base + collector current

      // Store operating point
      this.operatingPoint = { vBE, vCE, ib, ic, ie }

      // Stamp base-emitter junction as current source (load line result)
      rhsVector.set([baseNode, 0], (rhsVector.get([baseNode, 0]) as number) - ib)
      rhsVector.set([emitterNode, 0], (rhsVector.get([emitterNode, 0]) as number) + ib)

      // Stamp collector current as controlled current source
      rhsVector.set([collectorNode, 0], (rhsVector.get([collectorNode, 0]) as number) - ic)
      rhsVector.set([emitterNode, 0], (rhsVector.get([emitterNode, 0]) as number) + ic)

      // Add GMIN for numerical stability on all terminals
      const GMIN = 1e-12

      // Base-emitter conductance
      mnaMatrix.set([baseNode, baseNode], (mnaMatrix.get([baseNode, baseNode]) as number) + GMIN)
      mnaMatrix.set(
        [emitterNode, emitterNode],
        (mnaMatrix.get([emitterNode, emitterNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [baseNode, emitterNode],
        (mnaMatrix.get([baseNode, emitterNode]) as number) - GMIN,
      )
      mnaMatrix.set(
        [emitterNode, baseNode],
        (mnaMatrix.get([emitterNode, baseNode]) as number) - GMIN,
      )

      // Collector-emitter conductance (small for high output resistance)
      mnaMatrix.set(
        [collectorNode, collectorNode],
        (mnaMatrix.get([collectorNode, collectorNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [emitterNode, emitterNode],
        (mnaMatrix.get([emitterNode, emitterNode]) as number) + GMIN,
      )
      mnaMatrix.set(
        [collectorNode, emitterNode],
        (mnaMatrix.get([collectorNode, emitterNode]) as number) - GMIN,
      )
      mnaMatrix.set(
        [emitterNode, collectorNode],
        (mnaMatrix.get([emitterNode, collectorNode]) as number) - GMIN,
      )

      // Log operating point
      const region = this.bjtCharacteristic.getOperatingRegion(vBE, vCE)
      console.log(
        `BJT ${this.id}: ${region} - VBE=${vBE.toFixed(3)}V, VCE=${vCE.toFixed(3)}V, IB=${ib.toExponential(2)}A, IC=${ic.toExponential(2)}A`,
      )
    } else {
      // Fallback: Use cutoff state
      this.operatingPoint = { vBE: 0, vCE: 0, ib: 0, ic: 0, ie: 0 }
      console.log(`BJT ${this.id}: Cutoff state (no base bias detected)`)
    }
  }

  /**
   * Linear DC stamping (unused for non-linear components)
   */
  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    return { branchCurrents: [] }
  }

  /**
   * Calculate current from final solution
   * For BJT, we return collector current as the main current
   */
  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // Return collector current as primary current measurement
    if (this.operatingPoint) {
      return this.operatingPoint.ic
    }

    return 0 // Fallback for cutoff state
  }

  /**
   * Get base current for educational analysis
   */
  getBaseCurrent(): number {
    return this.operatingPoint?.ib || 0
  }

  /**
   * Get emitter current for educational analysis
   */
  getEmitterCurrent(): number {
    return this.operatingPoint?.ie || 0
  }

  /**
   * Get operating region for educational display
   */
  getOperatingRegion(): string {
    if (!this.operatingPoint) return 'Cutoff'
    return this.bjtCharacteristic.getOperatingRegion(
      this.operatingPoint.vBE,
      this.operatingPoint.vCE,
    )
  }
}
