import type { CircuitComponent } from '@/types/components'
import { ResistiveStamper } from '../shared'

/**
 * Switch component stamper - Models switch as variable resistance
 */
export class SwitchStamper extends ResistiveStamper {
  constructor(component: CircuitComponent) {
    // Switch resistance based on state: Open = high resistance (1GΩ), Closed = low resistance (1mΩ)
    const isOpen = component.properties?.isOpen === true // Default to closed (safer for circuits)
    const resistance = isOpen ? 1e9 : 1e-3 // 1GΩ for open, 1mΩ for closed
    super(component.id, component.type, component, resistance)
    console.log(`Switch ${component.id}: ${isOpen ? 'OPEN' : 'CLOSED'} (R=${resistance}Ω)`)
  }
}
