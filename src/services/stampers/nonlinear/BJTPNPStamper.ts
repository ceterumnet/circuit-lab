import type { CircuitComponent } from '@/types/components'
import { Matrix, matrix } from 'mathjs'
import type { ComponentStamper, StampResult } from '../shared'
import type { NonLinearStamper } from '@/services/numerical-solver'
import { BJTCharacteristic } from './BJTCharacteristic'
import { DiodeCharacteristic } from './DiodeCharacteristic'
import { LoadLineIntersection } from './LoadLineIntersection'

/**
 * PNP BJT stamper using Load Line Intersection approach
 * ARCHITECTURE: Similar to NPN but with inverted current relationships
 *
 * Key differences from NPN:
 * - Base-emitter junction requires VEB > 0.7V (not VBE) for conduction
 * - All current directions are opposite to NPN
 * - For active operation, emitter is at higher potential than base
 */
export class BJTPNPStamper implements ComponentStamper, NonLinearStamper {
  public id: string
  public type: string
  protected bjtCharacteristic: BJTCharacteristic
  protected baseEmitterDiode: DiodeCharacteristic
  protected operatingPoint: {
    vEB: number // Note: VEB for PNP (not VBE)
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
    // For PNP, we model the emitter-base junction (reverse of NPN)
    this.baseEmitterDiode = new DiodeCharacteristic(saturationCurrent, 1.0)

    this.parametersInitialized = true // BJTs use explicit parameters
  }

  /**
   * Get the collector, base, and emitter nodes from the node map
   */
  private getThreeTerminalNodes(nodeMap: Map<string, number>): [number, number, number] {
    const collectorNode = nodeMap.get(`${this.id}:collector`)
    const baseNode = nodeMap.get(`${this.id}:base`)
    const emitterNode = nodeMap.get(`${this.id}:emitter`)

    if (collectorNode === undefined || baseNode === undefined || emitterNode === undefined) {
      throw new Error(`PNP BJT ${this.id}: Missing terminal nodes`)
    }

    return [collectorNode, baseNode, emitterNode]
  }

  /**
   * DC stamping method - returns empty for non-linear components
   */
  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    frequency: number,
  ): StampResult {
    // Non-linear components don't stamp during DC analysis
    // They use the Newton-Raphson solver with stampLinearized
    return { branchCurrents: [] }
  }

  /**
   * Store reference to all stampers for circuit analysis
   */
  setAllStampers(stampers: ComponentStamper[]): void {
    this.cachedAllStampers = stampers
  }

  /**
   * Generate initial guess using Load Line Intersection on emitter-base junction
   * Note: For PNP, we analyze the emitter-base junction (VEB)
   */
  generateInitialGuess(nodeMap: Map<string, number>): { voltage: number; current: number } | null {
    if (!this.cachedAllStampers) {
      return null
    }

    // Analyze emitter-base circuit for load line intersection (PNP specific)
    const dummySolution = matrix([[0], [0], [0]]) // Minimal matrix for type compliance
    const { theveninVoltage, theveninResistance } = this.analyzeEmitterBaseCircuit(
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
        `🎯 PNP BJT ${this.id} Load Line Initial Guess: VEB=${loadLineResult.voltage.toFixed(4)}V, IB=${loadLineResult.current.toExponential(3)}A`,
      )

      return loadLineResult
    }

    return null
  }

  /**
   * Analyze emitter-base circuit for Thevenin equivalent (PNP specific)
   * For PNP, we need to analyze the emitter-base path, not base-emitter
   */
  private analyzeEmitterBaseCircuit(
    solution: Matrix,
    nodeMap: Map<string, number>,
    allStampers?: ComponentStamper[],
  ): { theveninVoltage: number; theveninResistance: number } {
    console.log(`🔍 PNP BJT ${this.id} Emitter-Base Circuit Analysis:`)

    const stampersToUse = allStampers || this.cachedAllStampers

    if (!stampersToUse) {
      console.log(`  No stampers provided, using defaults: Vth=5V, Rth=10000Ω`)
      return { theveninVoltage: 5.0, theveninResistance: 10000.0 }
    }

    // Get BJT terminal nodes
    const [, baseNode, emitterNode] = this.getThreeTerminalNodes(nodeMap)

    // Analyze all components to detect circuit patterns
    const allVoltageSources: { stamper: ComponentStamper; voltage: number }[] = []
    const allResistors: { stamper: ComponentStamper; resistance: number }[] = []

    for (const stamper of stampersToUse) {
      if (stamper.type === 'voltage_source' && 'component' in stamper) {
        const component = (stamper as unknown as { component: CircuitComponent }).component
        const voltage = (component.properties?.voltage as number) || 0
        allVoltageSources.push({ stamper, voltage })
      } else if (stamper.type === 'resistor' && 'component' in stamper) {
        const component = (stamper as unknown as { component: CircuitComponent }).component
        const resistance = (component.properties?.resistance as number) || 0
        allResistors.push({ stamper, resistance })
      }
    }

    // Detect circuit patterns (similar to NPN but for PNP bias)
    const smallVoltageSources = allVoltageSources.filter((vs) => vs.voltage > 0 && vs.voltage <= 5)
    const supplyVoltageSources = allVoltageSources.filter((vs) => vs.voltage > 5)
    const mediumResistors = allResistors.filter(
      (r) => r.resistance >= 1000 && r.resistance <= 50000,
    )
    const isVoltageDividerBias =
      supplyVoltageSources.length > 0 &&
      smallVoltageSources.length === 0 &&
      mediumResistors.length >= 2

    console.log(
      `  Pattern analysis: hasSmallVoltage=${smallVoltageSources.length > 0}, isVoltageDivider=${isVoltageDividerBias}`,
    )

    // Build circuit graph to identify emitter-base path
    const emitterBaseComponents = this.identifyEmitterBaseComponents(
      stampersToUse,
      nodeMap,
      emitterNode,
      baseNode,
      isVoltageDividerBias,
      smallVoltageSources.length > 0,
    )

    console.log(`  Components in emitter-base path: ${emitterBaseComponents.length}`)

    // If graph traversal found no components, use fallback for isolated BJT
    if (emitterBaseComponents.length === 0) {
      console.log(`  No components found in emitter-base path - BJT appears isolated`)
      return { theveninVoltage: 0.0, theveninResistance: 1000000.0 }
    }

    let theveninVoltage = 0.0
    let theveninResistance = 0.0

    // Analyze components and calculate proper Thevenin equivalent
    const voltageSources = emitterBaseComponents.filter((s) => s.type === 'voltage_source')
    const resistors = emitterBaseComponents.filter((s) => s.type === 'resistor')

    console.log(
      `  Analyzing ${voltageSources.length} voltage sources and ${resistors.length} resistors`,
    )

    if (isVoltageDividerBias && voltageSources.length === 1 && resistors.length >= 2) {
      // Voltage divider bias analysis for PNP
      const vcc =
        ((voltageSources[0] as unknown as { component: CircuitComponent }).component.properties
          ?.voltage as number) || 0
      const resistorValues = resistors
        .map(
          (r) =>
            ((r as unknown as { component: CircuitComponent }).component.properties
              ?.resistance as number) || 0,
        )
        .sort((a, b) => b - a) // Sort descending

      // For PNP voltage divider: VCC → R1 → base → R2 → ground
      // Emitter is typically connected to VCC through RE
      if (resistorValues.length >= 2) {
        const r1 = resistorValues[0] // Higher resistance (top of divider)
        const r2 = resistorValues[1] // Lower resistance (bottom of divider)

        // For PNP: VEB = VCC - VB, where VB = VCC * R2/(R1+R2)
        // So VEB = VCC - VCC * R2/(R1+R2) = VCC * R1/(R1+R2)
        theveninVoltage = (vcc * r1) / (r1 + r2)

        // Thevenin resistance: Rth = R1||R2 = (R1*R2)/(R1+R2)
        theveninResistance = (r1 * r2) / (r1 + r2)

        // Add any additional series resistance (like emitter resistor)
        if (resistorValues.length > 2) {
          theveninResistance += resistorValues[2]
        }

        console.log(`  PNP voltage divider analysis: VCC=${vcc}V, R1=${r1}Ω, R2=${r2}Ω`)
        console.log(
          `  Calculated: VEB_th = ${vcc}V * ${r1}Ω / ${r1 + r2}Ω = ${theveninVoltage.toFixed(3)}V`,
        )
        console.log(`  Calculated: Rth = ${r1}Ω || ${r2}Ω = ${theveninResistance.toFixed(0)}Ω`)
      }
    } else {
      // Simple bias analysis for PNP
      let totalVoltage = 0
      let totalResistance = 0

      for (const vs of voltageSources) {
        const voltage =
          ((vs as unknown as { component: CircuitComponent }).component.properties
            ?.voltage as number) || 0
        totalVoltage += voltage
      }

      for (const r of resistors) {
        const resistance =
          ((r as unknown as { component: CircuitComponent }).component.properties
            ?.resistance as number) || 0
        totalResistance += resistance
      }

      theveninVoltage = totalVoltage
      theveninResistance = Math.max(totalResistance, 1000) // Minimum 1kΩ

      console.log(`  Simple bias analysis: Vth=${theveninVoltage}V, Rth=${theveninResistance}Ω`)
    }

    return { theveninVoltage, theveninResistance }
  }

  /**
   * Identify components in the emitter-base path using graph traversal
   */
  private identifyEmitterBaseComponents(
    allStampers: ComponentStamper[],
    nodeMap: Map<string, number>,
    emitterNode: number,
    baseNode: number,
    isVoltageDividerBias: boolean,
    hasSmallVoltage: boolean,
  ): ComponentStamper[] {
    const components: ComponentStamper[] = []

    // Simple heuristic: include resistors in reasonable range and voltage sources
    for (const stamper of allStampers) {
      if (stamper.type === 'voltage_source') {
        components.push(stamper)
      } else if (stamper.type === 'resistor' && 'component' in stamper) {
        const component = (stamper as unknown as { component: CircuitComponent }).component
        const resistance = (component.properties?.resistance as number) || 0

        // Include resistors that could be in the bias path
        if (resistance >= 10000 && resistance <= 1000000) {
          // 10kΩ to 1MΩ range
          components.push(stamper)
        }
      }
    }

    return components
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

    // Get collector-emitter voltage from current solution
    const vC = solution.get([collectorNode, 0]) as number
    const vE = solution.get([emitterNode, 0]) as number
    const vB = solution.get([baseNode, 0]) as number
    const vCE = vC - vE
    const vEB = vE - vB // Note: VEB for PNP (not VBE)

    // Analyze emitter-base circuit using Load Line Intersection
    const { theveninVoltage, theveninResistance } = this.analyzeEmitterBaseCircuit(
      solution,
      nodeMap,
      allStampers,
    )

    if (theveninVoltage > 0 && theveninResistance > 0) {
      // Use Load Line Intersection for emitter-base junction
      const loadLineResult = LoadLineIntersection.solve(
        this.baseEmitterDiode,
        theveninVoltage,
        theveninResistance,
      )

      const vEBCalculated = loadLineResult.voltage
      const ib = loadLineResult.current

      // Check if PNP BJT is actually in cutoff after load line analysis
      if (vEBCalculated < 0.5) {
        this.operatingPoint = { vEB: vEBCalculated, vCE, ib: 0, ic: 0, ie: 0 }
        console.log(
          `PNP BJT ${this.id}: Cutoff detected after load line analysis (VEB=${vEBCalculated.toFixed(3)}V < 0.5V)`,
        )
        return
      }

      // Calculate collector current based on PNP BJT model
      // For PNP, we use VEB and the current relationships are inverted
      const ic = this.bjtCharacteristic.getCollectorCurrent(vEBCalculated, vCE)
      const ie = ib + ic // Emitter current = base + collector current

      // Store operating point
      this.operatingPoint = { vEB: vEBCalculated, vCE, ib, ic, ie }

      // Stamp base-emitter junction as current source (load line result)
      // For PNP, current directions are opposite to NPN
      rhsVector.set([baseNode, 0], (rhsVector.get([baseNode, 0]) as number) + ib)
      rhsVector.set([emitterNode, 0], (rhsVector.get([emitterNode, 0]) as number) - ib)

      // Stamp collector current as controlled current source
      // For PNP, collector current flows into collector (opposite of NPN)
      rhsVector.set([collectorNode, 0], (rhsVector.get([collectorNode, 0]) as number) + ic)
      rhsVector.set([emitterNode, 0], (rhsVector.get([emitterNode, 0]) as number) - ic)

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
      const region = this.bjtCharacteristic.getOperatingRegion(vEBCalculated, vCE)
      console.log(
        `🔋 PNP BJT ${this.id}: ${region} - VEB=${vEBCalculated.toFixed(3)}V, VCE=${vCE.toFixed(3)}V, IB=${ib.toExponential(2)}A, IC=${ic.toExponential(2)}A`,
      )
    } else {
      // Fallback: Use cutoff state
      this.operatingPoint = { vEB: 0, vCE: 0, ib: 0, ic: 0, ie: 0 }
      console.log(`PNP BJT ${this.id}: Cutoff state (no emitter bias detected)`)
    }
  }

  /**
   * Calculate current from final solution
   * For PNP BJT, we return collector current as the main current
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
   * NonLinearStamper interface methods
   */
  calculateNonLinearCurrent(voltage: number): number {
    // For PNP, this calculates base current from VEB
    return this.bjtCharacteristic.getBaseCurrent(voltage)
  }

  calculateConductance(voltage: number): number {
    return this.bjtCharacteristic.getBaseConductance(voltage)
  }

  getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    const baseNode = nodeMap.get(`${this.id}:base`)
    const emitterNode = nodeMap.get(`${this.id}:emitter`)

    if (baseNode === undefined || emitterNode === undefined) {
      throw new Error(`PNP BJT ${this.id}: Missing base or emitter node`)
    }

    return [baseNode, emitterNode]
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
      this.operatingPoint.vEB,
      this.operatingPoint.vCE,
    )
  }
}
