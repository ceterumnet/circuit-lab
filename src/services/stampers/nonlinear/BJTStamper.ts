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
   * FIXED: Now performs proper circuit graph analysis to identify only base-emitter path components
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

    // Detect circuit patterns
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

    // Build circuit graph to identify base-emitter path
    const baseEmitterComponents = this.identifyBaseEmitterComponents(
      stampersToUse,
      nodeMap,
      baseNode,
      emitterNode,
      isVoltageDividerBias,
      smallVoltageSources.length > 0,
    )

    console.log(`  Components in base-emitter path: ${baseEmitterComponents.length}`)

    // If graph traversal found no components, use fallback for isolated BJT
    if (baseEmitterComponents.length === 0) {
      console.log(`  No components found in base-emitter path - BJT appears isolated`)
      return { theveninVoltage: 0.0, theveninResistance: 1000000.0 }
    }

    let theveninVoltage = 0.0
    let theveninResistance = 0.0

    // Analyze components and calculate proper Thevenin equivalent
    const voltageSources = baseEmitterComponents.filter((s) => s.type === 'voltage_source')
    const resistors = baseEmitterComponents.filter((s) => s.type === 'resistor')

    console.log(
      `  Analyzing ${voltageSources.length} voltage sources and ${resistors.length} resistors`,
    )

    if (isVoltageDividerBias && voltageSources.length === 1 && resistors.length >= 2) {
      // Voltage divider bias analysis
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

      // For voltage divider: R1 (higher) → base → R2 (lower) → ground
      // Plus possibly RE (emitter resistor)
      if (resistorValues.length >= 2) {
        const r1 = resistorValues[0] // Higher resistance (top of divider)
        const r2 = resistorValues[1] // Lower resistance (bottom of divider)

        // Voltage divider: Vth = VCC * R2/(R1+R2)
        theveninVoltage = (vcc * r2) / (r1 + r2)

        // Thevenin resistance: Rth = R1||R2 = (R1*R2)/(R1+R2)
        theveninResistance = (r1 * r2) / (r1 + r2)

        // Add any additional series resistance (like emitter resistor)
        if (resistorValues.length > 2) {
          theveninResistance += resistorValues[2]
        }

        console.log(`  Voltage divider analysis: VCC=${vcc}V, R1=${r1}Ω, R2=${r2}Ω`)
        console.log(
          `  Calculated: Vth = ${vcc}V * ${r2}Ω / ${r1 + r2}Ω = ${theveninVoltage.toFixed(3)}V`,
        )
        console.log(`  Calculated: Rth = ${r1}Ω || ${r2}Ω = ${theveninResistance.toFixed(0)}Ω`)
      }
    } else {
      // Simple base bias or multiple voltage sources - use simple summation
      for (const stamper of baseEmitterComponents) {
        if (stamper.type === 'voltage_source' && 'component' in stamper) {
          const component = (stamper as unknown as { component: CircuitComponent }).component
          const voltage = (component.properties?.voltage as number) || 0
          console.log(`  Found voltage source in base-emitter path: ${component.id} = ${voltage}V`)
          theveninVoltage += voltage
        } else if (stamper.type === 'resistor' && 'component' in stamper) {
          const component = (stamper as unknown as { component: CircuitComponent }).component
          const resistance = (component.properties?.resistance as number) || 0
          console.log(`  Found resistor in base-emitter path: ${component.id} = ${resistance}Ω`)
          theveninResistance += resistance
        }
      }
    }

    console.log(`  Thevenin voltage: ${theveninVoltage.toFixed(3)}V`)
    console.log(`  Series resistance RTH: ${theveninResistance.toFixed(0)}Ω`)
    console.log(
      `  Final Base-Emitter Thevenin: Vth=${theveninVoltage.toFixed(3)}V, Rth=${theveninResistance.toFixed(1)}Ω`,
    )

    return { theveninVoltage, theveninResistance }
  }

  /**
   * Identify components in the base-emitter circuit path using smart heuristics
   * This distinguishes between base circuit and collector circuit components
   */
  private identifyBaseEmitterComponents(
    allStampers: ComponentStamper[],
    nodeMap: Map<string, number>,
    baseNode: number,
    emitterNode: number,
    isVoltageDividerBias: boolean,
    hasSmallVoltageSource: boolean,
  ): ComponentStamper[] {
    console.log(`  🔍 Smart heuristic analysis for base-emitter circuit`)

    const baseEmitterComponents: ComponentStamper[] = []

    // Categorize components by their electrical characteristics
    const voltageSources: { stamper: ComponentStamper; voltage: number }[] = []
    const resistors: { stamper: ComponentStamper; resistance: number }[] = []

    for (const stamper of allStampers) {
      if (stamper.type === 'voltage_source' && 'component' in stamper) {
        const component = (stamper as { component: CircuitComponent }).component
        const voltage = (component.properties?.voltage as number) || 0
        voltageSources.push({ stamper, voltage })
      } else if (stamper.type === 'resistor' && 'component' in stamper) {
        const component = (stamper as { component: CircuitComponent }).component
        const resistance = (component.properties?.resistance as number) || 0
        resistors.push({ stamper, resistance })
      }
    }

    // Smart heuristic: Distinguish base circuit from collector circuit
    console.log(`  Found ${voltageSources.length} voltage sources, ${resistors.length} resistors`)

    // Base circuit voltage sources: typically small (0.1V - 5V for base bias)
    // Collector circuit voltage sources: typically large (12V, 24V for VCC)
    for (const { stamper, voltage } of voltageSources) {
      if (voltage > 0 && voltage <= 5) {
        // This is likely a base bias voltage source
        baseEmitterComponents.push(stamper)
        console.log(
          `  ✅ Base bias voltage source: ${(stamper as unknown as { component: CircuitComponent }).component.id} = ${voltage}V`,
        )
      } else if (voltage > 5 && isVoltageDividerBias) {
        // For voltage divider bias: include supply voltage when pattern is detected
        baseEmitterComponents.push(stamper)
        console.log(
          `  ✅ Supply voltage for voltage divider bias: ${(stamper as unknown as { component: CircuitComponent }).component.id} = ${voltage}V`,
        )
      } else {
        console.log(
          `  ❌ Excluded collector supply: ${(stamper as unknown as { component: CircuitComponent }).component.id} = ${voltage}V`,
        )
      }
    }

    // Base circuit resistors: typically high value (10kΩ+ for base bias)
    // Collector circuit resistors: typically medium value (1kΩ-10kΩ for load)
    // Emitter circuit resistors: typically small value (100Ω-2kΩ for degeneration)
    for (const { stamper, resistance } of resistors) {
      if (resistance >= 10000) {
        // This is likely a base bias resistor (RB, R1 in voltage divider)
        // Real-world base resistors: 10kΩ - 1MΩ range
        baseEmitterComponents.push(stamper)
        console.log(
          `  ✅ Base bias resistor: ${(stamper as unknown as { component: CircuitComponent }).component.id} = ${resistance}Ω`,
        )
      } else if (isVoltageDividerBias && resistance >= 1000 && resistance <= 50000) {
        // For voltage divider bias: include medium-value resistors (R1, R2, RE)
        // But exclude obvious collector resistors (RC typically 2-5kΩ range)
        const componentId = (stamper as unknown as { component: CircuitComponent }).component.id
        if (
          !componentId.toUpperCase().includes('RC') &&
          !componentId.toUpperCase().includes('COLLECTOR')
        ) {
          baseEmitterComponents.push(stamper)
          console.log(`  ✅ Voltage divider resistor: ${componentId} = ${resistance}Ω`)
        } else {
          console.log(`  ❌ Excluded collector resistor: ${componentId} = ${resistance}Ω`)
        }
      } else {
        console.log(
          `  ❌ Excluded resistor: ${(stamper as unknown as { component: CircuitComponent }).component.id} = ${resistance}Ω`,
        )
      }
    }

    console.log(`  Final base-emitter components: ${baseEmitterComponents.length}`)
    return baseEmitterComponents
  }

  /**
   * Get the nodes that a component is connected to
   * (Kept for compatibility, but not used in current heuristic approach)
   */
  private getComponentNodes(stamper: ComponentStamper, nodeMap: Map<string, number>): number[] {
    const nodes: number[] = []

    // Get component terminals and map to node indices
    if ('component' in stamper) {
      const component = (stamper as { component: CircuitComponent }).component

      // Different components have different terminal patterns
      switch (component.type) {
        case 'voltage_source':
          nodes.push(
            nodeMap.get(`${component.id}:positive`) || -1,
            nodeMap.get(`${component.id}:negative`) || -1,
          )
          break
        case 'resistor':
          nodes.push(
            nodeMap.get(`${component.id}:terminal1`) || -1,
            nodeMap.get(`${component.id}:terminal2`) || -1,
          )
          break
        case 'wire':
          // Wires connect between component terminals
          // Get the actual connected nodes from the wire's startComponentId/endComponentId
          const wireComponent = component as CircuitComponent & {
            properties: { startComponentId: string; endComponentId: string }
          }
          // For now, skip wires in the graph traversal as they're connections, not components
          break
        // Add more component types as needed
      }
    }

    return nodes.filter((node) => node !== -1)
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

    // Get collector-emitter voltage from current solution (needed for load line analysis)
    const vC = solution.get([collectorNode, 0]) as number
    const vE = solution.get([emitterNode, 0]) as number
    const vCE = vC - vE

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

      // Check if BJT is actually in cutoff after load line analysis
      if (vBE < 0.5) {
        this.operatingPoint = { vBE, vCE, ib: 0, ic: 0, ie: 0 }
        console.log(
          `BJT ${this.id}: Cutoff detected after load line analysis (VBE=${vBE.toFixed(3)}V < 0.5V)`,
        )
        return
      }

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
        `🔋 BJT ${this.id}: ${region} - VBE=${vBE.toFixed(3)}V, VCE=${vCE.toFixed(3)}V, IB=${ib.toExponential(2)}A, IC=${ic.toExponential(2)}A`,
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
