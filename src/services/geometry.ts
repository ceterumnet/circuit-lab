import type { Position, CircuitComponent, Circuit } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

export function rotatePoint(point: Position, angleInDegrees: number): Position {
  const angleInRadians = (angleInDegrees * Math.PI) / 180
  const cos = Math.cos(angleInRadians)
  const sin = Math.sin(angleInRadians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

export function getTerminalWorldPosition(
  component: CircuitComponent,
  terminalId: string,
): Position {
  const definition = getComponentDefinition(component.type)
  if (!definition) {
    console.error(`No definition for component type ${component.type}`)
    return component.position
  }

  const terminalDef = definition.terminals.find((t) => t.id === terminalId)
  if (!terminalDef) {
    console.error(`Terminal ${terminalId} not found on component ${component.id}`)
    return component.position
  }

  // Apply rotation transformation to local offset
  const rotatedOffset = rotatePoint(terminalDef.position, component.rotation)

  const componentX = component.position?.x ?? 0
  const componentY = component.position?.y ?? 0

  if (isNaN(componentX) || isNaN(componentY) || isNaN(rotatedOffset.x) || isNaN(rotatedOffset.y)) {
    console.warn('NaN detected in position calculation for component:', component.id)
    return { x: 0, y: 0 }
  }

  return {
    x: componentX + rotatedOffset.x,
    y: componentY + rotatedOffset.y,
  }
}

export function findTerminalAtPosition(
  circuit: Circuit,
  position: Position,
): { terminalId: string; componentId: string; position: Position } | null {
  // Find all terminals in the circuit
  for (const component of circuit.components) {
    if (component.type === 'wire') continue

    const definition = getComponentDefinition(component.type)
    if (!definition) continue

    for (const terminalDef of definition.terminals) {
      const terminalWorldPos = getTerminalWorldPosition(component, terminalDef.id)

      // Check if position is within 15 pixels of the terminal
      const distance = Math.sqrt(
        Math.pow(position.x - terminalWorldPos.x, 2) + Math.pow(position.y - terminalWorldPos.y, 2),
      )

      if (distance <= 15) {
        return {
          terminalId: terminalDef.id,
          componentId: component.id,
          position: terminalWorldPos,
        }
      }
    }
  }

  return null
}

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(
  point: Position,
  lineStart: Position,
  lineEnd: Position,
): { distance: number; closestPoint: Position } {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  if (dx === 0 && dy === 0) {
    // Line segment is actually a point
    const distance = Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2),
    )
    return { distance, closestPoint: lineStart }
  }

  // Calculate the parameter t for the closest point on the line
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy),
    ),
  )

  // Calculate the closest point on the line segment
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  }

  // Calculate distance from point to closest point
  const distance = Math.sqrt(
    Math.pow(point.x - closestPoint.x, 2) + Math.pow(point.y - closestPoint.y, 2),
  )

  return { distance, closestPoint }
}

// NEW: Find wire at position for auto-connect
export function findWireAtPosition(
  circuit: Circuit,
  position: Position,
  tolerance: number = 15,
): { wireId: string; intersectionPoint: Position } | null {
  for (const component of circuit.components) {
    if (component.type !== 'wire' || !component.properties) continue

    const wireProps = component.properties
    const startComponentId = wireProps.startComponentId as string
    const startTerminalId = wireProps.startTerminal as string
    const endComponentId = wireProps.endComponentId as string
    const endTerminalId = wireProps.endTerminal as string

    // Get the wire endpoints
    const startComponent = circuit.components.find((c) => c.id === startComponentId)
    const endComponent = circuit.components.find((c) => c.id === endComponentId)

    if (!startComponent || !endComponent) continue

    const startPos = getTerminalWorldPosition(startComponent, startTerminalId)
    const endPos = getTerminalWorldPosition(endComponent, endTerminalId)

    // Check if the position is close to this wire
    const { distance, closestPoint } = distanceToLineSegment(position, startPos, endPos)

    if (distance <= tolerance) {
      return {
        wireId: component.id,
        intersectionPoint: closestPoint,
      }
    }
  }

  return null
}

// NEW: Find all terminals of a component that would intersect with existing wires/terminals
export function findIntersectionsForComponent(
  circuit: Circuit,
  componentType: string,
  position: Position,
  rotation: number = 0,
): Array<{
  type: 'terminal' | 'wire'
  terminalId: string
  targetTerminalId?: string
  targetComponentId?: string
  targetWireId?: string
  intersectionPoint?: Position
}> {
  const definition = getComponentDefinition(componentType)
  if (!definition) return []

  const intersections: Array<{
    type: 'terminal' | 'wire'
    terminalId: string
    targetTerminalId?: string
    targetComponentId?: string
    targetWireId?: string
    intersectionPoint?: Position
  }> = []

  // Check each terminal of the component being placed
  for (const terminalDef of definition.terminals) {
    // Calculate where this terminal would be positioned
    const rotatedOffset = rotatePoint(terminalDef.position, rotation)
    const terminalWorldPos = {
      x: position.x + rotatedOffset.x,
      y: position.y + rotatedOffset.y,
    }

    // Check for terminal intersections
    const existingTerminal = findTerminalAtPosition(circuit, terminalWorldPos)
    if (existingTerminal) {
      intersections.push({
        type: 'terminal',
        terminalId: terminalDef.id,
        targetTerminalId: existingTerminal.terminalId,
        targetComponentId: existingTerminal.componentId,
      })
    }

    // Check for wire intersections
    const wireIntersection = findWireAtPosition(circuit, terminalWorldPos)
    if (wireIntersection) {
      intersections.push({
        type: 'wire',
        terminalId: terminalDef.id,
        targetWireId: wireIntersection.wireId,
        intersectionPoint: wireIntersection.intersectionPoint,
      })
    }
  }

  return intersections
}
