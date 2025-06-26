import { DiodeCharacteristic } from './DiodeCharacteristic'

/**
 * Load line intersection solver for finding diode operating points
 * This separates the complex diode modeling from MNA matrix integration
 */
export class LoadLineIntersection {
  /**
   * Find the intersection between diode characteristic and circuit load line
   * Load line: I = (Vth - Vd) / Rth
   * Diode characteristic: I = f(Vd)
   */
  static solve(
    diodeCharacteristic: DiodeCharacteristic,
    theveninVoltage: number,
    theveninResistance: number,
  ): { voltage: number; current: number } {
    console.log(
      `🔍 Load Line Analysis: Vth=${theveninVoltage.toFixed(3)}V, Rth=${theveninResistance.toFixed(1)}Ω`,
    )

    // Load line function: I = (Vth - V) / Rth
    const loadLine = (voltage: number) => (theveninVoltage - voltage) / theveninResistance

    // ENHANCED: Check for reverse bias scenario first
    // If Thevenin voltage is negative, this indicates reverse bias
    if (theveninVoltage < 0) {
      console.log(`🔄 Reverse bias detected: Vth=${theveninVoltage.toFixed(3)}V`)
      // In reverse bias, most voltage appears across diode, tiny current flows
      const reverseVoltage = theveninVoltage * 0.99 // ~99% of supply voltage across diode
      const reverseCurrent = diodeCharacteristic.getCurrent(reverseVoltage)
      console.log(
        `🎯 Load Line Intersection (Reverse): V=${reverseVoltage.toFixed(4)}V, I=${reverseCurrent.toExponential(3)}A`,
      )
      return { voltage: reverseVoltage, current: reverseCurrent }
    }

    // IMPROVED: Extend search range to include negative voltages for forward bias edge cases
    let vLow = -theveninVoltage // Allow negative voltages for complete analysis
    let vHigh = theveninVoltage

    // Check if diode is conducting at all (enhanced logic)
    const diodeCurrentAtZero = diodeCharacteristic.getCurrent(0)
    const loadCurrentAtZero = loadLine(0)

    // For very low Thevenin voltages, be more careful about intersection detection
    if (theveninVoltage < 0.7 && diodeCurrentAtZero >= loadCurrentAtZero) {
      // Very low voltage - check if intersection exists in tiny current regime
      const lowVoltageCurrent = Math.min(theveninVoltage / theveninResistance / 1000, 1e-12)
      console.log(
        `🎯 Load Line Intersection: Low voltage/current, V=0V, I=${lowVoltageCurrent.toExponential(3)}A`,
      )
      return { voltage: 0, current: lowVoltageCurrent }
    }

    // Find bounds where intersection occurs
    const diodeCurrentAtVth = diodeCharacteristic.getCurrent(theveninVoltage)
    const loadCurrentAtVth = loadLine(theveninVoltage)

    if (diodeCurrentAtVth < loadCurrentAtVth) {
      // No intersection in normal range - use maximum available current
      const maxCurrent = Math.min(diodeCurrentAtVth, loadCurrentAtVth)
      console.log(
        `🎯 Load Line Intersection: V=${theveninVoltage.toFixed(4)}V, I=${maxCurrent.toExponential(3)}A`,
      )
      return { voltage: theveninVoltage, current: maxCurrent }
    }

    // Bisection method for robust convergence
    let iterations = 0
    const maxIterations = 50
    const tolerance = 1e-6

    while (iterations < maxIterations && vHigh - vLow > tolerance) {
      const vMid = (vLow + vHigh) / 2
      const diodeCurrent = diodeCharacteristic.getCurrent(vMid)
      const loadCurrent = loadLine(vMid)

      if (Math.abs(diodeCurrent - loadCurrent) < tolerance) {
        console.log(
          `🎯 Load Line Intersection: V=${vMid.toFixed(4)}V, I=${diodeCurrent.toExponential(3)}A (${iterations} iterations)`,
        )
        return { voltage: vMid, current: diodeCurrent }
      }

      if (diodeCurrent > loadCurrent) {
        vHigh = vMid
      } else {
        vLow = vMid
      }

      iterations++
    }

    // Return final result
    const finalVoltage = (vLow + vHigh) / 2
    const finalCurrent = diodeCharacteristic.getCurrent(finalVoltage)
    console.log(
      `🎯 Load Line Intersection: V=${finalVoltage.toFixed(4)}V, I=${finalCurrent.toExponential(3)}A (${iterations} iterations)`,
    )
    return { voltage: finalVoltage, current: finalCurrent }
  }
}
