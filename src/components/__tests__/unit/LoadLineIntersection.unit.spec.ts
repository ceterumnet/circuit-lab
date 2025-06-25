import { describe, it, expect } from 'vitest'

/**
 * UNIT TESTS FOR LOAD LINE INTERSECTION ALGORITHM
 *
 * These tests verify the building blocks work correctly in isolation:
 * 1. DiodeCharacteristic I-V curve calculation (ACTUAL implementation)
 * 2. LoadLineIntersection algorithm convergence (ACTUAL implementation)
 * 3. Parameter sensitivity validation
 * 4. Edge case handling
 *
 * CRITICAL: These tests import the ACTUAL classes from simulation.ts,
 * not duplicate implementations!
 */

// Import the ACTUAL classes we need to test from simulation.ts
import { DiodeCharacteristic, LoadLineIntersection } from '@/services/simulation'

describe('DiodeCharacteristic Unit Tests', () => {
  describe('I-V Curve Calculation', () => {
    it('should calculate correct forward current for silicon diode', () => {
      const diode = new DiodeCharacteristic(1e-12, 1) // Typical silicon diode

      // Test known points on I-V curve
      const current_0_6V = diode.getCurrent(0.6)
      const current_0_7V = diode.getCurrent(0.7)

      // Forward current should increase exponentially
      expect(current_0_7V).toBeGreaterThan(current_0_6V)
      expect(current_0_7V / current_0_6V).toBeGreaterThan(2) // Should be much larger
    })

    it('should handle reverse bias correctly', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)

      const reverseCurrent = diode.getCurrent(-1.0)

      // Reverse current should be -Is (saturation current)
      expect(reverseCurrent).toBeCloseTo(-1e-12, 15)
    })

    it('should show parameter independence', () => {
      const smallSignalDiode = new DiodeCharacteristic(1e-15, 1)
      const powerDiode = new DiodeCharacteristic(1e-9, 1)

      const voltage = 0.7
      const smallCurrent = smallSignalDiode.getCurrent(voltage)
      const powerCurrent = powerDiode.getCurrent(voltage)

      // Power diode should have much higher current
      expect(powerCurrent).toBeGreaterThan(smallCurrent)
      expect(powerCurrent / smallCurrent).toBeGreaterThan(1000) // 6 orders of magnitude difference
    })

    it('should calculate conductance correctly', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)

      const conductance_0_6V = diode.getConductance(0.6)
      const conductance_0_7V = diode.getConductance(0.7)

      // Conductance should increase with forward voltage
      expect(conductance_0_7V).toBeGreaterThan(conductance_0_6V)
      expect(conductance_0_7V).toBeGreaterThan(0)
    })
  })
})

describe('LoadLineIntersection Unit Tests', () => {
  describe('Basic Intersection Algorithm', () => {
    it('should find intersection for simple silicon diode circuit', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)
      const theveninVoltage = 5.0 // 5V supply
      const theveninResistance = 1000 // 1kΩ series resistance

      const result = LoadLineIntersection.solve(diode, theveninVoltage, theveninResistance)

      // Should find an operating point
      expect(result.voltage).toBeGreaterThan(0)
      expect(result.current).toBeGreaterThan(0)

      // Voltage should be reasonable for silicon diode (0.5-1.0V)
      expect(result.voltage).toBeGreaterThan(0.5)
      expect(result.voltage).toBeLessThan(1.0)

      // Current should be reasonable for this circuit
      expect(result.current).toBeLessThan(0.01) // Less than 10mA
    })

    it('should handle edge case: zero supply voltage', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)

      const result = LoadLineIntersection.solve(diode, 0, 1000)

      expect(result.voltage).toBe(0)
      expect(result.current).toBe(0)
    })
  })

  describe('Parameter Sensitivity', () => {
    it('should show different results for different saturation currents', () => {
      const smallSignalDiode = new DiodeCharacteristic(1e-15, 1)
      const standardDiode = new DiodeCharacteristic(1e-12, 1)
      const powerDiode = new DiodeCharacteristic(1e-9, 1)

      const theveninVoltage = 5.0
      const theveninResistance = 1000

      const smallResult = LoadLineIntersection.solve(
        smallSignalDiode,
        theveninVoltage,
        theveninResistance,
      )
      const standardResult = LoadLineIntersection.solve(
        standardDiode,
        theveninVoltage,
        theveninResistance,
      )
      const powerResult = LoadLineIntersection.solve(
        powerDiode,
        theveninVoltage,
        theveninResistance,
      )

      // Operating points should be different
      expect(smallResult.voltage).not.toBeCloseTo(standardResult.voltage, 3)
      expect(standardResult.voltage).not.toBeCloseTo(powerResult.voltage, 3)

      // Currents should be different
      expect(smallResult.current).not.toBeCloseTo(standardResult.current, 6)
      expect(standardResult.current).not.toBeCloseTo(powerResult.current, 6)

      // Higher Is should generally mean lower forward voltage drop (easier conduction)
      expect(powerResult.voltage).toBeLessThan(standardResult.voltage)
      expect(standardResult.voltage).toBeLessThan(smallResult.voltage)
    })

    it('should show monotonic behavior with resistance changes', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)
      const theveninVoltage = 5.0

      const resistances = [100, 1000, 10000] // 100Ω, 1kΩ, 10kΩ
      const results = resistances.map((R) => LoadLineIntersection.solve(diode, theveninVoltage, R))

      // Higher resistance should mean lower current
      expect(results[1].current).toBeLessThan(results[0].current) // 1kΩ < 100Ω
      expect(results[2].current).toBeLessThan(results[1].current) // 10kΩ < 1kΩ

      // Higher resistance should mean LOWER diode voltage (diode conducts less current)
      // This is correct physics: lower current → lower forward voltage on diode I-V curve
      expect(results[1].voltage).toBeLessThan(results[0].voltage) // 1kΩ diode voltage < 100Ω diode voltage
      expect(results[2].voltage).toBeLessThan(results[1].voltage) // 10kΩ diode voltage < 1kΩ diode voltage
    })
  })

  describe('Convergence Properties', () => {
    it('should find operating points across various circuit conditions', () => {
      const diode = new DiodeCharacteristic(1e-12, 1)

      // Test various circuit conditions
      const testCases = [
        { voltage: 1.5, resistance: 100 },
        { voltage: 5.0, resistance: 1000 },
        { voltage: 12.0, resistance: 10000 },
        { voltage: 24.0, resistance: 100000 },
      ]

      testCases.forEach((testCase) => {
        const result = LoadLineIntersection.solve(diode, testCase.voltage, testCase.resistance)
        expect(result.voltage).toBeGreaterThan(0)
        expect(result.current).toBeGreaterThan(0)
      })
    })

    it('should handle extreme but realistic parameter combinations', () => {
      // Very small saturation current with high voltage
      const smallDiode = new DiodeCharacteristic(1e-15, 1)
      const result1 = LoadLineIntersection.solve(smallDiode, 24.0, 100000)
      expect(result1.voltage).toBeGreaterThan(0)
      expect(result1.current).toBeGreaterThan(0)

      // Large saturation current with low voltage
      const largeDiode = new DiodeCharacteristic(1e-9, 1)
      const result2 = LoadLineIntersection.solve(largeDiode, 1.5, 10)
      expect(result2.voltage).toBeGreaterThan(0)
      expect(result2.current).toBeGreaterThan(0)
    })
  })
})

describe('Load Line Physics Validation', () => {
  it('should satisfy KVL around the circuit', () => {
    const diode = new DiodeCharacteristic(1e-12, 1)
    const theveninVoltage = 5.0
    const theveninResistance = 1000

    const result = LoadLineIntersection.solve(diode, theveninVoltage, theveninResistance)

    // KVL: Vth = Vdiode + I*R
    const resistorVoltage = result.current * theveninResistance
    const totalVoltage = result.voltage + resistorVoltage

    expect(totalVoltage).toBeCloseTo(theveninVoltage, 4) // Relaxed tolerance for bisection method
  })
})
