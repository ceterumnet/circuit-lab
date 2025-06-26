import type { ComponentStamper } from '../shared'
import { VoltageSourceStamper } from '../linear/VoltageSourceStamper'
import { ResistorStamper } from '../linear/ResistorStamper'

/**
 * Circuit analysis for automatic parameter selection
 */
export class CircuitAnalyzer {
  /**
   * Analyze circuit from stampers to estimate expected diode operating conditions
   * This implementation extracts actual component values from the stampers
   */
  static analyzeForDiode(
    diodeId: string,
    nodeMap: Map<string, number>,
    allStampers: ComponentStamper[],
  ): { supplyVoltage: number; expectedCurrent: number } {
    console.log(`🔍 Circuit Analysis for ${diodeId}:`)

    // Find the highest voltage source in the circuit
    let maxVoltage = 0
    let totalResistance = 0
    let hasVoltageSource = false

    for (const stamper of allStampers) {
      if (stamper.type === 'voltage_source') {
        // Extract actual voltage from VoltageSourceStamper
        const voltageStamper = stamper as VoltageSourceStamper
        const voltage = Math.abs(voltageStamper.voltage || 5.0)
        maxVoltage = Math.max(maxVoltage, voltage)
        hasVoltageSource = true
        console.log(`  Found voltage source ${stamper.id}: ${voltage}V`)
      } else if (stamper.type === 'resistor') {
        // Extract actual resistance from ResistorStamper
        const resistorStamper = stamper as ResistorStamper
        // Access the protected resistance property through component properties
        const resistance =
          typeof resistorStamper.component.properties?.resistance === 'number'
            ? resistorStamper.component.properties.resistance
            : 1000
        totalResistance += resistance
        console.log(`  Found resistor ${stamper.id}: ${resistance}Ω`)
      }
    }

    // If no voltage source found, use a default
    if (!hasVoltageSource) {
      maxVoltage = 5.0 // Default assumption
      console.log(`  No voltage source found: Using default ${maxVoltage}V`)
    }

    // If no resistors found, use a default series resistance
    if (totalResistance === 0) {
      totalResistance = 1000 // Default 1kΩ assumption
      console.log(`  No resistors found: Using default ${totalResistance}Ω`)
    }

    // Estimate current using simple voltage divider assumption
    // Assume diode forward voltage consumes ~0.7V, rest goes to resistors
    const estimatedCurrent = Math.max((maxVoltage - 0.7) / totalResistance, 1e-9)

    console.log(
      `  Final analysis: ${maxVoltage.toFixed(2)}V supply, ${totalResistance.toFixed(0)}Ω total resistance`,
    )
    console.log(`  Estimated current: ${estimatedCurrent.toExponential(2)}A`)

    return {
      supplyVoltage: maxVoltage,
      expectedCurrent: estimatedCurrent,
    }
  }
}
