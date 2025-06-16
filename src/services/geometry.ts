import type { Position, CircuitComponent, Resistor, VoltageSource, Ground, CircuitNode, Circuit } from '@/types/components'

export function rotatePoint(point: Position, angleInDegrees: number): Position {
  const angleInRadians = (angleInDegrees * Math.PI) / 180
  const cos = Math.cos(angleInRadians)
  const sin = Math.sin(angleInRadians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

export function getTerminalWorldPosition(component: CircuitComponent, terminalId: string): Position {
  let localOffset: Position

  switch (component.type) {
    case 'resistor':
    case 'voltage_source': {
      const terminals = (component as Resistor | VoltageSource).terminals
      const terminalIndex = terminals.indexOf(terminalId)
      // Left terminal at -30, right terminal at +30
      const offsetX = terminalIndex === 0 ? -30 : 30
      localOffset = { x: offsetX, y: 0 }
      break
    }
    case 'ground': {
      // Ground has single terminal at top
      localOffset = { x: 0, y: -15 }
      break
    }
    case 'node': {
      // Node terminal is at the center
      localOffset = { x: 0, y: 0 }
      break
    }
    default:
      return component.position
  }

  // Apply rotation transformation to local offset
  const rotatedOffset = rotatePoint(localOffset, component.rotation)

  return {
    x: component.position.x + rotatedOffset.x,
    y: component.position.y + rotatedOffset.y,
  }
}

export function findTerminalAtPosition(
  circuit: Circuit,
  position: Position,
): { terminalId: string; componentId: string; position: Position } | null {
  // Find all terminals in the circuit
  for (const component of circuit.components) {
    if (component.type === 'wire') continue

    let terminals: string[] = []
    if (
      component.type === 'resistor' ||
      component.type === 'voltage_source'
    ) {
      terminals = (component as Resistor | VoltageSource).terminals
    } else if (component.type === 'ground') {
      terminals = [(component as Ground).terminal]
    } else if (component.type === 'node') {
      terminals = [(component as CircuitNode).terminal]
    }

    for (const terminalId of terminals) {
      const terminalWorldPos = getTerminalWorldPosition(component, terminalId)

      // Check if position is within 15 pixels of the terminal
      const distance = Math.sqrt(
        Math.pow(position.x - terminalWorldPos.x, 2) +
          Math.pow(position.y - terminalWorldPos.y, 2),
      )

      if (distance <= 15) {
        // Calculate local terminal position with rotation applied
        let localOffset: Position

        switch (component.type) {
          case 'resistor':
          case 'voltage_source': {
            const terminals = (component as Resistor | VoltageSource).terminals
            const terminalIndex = terminals.indexOf(terminalId)
            const offsetX = terminalIndex === 0 ? -30 : 30
            localOffset = { x: offsetX, y: 0 }
            break
          }
          case 'ground': {
            localOffset = { x: 0, y: -15 }
            break
          }
          case 'node': {
            localOffset = { x: 0, y: 0 }
            break
          }
          default:
            localOffset = { x: 0, y: 0 }
        }

        // Apply rotation to get the local terminal position that matches the visual component
        const rotatedLocalOffset = rotatePoint(localOffset, component.rotation)

        return {
          terminalId,
          componentId: component.id,
          position: rotatedLocalOffset,
        }
      }
    }
  }

  return null
}
