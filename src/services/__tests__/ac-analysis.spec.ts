import { describe, it, expect } from 'vitest'
import {
  FrequencySweep,
  TransferFunctionCalculator,
  PhasorDiagramGenerator,
  ACResultFormatter,
  FilterAnalyzer,
} from '../ac-analysis'
import { Complex, ComplexUnits } from '../complex-math'
import type { AC_Result, FrequencyResponse, TransferFunction } from '../ac-analysis'

// -- Helpers --

function createACResult(
  frequency: number,
  voltages: Record<number, Complex>,
  currents: Record<string, Complex> = {},
): AC_Result {
  return {
    frequency,
    voltages,
    currents,
    termToNodeIndex: new Map(),
  }
}

function createFrequencyResponse(
  results: AC_Result[],
  sweepType: 'linear' | 'logarithmic' = 'logarithmic',
): FrequencyResponse {
  const freqs = results.map((r) => r.frequency)
  const start = freqs[0] ?? 0
  const stop = freqs[freqs.length - 1] ?? 0

  return {
    frequencies: freqs,
    results,
    metadata: {
      startFrequency: start,
      stopFrequency: stop,
      pointsPerDecade: 10,
      totalPoints: freqs.length,
      sweepType,
      analysisTime: 42,
    },
  }
}

function createTransferFunction(
  magnitudes: number[],
): TransferFunction {
  const frequencies = magnitudes.map((_, i) => 10 ** (i - Math.floor(magnitudes.length / 2)))
  const complexTF = magnitudes.map((m) => Complex.fromPolar(Math.pow(10, m / 20), 0))

  return {
    inputNode: 1,
    outputNode: 2,
    frequencies,
    transferFunction: complexTF,
    magnitudeDB: magnitudes,
    phaseDegrees: magnitudes.map(() => 0),
  }
}

// =====================================================================
describe('FrequencySweep', () => {
  describe('logarithmic', () => {
    it('generates frequencies spanning from start to stop', () => {
      const freqs = FrequencySweep.logarithmic(10, 1000, 10)

      expect(freqs[0]).toBeCloseTo(10)
      expect(freqs[freqs.length - 1]).toBeCloseTo(1000)
      expect(freqs.length).toBeGreaterThan(0)
    })

    it('produces the correct number of points for one decade', () => {
      const freqs = FrequencySweep.logarithmic(100, 1000, 10)
      // 1 decade * 10 ppd = 10, ceil = 10, +1 = 11
      expect(freqs.length).toBe(11)
    })

    it('produces the correct number of points for multiple decades', () => {
      const freqs = FrequencySweep.logarithmic(10, 1000, 10)
      // 2 decades * 10 ppd = 20, ceil = 20, +1 = 21
      expect(freqs.length).toBe(21)
    })

    it('frequencies are in ascending order', () => {
      const freqs = FrequencySweep.logarithmic(1, 10000, 5)
      for (let i = 1; i < freqs.length; i++) {
        expect(freqs[i]).toBeGreaterThan(freqs[i - 1])
      }
    })

    it('spreads points logarithmically', () => {
      const freqs = FrequencySweep.logarithmic(1, 100, 2)
      // Each ratio of consecutive points should be constant
      const ratio = freqs[1] / freqs[0]
      for (let i = 2; i < freqs.length; i++) {
        expect(freqs[i] / freqs[i - 1]).toBeCloseTo(ratio, 10)
      }
    })

    it('throws on zero start frequency', () => {
      expect(() => FrequencySweep.logarithmic(0, 100, 10)).toThrow(
        'Invalid frequency range for logarithmic sweep',
      )
    })

    it('throws on negative start frequency', () => {
      expect(() => FrequencySweep.logarithmic(-10, 100, 10)).toThrow(
        'Invalid frequency range for logarithmic sweep',
      )
    })

    it('throws when stop frequency equals start frequency', () => {
      expect(() => FrequencySweep.logarithmic(100, 100, 10)).toThrow(
        'Invalid frequency range for logarithmic sweep',
      )
    })

    it('throws when stop frequency is less than start frequency', () => {
      expect(() => FrequencySweep.logarithmic(1000, 10, 10)).toThrow(
        'Invalid frequency range for logarithmic sweep',
      )
    })

    it('handles fractional points per decade', () => {
      const freqs = FrequencySweep.logarithmic(10, 100, 5)
      // 1 decade * 5 ppd = 5, ceil = 5, +1 = 6
      expect(freqs.length).toBe(6)
    })

    it('handles sub-decade ranges', () => {
      const freqs = FrequencySweep.logarithmic(50, 100, 10)
      expect(freqs.length).toBeGreaterThanOrEqual(2)
      expect(freqs[0]).toBeCloseTo(50)
      expect(freqs[freqs.length - 1]).toBeCloseTo(100)
    })
  })

  describe('linear', () => {
    it('generates the exact number of points requested', () => {
      const freqs = FrequencySweep.linear(0, 100, 5)
      expect(freqs.length).toBe(5)
    })

    it('first and last points match start/stop', () => {
      const freqs = FrequencySweep.linear(10, 90, 5)
      expect(freqs[0]).toBe(10)
      expect(freqs[freqs.length - 1]).toBe(90)
    })

    it('spreads points evenly', () => {
      const freqs = FrequencySweep.linear(0, 100, 5)
      // step should be 25
      expect(freqs).toEqual([0, 25, 50, 75, 100])
    })

    it('handles start frequency of 0', () => {
      const freqs = FrequencySweep.linear(0, 1000, 10)
      expect(freqs[0]).toBe(0)
      expect(freqs[freqs.length - 1]).toBe(1000)
    })

    it('handles two-point sweep', () => {
      const freqs = FrequencySweep.linear(10, 20, 2)
      expect(freqs).toEqual([10, 20])
    })

    it('throws on negative start frequency', () => {
      expect(() => FrequencySweep.linear(-10, 100, 10)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })

    it('throws when stop frequency equals start frequency', () => {
      expect(() => FrequencySweep.linear(100, 100, 10)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })

    it('throws when stop frequency is less than start frequency', () => {
      expect(() => FrequencySweep.linear(100, 50, 10)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })

    it('throws when points is less than 2', () => {
      expect(() => FrequencySweep.linear(10, 100, 1)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })

    it('throws when points is 0', () => {
      expect(() => FrequencySweep.linear(10, 100, 0)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })

    it('throws when points is negative', () => {
      expect(() => FrequencySweep.linear(10, 100, -5)).toThrow(
        'Invalid parameters for linear frequency sweep',
      )
    })
  })

  describe('fromConfig', () => {
    it('delegates to logarithmic for logarithmic sweep type', () => {
      const config = {
        startFrequency: 10,
        stopFrequency: 1000,
        sweepType: 'logarithmic' as const,
        points: 10,
      }
      const result = FrequencySweep.fromConfig(config)
      const expected = FrequencySweep.logarithmic(10, 1000, 10)
      expect(result).toEqual(expected)
    })

    it('delegates to linear for linear sweep type', () => {
      const config = {
        startFrequency: 10,
        stopFrequency: 100,
        sweepType: 'linear' as const,
        points: 5,
      }
      const result = FrequencySweep.fromConfig(config)
      const expected = FrequencySweep.linear(10, 100, 5)
      expect(result).toEqual(expected)
    })
  })
})

// =====================================================================
describe('TransferFunctionCalculator', () => {
  it('calculates H(jw) = Vout/Vin correctly', () => {
    const vin = Complex.fromPolar(1, 0)
    const vout = Complex.fromPolar(0.5, Math.PI / 4)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.inputNode).toBe(1)
    expect(tf.outputNode).toBe(2)
    expect(tf.frequencies).toEqual([1000])
    expect(tf.transferFunction.length).toBe(1)
    expect(tf.transferFunction[0].magnitude()).toBeCloseTo(0.5)
    expect(tf.transferFunction[0].phase()).toBeCloseTo(Math.PI / 4)
  })

  it('computes magnitude in dB correctly', () => {
    const vin = Complex.fromPolar(1, 0)
    const vout = Complex.fromPolar(0.5, 0)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    // 20*log10(0.5) = -6.02...
    expect(tf.magnitudeDB[0]).toBeCloseTo(20 * Math.log10(0.5))
  })

  it('computes phase in degrees correctly', () => {
    const vin = Complex.fromPolar(1, 0)
    const vout = Complex.fromPolar(1, Math.PI / 2)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.phaseDegrees[0]).toBeCloseTo(90)
  })

  it('handles zero input voltage (returns zero transfer function)', () => {
    const vin = Complex.zero()
    const vout = Complex.fromPolar(1, 0)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].isZero()).toBe(true)
    expect(tf.magnitudeDB[0]).toBeCloseTo(-200)
  })

  it('handles very small input voltage (treated as zero)', () => {
    const vin = Complex.fromReal(1e-16)
    const vout = Complex.fromPolar(1, 0)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].isZero()).toBe(true)
  })

  it('handles missing input node (defaults to zero)', () => {
    const result = createACResult(1000, { 2: Complex.fromPolar(1, 0) })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].isZero()).toBe(true)
    expect(tf.magnitudeDB[0]).toBeCloseTo(-200)
  })

  it('handles missing output node (defaults to zero)', () => {
    const result = createACResult(1000, { 1: Complex.fromPolar(1, 0) })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].isZero()).toBe(true)
  })

  it('handles multiple frequency points', () => {
    const results: AC_Result[] = []
    for (let freq = 100; freq <= 1000; freq += 100) {
      const vin = Complex.fromPolar(1, 0)
      const vout = Complex.fromPolar(1 / (1 + freq / 1000), 0)
      results.push(createACResult(freq, { 1: vin, 2: vout }))
    }
    const response = createFrequencyResponse(results, 'linear')

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.frequencies.length).toBe(results.length)
    expect(tf.transferFunction.length).toBe(results.length)
    expect(tf.magnitudeDB.length).toBe(results.length)
    expect(tf.phaseDegrees.length).toBe(results.length)
  })

  it('uses default input amplitude of 1.0', () => {
    const vin = Complex.fromPolar(1, 0)
    const vout = Complex.fromPolar(1, 0)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].magnitude()).toBeCloseTo(1)
    expect(tf.magnitudeDB[0]).toBeCloseTo(0)
  })

  it('handles gain > 1 (positive dB)', () => {
    const vin = Complex.fromPolar(0.1, 0)
    const vout = Complex.fromPolar(1, 0)

    const result = createACResult(1000, { 1: vin, 2: vout })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.magnitudeDB[0]).toBeGreaterThan(0)
    expect(tf.magnitudeDB[0]).toBeCloseTo(20 * Math.log10(10))
  })

  it('handles zero-to-zero transfer', () => {
    const result = createACResult(1000, { 1: Complex.zero(), 2: Complex.zero() })
    const response = createFrequencyResponse([result])

    const tf = TransferFunctionCalculator.calculate(response, 1, 2)

    expect(tf.transferFunction[0].isZero()).toBe(true)
    expect(tf.magnitudeDB[0]).toBeCloseTo(-200)
  })
})

// =====================================================================
describe('PhasorDiagramGenerator', () => {
  it('generates voltage phasors for selected nodes', () => {
    const v1 = Complex.fromPolar(5, Math.PI / 3)
    const result = createACResult(1000, { 0: v1 })

    const diagram = PhasorDiagramGenerator.generate(result, [0])

    expect(diagram.frequency).toBe(1000)
    expect(diagram.phasors.length).toBe(1)
    expect(diagram.phasors[0].id).toBe('V0')
    expect(diagram.phasors[0].type).toBe('voltage')
    expect(diagram.phasors[0].magnitude).toBeCloseTo(5)
    expect(diagram.phasors[0].phase).toBeCloseTo(Math.PI / 3)
    expect(diagram.phasors[0].color).toBe('#ef4444')
  })

  it('generates phasors for multiple selected nodes', () => {
    const v1 = Complex.fromPolar(5, 0)
    const v2 = Complex.fromPolar(3, Math.PI / 2)
    const result = createACResult(1000, { 1: v1, 2: v2, 3: Complex.fromPolar(1, -0.5) })

    const diagram = PhasorDiagramGenerator.generate(result, [1, 2, 3])

    expect(diagram.phasors.length).toBe(3)
    expect(diagram.phasors.map((p) => p.id)).toEqual(['V1', 'V2', 'V3'])
  })

  it('skips nodes with zero voltage', () => {
    const v1 = Complex.fromPolar(5, 0)
    const result = createACResult(1000, { 1: v1, 2: Complex.zero() })

    const diagram = PhasorDiagramGenerator.generate(result, [1, 2])

    expect(diagram.phasors.length).toBe(1)
    expect(diagram.phasors[0].id).toBe('V1')
  })

  it('skips nodes with very small voltage', () => {
    const v1 = Complex.fromReal(1e-16)
    const result = createACResult(1000, { 1: Complex.fromPolar(5, 0), 2: v1 })

    const diagram = PhasorDiagramGenerator.generate(result, [1, 2])

    expect(diagram.phasors.length).toBe(1)
  })

  it('skips non-existent nodes', () => {
    const result = createACResult(1000, { 1: Complex.fromPolar(5, 0) })

    const diagram = PhasorDiagramGenerator.generate(result, [1, 99])

    expect(diagram.phasors.length).toBe(1)
    expect(diagram.phasors[0].id).toBe('V1')
  })

  it('includes current phasors', () => {
    const result = createACResult(
      1000,
      { 1: Complex.fromPolar(5, 0) },
      { 'I_R1': Complex.fromPolar(0.005, -Math.PI / 4) },
    )

    const diagram = PhasorDiagramGenerator.generate(result, [1])

    expect(diagram.phasors.length).toBe(2)
    const currentPhasor = diagram.phasors.find((p) => p.type === 'current')
    expect(currentPhasor).toBeDefined()
    expect(currentPhasor!.id).toBe('I_R1')
    expect(currentPhasor!.color).toBe('#3b82f6')
    expect(currentPhasor!.magnitude).toBeCloseTo(0.005)
    expect(currentPhasor!.phase).toBeCloseTo(-Math.PI / 4)
  })

  it('skips zero currents', () => {
    const result = createACResult(
      1000,
      { 1: Complex.fromPolar(5, 0) },
      { 'I_R1': Complex.fromPolar(0.005, 0), 'I_R2': Complex.zero() },
    )

    const diagram = PhasorDiagramGenerator.generate(result, [1])

    expect(diagram.phasors.length).toBe(2)
    expect(diagram.phasors.map((p) => p.id)).toEqual(['V1', 'I_R1'])
  })

  it('returns empty phasors for empty selected nodes and no currents', () => {
    const result = createACResult(1000, {})

    const diagram = PhasorDiagramGenerator.generate(result, [])

    expect(diagram.phasors.length).toBe(0)
    expect(diagram.frequency).toBe(1000)
  })

  it('includes current labels correctly', () => {
    const result = createACResult(
      500,
      {},
      { 'I_source': Complex.fromPolar(1, 0) },
    )

    const diagram = PhasorDiagramGenerator.generate(result, [])

    expect(diagram.phasors.length).toBe(1)
    expect(diagram.phasors[0].label).toBe('I_source')
  })

  it('preserves complex value in phasor data', () => {
    const v1 = Complex.fromPolar(10, Math.PI / 6)
    const result = createACResult(1000, { 1: v1 })

    const diagram = PhasorDiagramGenerator.generate(result, [1])

    expect(diagram.phasors[0].complex).toEqual(v1)
    expect(diagram.phasors[0].complex.equals(v1)).toBe(true)
  })
})

// =====================================================================
describe('ACResultFormatter', () => {
  describe('formatVoltages', () => {
    it('formats each voltage using ComplexUnits.formatVoltage', () => {
      const v1 = Complex.fromPolar(5, 0)
      const v2 = Complex.fromPolar(0.003, Math.PI / 4)
      const result = createACResult(1000, { 1: v1, 2: v2 })

      const formatted = ACResultFormatter.formatVoltages(result)

      expect(formatted[1]).toBe(ComplexUnits.formatVoltage(v1))
      expect(formatted[2]).toBe(ComplexUnits.formatVoltage(v2))
    })

    it('handles empty voltages', () => {
      const result = createACResult(1000, {})

      const formatted = ACResultFormatter.formatVoltages(result)

      expect(Object.keys(formatted).length).toBe(0)
    })

    it('converts string keys to integer keys', () => {
      const result = createACResult(1000, { '1': Complex.one(), '2': Complex.zero() })

      const formatted = ACResultFormatter.formatVoltages(result)

      expect(formatted[1]).toBeDefined()
      expect(formatted[2]).toBeDefined()
    })
  })

  describe('formatCurrents', () => {
    it('formats each current using ComplexUnits.formatCurrent', () => {
      const i1 = Complex.fromPolar(2, 0)
      const i2 = Complex.fromPolar(0.001, Math.PI)
      const result = createACResult(1000, {}, { 'I1': i1, 'I2': i2 })

      const formatted = ACResultFormatter.formatCurrents(result)

      expect(formatted['I1']).toBe(ComplexUnits.formatCurrent(i1))
      expect(formatted['I2']).toBe(ComplexUnits.formatCurrent(i2))
    })

    it('handles empty currents', () => {
      const result = createACResult(1000, {}, {})

      const formatted = ACResultFormatter.formatCurrents(result)

      expect(Object.keys(formatted).length).toBe(0)
    })

    it('preserves current key strings', () => {
      const result = createACResult(
        1000,
        {},
        { 'I_voltage_source1': Complex.fromPolar(0.5, 0) },
      )

      const formatted = ACResultFormatter.formatCurrents(result)

      expect(Object.keys(formatted)).toEqual(['I_voltage_source1'])
    })
  })

  describe('createSummary', () => {
    it('returns correct frequency range', () => {
      const result = createACResult(1000, { 1: Complex.fromPolar(5, 0) })
      const response = createFrequencyResponse([result])

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.frequencyRange).toEqual(
        `${response.metadata.startFrequency.toExponential(2)} - ${response.metadata.stopFrequency.toExponential(2)} Hz`,
      )
    })

    it('returns total points from metadata', () => {
      const results = [
        createACResult(100, { 1: Complex.one() }),
        createACResult(1000, { 1: Complex.one() }),
      ]
      const response = createFrequencyResponse(results)

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.totalPoints).toBe(response.metadata.totalPoints)
    })

    it('finds peak magnitude across all frequencies and nodes', () => {
      const results = [
        createACResult(100, { 1: Complex.fromPolar(1, 0), 2: Complex.fromPolar(0.5, 0) }),
        createACResult(1000, { 1: Complex.fromPolar(10, 0), 2: Complex.fromPolar(2, 0) }),
        createACResult(10000, { 1: Complex.fromPolar(0.1, 0), 2: Complex.fromPolar(3, 0) }),
      ]
      const response = createFrequencyResponse(results)

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.peakMagnitude.nodeId).toBe(1)
      expect(summary.peakMagnitude.frequency).toBe(1000)
      expect(summary.peakMagnitude.magnitude).toBeCloseTo(10)
    })

    it('handles empty results', () => {
      const response = createFrequencyResponse([])

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.peakMagnitude.magnitude).toBe(0)
      expect(summary.peakMagnitude.nodeId).toBe(0)
      expect(summary.peakMagnitude.frequency).toBe(0)
    })

    it('handles results with no voltages', () => {
      const result = createACResult(1000, {})
      const response = createFrequencyResponse([result])

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.peakMagnitude.magnitude).toBe(0)
    })

    it('does not include bandwidth estimate', () => {
      const result = createACResult(1000, { 1: Complex.one() })
      const response = createFrequencyResponse([result])

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.bandwidthEstimate).toBeUndefined()
    })

    it('finds peak across multiple nodes correctly', () => {
      const results = [
        createACResult(100, { 1: Complex.fromPolar(2, 0), 2: Complex.fromPolar(5, 0), 3: Complex.fromPolar(1, 0) }),
      ]
      const response = createFrequencyResponse(results)

      const summary = ACResultFormatter.createSummary(response)

      expect(summary.peakMagnitude.nodeId).toBe(2)
      expect(summary.peakMagnitude.magnitude).toBeCloseTo(5)
    })
  })
})

// =====================================================================
describe('FilterAnalyzer', () => {
  describe('classifyFilter', () => {
    // The algorithm uses 7-element arrays so midIndex = floor(7/2) = 3
    // lowFreqMag = magnitudeDB[0], midFreqMag = magnitudeDB[3], highFreqMag = magnitudeDB[6]

    it('classifies lowpass: high at low freq, drops at high freq', () => {
      // low=10, mid=10, high=-30  →  lowToMidDrop=0, midToHighDrop=40
      // bandstop: 0 > 6? No. lowpass: -30 < 10-6=4? Yes
      const tf = createTransferFunction([10, 10, 10, 10, 5, 0, -30])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('lowpass')
    })

    it('classifies highpass: low at low freq, high at high freq', () => {
      // low=-30, mid=10, high=10  →  lowToMidDrop=-40, midToHighDrop=0
      // bandstop: -40>6? No. bandpass: -40<-6✓, 0<-6? No. lowpass: 10<-36? No.
      // highpass: -30 < 4? Yes
      const tf = createTransferFunction([-30, -20, -10, 10, 10, 10, 10])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('highpass')
    })

    it('classifies bandstop: monotonically decreasing (low > mid > high by > 6dB each)', () => {
      // low=30, mid=0, high=-30  →  lowToMidDrop=30>6, midToHighDrop=30>6 → bandstop
      const tf = createTransferFunction([30, 20, 10, 0, -10, -20, -30])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('bandstop')
    })

    it('classifies bandpass: monotonically increasing (low < mid < high by > 6dB each)', () => {
      // low=-30, mid=0, high=30  →  lowToMidDrop=-30<-6, midToHighDrop=-30<-6 → bandpass
      const tf = createTransferFunction([-30, -20, -10, 0, 10, 20, 30])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('bandpass')
    })

    it('classifies as unknown when characteristics are ambiguous', () => {
      const tf = createTransferFunction([0, 0, 0, 0, 0, 0, 0])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('unknown')
    })

    it('classifies as unknown for small variations', () => {
      // No drop exceeds 6 dB threshold
      const tf = createTransferFunction([0, -1, -2, -1, 0, -1, 0])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('unknown')
    })

    it('lowpass classification does not include cornerFrequency or rolloffRate', () => {
      const tf = createTransferFunction([10, 10, 10, 10, 5, 0, -30])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('lowpass')
      expect(result.cornerFrequency).toBeUndefined()
      expect(result.rolloffRate).toBeUndefined()
    })

    it('classifies asymmetric response as lowpass', () => {
      // low=-2, mid=0, high=-10  →  lowToMidDrop=-2, midToHighDrop=10
      // bandstop: -2>6? No. bandpass: -2<-6? No. lowpass: -10 < -8? Yes
      const tf = createTransferFunction([-2, -1, 0, 0, -3, -5, -10])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('lowpass')
    })

    it('requires > 6 dB drop for classification (exactly 6 dB is not enough)', () => {
      // low=0, mid=0, high=-6  →  lowpass: -6 < 0-6=-6? No (not strictly less)
      const tf = createTransferFunction([0, 0, 0, 0, 0, -3, -6])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('unknown')
    })

    it('uses correct midIndex for even-length arrays', () => {
      // 6 elements: midIndex = floor(6/2) = 3 (4th element)
      // low=magnitudeDB[0]=0, mid=magnitudeDB[3]=-20, high=magnitudeDB[5]=-40
      // lowToMidDrop=20>6, midToHighDrop=20>6 → bandstop
      const tf = createTransferFunction([0, -5, -10, -20, -30, -40])
      const result = FilterAnalyzer.classifyFilter(tf)

      expect(result.type).toBe('bandstop')
    })
  })

  describe('find3dBPoints', () => {
    it('finds low and high 3dB points for a bandpass', () => {
      // Flat in middle, dropping at low and high
      const mags = [-20, -10, -2, 0, 0, -2, -10, -20]
      const tf = createTransferFunction(mags)

      const result = FilterAnalyzer.find3dBPoints(tf)

      // max = 0, target = -3
      // f3dB low: magnitude crosses from >= -3 to < -3 going from low to high
      // index: -2(>= -3) -> 0(>= -3) -> 0(>= -3) -> -2(< -3) at index 4
      // Wait, let's compute: max=0, target=-3
      // i=1: mags[0]=-20 < -3, no crossing
      // i=2: mags[1]=-10 < -3, no crossing
      // i=3: mags[2]=-2 >= -3, mags[3]=0 >= -3, no crossing
      // i=4: mags[3]=0 >= -3, mags[4]=0 >= -3, no crossing
      // i=5: mags[4]=0 >= -3, mags[5]=-2 >= -3, no crossing
      // i=6: mags[5]=-2 >= -3, mags[6]=-10 < -3 => f3dBHigh = freqs[6]

      // Let me reconsider: f3dBLow scans forward (low to high) finding first crossing down
      // f3dBHigh scans backward (high to low) finding first crossing down

      // Forward: mags[5]=-2 >= -3, mags[6]=-10 < -3 => f3dBLow = freqs[6]
      // Backward: mags[5]=-2 >= -3, mags[4]=0 >= -3, mags[3]=0 >= -3, mags[2]=-2 >= -3, mags[1]=-10 < -3
      //   i=4: mags[5]=-2 >= -3, mags[4]=0 >= -3, no
      //   i=3: mags[4]=0 >= -3, mags[3]=0 >= -3, no
      //   i=2: mags[3]=0 >= -3, mags[2]=-2 >= -3, no
      //   i=1: mags[2]=-2 >= -3, mags[1]=-10 < -3 => f3dBHigh = freqs[1]

      expect(result.f3dBLow).toBeDefined()
      expect(result.f3dBHigh).toBeDefined()
      expect(result.f3dBHigh).toBeLessThan(result.f3dBLow!)
    })

    it('returns undefined when all magnitudes are above -3dB of max', () => {
      const tf = createTransferFunction([0, 0, 0, 0])
      const result = FilterAnalyzer.find3dBPoints(tf)

      expect(result.f3dBLow).toBeUndefined()
      expect(result.f3dBHigh).toBeUndefined()
    })

    it('returns undefined when magnitudes never cross the 3dB threshold going down', () => {
      // Flat response - never drops below -3dB of max
      const tf = createTransferFunction([-1, -1, -1, -1])
      const result = FilterAnalyzer.find3dBPoints(tf)

      // max = -1, target = -4. All values are -1 >= -4, never crosses down.
      expect(result.f3dBLow).toBeUndefined()
      expect(result.f3dBHigh).toBeUndefined()
    })

    it('handles a monotonic decreasing response', () => {
      // Lowpass: starts high, decreases
      const tf = createTransferFunction([0, -3, -10, -20])
      const result = FilterAnalyzer.find3dBPoints(tf)

      // max=0, target=-3
      // Forward: i=1: mags[0]=0 >= -3, mags[1]=-3 >= -3? -3 is NOT < -3, so no
      // i=2: mags[1]=-3 >= -3, mags[2]=-10 < -3 => f3dBLow = freqs[2]
      // Backward: i=2: mags[3]=-20 < -3, so mags[i+1] >= target fails
      // i=1: mags[2]=-10 < -3, mags[i+1] >= target fails
      // i=0: mags[1]=-3 >= -3, mags[0]=0 >= -3? No, we check mags[i+1] >= target && mags[i] < target
      // So mags[1]=-3 >= -3 and mags[0]=0 < -3? No, 0 is not < -3
      // Result: f3dBHigh undefined

      expect(result.f3dBLow).toBeDefined()
      expect(result.f3dBHigh).toBeUndefined()
    })

    it('handles a monotonic increasing response (highpass-like)', () => {
      const tf = createTransferFunction([-20, -10, -3, 0])
      const result = FilterAnalyzer.find3dBPoints(tf)

      // max=0, target=-3
      // Forward: all values either >= -3 or crossing from < -3 to >= -3 (not >= then <)
      // i=1: mags[0]=-20 < -3, so mags[i-1] >= target fails
      // i=2: mags[1]=-10 < -3, fails
      // i=3: mags[2]=-3 >= -3, mags[3]=0 >= -3? No 0 < -3? No, 0 is not < -3. So no crossing.
      // f3dBLow: undefined
      // Backward:
      // i=2: mags[3]=0 >= -3, mags[2]=-3 >= -3? -3 < -3? No.
      // i=1: mags[2]=-3 >= -3, mags[1]=-10 < -3 => f3dBHigh = freqs[1]

      expect(result.f3dBLow).toBeUndefined()
      expect(result.f3dBHigh).toBeDefined()
    })

    it('handles single point', () => {
      const tf = createTransferFunction([0])
      const result = FilterAnalyzer.find3dBPoints(tf)

      expect(result.f3dBLow).toBeUndefined()
      expect(result.f3dBHigh).toBeUndefined()
    })

    it('handles two points crossing the threshold', () => {
      const tf = createTransferFunction([0, -10])
      const result = FilterAnalyzer.find3dBPoints(tf)

      // max=0, target=-3
      // Forward: i=1: mags[0]=0 >= -3, mags[1]=-10 < -3 => f3dBLow = freqs[1]
      // Backward: loop is i >= 0, i starts at 0, but magnitudeDB.length - 2 = 0
      // So i=0: mags[1]=-10 >= -3? No. Loop ends.

      expect(result.f3dBLow).toBeDefined()
      expect(result.f3dBHigh).toBeUndefined()
    })

    it('handles empty transfer function returns -Infinity max', () => {
      const tf: TransferFunction = {
        inputNode: 1,
        outputNode: 2,
        frequencies: [],
        transferFunction: [],
        magnitudeDB: [],
        phaseDegrees: [],
      }
      const result = FilterAnalyzer.find3dBPoints(tf)
      // Math.max(...[]) === -Infinity; the loops never find a crossing
      expect(result.f3dBLow).toBeUndefined()
      expect(result.f3dBHigh).toBeUndefined()
    })
  })
})

