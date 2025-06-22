import { testRunner } from './runner'
import { basicTests } from './basic-tests'
import type { TestCircuit, TestResult, TestSuite } from './types'

/**
 * Test circuit library - centralized access to all test circuits
 */
export class TestCircuitLibrary {
  private testSuites: Map<string, TestSuite> = new Map()

  constructor() {
    this.loadDefaultSuites()
  }

  /**
   * Load default test suites
   */
  private loadDefaultSuites() {
    this.registerSuite({
      name: 'Basic Functionality',
      description: 'Core simulation functionality tests',
      tests: basicTests,
    })
  }

  /**
   * Register a new test suite
   */
  registerSuite(suite: TestSuite) {
    this.testSuites.set(suite.name, suite)
  }

  /**
   * Get all available test suites
   */
  getSuites(): TestSuite[] {
    return Array.from(this.testSuites.values())
  }

  /**
   * Get a specific test suite by name
   */
  getSuite(name: string): TestSuite | undefined {
    return this.testSuites.get(name)
  }

  /**
   * Get all test circuits from all suites
   */
  getAllTests(): TestCircuit[] {
    const allTests: TestCircuit[] = []
    for (const suite of this.testSuites.values()) {
      allTests.push(...suite.tests)
    }
    return allTests
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category: TestCircuit['category']): TestCircuit[] {
    return this.getAllTests().filter((test) => test.category === category)
  }

  /**
   * Get tests by tag
   */
  getTestsByTag(tag: string): TestCircuit[] {
    return this.getAllTests().filter((test) => test.tags && test.tags.includes(tag))
  }

  /**
   * Run all tests from all suites
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Running all test circuits...')
    const allTests = this.getAllTests()
    return await testRunner.runTests(allTests)
  }

  /**
   * Run tests from a specific suite
   */
  async runSuite(suiteName: string): Promise<TestResult[]> {
    const suite = this.getSuite(suiteName)
    if (!suite) {
      throw new Error(`Test suite "${suiteName}" not found`)
    }

    console.log(`🧪 Running test suite: ${suiteName}`)
    return await testRunner.runTests(suite.tests)
  }

  /**
   * Run tests by category
   */
  async runCategory(category: TestCircuit['category']): Promise<TestResult[]> {
    console.log(`🔍 Running ${category} tests...`)
    const tests = this.getTestsByCategory(category)
    return await testRunner.runTests(tests)
  }

  /**
   * Run tests by tag
   */
  async runTag(tag: string): Promise<TestResult[]> {
    console.log(`🏷️ Running tests tagged with "${tag}"...`)
    const tests = this.getTestsByTag(tag)
    return await testRunner.runTests(tests)
  }

  /**
   * Run the critical wire current regression test
   */
  async runWireCurrentRegression(): Promise<TestResult[]> {
    console.log('🔧 Running wire current regression test...')
    return await this.runTag('wire-current')
  }

  /**
   * Generate comprehensive report for all tests
   */
  async generateFullReport(): Promise<string> {
    const results = await this.runAllTests()
    return testRunner.generateReport(results)
  }
}

/**
 * Global test circuit library instance
 */
export const testLibrary = new TestCircuitLibrary()

// Re-export key types and utilities
export type { TestCircuit, TestResult, TestSuite } from './types'
export { testRunner } from './runner'

/**
 * Convenience functions for quick testing
 */

/**
 * Quick test runner - just call this function to run all tests
 */
export async function runAllCircuitTests(): Promise<void> {
  try {
    const results = await testLibrary.runAllTests()
    const report = testRunner.generateReport(results)
    console.log('\n' + '='.repeat(50))
    console.log(report)
  } catch (error) {
    console.error('❌ Test execution failed:', error)
  }
}

/**
 * Quick regression test for the wire current bug fix
 */
export async function runWireCurrentRegressionTest(): Promise<void> {
  try {
    console.log('🎯 Testing wire current detection fix...')
    const results = await testLibrary.runWireCurrentRegression()

    const wireCurrentTest = results.find((r) => r.name.includes('Wire Current'))
    if (wireCurrentTest) {
      if (wireCurrentTest.passed) {
        console.log('✅ Wire current regression test PASSED!')
        console.log('   The critical W4 wire current bug has been fixed! 🎉')
      } else {
        console.log('❌ Wire current regression test FAILED!')
        console.log('   The W4 wire current bug fix needs more work.')

        // Show specific failures
        const wireCurrentFailures = wireCurrentTest.validation.currents.filter(
          (v) => v.property === 'W4' && !v.passed,
        )

        wireCurrentFailures.forEach((f) => {
          console.log(`   W4 current: expected ${f.expected}A, got ${f.actual}A`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Regression test failed:', error)
  }
}

// Console API for development (available in browser console)
if (typeof window !== 'undefined') {
  interface CircuitTestsAPI {
    runAll: () => Promise<void>
    runWireRegression: () => Promise<void>
    library: TestCircuitLibrary
    runner: typeof testRunner
  }

  ;(window as unknown as { circuitTests: CircuitTestsAPI }).circuitTests = {
    runAll: runAllCircuitTests,
    runWireRegression: runWireCurrentRegressionTest,
    library: testLibrary,
    runner: testRunner,
  }

  console.log('🧪 Circuit test API available at window.circuitTests')
  console.log('   Use circuitTests.runAll() to run all tests')
  console.log('   Use circuitTests.runWireRegression() to test the wire current fix')
}

export * from './runner'
export * from './basic-tests'
export * from './demo'
export * from './current-source-test'
export * from './current-source-runner'
export * from './led-test'

// New function to seed saved circuits with test circuits
export async function seedSavedCircuitsWithTests(): Promise<number> {
  // Get all available test circuits from the library
  const testCircuits = testLibrary.getAllTests()

  let seededCount = 0

  testCircuits.forEach((testCircuit) => {
    try {
      // Get existing saved circuits to avoid duplicates
      const savedCircuitsJson = localStorage.getItem('circuitlab_saved_circuits')
      const savedCircuits = savedCircuitsJson ? JSON.parse(savedCircuitsJson) : {}

      // Use test circuit name as the key, but add prefix to distinguish from user circuits
      const saveName = `[Test] ${testCircuit.name}`

      // Skip if already exists
      if (savedCircuits[saveName]) {
        console.log(`Test circuit "${saveName}" already exists, skipping`)
        return
      }

      // Create save data with metadata
      const saveData = {
        circuit: JSON.parse(JSON.stringify(testCircuit.circuit)),
        savedAt: new Date().toISOString(),
        name: saveName,
        isTestCircuit: true, // Mark as test circuit
        description: testCircuit.description,
      }

      // Save to storage
      savedCircuits[saveName] = saveData
      localStorage.setItem('circuitlab_saved_circuits', JSON.stringify(savedCircuits))

      seededCount++
      console.log(`[Test] Seeded circuit: "${saveName}"`)
    } catch (error) {
      console.error(`[Test] Failed to seed circuit "${testCircuit.name}":`, error)
    }
  })

  return seededCount
}
