import type { CircuitComponent } from '@/types/components'
import { ResistiveStamper } from '../shared'

/**
 * Variable resistor component stamper - Models as adjustable resistance
 */
export class VariableResistorStamper extends ResistiveStamper {
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
