/**
 * Diode parameter profiles for different applications
 * Based on real semiconductor datasheets and SPICE models
 */
interface DiodeParameterProfile {
  name: string
  description: string
  saturationCurrent: number // Is (A)
  emissionCoefficient: number // n (dimensionless)
  applicableVoltageRange: [number, number] // [min, max] supply voltage (V)
  applicableCurrentRange: [number, number] // [min, max] expected current (A)
  forwardVoltageTypical: number // Typical Vf at rated current (V)
  examples: string[] // Real part numbers
}

/**
 * Real diode parameter library based on industry datasheets
 */
export class DiodeParameterLibrary {
  private static profiles: DiodeParameterProfile[] = [
    {
      name: 'Small Signal Silicon',
      description: 'Fast switching, low current applications',
      saturationCurrent: 1e-15, // 1 fA - very small
      emissionCoefficient: 1.0,
      applicableVoltageRange: [1.0, 3.5], // Extended slightly for better coverage
      applicableCurrentRange: [1e-9, 1e-3], // 1nA to 1mA
      forwardVoltageTypical: 0.7,
      examples: ['1N4148', '1N914', 'BAV99'],
    },
    {
      name: 'General Purpose Silicon',
      description: 'Standard rectifier applications',
      saturationCurrent: 1e-12, // 1 pA - industry standard
      emissionCoefficient: 1.0,
      applicableVoltageRange: [3.5, 9.0], // Narrowed to prevent overlap dominance
      applicableCurrentRange: [1e-6, 1e-1], // 1µA to 100mA
      forwardVoltageTypical: 0.7,
      examples: ['1N4007', '1N4001', '1N5408'],
    },
    {
      name: 'Schottky Diode',
      description: 'Low forward voltage, fast recovery',
      saturationCurrent: 1e-9, // 1 nA - higher leakage
      emissionCoefficient: 1.0,
      applicableVoltageRange: [9.0, 24.0], // Started higher to reduce overlap
      applicableCurrentRange: [1e-3, 1.0], // 1mA to 1A
      forwardVoltageTypical: 0.4,
      examples: ['1N5819', 'BAT54', 'MBR140'],
    },
    {
      name: 'Power Rectifier',
      description: 'High current rectification',
      saturationCurrent: 1e-6, // 1 µA - power diode
      emissionCoefficient: 1.0,
      applicableVoltageRange: [15.0, 48.0], // Started higher for clear separation
      applicableCurrentRange: [0.1, 10.0], // 100mA to 10A
      forwardVoltageTypical: 0.8,
      examples: ['1N1183', '6A05', 'MUR460'],
    },
  ]

  /**
   * Get all available diode profiles
   */
  static getAllProfiles(): DiodeParameterProfile[] {
    return [...this.profiles]
  }

  /**
   * Find the best diode parameter profile for given circuit conditions
   * IMPROVED: Enhanced scoring to differentiate between voltage ranges
   */
  static selectOptimalProfile(
    supplyVoltage: number,
    expectedCurrent: number,
    temperature: number = 300, // Kelvin
  ): DiodeParameterProfile {
    console.log(`🔍 Enhanced Diode Parameter Selection:`)
    console.log(`  Supply Voltage: ${supplyVoltage.toFixed(2)}V`)
    console.log(`  Expected Current: ${expectedCurrent.toExponential(2)}A`)
    console.log(`  Temperature: ${temperature.toFixed(0)}K`)

    // Score each profile based on how well it fits the circuit conditions
    const scoredProfiles = this.profiles.map((profile) => {
      let score = 0
      let voltageScore = 0
      let currentScore = 0
      let preferenceBonus = 0

      // ENHANCED: More nuanced voltage range scoring
      const [minV, maxV] = profile.applicableVoltageRange
      const midV = (minV + maxV) / 2

      if (supplyVoltage >= minV && supplyVoltage <= maxV) {
        // Within range: score based on how close to optimal center
        const distanceFromCenter = Math.abs(supplyVoltage - midV) / (maxV - minV)
        voltageScore = 100 - distanceFromCenter * 20 // 80-100 points for in-range
      } else if (supplyVoltage < minV) {
        // Below range: steep penalty
        const gap = minV - supplyVoltage
        voltageScore = Math.max(0, 40 - gap * 15) // Steep penalty for being too low
      } else {
        // Above range: moderate penalty (diodes can handle overvoltage better)
        const excess = supplyVoltage - maxV
        voltageScore = Math.max(0, 60 - excess * 5) // Gentler penalty for being too high
      }

      // ENHANCED: Current range compatibility (less weight than voltage)
      const [minI, maxI] = profile.applicableCurrentRange
      if (expectedCurrent >= minI && expectedCurrent <= maxI) {
        currentScore = 40 // Reduced from 50 to de-emphasize current
      } else {
        const currentRatio = expectedCurrent / ((minI + maxI) / 2)
        currentScore = Math.max(0, 20 - Math.abs(Math.log10(currentRatio)) * 3)
      }

      // NEW: Voltage-based preference bonuses to ensure differentiation
      if (supplyVoltage <= 2.0 && profile.name === 'Small Signal Silicon') {
        preferenceBonus = 25 // Strong preference for low voltage
      } else if (supplyVoltage >= 15.0 && profile.name === 'Power Rectifier') {
        preferenceBonus = 25 // Strong preference for high voltage
      } else if (
        supplyVoltage >= 8.0 &&
        supplyVoltage <= 15.0 &&
        profile.name === 'Schottky Diode'
      ) {
        preferenceBonus = 15 // Moderate preference for medium-high voltage
      } else if (
        supplyVoltage >= 4.0 &&
        supplyVoltage <= 8.0 &&
        profile.name === 'General Purpose Silicon'
      ) {
        preferenceBonus = 10 // Moderate preference for medium voltage
      }

      score = voltageScore + currentScore + preferenceBonus

      console.log(
        `  ${profile.name}: ${score.toFixed(1)}pts (V:${voltageScore.toFixed(1)} + I:${currentScore.toFixed(1)} + Pref:${preferenceBonus.toFixed(1)}) [V: ${minV}-${maxV}V, I: ${minI.toExponential(1)}-${maxI.toExponential(1)}A]`,
      )

      return { profile, score, details: { voltageScore, currentScore, preferenceBonus } }
    })

    // Sort by score and return the best match
    scoredProfiles.sort((a, b) => b.score - a.score)
    const bestProfile = scoredProfiles[0].profile
    const bestScore = scoredProfiles[0]

    console.log(`✅ Selected: ${bestProfile.name} (${bestProfile.description})`)
    console.log(
      `  Winning Score: ${bestScore.score.toFixed(1)}pts (V:${bestScore.details.voltageScore.toFixed(1)} + I:${bestScore.details.currentScore.toFixed(1)} + Pref:${bestScore.details.preferenceBonus.toFixed(1)})`,
    )
    console.log(
      `  Parameters: Is=${bestProfile.saturationCurrent.toExponential(2)}A, n=${bestProfile.emissionCoefficient}`,
    )

    // Show runner-up for debugging
    if (scoredProfiles.length > 1) {
      const runnerUp = scoredProfiles[1]
      console.log(
        `  Runner-up: ${runnerUp.profile.name} (${runnerUp.score.toFixed(1)}pts) - margin: ${(bestScore.score - runnerUp.score).toFixed(1)}pts`,
      )
    }

    return bestProfile
  }

  /**
   * Create temperature-adjusted parameters
   */
  static adjustForTemperature(
    profile: DiodeParameterProfile,
    temperature: number,
  ): DiodeParameterProfile {
    // Temperature coefficient: Is doubles every ~10K, Vf decreases ~2mV/K
    const tempRatio = temperature / 300 // Room temperature reference
    const adjustedIs = profile.saturationCurrent * Math.pow(2, (temperature - 300) / 10)

    return {
      ...profile,
      saturationCurrent: adjustedIs,
      name: `${profile.name} @ ${temperature.toFixed(0)}K`,
    }
  }
}
