import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from '@/services/stampers/shared'
import type { Matrix } from 'mathjs'
import { ResistiveStamper } from '@/services/stampers/shared'
import { PotentiometerStamper } from '@/services/stampers'

/**
 * Wire component stamper - PURE MNA: Uses G-matrix stamping like all passive components
 * This ensures consistent Ohm's law calculations and eliminates KCL violations
 */
export class WireStamper extends ResistiveStamper {
  // Static set to track wires currently calculating current (prevents infinite recursion)
  private static calculatingWires = new Set<string>()

  constructor(component: CircuitComponent) {
    // Use wire's configured resistance, default to 1mΩ for numerical stability
    // 1mΩ is small enough to be negligible in most circuits but avoids conditioning issues
    const resistance = (component.properties?.resistance as number) || 1e-3
    super(component.id, component.type, component, resistance)
  }

  /**
   * Clear the recursion detection state (call before each simulation)
   */
  public static clearRecursionState(): void {
    WireStamper.calculatingWires.clear()
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

  // PURE MNA: Wire uses inherited G-matrix stamping from ResistiveStamper
  // No need to override stampDC - uses standard conductance stamping

  /**
   * KCL-Based Wire Current Calculation
   * Instead of using unstable Ohm's law calculation I=(V1-V2)/R_wire,
   * we calculate the wire current by applying KCL at its connection nodes.
   * This ensures series circuit current consistency and eliminates numerical instability.
   */
  calculateCurrent(
    solution: Matrix,
    nodeMap: Map<string, number>,
    branchCurrents: number[],
    allStampers?: ComponentStamper[],
  ): number {
    // RECURSION DETECTION: Prevent infinite loops in circular wire dependencies
    if (WireStamper.calculatingWires.has(this.id)) {
      console.warn(`⚠️ Wire ${this.id}: Circular dependency detected, falling back to Ohm's law`)
      return super.calculateCurrent(solution, nodeMap, branchCurrents, allStampers)
    }

    // Mark this wire as currently calculating
    WireStamper.calculatingWires.add(this.id)

    try {
      const [n1, n2] = this.getNodeIndices(nodeMap)

      // PURE MNA: Same-node connections carry zero current by definition
      if (n1 === n2) {
        console.log(`${this.type} ${this.id}: Same-node connection, current = 0A`)
        return 0
      }

      // KCL-Based Calculation: Find all components connected to this wire's nodes
      if (!allStampers) {
        // Fallback to Ohm's law if allStampers not provided (should not happen in normal operation)
        console.warn(`⚠️ Wire ${this.id}: allStampers not provided, falling back to Ohm's law`)
        WireStamper.calculatingWires.delete(this.id) // Clean up before early return
        return super.calculateCurrent(solution, nodeMap, branchCurrents, allStampers)
      }

      // Find all components connected to each wire node (excluding this wire itself)
      const n1Components: ComponentStamper[] = []
      const n2Components: ComponentStamper[] = []

      for (const stamper of allStampers) {
        if (stamper.id === this.id) continue // Skip self

        try {
          // Get the nodes this component connects to
          let componentNodes: number[] = []

          if (stamper.type === 'wire') {
            const wireStamper = stamper as WireStamper
            const [wireN1, wireN2] = wireStamper.getNodeIndices(nodeMap)
            componentNodes = [wireN1, wireN2]
          } else if (stamper.type === 'potentiometer') {
            // Potentiometers have 3 nodes
            const potStamper = stamper as PotentiometerStamper
            const nodeIndices = (
              potStamper as unknown as {
                getNodeIndices: (nodeMap: Map<string, number>) => [number, number, number]
              }
            ).getNodeIndices(nodeMap)
            componentNodes = [nodeIndices[0], nodeIndices[1], nodeIndices[2]]
          } else if (
            'getNodeIndices' in stamper &&
            typeof (stamper as unknown as { getNodeIndices: unknown }).getNodeIndices === 'function'
          ) {
            // Standard 2-terminal components
            const nodeIndices = (
              stamper as unknown as {
                getNodeIndices: (nodeMap: Map<string, number>) => [number, number]
              }
            ).getNodeIndices(nodeMap)
            componentNodes = [nodeIndices[0], nodeIndices[1]]
          }

          // Check if this component connects to our wire's nodes
          if (componentNodes.includes(n1)) {
            n1Components.push(stamper)
          }
          if (componentNodes.includes(n2)) {
            n2Components.push(stamper)
          }
        } catch (error) {
          // Skip components that don't have standard node access
          continue
        }
      }

      // Calculate KCL current: sum of currents flowing into n1 node should equal current flowing into n2 node
      // In a series circuit, the wire current should equal the current of connected series components

      // Find a reliable current reference from connected components
      let referenceComponent: ComponentStamper | null = null
      let referenceCurrent = 0

      // Prefer non-wire components as current reference (more stable)
      for (const component of [...n1Components, ...n2Components]) {
        if (component.type !== 'wire' && component.type !== 'ground' && component.type !== 'node') {
          referenceComponent = component
          referenceCurrent = Math.abs(
            component.calculateCurrent(solution, nodeMap, branchCurrents, allStampers),
          )
          break
        }
      }

      // If no non-wire reference found, try to use the wire's Ohm's law calculation but with better stability
      if (!referenceComponent) {
        const v1 = solution.get([n1, 0]) as number
        const v2 = solution.get([n2, 0]) as number
        const voltageDiff = Math.abs(v1 - v2)

        // Use KCL logic: if voltage difference is very small, use reference from connected components
        if (voltageDiff < 1e-6) {
          // Very small voltage difference - use first connected component's current
          if (n1Components.length > 0) {
            referenceCurrent = Math.abs(
              n1Components[0].calculateCurrent(solution, nodeMap, branchCurrents, allStampers),
            )
          } else if (n2Components.length > 0) {
            referenceCurrent = Math.abs(
              n2Components[0].calculateCurrent(solution, nodeMap, branchCurrents, allStampers),
            )
          } else {
            referenceCurrent = 0
          }
        } else {
          // Voltage difference significant enough for Ohm's law
          referenceCurrent = voltageDiff / this.resistance
        }
      }

      // Determine current direction based on node voltage difference
      const v1 = solution.get([n1, 0]) as number
      const v2 = solution.get([n2, 0]) as number
      const current = v1 > v2 ? referenceCurrent : -referenceCurrent

      console.log(
        `${this.type} ${this.id}: KCL-based current = ${current.toExponential(3)}A (ref: ${referenceComponent?.type || 'voltage-based'} ${referenceComponent?.id || ''})`,
      )
      return current
    } finally {
      // Clean up: remove this wire from calculating set
      WireStamper.calculatingWires.delete(this.id)
    }
  }
}
