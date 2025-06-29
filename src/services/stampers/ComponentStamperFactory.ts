import type { CircuitComponent } from '@/types/components'
import type { ComponentStamper } from './shared'

// Linear stampers
import { ResistorStamper } from './linear/ResistorStamper'
import { VoltageSourceStamper } from './linear/VoltageSourceStamper'
import { CurrentSourceStamper } from './linear/CurrentSourceStamper'
import { WireStamper } from './linear/WireStamper'
import { GroundStamper } from './linear/GroundStamper'
import { NodeStamper } from './linear/NodeStamper'
import { SwitchStamper } from './linear/SwitchStamper'
import { VariableResistorStamper } from './linear/VariableResistorStamper'
import { PotentiometerStamper } from './linear/PotentiometerStamper'
import { CapacitorStamper } from './linear/CapacitorStamper'
import { InductorStamper } from './linear/InductorStamper'

// Non-linear stampers
import { DiodeStamper } from './nonlinear/DiodeStamper'
import { LEDStamper } from './nonlinear/LEDStamper'

/**
 * Component stamper factory
 */
export class ComponentStamperFactory {
  private static stampers = new Map<string, new (component: CircuitComponent) => ComponentStamper>([
    ['resistor', ResistorStamper],
    ['wire', WireStamper],
    ['voltage_source', VoltageSourceStamper],
    ['current_source', CurrentSourceStamper],
    ['switch', SwitchStamper],
    ['variable_resistor', VariableResistorStamper],
    ['potentiometer', PotentiometerStamper],
    ['capacitor', CapacitorStamper],
    ['inductor', InductorStamper],
    ['diode', DiodeStamper],
    ['led', LEDStamper],
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
