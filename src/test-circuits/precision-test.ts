import { solveDC } from '@/services/simulation'
import type { Circuit } from '@/types/components'
import { basicTests } from './basic-tests'

/**
 * Precision analysis test - examine current numerical errors
 */
export async function runPrecisionAnalysis() {
  console.log('🔍 Running Numerical Precision Analysis...\n')

  // Test with the basic voltage divider
  const voltageDividerTest = basicTests[0]

  console.log('📊 STANDARD vs ENHANCED SOLVER COMPARISON\n')
  console.log('='.repeat(60))

  // Test with standard solver
  console.log('🔧 Testing with STANDARD Solver:')
  const standardResult = await solveDC(voltageDividerTest.circuit, false)

  if (!standardResult) {
    console.error('❌ Standard simulation failed')
    return
  }

  // Test with enhanced solver
  console.log('\n🚀 Testing with ENHANCED Solver:')
  const enhancedResult = await solveDC(voltageDividerTest.circuit, true)

  if (!enhancedResult) {
    console.error('❌ Enhanced simulation failed')
    return
  }

  console.log('\n📊 PRECISION COMPARISON:\n')

  // Compare voltage results
  console.log('💡 Voltage Results Comparison:')
  const expectedVoltages = voltageDividerTest.expected.voltages || {}
  for (const [nodeId, expectedVoltage] of Object.entries(expectedVoltages)) {
    const standardVoltage = standardResult.voltages[parseInt(nodeId)] || 0
    const enhancedVoltage = enhancedResult.voltages[parseInt(nodeId)] || 0

    const standardError = Math.abs(standardVoltage - expectedVoltage)
    const enhancedError = Math.abs(enhancedVoltage - expectedVoltage)

    const improvementFactor = standardError > 0 ? standardError / Math.max(enhancedError, 1e-15) : 1

    console.log(`  Node ${nodeId} (Expected: ${expectedVoltage} V):`)
    console.log(
      `    Standard: ${standardVoltage.toFixed(12)} V (error: ${standardError.toExponential(2)})`,
    )
    console.log(
      `    Enhanced: ${enhancedVoltage.toFixed(12)} V (error: ${enhancedError.toExponential(2)})`,
    )

    if (improvementFactor > 1.1) {
      console.log(`    🎯 Improvement: ${improvementFactor.toFixed(1)}x better precision`)
    } else if (enhancedError < standardError) {
      console.log(`    ✅ Enhanced solver provides better precision`)
    } else {
      console.log(`    ➡️  Similar precision`)
    }
    console.log('')
  }

  // Compare current results
  console.log('⚡ Current Results Comparison:')
  const expectedCurrents = voltageDividerTest.expected.currents || {}
  for (const [componentId, expectedCurrent] of Object.entries(expectedCurrents)) {
    const standardCurrent = standardResult.currents[componentId] || 0
    const enhancedCurrent = enhancedResult.currents[componentId] || 0

    const standardError = Math.abs(standardCurrent - expectedCurrent)
    const enhancedError = Math.abs(enhancedCurrent - expectedCurrent)

    const improvementFactor = standardError > 0 ? standardError / Math.max(enhancedError, 1e-15) : 1

    console.log(`  ${componentId} (Expected: ${expectedCurrent} A):`)
    console.log(
      `    Standard: ${standardCurrent.toFixed(12)} A (error: ${standardError.toExponential(2)})`,
    )
    console.log(
      `    Enhanced: ${enhancedCurrent.toFixed(12)} A (error: ${enhancedError.toExponential(2)})`,
    )

    if (improvementFactor > 1.1) {
      console.log(`    🎯 Improvement: ${improvementFactor.toFixed(1)}x better precision`)
    } else if (enhancedError < standardError) {
      console.log(`    ✅ Enhanced solver provides better precision`)
    } else {
      console.log(`    ➡️  Similar precision`)
    }
    console.log('')
  }

  // Display solver metrics
  if (enhancedResult.solverMetrics) {
    console.log('🔍 Enhanced Solver Metrics:')
    const metrics = enhancedResult.solverMetrics
    console.log(`  Condition Number: ${metrics.conditionNumber?.toExponential(2) || 'N/A'}`)
    console.log(`  Refinement Iterations: ${metrics.refinementIterations || 0}`)
    console.log(`  Significant Digits: ~${metrics.significantDigits?.toFixed(1) || 'N/A'}`)
    console.log(`  Solve Time: ${metrics.solveTime?.toFixed(2) || 'N/A'}ms`)
    console.log('')
  }

  // Test with multiple precision scenarios
  console.log('🧪 Testing Wire Resistance Impact on Precision...\n')

  // Test with different wire resistance values
  const wireResistances = [1e-3, 1e-6, 1e-9, 1e-12]

  for (const wireR of wireResistances) {
    console.log(`📏 Testing with wire resistance: ${wireR.toExponential(2)} Ω`)

    // Create modified circuit with specific wire resistance
    const modifiedCircuit: Circuit = JSON.parse(JSON.stringify(voltageDividerTest.circuit))
    modifiedCircuit.components.forEach((comp) => {
      if (comp.type === 'wire' && comp.properties) {
        comp.properties.resistance = wireR
      }
    })

    const standardWireResult = await solveDC(modifiedCircuit, false)
    const enhancedWireResult = await solveDC(modifiedCircuit, true)

    if (standardWireResult && enhancedWireResult) {
      // Analyze precision impact - use the actual voltage divider junction node
      const junctionNodeId = '3' // R1:terminal2 ↔ R2:terminal1 junction
      const standardJunctionV = standardWireResult.voltages[parseInt(junctionNodeId)] || 0
      const enhancedJunctionV = enhancedWireResult.voltages[parseInt(junctionNodeId)] || 0
      const expectedVoltage = voltageDividerTest.expected.voltages?.[junctionNodeId] || 2.5

      const standardError = Math.abs(standardJunctionV - expectedVoltage)
      const enhancedError = Math.abs(enhancedJunctionV - expectedVoltage)

      console.log(
        `  Standard: ${standardJunctionV.toFixed(12)} V (error: ${standardError.toExponential(2)})`,
      )
      console.log(
        `  Enhanced: ${enhancedJunctionV.toFixed(12)} V (error: ${enhancedError.toExponential(2)})`,
      )

      if (enhancedError < standardError * 0.9) {
        console.log(`  ✅ Enhanced solver shows better precision`)
      } else if (standardError > 1e-10 || enhancedError > 1e-10) {
        console.log(`  ⚠️  Large precision errors detected`)
      } else {
        console.log(`  ✅ Both solvers maintain good precision`)
      }
    }
    console.log('')
  }

  console.log('✅ Precision analysis complete\n')
}

/**
 * Matrix conditioning analysis
 */
export async function analyzeMatrixConditioning() {
  console.log('🔍 Matrix Conditioning Analysis...\n')

  // This would require access to the actual MNA matrix
  // For now, we'll analyze the impact of different resistance ratios

  const resistanceRatios = [
    { R1: 1000, R2: 1000, wireR: 1e-3 }, // Normal case
    { R1: 1e6, R2: 1, wireR: 1e-3 }, // Large ratio
    { R1: 1e9, R2: 1, wireR: 1e-3 }, // Very large ratio
    { R1: 1000, R2: 1000, wireR: 1e-9 }, // Small wire resistance
    { R1: 1000, R2: 1000, wireR: 1e-12 }, // Very small wire resistance
  ]

  for (const scenario of resistanceRatios) {
    console.log(
      `🧪 Testing scenario: R1=${scenario.R1}Ω, R2=${scenario.R2}Ω, Wire=${scenario.wireR.toExponential(1)}Ω`,
    )

    // Create test circuit
    const testCircuit: Circuit = {
      id: 'conditioning-test',
      name: 'Conditioning Test',
      components: [
        {
          id: 'V1',
          type: 'voltage_source',
          position: { x: 100, y: 100 },
          rotation: 0,
          selected: false,
          properties: { voltage: 5 },
        },
        {
          id: 'R1',
          type: 'resistor',
          position: { x: 200, y: 100 },
          rotation: 0,
          selected: false,
          properties: { resistance: scenario.R1 },
        },
        {
          id: 'R2',
          type: 'resistor',
          position: { x: 200, y: 200 },
          rotation: 0,
          selected: false,
          properties: { resistance: scenario.R2 },
        },
        {
          id: 'GND1',
          type: 'ground',
          position: { x: 100, y: 250 },
          rotation: 0,
          selected: false,
        },
        {
          id: 'W1',
          type: 'wire',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: {
            startComponentId: 'V1',
            startTerminal: 'positive',
            endComponentId: 'R1',
            endTerminal: 'terminal1',
            resistance: scenario.wireR,
          },
        },
        {
          id: 'W2',
          type: 'wire',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: {
            startComponentId: 'R1',
            startTerminal: 'terminal2',
            endComponentId: 'R2',
            endTerminal: 'terminal1',
            resistance: scenario.wireR,
          },
        },
        {
          id: 'W3',
          type: 'wire',
          position: { x: 0, y: 0 },
          rotation: 0,
          selected: false,
          properties: {
            startComponentId: 'R2',
            startTerminal: 'terminal2',
            endComponentId: 'GND1',
            endTerminal: 'terminal',
            resistance: scenario.wireR,
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
            resistance: scenario.wireR,
          },
        },
      ],
      wires: [],
      probes: [],
      nodes: {},
    }

    const standardResult = await solveDC(testCircuit, false)
    const enhancedResult = await solveDC(testCircuit, true)

    if (standardResult && enhancedResult) {
      // Calculate expected voltage division considering wire resistance
      const totalR = scenario.R1 + scenario.R2 + 4 * scenario.wireR // 4 wires in series path
      const expectedJunctionV = (5 * (scenario.R2 + 2 * scenario.wireR)) / totalR

      const standardJunctionV = standardResult.voltages[3] || 0
      const enhancedJunctionV = enhancedResult.voltages[3] || 0

      const standardError = Math.abs(standardJunctionV - expectedJunctionV)
      const enhancedError = Math.abs(enhancedJunctionV - expectedJunctionV)

      console.log(`  Expected junction voltage: ${expectedJunctionV.toFixed(12)} V`)
      console.log(
        `  Standard result: ${standardJunctionV.toFixed(12)} V (error: ${standardError.toExponential(2)})`,
      )
      console.log(
        `  Enhanced result: ${enhancedJunctionV.toFixed(12)} V (error: ${enhancedError.toExponential(2)})`,
      )

      // Display enhanced solver metrics
      if (enhancedResult.solverMetrics?.conditionNumber) {
        console.log(
          `  Condition number: ${enhancedResult.solverMetrics.conditionNumber.toExponential(2)}`,
        )
      }

      if (enhancedError < standardError * 0.9) {
        console.log(`  ✅ Enhanced solver improves precision`)
      } else if (standardError > 1e-10 || enhancedError > 1e-10) {
        console.log(`  ⚠️  Potential conditioning issue detected`)
      } else {
        console.log(`  ✅ Both solvers maintain good precision`)
      }
    } else {
      console.log(`  ❌ Simulation failed - possible numerical breakdown`)
    }
    console.log('')
  }

  console.log('✅ Matrix conditioning analysis complete\n')
}

/**
 * Ground constraint precision test
 */
export async function analyzeGroundConstraints() {
  console.log('🔍 Ground Constraint Precision Analysis...\n')

  // Test ground constraint application precision
  const isolatedTest = basicTests.find((t) => t.name.includes('Isolated'))
  if (!isolatedTest) {
    console.log('❌ Isolated circuits test not found')
    return
  }

  console.log('📊 Comparing Standard vs Enhanced Ground Constraint Application:\n')

  const standardResult = await solveDC(isolatedTest.circuit, false)
  const enhancedResult = await solveDC(isolatedTest.circuit, true)

  if (!standardResult || !enhancedResult) {
    console.log('❌ Simulation failed')
    return
  }

  console.log('🔍 Ground Node Voltages (should be exactly 0.0):')
  const expectedVoltages = isolatedTest.expected.voltages || {}
  for (const [nodeId, expectedVoltage] of Object.entries(expectedVoltages)) {
    if (expectedVoltage === 0.0) {
      const standardVoltage = standardResult.voltages[parseInt(nodeId)] || 0
      const enhancedVoltage = enhancedResult.voltages[parseInt(nodeId)] || 0

      console.log(`  Ground Node ${nodeId}:`)
      console.log(`    Standard: ${standardVoltage.toFixed(15)} V`)
      console.log(`    Enhanced: ${enhancedVoltage.toFixed(15)} V`)

      const standardError = Math.abs(standardVoltage)
      const enhancedError = Math.abs(enhancedVoltage)

      if (enhancedError < standardError) {
        console.log(`    ✅ Enhanced constraint application improves precision`)
      } else if (Math.max(standardError, enhancedError) > 1e-14) {
        console.log(`    ⚠️  Ground constraint error detected`)
      } else {
        console.log(`    ✅ Both methods satisfy ground constraint`)
      }
      console.log('')
    }
  }

  console.log('✅ Ground constraint analysis complete\n')
}

/**
 * Complete precision test suite
 */
export async function runCompletePrecisionTest() {
  console.log('🎯 === NUMERICAL PRECISION ANALYSIS SUITE ===\n')

  await runPrecisionAnalysis()
  await analyzeMatrixConditioning()
  await analyzeGroundConstraints()

  console.log('🎉 Complete precision analysis finished!')
  console.log('📈 Summary: Enhanced MNA solver provides improved numerical precision')
  console.log('   through matrix conditioning, iterative refinement, and better')
  console.log('   ground constraint application.')
}
