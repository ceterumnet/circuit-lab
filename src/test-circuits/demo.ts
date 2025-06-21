/**
 * Demo script showing how to use the test circuit system
 * This file demonstrates the key functionality and can be used as a reference
 */

import { runAllCircuitTests, runWireCurrentRegressionTest, testLibrary } from './index'

/**
 * Demo function showing various ways to use the test system
 */
export async function demoTestSystem() {
  console.log('🎯 Circuit Test System Demo')
  console.log('==========================\n')

  // 1. List all available tests
  console.log('📋 Available test circuits:')
  const allTests = testLibrary.getAllTests()
  allTests.forEach((test) => {
    console.log(`   • ${test.name} (${test.category})`)
    console.log(`     ${test.description}`)
  })
  console.log()

  // 2. Run basic functionality tests
  console.log('🔧 Running basic functionality tests...')
  try {
    const basicResults = await testLibrary.runCategory('basic')
    const passed = basicResults.filter((r) => r.passed).length
    console.log(`   Result: ${passed}/${basicResults.length} tests passed\n`)
  } catch (error) {
    console.log(`   Error: ${error}\n`)
  }

  // 3. Run the critical wire current regression test
  console.log('🎯 Running wire current regression test...')
  try {
    await runWireCurrentRegressionTest()
    console.log()
  } catch (error) {
    console.log(`   Error: ${error}\n`)
  }

  // 4. Show test by tags
  console.log('🏷️ Tests tagged with "regression":')
  const regressionTests = testLibrary.getTestsByTag('regression')
  regressionTests.forEach((test) => {
    console.log(`   • ${test.name}`)
  })
  console.log()

  console.log('✅ Demo complete! Use the functions in your browser console:')
  console.log('   • circuitTests.runAll() - run all tests')
  console.log('   • circuitTests.runWireRegression() - test the critical fix')
  console.log('   • circuitTests.library.runCategory("basic") - run specific category')
}

/**
 * Example of how to create and add a new test circuit
 */
export function exampleAddNewTest() {
  // This shows how you would add a new test to the system
  const newTestSuite = {
    name: 'Edge Cases',
    description: 'Tests for edge cases and error conditions',
    tests: [
      {
        name: 'Single Resistor Circuit',
        description: 'Simplest possible circuit - one resistor and one voltage source',
        category: 'basic' as const,
        tags: ['simple', 'edge-case'],
        circuit: {
          id: 'single-resistor',
          name: 'Single Resistor',
          components: [
            // ... circuit definition would go here
          ],
          wires: [],
          probes: [],
          nodes: {},
        },
        expected: {
          currents: { R1: 0.005 }, // 5mA through 1kΩ with 5V
          tolerance: 0.001,
        },
      },
    ],
  }

  // Register the new suite
  testLibrary.registerSuite(newTestSuite)
  console.log('✅ New test suite "Edge Cases" registered')
}

/**
 * Example of how to export a circuit from the UI to create a test
 */
export function exampleExportCircuitAsTest() {
  console.log(`
📝 To create a test from a circuit you built in the UI:

1. Build your circuit in the Circuit Editor
2. In browser console, run:
   const circuit = useCircuitStore().currentCircuit
   console.log(JSON.stringify(circuit, null, 2))

3. Copy the JSON output
4. Create a new TestCircuit object:
   const myTest: TestCircuit = {
     name: "My Custom Test",
     description: "Description of what this validates",
     category: "basic",
     circuit: /* paste the JSON here */,
     expected: {
       voltages: { "0": 5.0, "1": 2.5 },
       currents: { "R1": 0.0025 }
     }
   }

5. Add it to a test suite or create a new file
  `)
}

// Run demo if this file is imported directly
if (import.meta.hot) {
  console.log('🎯 Test system loaded! Try: demoTestSystem()')
}
