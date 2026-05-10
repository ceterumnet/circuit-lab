/**
 * MOSFET (Metal-Oxide-Semiconductor Field-Effect Transistor) characteristic model
 * Implements Shichman-Hodges square-law model for educational circuit simulation
 *
 * ARCHITECTURE: Three-region model with channel length modulation
 * - Cutoff: Vgs < Vth → Id = 0
 * - Triode: Vgs >= Vth, Vds < Vgs - Vth → Id = Kp * ((Vgs-Vth)*Vds - 0.5*Vds²) / (1 + λ*Vds)
 * - Saturation: Vgs >= Vth, Vds >= Vgs - Vth → Id = 0.5 * Kp * (Vgs-Vth)² * (1 + λ*Vds)
 */
export class MOSFETCharacteristic {
    private thresholdVoltage: number // Vth - Gate threshold voltage
    private transconductanceParam: number // Kp - Transconductance parameter (A/V²)
    private channelLengthMod: number // lambda - Channel length modulation

    constructor(
        thresholdVoltage: number = 1.0,
        transconductanceParam: number = 200e-6,
        channelLengthMod: number = 0.01,
    ) {
        this.thresholdVoltage = thresholdVoltage
        this.transconductanceParam = transconductanceParam
        this.channelLengthMod = channelLengthMod
    }

    /**
     * Calculate drain current based on operating region
     * For NMOS: Vgs = Vg - Vs, Vds = Vd - Vs (current flows drain to source in model)
     * For PMOS: use absolute values of Vsg and Vsd
     */
    getDrainCurrent(vgs: number, vds: number): number {
        if (vds < -20) {
            return 0 // clamp extreme reverse Vds
        }

        // Cutoff region
        if (vgs < this.thresholdVoltage) {
            return 0
        }

        const vOv = vgs - this.thresholdVoltage // overdrive voltage
        const channelMod = 1 + this.channelLengthMod * vds

        // Clamp channel modulation to prevent instability
        const clampedMod = Math.max(channelMod, 0.5)

        if (vds < vOv) {
            // Triode (linear) region
            const id = (this.transconductanceParam * (vOv * vds - 0.5 * vds * vds)) / clampedMod
            return Math.max(0, id)
        }

        // Saturation region
        const id = (0.5 * this.transconductanceParam * vOv * vOv * clampedMod)
        return Math.max(0, id)
    }

    /**
     * Calculate transconductance (dId/dVgs) for Jacobian/linearization
     */
    getTransconductance(vgs: number, vds: number): number {
        if (vgs < this.thresholdVoltage) {
            return 0 // cutoff - no transconductance
        }

        const vOv = vgs - this.thresholdVoltage
        const channelMod = Math.max(1 + this.channelLengthMod * vds, 0.5)

        if (vds < vOv) {
            // Triode region: dId/dVgs = Kp * Vds / (1 + λ*Vds)
            return (this.transconductanceParam * vds) / channelMod
        }

        // Saturation region: dId/dVgs = Kp * (Vgs-Vth) * (1 + λ*Vds)
        return this.transconductanceParam * vOv * channelMod
    }

    /**
     * Calculate output conductance (dId/dVds) for linearization
     */
    getOutputConductance(vgs: number, vds: number): number {
        if (vgs < this.thresholdVoltage) {
            return 0
        }

        const vOv = vgs - this.thresholdVoltage
        const channelMod = 1 + this.channelLengthMod * vds
        const clampedMod = Math.max(channelMod, 0.5)

        if (vds < vOv) {
            // Triode: dId/dVds ≈ Kp * (Vgs - Vth - Vds) / (1 + λ*Vds)
            return (this.transconductanceParam * (vOv - vds)) / clampedMod
        }

        // Saturation: dId/dVds = 0.5 * Kp * (Vgs-Vth)² * λ
        return 0.5 * this.transconductanceParam * vOv * vOv * this.channelLengthMod
    }

    /**
     * Determine MOSFET operating region for educational display
     */
    getOperatingRegion(vgs: number, vds: number): string {
        if (vgs < this.thresholdVoltage) {
            return 'Cutoff'
        }

        if (vds < vgs - this.thresholdVoltage) {
            return 'Triode'
        }

        return 'Saturation'
    }

    // Getters for component properties
    get Vth(): number {
        return this.thresholdVoltage
    }
    get Kp(): number {
        return this.transconductanceParam
    }
    get lambda(): number {
        return this.channelLengthMod
    }
}
