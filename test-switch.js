// Simple switch test runner
import { switchTests } from './src/test-circuits/switch-test.ts'
import { testRunner } from './src/test-circuits/runner.ts'

console.log('🔧 Testing Switch Implementation...')

try {
  const results = await testRunner.runTests(switchTests)
  const report = testRunner.generateReport(results)
  console.log('\n' + '='.repeat(50))
  console.log(report)
} catch (error) {
  console.error('❌ Switch test failed:', error)
}
