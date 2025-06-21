import { runCompletePrecisionTest } from './precision-test'

/**
 * Console runner for precision analysis - can be run from browser dev tools
 */
export class PrecisionTestRunner {
  static async runAnalysis() {
    console.clear()
    console.log('🎯 Starting Numerical Precision Analysis...')
    console.log('='.repeat(60))

    try {
      await runCompletePrecisionTest()
    } catch (error) {
      console.error('❌ Precision analysis failed:', error)
    }
  }
}

// Make it globally available for browser console access
if (typeof window !== 'undefined') {
  ;(window as unknown as { PrecisionTest: typeof PrecisionTestRunner }).PrecisionTest =
    PrecisionTestRunner
  console.log('📝 To run precision analysis, use: PrecisionTest.runAnalysis()')
}
