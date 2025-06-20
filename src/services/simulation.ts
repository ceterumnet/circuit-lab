import type { Circuit, CircuitComponent, Wire } from '@/types/components'
import { zeros, lusolve, matrix } from 'mathjs'
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
 * Analyzes and solves a circuit for its DC operating point.
 *
 * This function will eventually implement Modified Nodal Analysis (MNA)
 * to solve for all node voltages in the circuit.
 *
 * @param circuit The circuit object to be simulated.
 * @returns A promise that resolves to the DC_Result, or null if solving fails.
 */
export async function solveDC(circuit: Circuit): Promise<DC_Result | null> {
  console.log('Starting DC Analysis for circuit:', circuit.id)

  // Step 1: Identify nodes and components
  const components = circuit.components
  const wires = components.filter((c) => c.type === 'wire') as Wire[]

  // Build an adjacency list to represent component terminal connections
  const adj: Record<string, string[]> = {}
  const getTerminalId = (c: CircuitComponent, t: string) => `${c.id}:${t}`

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
    console.log(`Wire connection: ${startTerminalId} <--> ${endTerminalId}`)
  }

  // Use BFS/DFS to find connected components (these are our electrical nodes)
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

  // Find the ground node (must be one, and only one)
  let groundNodeIndex = electricalNodes.findIndex((node) =>
    node.some((termId) => termId.includes('ground')),
  )

  // If no ground component, assume the negative terminal of the first voltage source is ground.
  if (groundNodeIndex === -1) {
    const firstVSource = components.find((c) => c.type === 'voltage_source')
    if (firstVSource) {
      const vSourceDef = getComponentDefinition('voltage_source')
      const negTerminal = getTerminalId(firstVSource, vSourceDef!.terminals[1].id)
      groundNodeIndex = electricalNodes.findIndex((node) => node.includes(negTerminal))
    }
  }

  if (groundNodeIndex === -1) {
    console.error('Circuit must have a ground connection or a voltage source.')
    return null
  }

  // Create a mapping from node index to a readable name (e.g., the first terminal in the set)
  const nodeMap = new Map<number, string>(electricalNodes.map((node, i) => [i, node[0]]))
  const termToNodeIndex = new Map<string, number>()
  electricalNodes.forEach((node, i) => {
    node.forEach((termId) => termToNodeIndex.set(termId, i))
  })

  // Filter components for MNA
  const voltageSources = components.filter(
    (c) => c.type === 'voltage_source',
  ) as (CircuitComponent & { type: 'voltage_source' })[]

  // Only include resistors as resistive elements (wires are for connectivity only)
  const resistiveElements = components.filter((c) => c.type === 'resistor') as Array<
    CircuitComponent & { type: 'resistor' }
  >

  console.log('Electrical Nodes:', electricalNodes)
  console.log('Ground Node Index:', groundNodeIndex)
  console.log('Node Map:', nodeMap)
  console.log('Terminal to Node Index:', termToNodeIndex)

  // Step 2: Construct the MNA matrices
  const numNodes = electricalNodes.length
  const numVSources = voltageSources.length
  const A = matrix(zeros(numNodes + numVSources, numNodes + numVSources))
  const z = matrix(zeros(numNodes + numVSources, 1))

  // Stamp all resistive elements onto the G matrix
  for (const element of resistiveElements) {
    const resistance = element.properties?.resistance as number
    if (!resistance || resistance <= 0) continue

    const g = 1 / resistance
    const def = getComponentDefinition(element.type)!
    const n1 = termToNodeIndex.get(getTerminalId(element, def.terminals[0].id))!
    const n2 = termToNodeIndex.get(getTerminalId(element, def.terminals[1].id))!

    A.set([n1, n1], A.get([n1, n1]) + g)
    A.set([n2, n2], A.get([n2, n2]) + g)
    A.set([n1, n2], A.get([n1, n2]) - g)
    A.set([n2, n1], A.get([n2, n1]) - g)

    console.log(`${element.type} ${element.id}: R=${resistance}Ω, G=${g}S, nodes ${n1}-${n2}`)
  }

  // Stamp voltage sources onto B, C matrices and z vector
  voltageSources.forEach((v, i) => {
    const vSourceDef = getComponentDefinition('voltage_source')!
    let n1 = termToNodeIndex.get(getTerminalId(v, vSourceDef.terminals[0].id))! // Positive terminal
    let n2 = termToNodeIndex.get(getTerminalId(v, vSourceDef.terminals[1].id))! // Negative terminal
    const voltage = (v.properties?.voltage as number) || 0

    // Account for component rotation. If rotated 180 degrees, swap terminals.
    if (v.rotation === 180) {
      ;[n1, n2] = [n2, n1]
    }

    const vSourceIndex = numNodes + i

    A.set([vSourceIndex, n1], 1)
    A.set([n1, vSourceIndex], 1)
    A.set([vSourceIndex, n2], -1)
    A.set([n2, vSourceIndex], -1)
    z.set([vSourceIndex, 0], voltage)
  })

  // The ground node equation: V_gnd = 0
  if (groundNodeIndex !== -1) {
    // To enforce the ground constraint, we modify the matrix.
    // Zero out the row and column for the ground node.
    for (let i = 0; i < numNodes + numVSources; i++) {
      A.set([groundNodeIndex, i], 0)
      A.set([i, groundNodeIndex], 0)
    }
    // Set the diagonal element to 1 and the corresponding z vector element to 0.
    A.set([groundNodeIndex, groundNodeIndex], 1)
    z.set([groundNodeIndex, 0], 0)
  }

  // Step 3: Solve the linear system
  let solution
  try {
    solution = lusolve(A, z)
  } catch (err) {
    console.error('Failed to solve the circuit. The matrix may be singular.', err)
    return null
  }

  // Step 4: Format and return results
  const voltageResults: Record<number, number> = {}
  for (const [nodeIdx] of nodeMap.entries()) {
    if (nodeIdx !== groundNodeIndex) {
      voltageResults[nodeIdx] = solution.get([nodeIdx, 0])
    } else {
      voltageResults[nodeIdx] = 0 // Ground is always 0
    }
  }

  // Step 5: Calculate currents through all resistive elements
  const currentResults: Record<string, number> = {}

  // Calculate currents for resistors using Ohm's law
  for (const element of resistiveElements) {
    const resistance = element.properties?.resistance as number
    if (!resistance || resistance <= 0) continue

    const def = getComponentDefinition(element.type)!
    const n1_idx = termToNodeIndex.get(getTerminalId(element, def.terminals[0].id))!
    const n2_idx = termToNodeIndex.get(getTerminalId(element, def.terminals[1].id))!

    const n1_volts = solution.get([n1_idx, 0])
    const n2_volts = solution.get([n2_idx, 0])

    const current = (n1_volts - n2_volts) / resistance
    console.log(
      `${element.type} ${element.id}: V1=${n1_volts}V, V2=${n2_volts}V, R=${resistance}Ω, I=${current}A`,
    )
    currentResults[element.id] = current
  }

  // Currents through voltage sources (calculate this first to get reference current)
  voltageSources.forEach((v, i) => {
    const vSourceIndex = numNodes + i
    // The solution vector contains the current through the voltage source
    const current = solution.get([vSourceIndex, 0])
    console.log(`Voltage Source ${v.id}: I=${current}A`)
    currentResults[v.id] = current
  })

  // Calculate wire currents based on KCL - all wires in a series path carry the same current
  // In a simple series circuit, all elements carry the same current magnitude
  const totalCurrent = Math.abs(currentResults['V1'] || 0) // Use voltage source current as reference

  for (const wire of wires) {
    if (!wire.properties) continue

    const startComp = components.find((c) => c.id === wire.properties?.startComponentId)
    const endComp = components.find((c) => c.id === wire.properties?.endComponentId)

    if (!startComp || !endComp) continue

    // In a series circuit, all wires carry the same current as the total circuit current
    // The direction depends on the specific wire's position in the circuit
    let wireCurrent = totalCurrent

    // Determine current direction based on voltage difference across the wire's endpoints
    const startTerminalId = getTerminalId(startComp, wire.properties?.startTerminal as string)
    const endTerminalId = getTerminalId(endComp, wire.properties?.endTerminal as string)

    const startNodeIdx = termToNodeIndex.get(startTerminalId)
    const endNodeIdx = termToNodeIndex.get(endTerminalId)

    if (startNodeIdx !== undefined && endNodeIdx !== undefined) {
      const startVoltage = voltageResults[startNodeIdx] || 0
      const endVoltage = voltageResults[endNodeIdx] || 0

      // If voltages are different, current flows from high to low
      if (startVoltage > endVoltage) {
        wireCurrent = totalCurrent // Positive current (high to low)
      } else if (startVoltage < endVoltage) {
        wireCurrent = -totalCurrent // Negative current (low to high)
      } else {
        wireCurrent = totalCurrent // Same voltage, use positive by convention
      }
    }

    currentResults[wire.id] = wireCurrent
    console.log(`wire ${wire.id}: I=${wireCurrent}A (series circuit current)`)
  }

  console.log('DC Analysis finished.')
  console.log('Matrix A:', A.toArray())
  console.log('Vector z:', z.toArray())
  console.log('Solution:', solution.toArray())
  console.log('Final Voltage Results:', voltageResults)
  console.log('Final Current Results:', currentResults)

  return {
    voltages: voltageResults,
    currents: currentResults,
    termToNodeIndex,
  }
}
