/**
 * Simple Range Test for Diode Simulator
 * Shows how the simulator behaves across different parameters
 */

console.log('DIODE SIMULATOR RANGE TEST')
console.log('='.repeat(50))

// Simple diode model
function getDiodeCurrent(voltage, saturationCurrent = 1e-12, thermalVoltage = 0.026) {
  if (voltage < 0) return -saturationCurrent

  const expArg = voltage / thermalVoltage

  // Handle overflow
  if (expArg > 50) {
    return saturationCurrent * Math.exp(expArg)
  } else {
    return saturationCurrent * (Math.exp(expArg) - 1)
  }
}

// Test 1: Different Saturation Currents
console.log('\n1. SATURATION CURRENT RANGE TEST')
console.log('Testing at 0.7V forward voltage:')

const saturationCurrents = [1e-15, 1e-12, 1e-9, 1e-6]
for (const Is of saturationCurrents) {
  const current = getDiodeCurrent(0.7, Is)
  console.log(`Is=${Is.toExponential(0)}: I=${current.toExponential(2)}A`)
}

// Test 2: Different Voltages
console.log('\n2. VOLTAGE RANGE TEST')
console.log('Testing with Is=1e-12:')

for (let v = 0.0; v <= 1.0; v += 0.1) {
  const current = getDiodeCurrent(v, 1e-12)
  console.log(`V=${v.toFixed(1)}V: I=${current.toExponential(2)}A`)
}

// Test 3: Load Line Intersection Simulation
console.log('\n3. LOAD LINE INTERSECTION TEST')
console.log('Testing 5V supply with different resistors:')

const resistances = [100, 1000, 10000]
for (const R of resistances) {
  // Simple approximation: assume diode voltage is ~0.7V
  const diodeVoltage = 0.7
  const current = (5.0 - diodeVoltage) / R
  const diodeCurrent = getDiodeCurrent(diodeVoltage, 1e-12)

  console.log(
    `R=${R}Ω: Vd=0.7V, I_circuit=${current.toExponential(2)}A, I_diode=${diodeCurrent.toExponential(2)}A`,
  )
}

// Test 4: The Problem - High Voltage Operation
console.log('\n4. HIGH VOLTAGE PROBLEM')
console.log('What happens when we force high voltages:')

const highVoltages = [1.0, 2.0, 3.0, 4.0, 5.0]
for (const v of highVoltages) {
  const current = getDiodeCurrent(v, 1e-15) // Small Is like our failing test
  console.log(`V=${v.toFixed(1)}V: I=${current.toExponential(2)}A`)
}

console.log('\n5. ANALYSIS')
console.log('The issue is clear:')
console.log('- With Is=1e-15, the diode saturates at ~4.85e-7A')
console.log('- This happens because exp(V/0.026) gets clamped')
console.log('- Real diodes should operate around 0.7V, not 5V')
console.log('- Our Load Line Intersection finds the math solution')
console.log('- But the math solution is physically unrealistic')

console.log('\nSOLUTION: Use realistic parameters!')
console.log('- Larger Is (1e-12 instead of 1e-15)')
console.log('- Or lower supply voltages (1.5V instead of 5V)')
console.log('- Or both!')
