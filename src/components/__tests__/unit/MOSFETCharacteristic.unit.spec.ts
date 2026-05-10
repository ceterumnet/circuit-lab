import { describe, expect, it } from 'vitest'
import { MOSFETCharacteristic } from '@/services/stampers/nonlinear/MOSFETCharacteristic'

describe('MOSFETCharacteristic', () => {
    let mosfet: MOSFETCharacteristic

    describe('ComponentStamper Interface Implementation', () => {
        it('constructs with default parameters', () => {
            mosfet = new MOSFETCharacteristic()
            expect(mosfet.Vth).toBeCloseTo(1.0, 9)
            expect(mosfet.Kp).toBeCloseTo(200e-6, 9)
            expect(mosfet.lambda).toBeCloseTo(0.01, 9)
        })

        it('constructs with custom parameters', () => {
            mosfet = new MOSFETCharacteristic(2.5, 500e-6, 0.02)
            expect(mosfet.Vth).toBeCloseTo(2.5, 9)
            expect(mosfet.Kp).toBeCloseTo(500e-6, 9)
            expect(mosfet.lambda).toBeCloseTo(0.02, 9)
        })
    })

    describe('Cutoff Region', () => {
        it('returns Id = 0 when Vgs < Vth', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(0.5, 1.0)
            expect(id).toBeCloseTo(0, 9)
        })

        it('returns gm = 0 in cutoff', () => {
            mosfet = new MOSFETCharacteristic()
            const gm = mosfet.getTransconductance(0.5, 1.0)
            expect(gm).toBeCloseTo(0, 9)
        })

        it('returns output conductance = 0 in cutoff', () => {
            mosfet = new MOSFETCharacteristic()
            const gds = mosfet.getOutputConductance(0.5, 1.0)
            expect(gds).toBeCloseTo(0, 9)
        })

        it('returns region = Cutoff', () => {
            mosfet = new MOSFETCharacteristic()
            const region = mosfet.getOperatingRegion(0.5, 1.0)
            expect(region).toBe('Cutoff')
        })

        it('stays in cutoff regardless of Vds when Vgs < Vth', () => {
            mosfet = new MOSFETCharacteristic()
            expect(mosfet.getOperatingRegion(0.5, 0.1)).toBe('Cutoff')
            expect(mosfet.getOperatingRegion(0.5, 5.0)).toBe('Cutoff')
            expect(mosfet.getDrainCurrent(0.5, 5.0)).toBeCloseTo(0, 9)
        })
    })

    describe('Triode Region', () => {
        it('identifies region as Triode when Vgs > Vth and Vds < Vgs - Vth', () => {
            mosfet = new MOSFETCharacteristic()
            const region = mosfet.getOperatingRegion(3.0, 0.5)
            expect(region).toBe('Triode')
        })

        it('returns positive Id in triode region', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, 0.5)
            expect(id).toBeGreaterThan(0)
        })

        it('returns positive gm in triode region', () => {
            mosfet = new MOSFETCharacteristic()
            const gm = mosfet.getTransconductance(3.0, 0.5)
            expect(gm).toBeGreaterThan(0)
        })

        it('returns positive output conductance in triode region', () => {
            mosfet = new MOSFETCharacteristic()
            const gds = mosfet.getOutputConductance(3.0, 0.5)
            expect(gds).toBeGreaterThan(0)
        })

        it('calculates Id = Kp * ((Vgs-Vth)*Vds - 0.5*Vds^2) / (1 + lambda*Vds)', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 0.5
            const vOv = vgs - mosfet.Vth
            const channelMod = 1 + mosfet.lambda * vds
            const expected = (mosfet.Kp * (vOv * vds - 0.5 * vds * vds)) / channelMod
            const actual = mosfet.getDrainCurrent(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })

        it('calculates gm = Kp * Vds / (1 + lambda*Vds)', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 0.5
            const channelMod = 1 + mosfet.lambda * vds
            const expected = (mosfet.Kp * vds) / channelMod
            const actual = mosfet.getTransconductance(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })

        it('calculates output conductance = Kp * (Vgs - Vth - Vds) / (1 + lambda*Vds)', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 0.5
            const vOv = vgs - mosfet.Vth
            const channelMod = 1 + mosfet.lambda * vds
            const expected = (mosfet.Kp * (vOv - vds)) / channelMod
            const actual = mosfet.getOutputConductance(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })
    })

    describe('Saturation Region', () => {
        it('identifies region as Saturation when Vgs > Vth and Vds >= Vgs - Vth', () => {
            mosfet = new MOSFETCharacteristic()
            const region = mosfet.getOperatingRegion(3.0, 2.5)
            expect(region).toBe('Saturation')
        })

        it('returns positive Id in saturation', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, 2.5)
            expect(id).toBeGreaterThan(0)
        })

        it('returns positive gm in saturation', () => {
            mosfet = new MOSFETCharacteristic()
            const gm = mosfet.getTransconductance(3.0, 2.5)
            expect(gm).toBeGreaterThan(0)
        })

        it('calculates Id = 0.5 * Kp * (Vgs-Vth)^2 * (1 + lambda*Vds)', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 2.5
            const vOv = vgs - mosfet.Vth
            const channelMod = 1 + mosfet.lambda * vds
            const expected = 0.5 * mosfet.Kp * vOv * vOv * channelMod
            const actual = mosfet.getDrainCurrent(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })

        it('calculates gm = Kp * (Vgs-Vth) * (1 + lambda*Vds)', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 2.5
            const vOv = vgs - mosfet.Vth
            const channelMod = 1 + mosfet.lambda * vds
            const expected = mosfet.Kp * vOv * channelMod
            const actual = mosfet.getTransconductance(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })

        it('calculates output conductance = 0.5 * Kp * (Vgs-Vth)^2 * lambda', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = 2.5
            const vOv = vgs - mosfet.Vth
            const expected = 0.5 * mosfet.Kp * vOv * vOv * mosfet.lambda
            const actual = mosfet.getOutputConductance(vgs, vds)
            expect(actual).toBeCloseTo(expected, 9)
        })
    })

    describe('Parameter Variations', () => {
        it('different Vth produces different results', () => {
            const m1 = new MOSFETCharacteristic(1.0, 200e-6, 0.01)
            const m2 = new MOSFETCharacteristic(2.0, 200e-6, 0.01)
            const id1 = m1.getDrainCurrent(3.0, 1.0)
            const id2 = m2.getDrainCurrent(3.0, 1.0)
            expect(id1).not.toBeCloseTo(id2, 6)
        })

        it('different Kp produces different results', () => {
            const m1 = new MOSFETCharacteristic(1.0, 200e-6, 0.01)
            const m2 = new MOSFETCharacteristic(1.0, 500e-6, 0.01)
            const id1 = m1.getDrainCurrent(3.0, 1.0)
            const id2 = m2.getDrainCurrent(3.0, 1.0)
            expect(id1).not.toBeCloseTo(id2, 6)
        })

        it('different lambda produces different results in saturation', () => {
            const m1 = new MOSFETCharacteristic(1.0, 200e-6, 0.0)
            const m2 = new MOSFETCharacteristic(1.0, 200e-6, 0.05)
            const id1 = m1.getDrainCurrent(3.0, 5.0)
            const id2 = m2.getDrainCurrent(3.0, 5.0)
            expect(id2).toBeGreaterThan(id1)
        })

        it('zero lambda removes channel length modulation', () => {
            const mosfet = new MOSFETCharacteristic(1.0, 200e-6, 0.0)
            const id1 = mosfet.getDrainCurrent(3.0, 2.0)
            const id2 = mosfet.getDrainCurrent(3.0, 5.0)
            expect(id1).toBeCloseTo(id2, 9)
        })
    })

    describe('Numerical Stability', () => {
        it('handles large positive Vds without NaN or Infinity', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, 100.0)
            expect(Number.isFinite(id)).toBe(true)
            expect(id).not.toBeNaN()
        })

        it('handles large positive Vgs without NaN or Infinity', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(100.0, 5.0)
            expect(Number.isFinite(id)).toBe(true)
            expect(id).not.toBeNaN()
        })

        it('clamps extreme reverse Vds', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, -25.0)
            expect(id).toBeCloseTo(0, 9)
        })

        it('handles negative Vds gracefully', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, -1.0)
            expect(Number.isFinite(id)).toBe(true)
            expect(id).not.toBeNaN()
        })

        it('handles near-zero Vds', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, 0.0001)
            expect(id).toBeGreaterThanOrEqual(0)
            expect(Number.isFinite(id)).toBe(true)
        })

        it('handles Vgs = Vth boundary for saturation', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(1.0, 0.5)
            expect(id).toBeCloseTo(0, 9)
        })

        it('clamps channel modulation denominator', () => {
            mosfet = new MOSFETCharacteristic()
            const id = mosfet.getDrainCurrent(3.0, -10.0)
            expect(Number.isFinite(id)).toBe(true)
        })
    })

    describe('Region Boundaries', () => {
        it('at Vds = Vgs - Vth returns Saturation', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = vgs - mosfet.Vth
            const region = mosfet.getOperatingRegion(vgs, vds)
            expect(region).toBe('Saturation')
        })

        it('just below boundary (Vds slightly < Vgs-Vth) returns Triode', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const vds = (vgs - mosfet.Vth) - 1e-9
            const region = mosfet.getOperatingRegion(vgs, vds)
            expect(region).toBe('Triode')
        })

        it('Id is continuous at triode/saturation boundary', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const boundaryVds = vgs - mosfet.Vth

            const idTriode = mosfet.getDrainCurrent(vgs, boundaryVds)
            const idSat = mosfet.getDrainCurrent(vgs, boundaryVds + 1e-9)
            expect(idTriode).toBeCloseTo(idSat, 6)
        })

        it('gm is continuous near triode/saturation boundary', () => {
            mosfet = new MOSFETCharacteristic()
            const vgs = 3.0
            const boundaryVds = vgs - mosfet.Vth

            const gmTriode = mosfet.getTransconductance(vgs, boundaryVds)
            const gmSat = mosfet.getTransconductance(vgs, boundaryVds + 1e-6)
            expect(gmTriode).toBeCloseTo(gmSat, 5)
        })

        it('Vgs = Vth exactly returns Saturation for any positive Vds', () => {
            mosfet = new MOSFETCharacteristic()
            const region = mosfet.getOperatingRegion(1.0, 1.0)
            expect(region).toBe('Saturation')
        })
    })
})
