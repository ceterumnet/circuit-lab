import type { Circuit, CircuitComponent, Wire } from '@/types/components'
import { zeros, lusolve, matrix, Matrix } from 'mathjs'
import { getComponentDefinition } from '@/registry/components'
import { EnhancedMNASolver, NewtonRaphsonSolver, type NonLinearStamper } from './numerical-solver'
import { DiodeStamper, ComponentStamperFactory, type ComponentStamper } from '@/services/stampers'
import { WireStamper } from '@/services/stampers/linear/WireStamper'

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
    } else if (component.type === 'diode' || component.type === 'led') {
      // Diodes and LEDs provide DC connectivity (forward-biased behavior)
      // For floating node detection, treat them as providing electrical continuity
      const definition = getComponentDefinition(component.type)!
      const term1Id = `${component.id}:${definition.terminals[0].id}` // anode
      const term2Id = `${component.id}:${definition.terminals[1].id}` // cathode
      node1 = termToNodeIndex.get(term1Id)
      node2 = termToNodeIndex.get(term2Id)
      console.log(`🔍 ${component.type} ${component.id}: nodes ${node1} ↔ ${node2}`)
    } else if (component.type === 'bjt_npn' || component.type === 'bjt_pnp') {
      // BJTs provide DC connectivity between all three terminals
      // For floating node detection, treat them as providing electrical continuity
      const definition = getComponentDefinition(component.type)!
      const baseTermId = `${component.id}:${definition.terminals[0].id}` // base
      const collectorTermId = `${component.id}:${definition.terminals[1].id}` // collector
      const emitterTermId = `${component.id}:${definition.terminals[2].id}` // emitter

      const baseNode = termToNodeIndex.get(baseTermId)
      const collectorNode = termToNodeIndex.get(collectorTermId)
      const emitterNode = termToNodeIndex.get(emitterTermId)

      console.log(
        `🔍 ${component.type} ${component.id}: nodes base=${baseNode}, collector=${collectorNode}, emitter=${emitterNode}`,
      )

      // Add connectivity: base ↔ collector ↔ emitter (three-terminal device)
      // For floating node detection, treat as providing paths between all terminals
      if (baseNode !== undefined && collectorNode !== undefined) {
        connectivity.get(baseNode)!.add(collectorNode)
        connectivity.get(collectorNode)!.add(baseNode)
      }
      if (collectorNode !== undefined && emitterNode !== undefined) {
        connectivity.get(collectorNode)!.add(emitterNode)
        connectivity.get(emitterNode)!.add(collectorNode)
      }
      if (baseNode !== undefined && emitterNode !== undefined) {
        connectivity.get(baseNode)!.add(emitterNode)
        connectivity.get(emitterNode)!.add(baseNode)
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
    // Clear wire recursion state before each simulation
    WireStamper.clearRecursionState()

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

    // Step 2: Create component stampers and separate linear vs non-linear

    const stampers: ComponentStamper[] = []
    const nonLinearStampers: NonLinearStamper[] = []

    for (const component of components) {
      try {
        const stamper = ComponentStamperFactory.createStamper(component)
        stampers.push(stamper)

        // Check if this is also a non-linear component
        if (component.type === 'diode' || component.type === 'led') {
          nonLinearStampers.push(stamper as ComponentStamper & NonLinearStamper)
        }
      } catch (error) {
        console.warn(`Skipping component ${component.id}: ${error}`)
      }
    }

    const hasNonLinearComponents = nonLinearStampers.length > 0
    console.log(`Found ${nonLinearStampers.length} non-linear components`)
    if (hasNonLinearComponents) {
      console.log(
        'Non-linear components detected:',
        nonLinearStampers.map((s) => `${s.type} ${s.id}`),
      )
    }

    // Step 3: Determine total number of branch currents needed
    let totalBranchCurrents = 0
    const numNodes = electricalNodes.length

    // PURE MNA: Only components that genuinely need branch currents add them to the MNA matrix
    // Passive components (resistors, wires) use G-matrix stamping - no branch currents needed
    for (const stamper of stampers) {
      if (stamper.type === 'voltage_source') {
        totalBranchCurrents += 1 // Each voltage source adds one branch current
      }
      // REMOVED: Wire branch current counting - wires now use G-matrix stamping
      // Other components (resistors, wires, grounds, nodes) don't add branch currents
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

    // Step 7: Solve the system - Linear vs Non-Linear
    let solution: Matrix
    let solverMetrics: DC_Result['solverMetrics']

    const solveStartTime = performance.now()

    if (hasNonLinearComponents) {
      console.log('🎯 Using Load Line Intersection approach for non-linear DC analysis...')

      // ARCHITECTURE COMPLIANCE: Try direct Load Line solution first (SPICE-like)
      // For simple circuits, this should eliminate the need for Newton-Raphson

      // CRITICAL FIX: Provide all stampers to diode stampers for proper circuit analysis
      for (const stamper of nonLinearStampers) {
        if (stamper.type === 'diode' || stamper.type === 'led') {
          const diodeStamper = stamper as DiodeStamper
          diodeStamper.setAllStampers(stampers)
        }
      }

      // Create the full system including Load Line pre-solved diodes
      const fullMatrix = matrix(zeros(matrixSize, matrixSize))
      const fullRhs = matrix(zeros(matrixSize, 1))

      // Stamp all components (including diodes using Load Line approach)
      let nextFullBranchIndex = numNodes
      const fullBranchCurrents: number[] = []

      for (const stamper of stampers) {
        if (stamper.type === 'diode' || stamper.type === 'led') {
          // For diodes, use Load Line pre-calculation in stampLinearized
          // This requires a dummy solution vector for the analysis
          const dummySolution = matrix(zeros(matrixSize, 1))
          const diodeStamper = stamper as DiodeStamper
          diodeStamper.stampLinearized(
            fullMatrix,
            fullRhs,
            termToNodeIndex,
            dummySolution,
            stampers,
          )
        } else {
          // Standard linear component stamping
          const result = stamper.stampDC(fullMatrix, fullRhs, termToNodeIndex, nextFullBranchIndex)
          fullBranchCurrents.push(...result.branchCurrents)
          nextFullBranchIndex += result.branchCurrents.length
        }
      }

      // Apply GMIN and ground constraints
      const GMIN = 1e-12
      for (let nodeIndex = 0; nodeIndex < numNodes; nodeIndex++) {
        if (!groundNodeIndices.includes(nodeIndex)) {
          fullMatrix.set(
            [nodeIndex, nodeIndex],
            (fullMatrix.get([nodeIndex, nodeIndex]) as number) + GMIN,
          )
        }
      }

      if (useEnhancedSolver) {
        EnhancedMNASolver.applyGroundConstraintsEnhanced(fullMatrix, fullRhs, groundNodeIndices)
      } else {
        for (const groundIndex of groundNodeIndices) {
          for (let i = 0; i < matrixSize; i++) {
            fullMatrix.set([groundIndex, i], 0)
            fullMatrix.set([i, groundIndex], 0)
          }
          fullMatrix.set([groundIndex, groundIndex], 1)
          fullRhs.set([groundIndex, 0], 0)
        }
      }

      // Try direct linear solve with Load Line pre-calculated diodes
      try {
        if (useEnhancedSolver) {
          console.log('🔍 Attempting Load Line + Enhanced Linear Solver...')
          const enhancedSolver = new EnhancedMNASolver({
            tolerance: 1e-12,
            useMatrixConditioning: true,
            useIterativeRefinement: true,
            enablePrecisionMonitoring: false,
          })

          const solverResult = enhancedSolver.solve(fullMatrix, fullRhs)
          solution = solverResult.solution

          solverMetrics = {
            conditionNumber: solverResult.conditionNumber,
            refinementIterations: solverResult.refinementIterations,
            significantDigits: solverResult.precisionMetrics?.significantDigits,
            solveTime: performance.now() - solveStartTime,
          }

          console.log('✅ Load Line + Linear solver succeeded - no Newton-Raphson needed!')
        } else {
          console.log('📐 Attempting Load Line + Basic Linear Solver...')
          solution = lusolve(fullMatrix, fullRhs) as Matrix
          solverMetrics = {
            solveTime: performance.now() - solveStartTime,
          }
          console.log('✅ Load Line + Basic linear solver succeeded!')
        }
      } catch (error) {
        console.warn('⚠️ Load Line + Linear solver failed, falling back to Newton-Raphson...')
        console.warn('Error:', error)

        // Fallback to Newton-Raphson if direct approach fails
        // This maintains compatibility with complex multi-diode circuits
        console.log('🔥 Using Newton-Raphson Solver as fallback...')

        // Create linear system (matrix without non-linear components)
        const linearMatrix = matrix(zeros(matrixSize, matrixSize))
        const linearRhs = matrix(zeros(matrixSize, 1))

        // Stamp only linear components
        let nextLinearBranchIndex = numNodes
        const linearBranchCurrents: number[] = []

        for (const stamper of stampers) {
          // Skip non-linear components for linear stamping
          if (stamper.type !== 'diode' && stamper.type !== 'led') {
            const result = stamper.stampDC(
              linearMatrix,
              linearRhs,
              termToNodeIndex,
              nextLinearBranchIndex,
            )
            linearBranchCurrents.push(...result.branchCurrents)
            nextLinearBranchIndex += result.branchCurrents.length
          }
        }

        // Apply GMIN and ground constraints to linear system
        for (let nodeIndex = 0; nodeIndex < numNodes; nodeIndex++) {
          if (!groundNodeIndices.includes(nodeIndex)) {
            linearMatrix.set(
              [nodeIndex, nodeIndex],
              (linearMatrix.get([nodeIndex, nodeIndex]) as number) + GMIN,
            )
          }
        }

        if (useEnhancedSolver) {
          EnhancedMNASolver.applyGroundConstraintsEnhanced(
            linearMatrix,
            linearRhs,
            groundNodeIndices,
          )
        } else {
          for (const groundIndex of groundNodeIndices) {
            for (let i = 0; i < matrixSize; i++) {
              linearMatrix.set([groundIndex, i], 0)
              linearMatrix.set([i, groundIndex], 0)
            }
            linearMatrix.set([groundIndex, groundIndex], 1)
            linearRhs.set([groundIndex, 0], 0)
          }
        }

        // Solve with Newton-Raphson fallback
        const newtonSolver = new NewtonRaphsonSolver({
          maxIterations: 50, // Fewer iterations since Load Line should provide good starting point
          convergenceTolerance: 1e-6, // Tighter tolerance for better accuracy
          dampingFactor: 0.7,
          useAdaptiveDamping: true,
          tolerance: 1e-12,
          useMatrixConditioning: true,
          useIterativeRefinement: true,
          enablePrecisionMonitoring: false,
        })

        const newtonResult = newtonSolver.solve(
          linearMatrix,
          linearRhs,
          groundNodeIndices,
          nonLinearStampers,
          termToNodeIndex,
          undefined, // initialGuess
          stampers, // allStampers for parameter scaling
        )

        solution = newtonResult.solution

        solverMetrics = {
          conditionNumber: newtonResult.linearSolverMetrics?.conditionNumber,
          refinementIterations: newtonResult.linearSolverMetrics?.refinementIterations,
          significantDigits: newtonResult.linearSolverMetrics?.precisionMetrics?.significantDigits,
          solveTime: performance.now() - solveStartTime,
        }

        if (newtonResult.converged) {
          console.log(
            `✅ Newton-Raphson fallback converged in ${newtonResult.iterations} iterations`,
          )
          console.log(`   Final residual: ${newtonResult.residualNorm.toExponential(2)}`)
        } else {
          console.warn(
            `❌ Newton-Raphson fallback failed after ${newtonResult.iterations} iterations`,
          )
          console.warn(`   Final residual: ${newtonResult.residualNorm.toExponential(2)}`)
        }
      }
    } else if (useEnhancedSolver) {
      console.log('🔍 Using Enhanced MNA Solver for linear DC analysis...')
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

      console.log('✅ Enhanced linear solver completed successfully')
    } else {
      console.log('📐 Using basic linear solver...')
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
