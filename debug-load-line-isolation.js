/**
 * Load Line Intersection Isolation Test
 * This script tests the Load Line Intersection algorithm directly
 * to identify why different resistance values produce similar currents
 */

// Simulate the DiodeCharacteristic class
class DiodeCharacteristic {
  constructor(saturationCurrent = 1e-15, emissionCoefficient = 1) {
    this.saturationCurrent = saturationCurrent
    this.thermalVoltage = 0.026 // 26mV at room temperature
    this.emissionCoefficient = emissionCoefficient
  }

  getCurrent(voltage) {
    if (voltage < 0) return -this.saturationCurrent

    const expArg = Math.min(voltage / (this.emissionCoefficient * this.thermalVoltage), 20)
    return this.saturationCurrent * (Math.exp(expArg) - 1)
  }

  getConductance(voltage) {
    if (voltage < 0) return 1e-12

    const expArg = Math.min(voltage / (this.emissionCoefficient * this.thermalVoltage), 20)
    return (
      (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) * Math.exp(expArg)
    )
  }
}

// Simulate the LoadLineIntersection class
class LoadLineIntersection {
  static solve(diodeCharacteristic, theveninVoltage, theveninResistance) {
    console.log(
      `🔍 Load Line Analysis: Vth=${theveninVoltage.toFixed(3)}V, Rth=${theveninResistance.toFixed(1)}Ω`,
    )

    // Load line function: I = (Vth - V) / Rth
    const loadLine = (voltage) => (theveninVoltage - voltage) / theveninResistance

    // Newton-Raphson iteration to find intersection
    let voltage = Math.min(theveninVoltage * 0.5, 0.7) // Initial guess
    let iterations = 0
    const maxIterations = 50
    const tolerance = 1e-9

    console.log(`  Initial guess: V=${voltage.toFixed(4)}V`)

    while (iterations < maxIterations) {
      const diodeCurrent = diodeCharacteristic.getCurrent(voltage)
      const loadCurrent = loadLine(voltage)
      const error = diodeCurrent - loadCurrent

      console.log(
        `  Iter ${iterations + 1}: V=${voltage.toFixed(4)}V, Id=${diodeCurrent.toExponential(3)}A, Il=${loadCurrent.toExponential(3)}A, err=${error.toExponential(3)}A`,
      )

      if (Math.abs(error) < tolerance) {
        const finalCurrent = diodeCurrent
        console.log(
          `🎯 Load Line Intersection: V=${voltage.toFixed(4)}V, I=${finalCurrent.toExponential(3)}A (${iterations + 1} iterations)`,
        )
        return { voltage, current: finalCurrent }
      }

      // Newton-Raphson step: V_new = V_old - f(V) / f'(V)
      // f(V) = Id(V) - Il(V) = Id(V) - (Vth - V)/Rth
      // f'(V) = dId/dV + 1/Rth
      const diodeConductance = diodeCharacteristic.getConductance(voltage)
      const derivative = diodeConductance + 1 / theveninResistance

      if (Math.abs(derivative) < 1e-15) {
        console.log(`⚠️ Derivative too small, stopping iteration`)
        break
      }

      const deltaV = -error / derivative

      // Apply damping for stability
      const dampingFactor = 0.5
      voltage += dampingFactor * deltaV

      // Keep voltage in reasonable bounds
      voltage = Math.max(0, Math.min(voltage, theveninVoltage))

      iterations++
    }

    // Fallback if no convergence
    const fallbackCurrent = diodeCharacteristic.getCurrent(voltage)
    console.log(
      `⚠️ Load Line Intersection: Convergence failed, using V=${voltage.toFixed(4)}V, I=${fallbackCurrent.toExponential(3)}A`,
    )
    return { voltage, current: fallbackCurrent }
  }
}

// Test function
function testLoadLineIntersection() {
  console.log('='.repeat(80))
  console.log('LOAD LINE INTERSECTION ISOLATION TEST')
  console.log('='.repeat(80))

  // Create diode characteristic with default parameters (same as simulation)
  const saturationCurrent = 1e-15 // Default from DiodeStamper
  const emissionCoefficient = 1 // Default from DiodeStamper
  const diode = new DiodeCharacteristic(saturationCurrent, emissionCoefficient)

  console.log(`\nDiode Parameters:`)
  console.log(`  Saturation Current: ${saturationCurrent.toExponential(2)}A`)
  console.log(`  Emission Coefficient: ${emissionCoefficient}`)
  console.log(`  Thermal Voltage: ${diode.thermalVoltage}V`)

  // Test with different resistance values (same as the failing tests)
  const testCases = [
    { name: '100Ω Test', resistance: 100, voltage: 5 },
    { name: '1kΩ Test', resistance: 1000, voltage: 5 },
    { name: '10kΩ Test', resistance: 10000, voltage: 5 },
  ]

  const results = []

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`${testCase.name}: Vth=${testCase.voltage}V, Rth=${testCase.resistance}Ω`)
    console.log(`${'='.repeat(50)}`)

    const result = LoadLineIntersection.solve(diode, testCase.voltage, testCase.resistance)
    results.push({
      name: testCase.name,
      resistance: testCase.resistance,
      voltage: result.voltage,
      current: result.current,
    })

    // Calculate expected linear approximation for comparison
    const expectedCurrent = testCase.voltage / testCase.resistance
    console.log(`  Linear approximation (V/R): ${expectedCurrent.toExponential(3)}A`)
    console.log(`  Diode result: ${result.current.toExponential(3)}A`)
    console.log(`  Ratio (diode/linear): ${(result.current / expectedCurrent).toFixed(4)}`)
  }

  // Summary comparison
  console.log(`\n${'='.repeat(80)}`)
  console.log('SUMMARY COMPARISON')
  console.log(`${'='.repeat(80)}`)
  console.log('Test Case        | Resistance | Voltage    | Current       | Current Ratio')
  console.log('-'.repeat(80))

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const ratio = i > 0 ? (result.current / results[0].current).toFixed(4) : '1.0000'
    console.log(
      `${result.name.padEnd(15)} | ${result.resistance.toString().padEnd(10)} | ${result.voltage.toFixed(4)}V   | ${result.current.toExponential(3)}A | ${ratio}`,
    )
  }

  // Analysis
  console.log(`\n${'='.repeat(80)}`)
  console.log('ANALYSIS')
  console.log(`${'='.repeat(80)}`)

  // Check if currents are monotonically decreasing with increasing resistance
  let isMonotonic = true
  for (let i = 1; i < results.length; i++) {
    if (results[i].current >= results[i - 1].current) {
      isMonotonic = false
      console.log(
        `❌ NON-MONOTONIC: ${results[i].name} current (${results[i].current.toExponential(3)}A) >= ${results[i - 1].name} current (${results[i - 1].current.toExponential(3)}A)`,
      )
    } else {
      console.log(
        `✅ MONOTONIC: ${results[i].name} current (${results[i].current.toExponential(3)}A) < ${results[i - 1].name} current (${results[i - 1].current.toExponential(3)}A)`,
      )
    }
  }

  if (isMonotonic) {
    console.log(
      `\n✅ RESULT: Load Line Intersection is working correctly - higher resistance produces lower current`,
    )
  } else {
    console.log(
      `\n❌ RESULT: Load Line Intersection has issues - current doesn't decrease monotonically with resistance`,
    )
  }

  // Check for identical values (the main issue)
  const tolerance = 1e-12
  for (let i = 1; i < results.length; i++) {
    const diff = Math.abs(results[i].current - results[i - 1].current)
    if (diff < tolerance) {
      console.log(
        `❌ IDENTICAL VALUES: ${results[i].name} and ${results[i - 1].name} have nearly identical currents (diff: ${diff.toExponential(3)}A)`,
      )
    }
  }

  return results
}

// Test diode I-V characteristic directly
function testDiodeCharacteristic() {
  console.log(`\n${'='.repeat(80)}`)
  console.log('DIODE I-V CHARACTERISTIC TEST')
  console.log(`${'='.repeat(80)}`)

  const diode = new DiodeCharacteristic(1e-15, 1)

  console.log('Voltage (V) | Current (A)    | Conductance (S)')
  console.log('-'.repeat(50))

  for (let v = 0; v <= 1.0; v += 0.1) {
    const current = diode.getCurrent(v)
    const conductance = diode.getConductance(v)
    console.log(
      `${v.toFixed(1).padEnd(10)} | ${current.toExponential(3).padEnd(13)} | ${conductance.toExponential(3)}`,
    )
  }
}

// Run the tests
console.log('Starting Load Line Intersection Isolation Test...\n')

try {
  testDiodeCharacteristic()
  const results = testLoadLineIntersection()

  console.log(`\n${'='.repeat(80)}`)
  console.log('TEST COMPLETE')
  console.log(`${'='.repeat(80)}`)
  console.log('If this test shows the Load Line Intersection working correctly,')
  console.log('then the issue is likely in:')
  console.log('1. How the circuit analysis extracts component values')
  console.log('2. How the test circuits are constructed')
  console.log('3. Parameter differences between this test and the actual simulation')
} catch (error) {
  console.error('Test failed with error:', error)
}
