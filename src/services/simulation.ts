import type { Circuit, CircuitComponent, Wire } from '@/types/components'
import { zeros, lusolve, matrix, Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'

/**
 * Represents the result of a DC simulation.
 * It's a map where keys are node IDs and values are their calculated voltages.
 */
export interface DC_Result {
  voltages: Record<number, number>
  currents: Record<string, number>
  termToNodeIndex: Map<string, number>
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
 * Wire component stamper - wires as resistive elements that participate in MNA equations
 */
class WireStamper extends ResistiveStamper {
  private branchIndex: number = -1

  constructor(component: CircuitComponent) {
    // Use wire's configured resistance, default to very small value (1μΩ) for realistic modeling
    // This allows wires to participate in simulation without significantly affecting most circuits
    const resistance = (component.properties?.resistance as number) || 1e-6
    super(component.id, component.type, component, resistance)
  }

  public getNodeIndices(nodeMap: Map<string, number>): [number, number] {
    // Wires store connection info differently than standard components
    const props = this.component.properties!
    const startTerminalId = `${props.startComponentId}:${props.startTerminal}`
    const endTerminalId = `${props.endComponentId}:${props.endTerminal}`

    const n1 = nodeMap.get(startTerminalId)
    const n2 = nodeMap.get(endTerminalId)

    if (n1 === undefined || n2 === undefined) {
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

    // For wires connecting different nodes, use standard resistor stamp
    if (n1 !== n2) {
      const g = 1 / this.resistance
      mnaMatrix.set([n1, n1], (mnaMatrix.get([n1, n1]) as number) + g)
      mnaMatrix.set([n2, n2], (mnaMatrix.get([n2, n2]) as number) + g)
      mnaMatrix.set([n1, n2], (mnaMatrix.get([n1, n2]) as number) - g)
      mnaMatrix.set([n2, n1], (mnaMatrix.get([n2, n1]) as number) - g)

      console.log(`Wire ${this.id}: R=${this.resistance}Ω, nodes ${n1}-${n2} (different nodes)`)
      return { branchCurrents: [] }
    }

    // For wires connecting same node, don't add to MNA matrix
    // Current will be calculated using topology analysis after solving
    console.log(
      `Wire ${this.id}: R=${this.resistance}Ω, nodes ${n1}-${n2} (same node, topology analysis)`,
    )
    return { branchCurrents: [] }
  }

  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    const [n1, n2] = this.getNodeIndices(nodeMap)

    // If wire connects different nodes, use standard Ohm's law
    if (n1 !== n2) {
      const v1 = solution.get([n1, 0]) as number
      const v2 = solution.get([n2, 0]) as number
      return (v1 - v2) / this.resistance
    }

    // For wires connecting same node, calculate using topology analysis
    return this.calculateBranchCurrentByKCL(nodeMap, solution, allStampers || [])
  }

  /**
   * Calculate branch current using series current conservation and circuit topology
   * For wires connecting same electrical node, find the current that flows through
   * this physical path by analyzing connected components
   */
  private calculateBranchCurrentByKCL(
    nodeMap: Map<string, number>,
    solution: Matrix,
    allStampers: ComponentStamper[],
  ): number {
    const props = this.component.properties!
    const startComponentId = props.startComponentId as string
    const endComponentId = props.endComponentId as string

    // Strategy: Find a series-connected component and use its current
    // In a series path, all elements have the same current magnitude

    // Check start component first
    const startComponent = allStampers.find((s) => s.id === startComponentId)
    if (
      startComponent &&
      (startComponent.type === 'resistor' || startComponent.type === 'voltage_source')
    ) {
      const current = startComponent.calculateCurrent(solution, nodeMap, [], allStampers)
      if (Math.abs(current) > 1e-12) {
        // Avoid numerical noise
        return Math.abs(current) // Use magnitude for current measurement
      }
    }

    // Check end component
    const endComponent = allStampers.find((s) => s.id === endComponentId)
    if (
      endComponent &&
      (endComponent.type === 'resistor' || endComponent.type === 'voltage_source')
    ) {
      const current = endComponent.calculateCurrent(solution, nodeMap, [], allStampers)
      if (Math.abs(current) > 1e-12) {
        return Math.abs(current)
      }
    }

    // If connected to nodes, trace through the circuit topology
    // Find other wires connected to the same nodes that might carry current
    const [n1, n2] = this.getNodeIndices(nodeMap)
    const nodeIndex = n1 // Since n1 === n2

    // Look for other components connected to this node that have non-zero current
    for (const stamper of allStampers) {
      if (stamper.id === this.id) continue

      // Check if this component is connected to our node
      if (this.isComponentConnectedToNode(stamper, nodeIndex, nodeMap)) {
        if (stamper.type === 'resistor' || stamper.type === 'voltage_source') {
          const current = stamper.calculateCurrent(solution, nodeMap, [], allStampers)
          if (Math.abs(current) > 1e-12) {
            return Math.abs(current)
          }
        }
      }
    }

    // Default: return 0 if no current path can be determined
    return 0
  }

  /**
   * Check if a component is connected to a specific electrical node
   */
  private isComponentConnectedToNode(
    component: ComponentStamper,
    nodeIndex: number,
    nodeMap: Map<string, number>,
  ): boolean {
    if (component.type === 'wire') {
      const wire = component as WireStamper
      const [n1, n2] = wire.getNodeIndices(nodeMap)
      return n1 === nodeIndex || n2 === nodeIndex
    } else if (component.type === 'resistor' || component.type === 'voltage_source') {
      // For other components, check their terminals using component ID
      const definition = getComponentDefinition(component.type)
      if (definition) {
        for (const terminal of definition.terminals) {
          const terminalId = `${component.id}:${terminal.id}`
          const termNodeIndex = nodeMap.get(terminalId)
          if (termNodeIndex === nodeIndex) {
            return true
          }
        }
      }
    }
    return false
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
 * New unified DC analysis using component stamping approach
 */
export async function solveDC(circuit: Circuit): Promise<DC_Result | null> {
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

    // First pass: count how many branch currents each component will need
    for (const stamper of stampers) {
      if (stamper.type === 'voltage_source') {
        totalBranchCurrents += 1 // Each voltage source adds one branch current
      }
      // Note: Same-node wires don't add branch currents to MNA matrix
      // Their currents are calculated using topology analysis after solving
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

    // Step 6: Apply ground constraints for all isolated circuits
    console.log('Applying ground constraints for nodes:', groundNodeIndices)
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

    // Step 7: Solve the system
    const solution = lusolve(mnaMatrix, rhsVector) as Matrix

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

    return {
      voltages: voltageResults,
      currents: currentResults,
      termToNodeIndex,
    }
  } catch (error) {
    console.error('Unified DC analysis failed:', error)
    return null
  }
}

/**
 * Build electrical nodes (extracted from original logic)
 */
function buildElectricalNodes(components: CircuitComponent[]) {
  const wires = components.filter((c) => c.type === 'wire') as Wire[]
  const getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

  // Build adjacency list
  const adj: Record<string, string[]> = {}

  for (const component of components) {
    if (component.type === 'wire' || component.type === 'node') continue
    const definition = getComponentDefinition(component.type)
    const termIds = (definition?.terminals || []).map((t) => t.id)
    for (const termId of termIds) {
      const globalTermId = getTerminalId(component, termId)
      if (!adj[globalTermId]) adj[globalTermId] = []
    }
  }

  for (const wire of wires) {
    if (!wire.properties) continue
    const props = wire.properties

    const startComp = components.find((c) => c.id === props.startComponentId)
    const endComp = components.find((c) => c.id === props.endComponentId)
    if (!startComp || !endComp) continue

    const startTerminalId = getTerminalId(startComp, props.startTerminal as string)
    const endTerminalId = getTerminalId(endComp, props.endTerminal as string)

    if (!adj[startTerminalId]) adj[startTerminalId] = []
    if (!adj[endTerminalId]) adj[endTerminalId] = []
    adj[startTerminalId].push(endTerminalId)
    adj[endTerminalId].push(startTerminalId)
  }

  // Find connected components (electrical nodes)
  const visited = new Set<string>()
  const electricalNodes: string[][] = []

  for (const termId in adj) {
    if (!visited.has(termId)) {
      const newNode: string[] = []
      const q = [termId]
      visited.add(termId)
      let head = 0

      while (head < q.length) {
        const current = q[head++]
        newNode.push(current)
        for (const neighbor of adj[current]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            q.push(neighbor)
          }
        }
      }
      electricalNodes.push(newNode)
    }
  }

  // Find all ground nodes and identify circuit islands
  const groundNodeIndices: number[] = []

  // First, find all explicit ground nodes
  electricalNodes.forEach((node, index) => {
    if (node.some((termId) => termId.includes('ground'))) {
      groundNodeIndices.push(index)
    }
  })

  // If no explicit grounds, find reference nodes for each isolated circuit
  if (groundNodeIndices.length === 0) {
    // Identify isolated circuits by finding nodes connected to voltage sources
    const voltageSourceNodes = new Set<number>()

    for (const component of components) {
      if (component.type === 'voltage_source') {
        const vSourceDef = getComponentDefinition('voltage_source')
        if (vSourceDef) {
          const negTerminal = getTerminalId(component, vSourceDef.terminals[1].id)
          // Find which electrical node this terminal belongs to
          for (let i = 0; i < electricalNodes.length; i++) {
            if (electricalNodes[i].includes(negTerminal)) {
              if (!voltageSourceNodes.has(i)) {
                voltageSourceNodes.add(i)
                groundNodeIndices.push(i)
              }
              break
            }
          }
        }
      }
    }
  }

  // Create terminal to node index mapping
  const termToNodeIndex = new Map<string, number>()
  electricalNodes.forEach((node, i) => {
    node.forEach((termId) => termToNodeIndex.set(termId, i))
  })

  // For backward compatibility, return the first ground node as the primary ground
  const groundNodeIndex = groundNodeIndices.length > 0 ? groundNodeIndices[0] : -1

  return { electricalNodes, termToNodeIndex, groundNodeIndex, groundNodeIndices }
}
