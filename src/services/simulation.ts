import type { Circuit, CircuitComponent, Wire } from '@/types/components'
import { zeros, lusolve, matrix, Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'
import { EnhancedMNASolver } from './numerical-solver'

/**
 * Represents the result of a DC simulation.
 * It's a map where keys are node IDs and values are their calculated voltages.
 */
export interface DC_Result {
  voltages: Record<number, number>
  currents: Record<string, number>
  termToNodeIndex: Map<string, number>
  /** Enhanced solver metrics for precision analysis */
  solverMetrics?: {
    conditionNumber?: number
    refinementIterations?: number
    significantDigits?: number
    solveTime?: number
  }
}

/**
 * Result of component stamping operation
 */
interface StampResult {
  branchCurrents: number[] // Indices of branch currents this component introduces
}

/**
 * Interface for component stamping into MNA matrices
 */
interface ComponentStamper {
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
abstract class ResistiveStamper implements ComponentStamper {
  constructor(
    public id: string,
    public type: string,
    protected component: CircuitComponent,
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
    const v1 = solution.get([n1, 0]) as number
    const v2 = solution.get([n2, 0]) as number
    return (v1 - v2) / this.resistance
  }
}

/**
 * Resistor component stamper
 */
class ResistorStamper extends ResistiveStamper {
  constructor(component: CircuitComponent) {
    const resistance = (component.properties?.resistance as number) || 1000
    super(component.id, component.type, component, resistance)
  }
}

/**
 * Wire component stamper - ALL wires now get branch current variables for proper MNA analysis
 * This eliminates heuristic-based current calculations and ensures KCL compliance
 */
class WireStamper extends ResistiveStamper {
  private branchIndex: number = -1

  constructor(component: CircuitComponent) {
    // Use wire's configured resistance, default to 1mΩ for numerical stability
    // 1mΩ is small enough to be negligible in most circuits but avoids conditioning issues
    const resistance = (component.properties?.resistance as number) || 1e-3
    super(component.id, component.type, component, resistance)
  }

  public getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    // Wires store connection info differently than standard components
    const props = this.component.properties!
    const startTerminalId = `${props.startComponentId}:${props.startTerminal}`
    const endTerminalId = `${props.endComponentId}:${props.endTerminal}`

    const n1 = nodeMap.get(startTerminalId)
    const n2 = nodeMap.get(endTerminalId)

    // DEBUG: Log wire terminal mapping details
    console.log(`🔍 Wire ${this.id} terminal mapping:`)
    console.log(`  Start: ${startTerminalId} → node ${n1}`)
    console.log(`  End: ${endTerminalId} → node ${n2}`)
    console.log(`  Wire properties:`, props)

    if (n1 === undefined || n2 === undefined) {
      console.error(`❌ Wire ${this.id}: Missing node mappings!`)
      console.error(`  Available node mappings:`)
      for (const [termId, nodeIdx] of nodeMap.entries()) {
        console.error(`    ${termId} → ${nodeIdx}`)
      }
      throw new Error(`Wire ${this.id}: Could not find node indices for terminals`)
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

    // SPECIAL CASE: Same-node wires (n1 === n2) don't carry current
    // These represent direct connections within the same electrical node
    if (n1 === n2) {
      console.log(`Wire ${this.id}: Same-node connection (${n1}-${n2}), no branch current needed`)
      return { branchCurrents: [] }
    }

    this.branchIndex = nextBranchIndex

    // EXTENDED MNA: Different-node wires get branch current variables
    // This ensures every inter-node wire current is directly calculated by MNA

    // Standard voltage-controlled current source stamp (wire as resistor with branch current)
    // Equations: V1 - V2 = I_wire * R_wire
    //           I_wire is the branch current variable

    // B matrix: current flowing from node n1 to node n2
    mnaMatrix.set([n1, this.branchIndex], 1)
    mnaMatrix.set([n2, this.branchIndex], -1)

    // C matrix: voltage constraint equation
    mnaMatrix.set([this.branchIndex, n1], 1)
    mnaMatrix.set([this.branchIndex, n2], -1)

    // Add resistance effect to the branch equation
    // V1 - V2 - I_wire * R_wire = 0
    mnaMatrix.set([this.branchIndex, this.branchIndex], -this.resistance)

    console.log(
      `Wire ${this.id}: R=${this.resistance}Ω, nodes ${n1}-${n2}, branch current index ${this.branchIndex}`,
    )

    return { branchCurrents: [this.branchIndex] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    const [n1, n2] = this.getNodeIndices(nodeMap)

    // Same-node wires carry zero current by definition
    if (n1 === n2) {
      console.log(`Wire ${this.id}: Same-node wire, current = 0A`)
      return 0
    }

    // CRITICAL: Direct MNA solution - no heuristics, no special cases
    // This is the current that a real multimeter would measure if inserted in series
    if (this.branchIndex === -1) {
      console.error(
        `Wire ${this.id}: Branch index not set for inter-node wire, cannot calculate current`,
      )
      return 0
    }

    const current = solution.get([this.branchIndex, 0]) as number
    console.log(`Wire ${this.id}: Direct MNA current = ${current}A`)
    return current
  }
}

/**
 * Voltage source component stamper
 */
class VoltageSourceStamper implements ComponentStamper {
  private voltage: number
  private branchIndex: number = -1
  public id: string
  public type: string

  constructor(private component: CircuitComponent) {
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
    return solution.get([this.branchIndex, 0]) as number
  }
}

/**
 * Ground component stamper
 */
class GroundStamper implements ComponentStamper {
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
    // Ground doesn't stamp anything - it's handled by setting ground node voltage to 0
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    return 0 // Ground doesn't have current
  }
}

/**
 * Node component stamper - purely for connectivity, no electrical behavior
 */
class NodeStamper implements ComponentStamper {
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

/**
 * Component stamper factory
 */
class ComponentStamperFactory {
  private static stampers = new Map<string, new (component: CircuitComponent) => ComponentStamper>([
    ['resistor', ResistorStamper],
    ['wire', WireStamper],
    ['voltage_source', VoltageSourceStamper],
    ['ground', GroundStamper],
    ['node', NodeStamper],
  ])

  static createStamper(component: CircuitComponent): ComponentStamper {
    const StamperClass = this.stampers.get(component.type)
    if (!StamperClass) {
      throw new Error(`No stamper registered for component type: ${component.type}`)
    }
    return new StamperClass(component)
  }

  static registerStamper(
    type: string,
    stamperClass: new (component: CircuitComponent) => ComponentStamper,
  ) {
    this.stampers.set(type, stamperClass)
  }
}

/**
 * New unified DC analysis using component stamping approach with enhanced numerical solver
 */
export async function solveDC(
  circuit: Circuit,
  useEnhancedSolver: boolean = true,
): Promise<DC_Result | null> {
  console.log('Starting Unified DC Analysis for circuit:', circuit.id)

  try {
    const components = circuit.components

    // Step 1: Build electrical nodes using the same logic as before
    const { electricalNodes, termToNodeIndex, groundNodeIndex, groundNodeIndices } =
      buildElectricalNodes(components)

    if (groundNodeIndices.length === 0) {
      console.error('Circuit must have a ground connection or a voltage source.')
      return null
    }

    console.log('Electrical Nodes:', electricalNodes)
    console.log('Ground Node Index:', groundNodeIndex)

    // Step 2: Create component stampers
    const stampers: ComponentStamper[] = []
    for (const component of components) {
      try {
        const stamper = ComponentStamperFactory.createStamper(component)
        stampers.push(stamper)
      } catch (error) {
        console.warn(`Skipping component ${component.id}: ${error}`)
      }
    }

    // Step 3: Determine total number of branch currents needed
    let totalBranchCurrents = 0
    const numNodes = electricalNodes.length

    // CRITICAL: Only components that need branch currents add them to the MNA matrix
    // This eliminates the need for heuristic current calculations
    for (const stamper of stampers) {
      if (stamper.type === 'voltage_source') {
        totalBranchCurrents += 1 // Each voltage source adds one branch current
      } else if (stamper.type === 'wire') {
        // Only inter-node wires get branch currents, same-node wires don't
        const wireStamper = stamper as WireStamper
        const [n1, n2] = wireStamper.getNodeIndices(termToNodeIndex)
        if (n1 !== n2) {
          totalBranchCurrents += 1 // Only inter-node wires add branch currents
        }
      }
      // Other components (resistors, grounds, nodes) don't add branch currents
    }

    const matrixSize = numNodes + totalBranchCurrents
    console.log(
      `Matrix size: ${numNodes} nodes + ${totalBranchCurrents} branch currents = ${matrixSize}`,
    )

    // Step 4: Initialize MNA matrices
    const mnaMatrix = matrix(zeros(matrixSize, matrixSize))
    const rhsVector = matrix(zeros(matrixSize, 1))

    // Step 5: Stamp all components
    let nextBranchIndex = numNodes
    const allBranchCurrents: number[] = []

    for (const stamper of stampers) {
      const result = stamper.stampDC(mnaMatrix, rhsVector, termToNodeIndex, nextBranchIndex)
      allBranchCurrents.push(...result.branchCurrents)
      nextBranchIndex += result.branchCurrents.length
    }

    // Step 6: Apply ground constraints - Enhanced or Standard method
    console.log('Applying ground constraints for nodes:', groundNodeIndices)

    if (useEnhancedSolver) {
      // Use enhanced ground constraint application for better numerical stability
      EnhancedMNASolver.applyGroundConstraintsEnhanced(mnaMatrix, rhsVector, groundNodeIndices)
    } else {
      // Standard ground constraint application
      for (const groundIndex of groundNodeIndices) {
        // Zero out ground node row and column
        for (let i = 0; i < matrixSize; i++) {
          mnaMatrix.set([groundIndex, i], 0)
          mnaMatrix.set([i, groundIndex], 0)
        }
        // Set ground node equation: V_ground = 0
        mnaMatrix.set([groundIndex, groundIndex], 1)
        rhsVector.set([groundIndex, 0], 0)
      }
    }

    // Step 7: Solve the system with enhanced numerical solver
    let solution: Matrix
    let solverMetrics: DC_Result['solverMetrics']

    const solveStartTime = performance.now()

    if (useEnhancedSolver) {
      console.log('🔍 Using Enhanced MNA Solver for improved precision...')
      const enhancedSolver = new EnhancedMNASolver({
        tolerance: 1e-12,
        useMatrixConditioning: true,
        useIterativeRefinement: true,
        enablePrecisionMonitoring: true,
      })

      const solverResult = enhancedSolver.solve(mnaMatrix, rhsVector)
      solution = solverResult.solution

      solverMetrics = {
        conditionNumber: solverResult.conditionNumber,
        refinementIterations: solverResult.refinementIterations,
        significantDigits: solverResult.precisionMetrics?.significantDigits,
        solveTime: performance.now() - solveStartTime,
      }

      console.log('✅ Enhanced solver completed successfully')
    } else {
      solution = lusolve(mnaMatrix, rhsVector) as Matrix
      solverMetrics = {
        solveTime: performance.now() - solveStartTime,
      }
    }

    // Step 8: Extract results
    const voltageResults: Record<number, number> = {}
    for (let i = 0; i < numNodes; i++) {
      voltageResults[i] = solution.get([i, 0]) as number
    }

    // Step 9: Calculate currents for all components
    const currentResults: Record<string, number> = {}
    for (const stamper of stampers) {
      const current = stamper.calculateCurrent(
        solution,
        termToNodeIndex,
        allBranchCurrents,
        stampers,
      )
      currentResults[stamper.id] = current
    }

    console.log('Unified DC Analysis completed successfully')
    console.log('Final Voltage Results:', voltageResults)
    console.log('Final Current Results:', currentResults)

    if (useEnhancedSolver && solverMetrics) {
      console.log('Enhanced Solver Metrics:', solverMetrics)
    }

    return {
      voltages: voltageResults,
      currents: currentResults,
      termToNodeIndex,
      solverMetrics,
    }
  } catch (error) {
    console.error('Unified DC analysis failed:', error)
    return null
  }
}

/**
 * Build electrical nodes for Extended MNA (each terminal is its own node initially)
 * BUT: Ground terminals should be grouped into the same electrical node
 */
function buildElectricalNodes(components: CircuitComponent[]) {
  const getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  // EXTENDED MNA APPROACH: Each terminal gets its own electrical node
  // Wires will connect between these nodes as circuit elements
  const electricalNodes: string[][] = []
  const allTerminals: string[] = []

  // Collect all component terminals (except wires and nodes have special handling)
  for (const component of components) {
    if (component.type === 'wire') continue // Wires don't have their own nodes

    const definition = getComponentDefinition(component.type)
    const termIds = (definition?.terminals || []).map((t) => t.id)

    for (const termId of termIds) {
      const globalTermId = getTerminalId(component, termId)
      allTerminals.push(globalTermId)
    }
  }

  // CRITICAL FIX: Group all ground terminals into a single electrical node
  // This ensures all grounds are at the same potential (equipotential)
  const groundTerminals: string[] = []
  const nonGroundTerminals: string[] = []

  for (const terminalId of allTerminals) {
    const [componentId] = terminalId.split(':')
    const component = components.find((c) => c.id === componentId)

    if (component?.type === 'ground') {
      groundTerminals.push(terminalId)
    } else {
      nonGroundTerminals.push(terminalId)
    }
  }

  // Create individual nodes for non-ground terminals
  for (const terminalId of nonGroundTerminals) {
    electricalNodes.push([terminalId])
  }

  // Create ONE node for ALL ground terminals (equipotential)
  if (groundTerminals.length > 0) {
    electricalNodes.push(groundTerminals)
    console.log(
      `🔍 Extended MNA: Grouped ${groundTerminals.length} ground terminals into single node`,
    )
  }

  console.log(`🔍 Extended MNA: Created ${electricalNodes.length} electrical nodes`)
  for (let i = 0; i < electricalNodes.length; i++) {
    if (electricalNodes[i].length === 1) {
      console.log(`  Node ${i}: ${electricalNodes[i][0]}`)
    } else {
      console.log(`  Node ${i}: [${electricalNodes[i].join(', ')}] (equipotential ground)`)
    }
  }

  // Find the ground node (there should be exactly one equipotential ground node)
  const groundNodeIndices: number[] = []

  // Find the electrical node that contains ground terminals
  for (let i = 0; i < electricalNodes.length; i++) {
    const node = electricalNodes[i]
    // Check if this node contains any ground terminals
    const hasGroundTerminal = node.some((terminalId) => {
      const [componentId] = terminalId.split(':')
      const component = components.find((c) => c.id === componentId)
      return component?.type === 'ground'
    })

    if (hasGroundTerminal) {
      groundNodeIndices.push(i)
      console.log(
        `🔍 Extended MNA: Found equipotential ground node ${i} with terminals: [${node.join(', ')}]`,
      )
      break // There should be only one ground node now
    }
  }

  // If no explicit grounds, use ONLY ONE voltage source negative terminal as reference
  // Extended MNA only needs one reference point for the entire connected circuit
  if (groundNodeIndices.length === 0) {
    for (const component of components) {
      if (component.type === 'voltage_source') {
        const vSourceDef = getComponentDefinition('voltage_source')
        if (vSourceDef) {
          const negTerminal = getTerminalId(component, vSourceDef.terminals[1].id)
          // Find which electrical node this terminal belongs to
          for (let i = 0; i < electricalNodes.length; i++) {
            if (electricalNodes[i].includes(negTerminal)) {
              groundNodeIndices.push(i)
              console.log(
                `🔍 Extended MNA: Using single ground reference at node ${i} (${negTerminal})`,
              )
              break // ONLY ONE reference point needed for entire circuit
            }
          }
        }
        break // Stop after finding first voltage source
      }
    }
  }

  console.log(
    `🔍 Extended MNA: Found ${groundNodeIndices.length} ground reference nodes:`,
    groundNodeIndices,
  )

  // Create terminal to node index mapping
  const termToNodeIndex = new Map<string, number>()
  electricalNodes.forEach((node, i) => {
    node.forEach((termId) => termToNodeIndex.set(termId, i))
  })

  // For backward compatibility, return the first ground node as the primary ground
  const groundNodeIndex = groundNodeIndices.length > 0 ? groundNodeIndices[0] : -1

  return { electricalNodes, termToNodeIndex, groundNodeIndex, groundNodeIndices }
}
