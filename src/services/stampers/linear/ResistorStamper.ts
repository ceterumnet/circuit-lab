import type { CircuitComponent } from '@/types/components'
import { ResistiveStamper } from '../shared'

/**
 * Resistor component stamper
 */
export class ResistorStamper extends ResistiveStamper {
  constructor(component: CircuitComponent) {
    const resistance = (component.properties?.resistance as number) || 1000
    super(component.id, component.type, component, resistance)
  }
}
