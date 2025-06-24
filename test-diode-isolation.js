// Test diode model in complete isolation
// This tests ONLY the diode equations without any circuit simulation

// Mock the diode model from the simulation
class IsolatedDiodeModel {
  constructor(saturationCurrent = 1e-12) {
    this.saturationCurrent = saturationCurrent
  }

  calculateNonLinearCurrent(voltage) {
    if (voltage < 0) {
      // Reverse bias - small leakage current
      return -1e-12
    }

    // Current logarithmic model from simulation.ts
    if (voltage < 0.3) {
      // Below turn-on: exponential region can be handled normally
      const Is = 1e-12 // Standard saturation current (1pA)
      const Vt = 0.026 // Standard thermal voltage (26mV)
      const expArg = Math.min(voltage / Vt, 10) // Safe exponential range
      return Is * (Math.exp(expArg) - 1)
    } else {
      // Above turn-on: use logarithmic approximation to prevent overflow
      const I0 = 1e-6 // Reference current at turn-on (1µA)
      const V0 = 0.3 // Turn-on voltage reference point
      const n = 8 // Slope factor (controls steepness)

      // Logarithmic model: I = I0 * (V/V0)^n for V > V0
      const currentRatio = Math.pow(voltage / V0, n)
      const current = I0 * currentRatio

      // Realistic saturation: limit maximum current for very high voltages
      return Math.min(current, 0.1) // Cap at 100mA
    }
  }

  calculateConductance(voltage) {
    if (voltage < 0) {
      return 1e-12 // Small conductance in reverse bias
    }

    if (voltage < 0.3) {
      // Below turn-on: derivative of exponential model
      const Is = 1e-12
      const Vt = 0.026
      const expArg = Math.min(voltage / Vt, 10)
      const conductance = (Is / Vt) * Math.exp(expArg)
      return Math.max(conductance, 1e-12)
    } else {
      // Above turn-on: derivative of logarithmic model
      const I0 = 1e-6
      const V0 = 0.3
      const n = 8

      const currentRatio = Math.pow(voltage / V0, n - 1)
      const conductance = (I0 * n * currentRatio) / V0

      // Apply same saturation limit
      const currentValue = I0 * Math.pow(voltage / V0, n)
      if (currentValue >= 0.1) {
        return 1e-6 // Small conductance when current is saturated
      }

      return Math.max(conductance, 1e-12)
    }
  }
}

// Test the diode model in isolation
console.log('=== DIODE MODEL ISOLATION TEST ===\n')

const diode = new IsolatedDiodeModel()

console.log('1. REVERSE BIAS TEST:')
const reverseVoltages = [-5, -1, -0.5]
reverseVoltages.forEach((v) => {
  const current = diode.calculateNonLinearCurrent(v)
  const conductance = diode.calculateConductance(v)
  console.log(
    `  V=${v.toFixed(1)}V: I=${current.toExponential(2)}A, G=${conductance.toExponential(2)}S`,
  )
})

console.log('\n2. LOW FORWARD BIAS TEST (below turn-on):')
const lowVoltages = [0.1, 0.2, 0.25, 0.29]
lowVoltages.forEach((v) => {
  const current = diode.calculateNonLinearCurrent(v)
  const conductance = diode.calculateConductance(v)
  console.log(
    `  V=${v.toFixed(2)}V: I=${current.toExponential(2)}A, G=${conductance.toExponential(2)}S`,
  )
})

console.log('\n3. FORWARD BIAS TEST (above turn-on):')
const forwardVoltages = [0.3, 0.5, 0.7, 1.0, 2.0]
forwardVoltages.forEach((v) => {
  const current = diode.calculateNonLinearCurrent(v)
  const conductance = diode.calculateConductance(v)
  console.log(
    `  V=${v.toFixed(1)}V: I=${current.toExponential(2)}A, G=${conductance.toExponential(2)}S`,
  )
})

console.log('\n4. PARAMETER SENSITIVITY TEST:')
const normalDiode = new IsolatedDiodeModel(1e-12)
const highIsDiode = new IsolatedDiodeModel(1e-9)

const testVoltage = 0.7
const normalCurrent = normalDiode.calculateNonLinearCurrent(testVoltage)
const highIsCurrent = highIsDiode.calculateNonLinearCurrent(testVoltage)

console.log(`  Normal Is (1e-12): V=${testVoltage}V → I=${normalCurrent.toExponential(2)}A`)
console.log(`  High Is (1e-9):    V=${testVoltage}V → I=${highIsCurrent.toExponential(2)}A`)
console.log(`  Current ratio: ${(highIsCurrent / normalCurrent).toFixed(1)}x`)

console.log('\n5. EXPONENTIAL BEHAVIOR TEST:')
const voltageRange = [1, 2, 3, 4, 5]
const currents = voltageRange.map((v) => diode.calculateNonLinearCurrent(v))
console.log('  Voltage sweep:')
voltageRange.forEach((v, i) => {
  console.log(`    V=${v}V: I=${currents[i].toExponential(2)}A`)
})

console.log('\n  Exponential growth check:')
for (let i = 1; i < currents.length; i++) {
  const ratio = currents[i] / currents[i - 1]
  console.log(`    I(${voltageRange[i]}V) / I(${voltageRange[i - 1]}V) = ${ratio.toFixed(1)}x`)
}

console.log('\n=== DIODE MODEL VALIDATION COMPLETE ===')
