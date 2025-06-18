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
