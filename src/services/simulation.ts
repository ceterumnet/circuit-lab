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
  /** Floating node warnings for UI display */
  floatingNodeWarnings?: string[]
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
 * Current source component stamper
 */
class CurrentSourceStamper implements ComponentStamper {
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
    nextBranchIndex: number,
  ): StampResult {
    const [n1, n2] = this.getNodeIndices(nodeMap)

    // Current source MNA stamp - inject current into RHS vector
    // Current flows from n1 to n2 (out of positive terminal, into negative terminal)
    // KCL: I_out = -I_in, so we add current to positive node and subtract from negative node
    const currentRhs = rhsVector.size()[0] as number

    // Add current injection to positive terminal (current flows out)
    rhsVector.set([n1, 0], (rhsVector.get([n1, 0]) as number) + this.current)

    // Subtract current injection from negative terminal (current flows in)
    rhsVector.set([n2, 0], (rhsVector.get([n2, 0]) as number) - this.current)

    console.log(`Current Source ${this.id}: I=${this.current}A, nodes ${n1}-${n2}, injected to RHS`)
    return { branchCurrents: [] } // Current sources don't introduce branch current variables
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // Current source current is fixed by definition
    return this.current
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
 * Switch component stamper - Models switch as variable resistance
 */
class SwitchStamper extends ResistiveStamper {
  constructor(component: CircuitComponent) {
    // Switch resistance based on state: Open = high resistance (1GΩ), Closed = low resistance (1mΩ)
    const isOpen = component.properties?.isOpen === true // Default to closed (safer for circuits)
    const resistance = isOpen ? 1e9 : 1e-3 // 1GΩ for open, 1mΩ for closed
    super(component.id, component.type, component, resistance)
    console.log(`Switch ${component.id}: ${isOpen ? 'OPEN' : 'CLOSED'} (R=${resistance}Ω)`)
  }
}

/**
 * Variable resistor component stamper - Models as adjustable resistance
 */
class VariableResistorStamper extends ResistiveStamper {
  constructor(component: CircuitComponent) {
    // Use the current resistance value, with bounds checking
    const resistance = (component.properties?.resistance as number) || 5000
    const minResistance = (component.properties?.minResistance as number) || 0
    const maxResistance = (component.properties?.maxResistance as number) || 10000

    // Clamp resistance within bounds
    const clampedResistance = Math.max(minResistance, Math.min(maxResistance, resistance))

    super(component.id, component.type, component, clampedResistance)
    console.log(
      `VariableResistor ${component.id}: R=${clampedResistance}Ω (${minResistance}-${maxResistance}Ω range)`,
    )
  }
}

/**
 * Potentiometer component stamper - Models as two resistors in series with wiper tap
 */
class PotentiometerStamper implements ComponentStamper {
  public id: string
  public type: string
  private totalResistance: number
  private wiperPosition: number // 0-100%
  private r1: number // Resistance from terminal1 to wiper
  private r2: number // Resistance from wiper to terminal2

  constructor(private component: CircuitComponent) {
    this.id = component.id
    this.type = component.type
    this.totalResistance = (component.properties?.totalResistance as number) || 10000
    this.wiperPosition = (component.properties?.wiperPosition as number) || 50 // Default to center

    // Calculate resistances: R1 = wiperPosition% of total, R2 = remaining
    this.r1 = (this.wiperPosition / 100) * this.totalResistance
    this.r2 = this.totalResistance - this.r1

    // Ensure minimum resistance to avoid numerical issues
    this.r1 = Math.max(this.r1, 1e-6)
    this.r2 = Math.max(this.r2, 1e-6)

    console.log(
      `Potentiometer ${this.id}: R1=${this.r1.toFixed(1)}Ω, R2=${this.r2.toFixed(1)}Ω (${this.wiperPosition}% position)`,
    )
  }

  private getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  private getNodeIndices(nodeMap: Map<string, number>): [number, number, number] {
    const definition = getComponentDefinition(this.component.type)!
    const n1 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[0].id))! // terminal1
    const n2 = nodeMap.get(this.getTerminalId(this.component, definition.terminals[1].id))! // terminal2
    const nWiper = nodeMap.get(this.getTerminalId(this.component, definition.terminals[2].id))! // wiper
    return [n1, n2, nWiper]
  }

  stampDC(
    mnaMatrix: Matrix,
    rhsVector: Matrix,
    nodeMap: Map<string, number>,
    nextBranchIndex: number,
  ): StampResult {
    const [n1, n2, nWiper] = this.getNodeIndices(nodeMap)

    // Stamp two resistors: R1 between terminal1 and wiper, R2 between wiper and terminal2
    const g1 = 1 / this.r1 // Conductance from terminal1 to wiper
    const g2 = 1 / this.r2 // Conductance from wiper to terminal2

    // R1 stamp: terminal1 to wiper
    mnaMatrix.set([n1, n1], (mnaMatrix.get([n1, n1]) as number) + g1)
    mnaMatrix.set([nWiper, nWiper], (mnaMatrix.get([nWiper, nWiper]) as number) + g1)
    mnaMatrix.set([n1, nWiper], (mnaMatrix.get([n1, nWiper]) as number) - g1)
    mnaMatrix.set([nWiper, n1], (mnaMatrix.get([nWiper, n1]) as number) - g1)

    // R2 stamp: wiper to terminal2
    mnaMatrix.set([nWiper, nWiper], (mnaMatrix.get([nWiper, nWiper]) as number) + g2)
    mnaMatrix.set([n2, n2], (mnaMatrix.get([n2, n2]) as number) + g2)
    mnaMatrix.set([nWiper, n2], (mnaMatrix.get([nWiper, n2]) as number) - g2)
    mnaMatrix.set([n2, nWiper], (mnaMatrix.get([n2, nWiper]) as number) - g2)

    console.log(
      `Potentiometer ${this.id}: G1=${g1.toExponential(3)}S, G2=${g2.toExponential(3)}S, nodes ${n1}-${nWiper}-${n2}`,
    )
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // Return current through R1 (terminal1 to wiper) as the main current
    const [n1, n2, nWiper] = this.getNodeIndices(nodeMap)
    const v1 = solution.get([n1, 0]) as number
    const vWiper = solution.get([nWiper, 0]) as number
    return (v1 - vWiper) / this.r1
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
    ['current_source', CurrentSourceStamper],
    ['switch', SwitchStamper],
    ['variable_resistor', VariableResistorStamper],
    ['potentiometer', PotentiometerStamper],
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
 * Detect potential floating nodes and provide educational warnings
 * Special handling for switches: open switches create expected floating nodes
 */
function detectFloatingNodes(
  components: CircuitComponent[],
  termToNodeIndex: Map<string, number>,
  groundNodeIndices: number[],
): { floatingNodes: number[]; warnings: string[]; switchCausedFloating: boolean } {
  const floatingNodes: number[] = []
  const warnings: string[] = []
  let switchCausedFloating = false

  // Build a set of all node indices
  const allNodes = new Set<number>()
  for (const nodeIndex of termToNodeIndex.values()) {
    allNodes.add(nodeIndex)
  }

  console.log(`🔍 Building circuit connectivity graph for floating node detection`)
  console.log(`🔍 Total nodes: ${allNodes.size}, Ground nodes: [${groundNodeIndices.join(', ')}]`)

  // Build connectivity graph: node -> Set of directly connected nodes
  const connectivity = new Map<number, Set<number>>()
  for (const nodeIndex of allNodes) {
    connectivity.set(nodeIndex, new Set<number>())
  }

  // Add edges for each component that provides DC connectivity
  for (const component of components) {
    let node1: number | undefined
    let node2: number | undefined

    if (component.type === 'voltage_source' || component.type === 'current_source') {
      // Sources provide strong DC connectivity
      const definition = getComponentDefinition(component.type)!
      const term1Id = `${component.id}:${definition.terminals[0].id}`
      const term2Id = `${component.id}:${definition.terminals[1].id}`
      node1 = termToNodeIndex.get(term1Id)
      node2 = termToNodeIndex.get(term2Id)
      console.log(`🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${node2}`)
    } else if (component.type === 'resistor') {
      // Resistors provide DC connectivity
      const definition = getComponentDefinition(component.type)!
      const term1Id = `${component.id}:${definition.terminals[0].id}`
      const term2Id = `${component.id}:${definition.terminals[1].id}`
      node1 = termToNodeIndex.get(term1Id)
      node2 = termToNodeIndex.get(term2Id)
      console.log(`🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${node2}`)
    } else if (component.type === 'wire') {
      // Wires provide DC connectivity
      if (component.properties) {
        const startCompId = component.properties.startComponentId as string
        const startTermId = component.properties.startTerminal as string
        const endCompId = component.properties.endComponentId as string
        const endTermId = component.properties.endTerminal as string
        const term1Id = `${startCompId}:${startTermId}`
        const term2Id = `${endCompId}:${endTermId}`
        node1 = termToNodeIndex.get(term1Id)
        node2 = termToNodeIndex.get(term2Id)
        console.log(`🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${node2}`)
      }
    } else if (component.type === 'switch') {
      // Only closed switches provide DC connectivity
      const isOpen = component.properties?.isOpen === true
      if (!isOpen) {
        const definition = getComponentDefinition(component.type)!
        const term1Id = `${component.id}:${definition.terminals[0].id}`
        const term2Id = `${component.id}:${definition.terminals[1].id}`
        node1 = termToNodeIndex.get(term1Id)
        node2 = termToNodeIndex.get(term2Id)
        console.log(`🔍 ${component.type} ${component.id} (CLOSED): nodes ${node1} ↔ ${node2}`)
      } else {
        console.log(`🔍 ${component.type} ${component.id} (OPEN): no connectivity`)
        switchCausedFloating = true
      }
    } else if (component.type === 'variable_resistor') {
      // Variable resistors provide DC connectivity between their terminals
      const definition = getComponentDefinition(component.type)!
      const term1Id = `${component.id}:${definition.terminals[0].id}`
      const term2Id = `${component.id}:${definition.terminals[1].id}`
      node1 = termToNodeIndex.get(term1Id)
      node2 = termToNodeIndex.get(term2Id)
      console.log(`🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${node2}`)
    } else if (component.type === 'potentiometer') {
      // Potentiometers provide DC connectivity between all three terminals
      const definition = getComponentDefinition(component.type)!
      const term1Id = `${component.id}:${definition.terminals[0].id}` // terminal1
      const term2Id = `${component.id}:${definition.terminals[1].id}` // terminal2
      const wiperTermId = `${component.id}:${definition.terminals[2].id}` // wiper

      const node1 = termToNodeIndex.get(term1Id)
      const node2 = termToNodeIndex.get(term2Id)
      const nodeWiper = termToNodeIndex.get(wiperTermId)

      console.log(
        `🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${nodeWiper} ↔ ${node2}`,
      )

      // Add connectivity: terminal1 ↔ wiper ↔ terminal2
      if (node1 !== undefined && nodeWiper !== undefined) {
        connectivity.get(node1)!.add(nodeWiper)
        connectivity.get(nodeWiper)!.add(node1)
      }
      if (nodeWiper !== undefined && node2 !== undefined) {
        connectivity.get(nodeWiper)!.add(node2)
        connectivity.get(node2)!.add(nodeWiper)
      }

      // Skip the standard two-terminal connectivity logic below
      continue
    }

    // Add bidirectional connectivity
    if (node1 !== undefined && node2 !== undefined) {
      connectivity.get(node1)!.add(node2)
      connectivity.get(node2)!.add(node1)
    }
  }

  // Use graph traversal (BFS) from ground nodes to find all reachable nodes
  const reachableFromGround = new Set<number>()
  const queue: number[] = [...groundNodeIndices]

  // Initialize with ground nodes
  for (const groundNode of groundNodeIndices) {
    reachableFromGround.add(groundNode)
  }

  console.log(`🔍 Starting BFS traversal from ground nodes: [${groundNodeIndices.join(', ')}]`)

  // BFS traversal
  while (queue.length > 0) {
    const currentNode = queue.shift()!
    const neighbors = connectivity.get(currentNode)!

    for (const neighbor of neighbors) {
      if (!reachableFromGround.has(neighbor)) {
        console.log(`🔍 BFS: ${currentNode} → ${neighbor}`)
        reachableFromGround.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  console.log(
    `🔍 Nodes reachable from ground: [${Array.from(reachableFromGround).sort().join(', ')}]`,
  )

  // Find floating nodes (nodes not reachable from ground)
  for (const nodeIndex of allNodes) {
    if (!reachableFromGround.has(nodeIndex)) {
      floatingNodes.push(nodeIndex)

      // Find which component terminals are on this floating node
      const floatingTerminals: string[] = []
      for (const [terminalId, termNodeIndex] of termToNodeIndex.entries()) {
        if (termNodeIndex === nodeIndex) {
          floatingTerminals.push(terminalId)
        }
      }

      console.log(
        `🔍 FLOATING NODE DETECTED: ${nodeIndex} with terminals: [${floatingTerminals.join(', ')}]`,
      )

      if (switchCausedFloating) {
        warnings.push(
          `ℹ️  Open switch created floating node ${nodeIndex} with terminals: [${floatingTerminals.join(', ')}]`,
        )
        warnings.push(
          `   This is expected behavior when switches are open. GMIN stabilization applied.`,
        )
      } else {
        warnings.push(
          `⚠️  Potential floating node ${nodeIndex} with terminals: [${floatingTerminals.join(', ')}]`,
        )
        warnings.push(
          `   Floating nodes have undefined voltage in real circuits. GMIN stabilization applied.`,
        )
      }
    }
  }

  // ADDITIONAL CHECK: Detect incomplete current loops (educational warning)
  // This finds nodes that are electrically connected but lack complete current paths
  console.log(`🔍 Checking for incomplete current loops...`)

  // For each voltage/current source, verify all reachable nodes have return paths
  for (const component of components) {
    if (component.type === 'voltage_source' || component.type === 'current_source') {
      const definition = getComponentDefinition(component.type)!
      const posTermId = `${component.id}:${definition.terminals[0].id}`
      const negTermId = `${component.id}:${definition.terminals[1].id}`
      const posNode = termToNodeIndex.get(posTermId)
      const negNode = termToNodeIndex.get(negTermId)

      if (posNode !== undefined && negNode !== undefined) {
        // Check if there are multiple independent paths between source terminals
        // If we remove the direct source connection, can we still reach from pos to neg?
        const tempConnectivity = new Map<number, Set<number>>()
        for (const [node, neighbors] of connectivity.entries()) {
          tempConnectivity.set(node, new Set(neighbors))
        }

        // Remove the direct source connection temporarily
        tempConnectivity.get(posNode)!.delete(negNode)
        tempConnectivity.get(negNode)!.delete(posNode)

        // Try to find alternative path from pos to neg (excluding direct source connection)
        const visited = new Set<number>()
        const queue = [posNode]
        visited.add(posNode)
        let hasAlternatePath = false

        while (queue.length > 0 && !hasAlternatePath) {
          const currentNode = queue.shift()!
          const neighbors = tempConnectivity.get(currentNode)!

          for (const neighbor of neighbors) {
            if (neighbor === negNode) {
              hasAlternatePath = true
              console.log(
                `🔍 Found complete circuit path: ${component.type} ${component.id} has return path`,
              )
              break
            }
            if (!visited.has(neighbor)) {
              visited.add(neighbor)
              queue.push(neighbor)
            }
          }
        }

        // ALWAYS check for dead-end nodes, even if main path exists
        // This detects partial dead-ends where some branches have no return path
        console.log(`🔍 Checking for dead-end branches from ${component.type} ${component.id}...`)

        const deadEndNodes = new Set<number>()

        // Build reachable nodes from positive terminal (excluding direct source connection)
        const reachableFromPos = new Set<number>()
        const posQueue = [posNode]
        reachableFromPos.add(posNode)

        while (posQueue.length > 0) {
          const currentNode = posQueue.shift()!
          const neighbors = tempConnectivity.get(currentNode) || new Set<number>()

          for (const neighbor of neighbors) {
            if (!reachableFromPos.has(neighbor)) {
              reachableFromPos.add(neighbor)
              posQueue.push(neighbor)
            }
          }
        }

        // Enhanced dead-end detection: Check for nodes with degree-1 connectivity
        // (only one electrical connection) that create current flow impossibilities
        for (const node of reachableFromPos) {
          if (node === posNode || node === negNode) continue // Skip source terminals

          const nodeConnections = tempConnectivity.get(node) || new Set<number>()

          // Check if this is a terminal node (degree-1) that can't complete current loop
          if (nodeConnections.size <= 1) {
            // This is a dead-end: current can flow TO this node but has no exit path
            deadEndNodes.add(node)
            console.log(
              `🔍 DEAD-END DETECTED: Node ${node} has only ${nodeConnections.size} connection(s) - current cannot exit`,
            )
            continue
          }

          // For nodes with multiple connections, verify they can reach negative terminal
          // via a path that doesn't backtrack through the same route
          let foundIndependentPath = false

          // Try each neighbor as a potential path back to negative
          for (const neighbor of nodeConnections) {
            // Create a modified connectivity that doesn't allow backtracking to this node
            const noBacktrackConnectivity = new Map<number, Set<number>>()
            for (const [n, connections] of tempConnectivity.entries()) {
              noBacktrackConnectivity.set(n, new Set(connections))
            }

            // Remove the edge back to current node to prevent backtracking
            noBacktrackConnectivity.get(neighbor)?.delete(node)

            // Try to reach negative terminal from this neighbor
            const visited = new Set<number>([node]) // Don't revisit the starting node
            const queue: number[] = [neighbor]
            visited.add(neighbor)

            while (queue.length > 0) {
              const currentNode: number = queue.shift()!

              if (currentNode === negNode) {
                foundIndependentPath = true
                break
              }

              const connections = noBacktrackConnectivity.get(currentNode) || new Set<number>()
              for (const conn of connections) {
                if (!visited.has(conn)) {
                  visited.add(conn)
                  queue.push(conn)
                }
              }
            }

            if (foundIndependentPath) {
              break // Found a valid return path
            }
          }

          if (!foundIndependentPath) {
            deadEndNodes.add(node)
            console.log(
              `🔍 DEAD-END DETECTED: Node ${node} cannot reach negative terminal without backtracking`,
            )
          }
        }

        // Report dead-end nodes
        for (const deadEndNode of deadEndNodes) {
          // Find terminals on this dead-end node
          const deadEndTerminals: string[] = []
          for (const [terminalId, termNodeIndex] of termToNodeIndex.entries()) {
            if (termNodeIndex === deadEndNode) {
              deadEndTerminals.push(terminalId)
            }
          }

          console.log(
            `🔍 DEAD-END NODE: ${deadEndNode} with terminals: [${deadEndTerminals.join(', ')}]`,
          )

          floatingNodes.push(deadEndNode)
          warnings.push(
            `⚠️  Incomplete circuit: Node ${deadEndNode} with terminals [${deadEndTerminals.join(', ')}] has no return path to ${component.type} ${component.id}`,
          )
          warnings.push(
            `   This creates an incomplete current loop. GMIN stabilization applied for DC analysis.`,
          )
        }

        if (!hasAlternatePath && deadEndNodes.size === 0) {
          console.log(
            `🔍 INCOMPLETE CIRCUIT DETECTED: ${component.type} ${component.id} has no return path`,
          )
        }
      }
    }
  }

  if (floatingNodes.length === 0) {
    console.log('✅ No floating nodes detected - all nodes have DC paths to ground')
  }

  return { floatingNodes, warnings, switchCausedFloating }
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

    // Step 1.5: Detect floating nodes and provide educational warnings
    const floatingAnalysis = detectFloatingNodes(components, termToNodeIndex, groundNodeIndices)
    if (floatingAnalysis.floatingNodes.length > 0) {
      console.warn('🔍 Floating Node Analysis:')
      for (const warning of floatingAnalysis.warnings) {
        console.warn(warning)
      }
    } else {
      console.log('✅ No floating nodes detected - all nodes have DC paths to ground')
    }

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

    // Step 5.5: Add GMIN conductance for floating node stability (Professional SPICE approach)
    // This prevents floating nodes from having arbitrary voltages by adding tiny conductance to ground
    const GMIN = 1e-12 // 1 TΩ resistance to ground (1 pS conductance) - professional SPICE standard
    let floatingNodeCount = 0

    for (let nodeIndex = 0; nodeIndex < numNodes; nodeIndex++) {
      // Skip ground nodes - they're already constrained to 0V
      if (!groundNodeIndices.includes(nodeIndex)) {
        // Add tiny conductance from this node to ground
        // This ensures all floating nodes settle near ground potential (realistic physics)
        mnaMatrix.set(
          [nodeIndex, nodeIndex],
          (mnaMatrix.get([nodeIndex, nodeIndex]) as number) + GMIN,
        )
        floatingNodeCount++
      }
    }

    console.log(
      `🔧 Applied GMIN stabilization: Added ${GMIN.toExponential(1)}S conductance to ${floatingNodeCount} non-ground nodes`,
    )
    console.log(
      '   This ensures floating nodes behave realistically (settle near ground potential)',
    )

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
      floatingNodeWarnings: floatingAnalysis.warnings,
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
