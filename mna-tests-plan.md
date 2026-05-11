# MNA System Tests Plan

## Overview

This document defines the test architecture, tolerance specifications, and validation strategy for the circuit simulation engine.

## Test Architecture Definition

### Test Structure

- **`unit/`** — Individual component stampers, matrix operations, mathematical functions. All dependencies mocked.
- **`functional/`** — Complete simulation workflows with real dependencies (full circuit analysis, parameter sweeps, convergence).
- **`integration/`** — Multi-component circuits, file I/O, complex interactions.

### Test Circuit Management

Circuit fixtures live in `src/components/__tests__/circuits/`.

**Naming convention:** `{test-type}-{component}-{scenario}-{variation}.json`

Examples:
- `unit-resistor-basic-1k.json` — Single 1kΩ resistor for unit testing
- `functional-diode-forward-silicon.json` — Silicon diode forward bias
- `integration-mixed-complex-nonlinear.json` — Complex mixed circuit

### Circuit Factory Pattern

```typescript
interface TestCircuitSpec {
  id: string
  description: string
  expectedResults: {
    voltages: Record<string, number>
    currents: Record<string, number>
    tolerances: ToleranceSpec
    kcl_compliance: boolean
    parameter_independence: boolean
  }
  circuit: Circuit
}
```

## Tolerance Specifications

### Tolerance Categories

```typescript
interface ToleranceSpec {
  voltage: number   // Volts
  current: number   // Amperes
  relative: number  // Percentage (0.01 = 1%)
  numerical: number // For pure mathematical operations
}
```

### Tolerance Standards

| Category | voltage | current | relative | numerical |
|---|---|---|---|---|
| **High Precision Linear** | 1e-9 | 1e-12 | 1e-6 | 1e-15 |
| **Standard Linear** | 1e-6 | 1e-9 | 1e-3 | 1e-12 |
| **Non-Linear Converged** | 1e-3 | 1e-6 | 1e-2 | 1e-9 |
| **Non-Linear Approximate** | 1e-2 | 1e-5 | 5e-2 | 1e-6 |

Each test must document why its tolerance level is chosen.

## Validation Checklist

### Phase 0: Architectural Compliance ✅

- [x] All passive components use G-matrix stamping
- [x] Wire stamping produces realistic conductance values
- [x] No hybrid branch current approaches for passive components
- [x] Series circuit KCL compliance (current differences < 1pA)
- [x] Parameter independence (different component values → different results)

### Phase 1: Non-Linear Component Validation ✅

- [x] DiodeCharacteristic direct usage (no hardcoded parameters)
- [x] Load Line Intersection for operating point + educational analysis
- [x] Parameter independence (different saturation currents → different results)
- [x] GMIN stabilization (1e-12 S matrix conditioning)
- [x] Operating point consistency between stamping and current calculation

### Critical Regression Tests

- **Parameter Independence**: Same topology, different values → different results
- **Series KCL**: All components in series have identical current
- **KVL**: Component voltage drops sum to supply voltage
- **Diode Physics**: Different Is → different operating points
- **Load Line Stability**: Convergence without Newton-Raphson oscillations

## Implementation Checklist

- [ ] CurrentSourceStamper unit tests
- [ ] SwitchStamper unit tests
- [ ] PotentiometerStamper unit tests
- [ ] Numerical solver unit tests (EnhancedMNASolver, NewtonRaphsonSolver)
- [ ] Performance benchmarks for large circuits
