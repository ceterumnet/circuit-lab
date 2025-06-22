// Debug script to compare standalone LED solver vs MNA implementation
// This will help isolate the exact numerical discrepancy

// Standalone LED equation solver (KNOWN TO WORK)
function solveLEDStandalone() {
  console.log('=== STANDALONE LED SOLVER (KNOWN WORKING) ===')

  const Vsupply = 5.0
  const R = 1000.0

  // LED parameters - same as MNA implementation
  const Is = 1e-6 // Saturation current
  const Vt = 0.1 // Thermal voltage
  const Vf = 2.0 // Forward voltage threshold

  function ledCurrent(vLed) {
    if (vLed < 0) return -1e-12
    const expArg = Math.min((vLed - Vf) / Vt, 20)
    return Is * (Math.exp(expArg) - 1)
  }

  function ledConductance(vLed) {
    if (vLed < 0) return 1e-12
    const expArg = Math.min((vLed - Vf) / Vt, 20)
    return (Is / Vt) * Math.exp(expArg)
  }

  // Newton-Raphson to solve: Vsupply = vLed + I*R where I = ledCurrent(vLed)
  let vLed = 2.5 // Initial guess

  for (let iter = 0; iter < 20; iter++) {
    const current = ledCurrent(vLed)
    const conductance = ledConductance(vLed)

    // Circuit equation: f(vLed) = Vsupply - vLed - ledCurrent(vLed)*R = 0
    const f = Vsupply - vLed - current * R
    const dfDv = -1 - conductance * R // Derivative

    const delta = -f / dfDv
    vLed += delta

    console.log(
      `Iter ${iter + 1}: vLed=${vLed.toFixed(4)}V, I=${current.toExponential(3)}A, f=${f.toExponential(3)}, delta=${delta.toExponential(3)}`,
    )

    if (Math.abs(delta) < 1e-6) {
      console.log(`✅ Converged: vLed=${vLed.toFixed(4)}V, I=${ledCurrent(vLed).toExponential(3)}A`)
      return { vLed, current: ledCurrent(vLed), converged: true }
    }
  }

  console.log(`❌ Failed to converge`)
  return { vLed, current: ledCurrent(vLed), converged: false }
}

// MNA Companion Model Solver (TO BE DEBUGGED)
function solveLEDCompanionModel() {
  console.log('\n=== MNA COMPANION MODEL SOLVER (TO DEBUG) ===')

  const Vsupply = 5.0
  const R = 1000.0

  // LED parameters - identical to standalone
  const Is = 1e-6
  const Vt = 0.1
  const Vf = 2.0

  function ledCurrent(vLed) {
    if (vLed < 0) return -1e-12
    const expArg = Math.min((vLed - Vf) / Vt, 20)
    return Is * (Math.exp(expArg) - 1)
  }

  function ledConductance(vLed) {
    if (vLed < 0) return 1e-12
    const expArg = Math.min((vLed - Vf) / Vt, 20)
    return (Is / Vt) * Math.exp(expArg)
  }

  // MNA setup: 3 nodes (supply+, LED+, ground)
  // Node 0: Ground (0V reference)
  // Node 1: Supply positive (5V)
  // Node 2: LED anode (between resistor and LED)

  let vNodes = [0, 5, 2.5] // Initial guess: [ground, supply, led_anode]

  for (let iter = 0; iter < 20; iter++) {
    const vLed = vNodes[2] - vNodes[0] // LED voltage (node 2 to ground)

    // Calculate LED companion model
    const current = ledCurrent(vLed)
    const conductance = ledConductance(vLed)
    const equivalentCurrent = current - conductance * vLed // This is the key line!

    console.log(
      `Iter ${iter + 1}: LED voltage=${vLed.toFixed(4)}V, I=${current.toExponential(3)}A, G=${conductance.toExponential(3)}S, Ieq=${equivalentCurrent.toExponential(3)}A`,
    )

    // Build MNA matrix (3x3 for nodes 0,1,2)
    // Resistor: 1000Ω between nodes 1 and 2
    // LED companion: conductance G + current source Ieq between nodes 2 and 0
    // Voltage source: 5V between nodes 1 and 0

    const G = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ] // Conductance matrix
    const I = [0, 0, 0] // Current injection vector

    // Resistor stamp (nodes 1-2)
    const gR = 1 / R
    G[1][1] += gR
    G[1][2] -= gR
    G[2][1] -= gR
    G[2][2] += gR

    // LED companion conductance stamp (nodes 2-0)
    G[2][2] += conductance
    G[2][0] -= conductance
    G[0][2] -= conductance
    G[0][0] += conductance

    // FIXED: LED companion current source stamp with correct polarity
    // Current flows from anode (node 2) to cathode (node 0)
    // KCL: current INTO anode = -nortonCurrent, current OUT OF cathode = +nortonCurrent
    I[2] -= equivalentCurrent
    I[0] += equivalentCurrent

    // Ground constraint: node 0 = 0V
    G[0][0] = 1
    G[0][1] = 0
    G[0][2] = 0
    I[0] = 0

    // Voltage source constraint: node 1 = 5V
    G[1][0] = 0
    G[1][1] = 1
    G[1][2] = 0
    I[1] = Vsupply

    // Print matrix for debugging
    console.log(`  G matrix: [${G[0].map((x) => x.toExponential(2)).join(', ')}]`)
    console.log(`            [${G[1].map((x) => x.toExponential(2)).join(', ')}]`)
    console.log(`            [${G[2].map((x) => x.toExponential(2)).join(', ')}]`)
    console.log(`  I vector: [${I.map((x) => x.toExponential(2)).join(', ')}]`)

    // Solve linear system G * v = I
    // Simple 3x3 solver (Cramer's rule for debugging)
    const det =
      G[0][0] * (G[1][1] * G[2][2] - G[1][2] * G[2][1]) -
      G[0][1] * (G[1][0] * G[2][2] - G[1][2] * G[2][0]) +
      G[0][2] * (G[1][0] * G[2][1] - G[1][1] * G[2][0])

    if (Math.abs(det) < 1e-12) {
      console.log(`❌ Singular matrix, det=${det}`)
      break
    }

    const newV = [
      (I[0] * (G[1][1] * G[2][2] - G[1][2] * G[2][1]) -
        I[1] * (G[0][1] * G[2][2] - G[0][2] * G[2][1]) +
        I[2] * (G[0][1] * G[1][2] - G[0][2] * G[1][1])) /
        det,
      (G[0][0] * (I[1] * G[2][2] - I[2] * G[1][2]) -
        G[0][1] * (I[0] * G[2][2] - I[2] * G[2][0]) +
        G[0][2] * (I[0] * G[1][2] - I[1] * G[2][0])) /
        det,
      (G[0][0] * (G[1][1] * I[2] - G[1][2] * I[1]) -
        G[0][1] * (G[1][0] * I[2] - G[1][2] * I[0]) +
        G[0][2] * (G[1][0] * I[1] - G[1][1] * I[0])) /
        det,
    ]

    console.log(`  Solution: [${newV.map((x) => x.toFixed(4)).join(', ')}]V`)

    // Check convergence
    const maxDelta = Math.max(
      Math.abs(newV[0] - vNodes[0]),
      Math.abs(newV[1] - vNodes[1]),
      Math.abs(newV[2] - vNodes[2]),
    )
    vNodes = newV

    if (maxDelta < 1e-6) {
      const finalLedVoltage = vNodes[2] - vNodes[0]
      const finalCurrent = ledCurrent(finalLedVoltage)
      console.log(
        `✅ Converged: vLed=${finalLedVoltage.toFixed(4)}V, I=${finalCurrent.toExponential(3)}A`,
      )
      return { vLed: finalLedVoltage, current: finalCurrent, converged: true }
    }
  }

  console.log(`❌ Failed to converge`)
  const finalLedVoltage = vNodes[2] - vNodes[0]
  return { vLed: finalLedVoltage, current: ledCurrent(finalLedVoltage), converged: false }
}

// Compare both methods
console.log('LED Model Debug: Standalone vs MNA Companion Model')
console.log('Circuit: 5V supply + 1kΩ resistor + LED')
console.log('LED params: Is=1e-6A, Vt=0.1V, Vf=2.0V')

const standalone = solveLEDStandalone()
const companion = solveLEDCompanionModel()

console.log('\n=== COMPARISON ===')
console.log(
  `Standalone: vLed=${standalone.vLed.toFixed(4)}V, I=${standalone.current.toExponential(3)}A`,
)
console.log(
  `Companion:  vLed=${companion.vLed.toFixed(4)}V, I=${companion.current.toExponential(3)}A`,
)
console.log(
  `Difference: ΔV=${Math.abs(standalone.vLed - companion.vLed).toExponential(3)}V, ΔI=${Math.abs(standalone.current - companion.current).toExponential(3)}A`,
)

if (Math.abs(standalone.current - companion.current) / standalone.current > 0.01) {
  console.log('❌ SIGNIFICANT DISCREPANCY FOUND - MNA implementation has a bug!')
} else {
  console.log('✅ Methods agree - look elsewhere for the bug')
}
