/**
 * AC Circuit Analysis - Frequency Domain Results and Infrastructure
 * Extends the existing DC simulation system with complex number support
 * for capacitors, inductors, and AC sources
 */

import { Complex, ComplexMatrix, ComplexUnits } from './complex-math'
import type { Circuit, CircuitComponent } from '@/types/components'

/**
 * AC Analysis result for a single frequency point
 * Extension of DC_Result with complex voltages and currents
 */
export interface AC_Result {
  /** Frequency of this analysis point (Hz) */
  frequency: number
  /** Complex node voltages */
  voltages: Record<number, Complex>
  /** Complex branch currents */
  currents: Record<string, Complex>
  /** Node mapping for result interpretation */
  termToNodeIndex: Map<string, number>
  /** Floating node warnings (same as DC) */
  floatingNodeWarnings?: string[]
  /** Complex solver metrics */
  solverMetrics?: {
    conditionNumber?: number
    refinementIterations?: number
    significantDigits?: number
    solveTime?: number
  }
}

/**
 * Frequency sweep analysis results
 * Contains AC_Result for each frequency point
 */
export interface FrequencyResponse {
  /** Array of frequency points analyzed (Hz) */
  frequencies: number[]
  /** AC results for each frequency */
  results: AC_Result[]
  /** Analysis metadata */
  metadata: {
    startFrequency: number
    stopFrequency: number
    pointsPerDecade: number
    totalPoints: number
    sweepType: 'linear' | 'logarithmic'
    analysisTime: number
  }
}

/**
 * Transfer function measurement between two nodes
 * Used for Bode plot generation and filter analysis
 */
export interface TransferFunction {
  /** Input node ID */
  inputNode: number
  /** Output node ID */
  outputNode: number
  /** Frequency points */
  frequencies: number[]
  /** Complex transfer function H(jω) = Vout/Vin */
  transferFunction: Complex[]
  /** Magnitude in dB: 20*log10(|H(jω)|) */
  magnitudeDB: number[]
  /** Phase in degrees */
  phaseDegrees: number[]
}

/**
 * Phasor diagram data for AC steady-state visualization
 */
export interface PhasorDiagram {
  /** Analysis frequency */
  frequency: number
  /** Phasor data for visualization */
  phasors: {
    id: string
    label: string
    magnitude: number
    phase: number // radians
    complex: Complex
    type: 'voltage' | 'current'
    color: string
  }[]
}

/**
 * Frequency sweep configuration
 */
export interface FrequencySweepConfig {
  /** Start frequency (Hz) */
  startFrequency: number
  /** Stop frequency (Hz) */
  stopFrequency: number
  /** Sweep type */
  sweepType: 'linear' | 'logarithmic'
  /** Number of points (linear) or points per decade (logarithmic) */
  points: number
}

/**
 * AC source configuration for AC analysis
 */
export interface ACSourceConfig {
  /** Component ID */
  componentId: string
  /** AC amplitude (V for voltage source, A for current source) */
  amplitude: number
  /** Frequency (Hz) - can be overridden by sweep */
  frequency?: number
  /** Phase offset (degrees) */
  phase: number
  /** Source type */
  type: 'voltage' | 'current'
}

/**
 * Frequency sweep generator
 * Creates frequency arrays for AC analysis
 */
export class FrequencySweep {
  /**
   * Generate logarithmic frequency sweep (most common for AC analysis)
   * @param startFreq Start frequency (Hz)
   * @param stopFreq Stop frequency (Hz)
   * @param pointsPerDecade Points per decade (typically 10-50)
   * @returns Array of frequency points
   */
  static logarithmic(startFreq: number, stopFreq: number, pointsPerDecade: number): number[] {
    if (startFreq <= 0 || stopFreq <= startFreq) {
      throw new Error('Invalid frequency range for logarithmic sweep')
    }

    const decades = Math.log10(stopFreq / startFreq)
    const totalPoints = Math.ceil(decades * pointsPerDecade) + 1
    const logStart = Math.log10(startFreq)
    const logStop = Math.log10(stopFreq)

    const frequencies: number[] = []
    for (let i = 0; i < totalPoints; i++) {
      const logFreq = logStart + (i / (totalPoints - 1)) * (logStop - logStart)
      frequencies.push(Math.pow(10, logFreq))
    }

    return frequencies
  }

  /**
   * Generate linear frequency sweep
   * @param startFreq Start frequency (Hz)
   * @param stopFreq Stop frequency (Hz)
   * @param points Total number of points
   * @returns Array of frequency points
   */
  static linear(startFreq: number, stopFreq: number, points: number): number[] {
    if (startFreq < 0 || stopFreq <= startFreq || points < 2) {
      throw new Error('Invalid parameters for linear frequency sweep')
    }

    const frequencies: number[] = []
    const step = (stopFreq - startFreq) / (points - 1)

    for (let i = 0; i < points; i++) {
      frequencies.push(startFreq + i * step)
    }

    return frequencies
  }

  /**
   * Generate frequency sweep from configuration
   */
  static fromConfig(config: FrequencySweepConfig): number[] {
    if (config.sweepType === 'logarithmic') {
      return FrequencySweep.logarithmic(config.startFrequency, config.stopFrequency, config.points)
    } else {
      return FrequencySweep.linear(config.startFrequency, config.stopFrequency, config.points)
    }
  }
}

/**
 * Transfer function calculator
 * Computes frequency response between circuit nodes
 */
export class TransferFunctionCalculator {
  /**
   * Calculate transfer function from frequency response data
   * @param response Frequency response data
   * @param inputNode Input node ID
   * @param outputNode Output node ID
   * @param inputAmplitude Input signal amplitude for normalization
   * @returns Transfer function data
   */
  static calculate(
    response: FrequencyResponse,
    inputNode: number,
    outputNode: number,
    inputAmplitude: number = 1.0,
  ): TransferFunction {
    const transferFunction: Complex[] = []
    const magnitudeDB: number[] = []
    const phaseDegrees: number[] = []

    for (const result of response.results) {
      const inputVoltage = result.voltages[inputNode] || Complex.zero()
      const outputVoltage = result.voltages[outputNode] || Complex.zero()

      // H(jω) = Vout/Vin
      let h: Complex
      if (inputVoltage.magnitude() > 1e-15) {
        h = outputVoltage.divide(inputVoltage)
      } else {
        h = Complex.zero()
      }

      transferFunction.push(h)

      // Magnitude in dB
      const magDB = h.magnitude() > 1e-15 ? 20 * Math.log10(h.magnitude()) : -200
      magnitudeDB.push(magDB)

      // Phase in degrees
      const phaseDeg = (h.phase() * 180) / Math.PI
      phaseDegrees.push(phaseDeg)
    }

    return {
      inputNode,
      outputNode,
      frequencies: response.frequencies,
      transferFunction,
      magnitudeDB,
      phaseDegrees,
    }
  }
}

/**
 * Phasor diagram generator
 * Creates phasor visualization data for AC steady-state analysis
 */
export class PhasorDiagramGenerator {
  /**
   * Generate phasor diagram from AC analysis result
   * @param result AC analysis result for a single frequency
   * @param selectedNodes Node IDs to include in phasor diagram
   * @returns Phasor diagram data
   */
  static generate(result: AC_Result, selectedNodes: number[]): PhasorDiagram {
    const phasors: PhasorDiagram['phasors'] = []

    // Add voltage phasors
    for (const nodeId of selectedNodes) {
      const voltage = result.voltages[nodeId]
      if (voltage && voltage.magnitude() > 1e-15) {
        phasors.push({
          id: `V${nodeId}`,
          label: `V${nodeId}`,
          magnitude: voltage.magnitude(),
          phase: voltage.phase(),
          complex: voltage,
          type: 'voltage',
          color: '#ef4444', // voltage-red from design system
        })
      }
    }

    // Add current phasors (if available)
    for (const [currentId, current] of Object.entries(result.currents)) {
      if (current.magnitude() > 1e-15) {
        phasors.push({
          id: currentId,
          label: currentId,
          magnitude: current.magnitude(),
          phase: current.phase(),
          complex: current,
          type: 'current',
          color: '#3b82f6', // current-blue from design system
        })
      }
    }

    return {
      frequency: result.frequency,
      phasors,
    }
  }
}

/**
 * AC analysis result formatting utilities
 */
export class ACResultFormatter {
  /**
   * Format AC result voltages for display
   */
  static formatVoltages(result: AC_Result): Record<number, string> {
    const formatted: Record<number, string> = {}
    for (const [nodeId, voltage] of Object.entries(result.voltages)) {
      formatted[parseInt(nodeId)] = ComplexUnits.formatVoltage(voltage)
    }
    return formatted
  }

  /**
   * Format AC result currents for display
   */
  static formatCurrents(result: AC_Result): Record<string, string> {
    const formatted: Record<string, string> = {}
    for (const [currentId, current] of Object.entries(result.currents)) {
      formatted[currentId] = ComplexUnits.formatCurrent(current)
    }
    return formatted
  }

  /**
   * Create summary statistics for frequency response
   */
  static createSummary(response: FrequencyResponse): {
    frequencyRange: string
    totalPoints: number
    peakMagnitude: { frequency: number; nodeId: number; magnitude: number }
    bandwidthEstimate?: { f3dBLow: number; f3dBHigh: number; bandwidth: number }
  } {
    let peakMagnitude = { frequency: 0, nodeId: 0, magnitude: 0 }

    // Find peak voltage magnitude across all frequencies and nodes
    for (let i = 0; i < response.results.length; i++) {
      const result = response.results[i]
      for (const [nodeId, voltage] of Object.entries(result.voltages)) {
        const mag = voltage.magnitude()
        if (mag > peakMagnitude.magnitude) {
          peakMagnitude = {
            frequency: result.frequency,
            nodeId: parseInt(nodeId),
            magnitude: mag,
          }
        }
      }
    }

    return {
      frequencyRange: `${response.metadata.startFrequency.toExponential(2)} - ${response.metadata.stopFrequency.toExponential(2)} Hz`,
      totalPoints: response.metadata.totalPoints,
      peakMagnitude,
    }
  }
}

/**
 * Filter analysis utilities
 * Identifies filter characteristics from frequency response
 */
export class FilterAnalyzer {
  /**
   * Classify filter type based on transfer function
   */
  static classifyFilter(transferFunction: TransferFunction): {
    type: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop' | 'unknown'
    cornerFrequency?: number
    rolloffRate?: number // dB/decade
  } {
    const { frequencies, magnitudeDB } = transferFunction

    // Simple heuristic-based classification
    const lowFreqMag = magnitudeDB[0]
    const highFreqMag = magnitudeDB[magnitudeDB.length - 1]
    const midIndex = Math.floor(magnitudeDB.length / 2)
    const midFreqMag = magnitudeDB[midIndex]

    const lowToMidDrop = lowFreqMag - midFreqMag
    const midToHighDrop = midFreqMag - highFreqMag

    if (lowToMidDrop > 6 && midToHighDrop > 6) {
      return { type: 'bandstop' }
    } else if (lowToMidDrop < -6 && midToHighDrop < -6) {
      return { type: 'bandpass' }
    } else if (highFreqMag < lowFreqMag - 6) {
      return { type: 'lowpass' }
    } else if (lowFreqMag < highFreqMag - 6) {
      return { type: 'highpass' }
    }

    return { type: 'unknown' }
  }

  /**
   * Find -3dB frequency points
   */
  static find3dBPoints(transferFunction: TransferFunction): {
    f3dBLow?: number
    f3dBHigh?: number
  } {
    const { frequencies, magnitudeDB } = transferFunction
    const maxMag = Math.max(...magnitudeDB)
    const target3dB = maxMag - 3

    let f3dBLow: number | undefined
    let f3dBHigh: number | undefined

    // Find first crossing from low frequency
    for (let i = 1; i < magnitudeDB.length; i++) {
      if (magnitudeDB[i - 1] >= target3dB && magnitudeDB[i] < target3dB) {
        f3dBLow = frequencies[i]
        break
      }
    }

    // Find last crossing from high frequency
    for (let i = magnitudeDB.length - 2; i >= 0; i--) {
      if (magnitudeDB[i + 1] >= target3dB && magnitudeDB[i] < target3dB) {
        f3dBHigh = frequencies[i]
        break
      }
    }

    return { f3dBLow, f3dBHigh }
  }
}
