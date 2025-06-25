/**
 * Comprehensive Diode Simulator Validation
 * Tests the diode simulation across realistic parameter ranges
 * This is what a SIMULATOR should actually be tested for!
 */

// Simulate the DiodeCharacteristic class
class DiodeCharacteristic {
  constructor(saturationCurrent = 1e-12, emissionCoefficient = 1, temperature = 300) {
    this.saturationCurrent = saturationCurrent
    this.emissionCoefficient = emissionCoefficient
    this.thermalVoltage = (1.381e-23 * temperature) / 1.602e-19 // kT/q
    this.temperature = temperature
  }

  getCurrent(voltage) {
    if (voltage < 0) return -this.saturationCurrent

    const expArg = voltage / (this.emissionCoefficient * this.thermalVoltage)

    // Handle large arguments to prevent overflow
    if (expArg > 50) {
      return this.saturationCurrent * Math.exp(expArg)
    } else {
      return this.saturationCurrent * (Math.exp(expArg) - 1)
    }
  }

  getConductance(voltage) {
    if (voltage < 0) return 1e-12

    const expArg = voltage / (this.emissionCoefficient * this.thermalVoltage)

    if (expArg > 50) {
      return (
        (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) *
        Math.exp(expArg)
      )
    } else {
      return (
        (this.saturationCurrent / (this.emissionCoefficient * this.thermalVoltage)) *
        Math.exp(expArg)
      )
    }
  }
}

// Load Line Intersection solver
class LoadLineIntersection {
  static solve(diodeCharacteristic, theveninVoltage, theveninResistance, verbose = false) {
    if (verbose) {
      console.log(
        `🔍 Load Line: Vth=${theveninVoltage.toFixed(2)}V, Rth=${theveninResistance.toFixed(0)}Ω`,
      )
    }

    const loadLine = (voltage) => (theveninVoltage - voltage) / theveninResistance

    // Better initial guess based on typical diode forward voltage
    let voltage = Math.min(theveninVoltage * 0.8, 0.7)
    let iterations = 0
    const maxIterations = 100
    const tolerance = 1e-12

    while (iterations < maxIterations) {
      const diodeCurrent = diodeCharacteristic.getCurrent(voltage)
      const loadCurrent = loadLine(voltage)
      const error = diodeCurrent - loadCurrent

      if (Math.abs(error) < tolerance) {
        if (verbose) {
          console.log(
            `  ✅ Converged: V=${voltage.toFixed(3)}V, I=${diodeCurrent.toExponential(2)}A (${iterations + 1} iter)`,
          )
        }
        return { voltage, current: diodeCurrent, converged: true }
      }

      const diodeConductance = diodeCharacteristic.getConductance(voltage)
      const derivative = diodeConductance + 1 / theveninResistance

      if (Math.abs(derivative) < 1e-15) break

      const deltaV = -error / derivative
      voltage += 0.5 * deltaV // Damping
      voltage = Math.max(0, Math.min(voltage, theveninVoltage))

      iterations++
    }

    if (verbose) {
      console.log(`  ⚠️ Failed to converge after ${iterations} iterations`)
    }
    return { voltage, current: diodeCharacteristic.getCurrent(voltage), converged: false }
  }
}

// Comprehensive test suite
function runComprehensiveTests() {
  console.log('='.repeat(100))
  console.log('COMPREHENSIVE DIODE SIMULATOR VALIDATION')
  console.log('Testing across realistic parameter ranges like a REAL simulator should!')
  console.log('='.repeat(100))

  const results = []

  // Test 1: Different Saturation Currents (Silicon diode range)
  console.log('\n📊 TEST 1: SATURATION CURRENT RANGE')
  console.log('Testing silicon diodes from small-signal to power diodes')
  console.log('-'.repeat(80))

  const saturationCurrents = [
    { name: 'Small Signal', Is: 1e-15, description: 'Small signal diode (1N4148)' },
    { name: 'General Purpose', Is: 1e-12, description: 'General purpose diode (1N4007)' },
    { name: 'Schottky', Is: 1e-9, description: 'Schottky diode (1N5819)' },
    { name: 'Power Diode', Is: 1e-6, description: 'Power rectifier diode' },
  ]

  for (const diodeType of saturationCurrents) {
    console.log(`\n${diodeType.name} (${diodeType.description}):`)
    const diode = new DiodeCharacteristic(diodeType.Is, 1, 300)

    // Test with 5V, 1kΩ circuit
    const result = LoadLineIntersection.solve(diode, 5.0, 1000, true)
    results.push({
      test: 'Saturation Current',
      parameter: diodeType.name,
      value: diodeType.Is,
      voltage: result.voltage,
      current: result.current,
      converged: result.converged,
    })
  }

  // Test 2: Different Supply Voltages
  console.log('\n📊 TEST 2: SUPPLY VOLTAGE RANGE')
  console.log('Testing common circuit supply voltages')
  console.log('-'.repeat(80))

  const supplyVoltages = [1.5, 3.3, 5.0, 9.0, 12.0, 24.0]
  const standardDiode = new DiodeCharacteristic(1e-12, 1, 300)

  for (const voltage of supplyVoltages) {
    console.log(`\n${voltage}V Supply:`)
    const result = LoadLineIntersection.solve(standardDiode, voltage, 1000, true)
    results.push({
      test: 'Supply Voltage',
      parameter: `${voltage}V`,
      value: voltage,
      voltage: result.voltage,
      current: result.current,
      converged: result.converged,
    })
  }

  // Test 3: Different Load Resistances
  console.log('\n📊 TEST 3: LOAD RESISTANCE RANGE')
  console.log('Testing different series resistor values')
  console.log('-'.repeat(80))

  const resistances = [10, 100, 470, 1000, 4700, 10000, 47000]

  for (const resistance of resistances) {
    console.log(`\n${resistance}Ω Load:`)
    const result = LoadLineIntersection.solve(standardDiode, 5.0, resistance, true)
    results.push({
      test: 'Load Resistance',
      parameter: `${resistance}Ω`,
      value: resistance,
      voltage: result.voltage,
      current: result.current,
      converged: result.converged,
    })
  }

  // Test 4: Temperature Effects
  console.log('\n📊 TEST 4: TEMPERATURE RANGE')
  console.log('Testing temperature coefficient effects')
  console.log('-'.repeat(80))

  const temperatures = [
    { temp: 233, name: '-40°C (Arctic)' },
    { temp: 273, name: '0°C (Freezing)' },
    { temp: 300, name: '27°C (Room)' },
    { temp: 350, name: '77°C (Hot)' },
    { temp: 400, name: '127°C (Very Hot)' },
  ]

  for (const tempData of temperatures) {
    console.log(`\n${tempData.name}:`)
    const diode = new DiodeCharacteristic(1e-12, 1, tempData.temp)
    const result = LoadLineIntersection.solve(diode, 5.0, 1000, true)
    results.push({
      test: 'Temperature',
      parameter: tempData.name,
      value: tempData.temp,
      voltage: result.voltage,
      current: result.current,
      converged: result.converged,
    })
  }

  // Test 5: Edge Cases
  console.log('\n📊 TEST 5: EDGE CASES')
  console.log('Testing extreme but realistic scenarios')
  console.log('-'.repeat(80))

  const edgeCases = [
    {
      name: 'Low Voltage, High R',
      voltage: 1.0,
      resistance: 100000,
      diode: new DiodeCharacteristic(1e-12, 1),
    },
    {
      name: 'High Voltage, Low R',
      voltage: 48.0,
      resistance: 10,
      diode: new DiodeCharacteristic(1e-12, 1),
    },
    {
      name: 'LED Parameters',
      voltage: 3.3,
      resistance: 330,
      diode: new DiodeCharacteristic(1e-9, 2),
    },
    {
      name: 'Zener-like',
      voltage: 12.0,
      resistance: 1000,
      diode: new DiodeCharacteristic(1e-6, 1),
    },
  ]

  for (const testCase of edgeCases) {
    console.log(`\n${testCase.name}:`)
    const result = LoadLineIntersection.solve(
      testCase.diode,
      testCase.voltage,
      testCase.resistance,
      true,
    )
    results.push({
      test: 'Edge Cases',
      parameter: testCase.name,
      value: 0,
      voltage: result.voltage,
      current: result.current,
      converged: result.converged,
    })
  }

  // Analysis
  console.log('\n' + '='.repeat(100))
  console.log('COMPREHENSIVE ANALYSIS')
  console.log('='.repeat(100))

  const convergenceRate = results.filter((r) => r.converged).length / results.length
  console.log(`\n📈 Overall Convergence Rate: ${(convergenceRate * 100).toFixed(1)}%`)

  // Check for realistic forward voltages
  const forwardVoltages = results.map((r) => r.voltage).filter((v) => v > 0 && v < 2)
  console.log(`📈 Realistic Forward Voltages (0-2V): ${forwardVoltages.length}/${results.length}`)

  // Check for monotonic behavior in resistance test
  const resistanceResults = results
    .filter((r) => r.test === 'Load Resistance')
    .sort((a, b) => a.value - b.value)
  let monotonicResistance = true
  for (let i = 1; i < resistanceResults.length; i++) {
    if (resistanceResults[i].current > resistanceResults[i - 1].current) {
      monotonicResistance = false
      console.log(
        `❌ Non-monotonic: ${resistanceResults[i].parameter} current > ${resistanceResults[i - 1].parameter} current`,
      )
    }
  }
  if (monotonicResistance) {
    console.log('✅ Resistance test shows monotonic current decrease')
  }

  // Check for realistic current ranges
  const currentRanges = {
    microamps: results.filter((r) => r.current >= 1e-6 && r.current < 1e-3).length,
    milliamps: results.filter((r) => r.current >= 1e-3 && r.current < 1).length,
    amps: results.filter((r) => r.current >= 1).length,
    unrealistic: results.filter((r) => r.current < 1e-9 || r.current > 100).length,
  }

  console.log('\n📊 Current Distribution:')
  console.log(`  Microamps (1µA-1mA): ${currentRanges.microamps} tests`)
  console.log(`  Milliamps (1mA-1A): ${currentRanges.milliamps} tests`)
  console.log(`  Amps (>1A): ${currentRanges.amps} tests`)
  console.log(`  Unrealistic (<1nA or >100A): ${currentRanges.unrealistic} tests`)

  if (currentRanges.unrealistic > 0) {
    console.log('❌ Some tests produced unrealistic current levels')
  } else {
    console.log('✅ All tests produced realistic current levels')
  }

  // Summary
  console.log('\n' + '='.repeat(100))
  console.log('SIMULATOR VALIDATION SUMMARY')
  console.log('='.repeat(100))

  if (convergenceRate > 0.9 && monotonicResistance && currentRanges.unrealistic === 0) {
    console.log('🎉 SIMULATOR PASSES: Ready for real-world use across parameter ranges')
  } else {
    console.log('❌ SIMULATOR FAILS: Needs fixes for robust parameter handling')
    console.log('\nIssues found:')
    if (convergenceRate <= 0.9)
      console.log(`  - Low convergence rate: ${(convergenceRate * 100).toFixed(1)}%`)
    if (!monotonicResistance) console.log('  - Non-monotonic resistance behavior')
    if (currentRanges.unrealistic > 0)
      console.log(`  - ${currentRanges.unrealistic} tests with unrealistic currents`)
  }

  return results
}

// Run the comprehensive test
console.log('Starting Comprehensive Diode Simulator Validation...\n')

try {
  const results = runComprehensiveTests()
  console.log(`\nTested ${results.length} different parameter combinations`)
  console.log('This is what a REAL simulator validation looks like!')
} catch (error) {
  console.error('Comprehensive test failed:', error)
}
