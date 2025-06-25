const { solveDC } = require('./src/services/simulation.ts')

// Create 12V circuit with explicit small-signal parameters
const explicitCircuit = {
  id: 'explicit-test',
  name: 'Explicit Parameters Test',
  components: [
    {
      id: 'V1',
      type: 'voltage_source',
      position: { x: 100, y: 200 },
      rotation: 0,
      selected: false,
      properties: { voltage: 12.0 }, // 12V supply
    },
    {
      id: 'D1',
      type: 'diode',
      position: { x: 200, y: 100 },
      rotation: 0,
      selected: false,
      properties: { saturationCurrent: 1e-15 }, // Explicit small-signal
    },
    {
      id: 'R1',
      type: 'resistor',
      position: { x: 300, y: 100 },
      rotation: 0,
      selected: false,
      properties: { resistance: 470 }, // Lower resistance
    },
    {
      id: 'GND1',
      type: 'ground',
      position: { x: 100, y: 300 },
      rotation: 0,
      selected: false,
    },
    // Wires
    {
      id: 'W1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'D1',
        endTerminal: 'anode',
      },
    },
    {
      id: 'W2',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'D1',
        startTerminal: 'cathode',
        endComponentId: 'R1',
        endTerminal: 'terminal1',
      },
    },
    {
      id: 'W3',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'R1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
      },
    },
    {
      id: 'W4',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
      },
    },
  ],
  wires: [],
  probes: [],
  nodes: {},
}

// Create 12V circuit with automatic parameter scaling
const autoCircuit = {
  id: 'auto-test',
  name: 'Automatic Parameters Test',
  components: [
    {
      id: 'V1',
      type: 'voltage_source',
      position: { x: 100, y: 200 },
      rotation: 0,
      selected: false,
      properties: { voltage: 12.0 }, // 12V supply
    },
    {
      id: 'D1',
      type: 'diode',
      position: { x: 200, y: 100 },
      rotation: 0,
      selected: false,
      properties: {}, // No explicit parameters - let scaling decide
    },
    {
      id: 'R1',
      type: 'resistor',
      position: { x: 300, y: 100 },
      rotation: 0,
      selected: false,
      properties: { resistance: 470 }, // Lower resistance
    },
    {
      id: 'GND1',
      type: 'ground',
      position: { x: 100, y: 300 },
      rotation: 0,
      selected: false,
    },
    // Wires (same as above)
    {
      id: 'W1',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'positive',
        endComponentId: 'D1',
        endTerminal: 'anode',
      },
    },
    {
      id: 'W2',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'D1',
        startTerminal: 'cathode',
        endComponentId: 'R1',
        endTerminal: 'terminal1',
      },
    },
    {
      id: 'W3',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'R1',
        startTerminal: 'terminal2',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
      },
    },
    {
      id: 'W4',
      type: 'wire',
      position: { x: 0, y: 0 },
      rotation: 0,
      selected: false,
      properties: {
        startComponentId: 'V1',
        startTerminal: 'negative',
        endComponentId: 'GND1',
        endTerminal: 'terminal',
      },
    },
  ],
  wires: [],
  probes: [],
  nodes: {},
}

async function testExplicitVsAuto() {
  console.log('🔧 Testing EXPLICIT parameters (12V, 470Ω, Is=1e-15)')
  const explicitResult = await solveDC(explicitCircuit, true)
  const explicitCurrent = Math.abs(explicitResult.currents['D1'])
  console.log(`  Explicit current: ${explicitCurrent.toExponential(3)}A`)

  console.log('\n🧠 Testing AUTOMATIC parameter scaling (12V, 470Ω, should select Schottky)')
  const autoResult = await solveDC(autoCircuit, true)
  const autoCurrent = Math.abs(autoResult.currents['D1'])
  console.log(`  Auto current: ${autoCurrent.toExponential(3)}A`)

  const currentRatio =
    Math.max(explicitCurrent, autoCurrent) / Math.min(explicitCurrent, autoCurrent)
  console.log(`\n📊 Current ratio: ${currentRatio.toFixed(2)}x`)

  if (currentRatio > 2) {
    console.log('✅ SUCCESS: Significant difference between explicit and automatic parameters')
  } else {
    console.log(
      '❌ FAILURE: Not enough difference - parameter scaling may not be working correctly',
    )
  }

  return { explicitCurrent, autoCurrent, currentRatio }
}

testExplicitVsAuto().catch(console.error)
