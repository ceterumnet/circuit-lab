# MNA System Tests Plan

## CRITICAL ARCHITECTURAL DISCOVERY

**ROOT CAUSE IDENTIFIED**: Our current **Hybrid MNA Architecture** violates fundamental circuit physics by using inconsistent mathematical methods for identical physical phenomena.

### The Fundamental Flaw

**Current Broken Approach**:

- **Resistors**: G-matrix stamping → `I = (V₁-V₂)/R` (Ohm's law)
- **Wires**: Branch current variables → `I = MNA_solution[branch_index]` (arbitrary)
- **Result**: Series components with **different current calculations** → **KCL violations**

**Demonstrated Issues**:

1. **Parameter Independence Failure**: Different resistor values dominated by wire branch current noise
2. **KCL Violations**: Resistor (5mA) vs Wire (6e-12A) in same series circuit
3. **Newton-Raphson Divergence**: Inconsistent math creates artificial residuals
4. **Wire Current Picoamps**: Branch variables affected by GMIN instead of physics

### The Pure MNA Solution

**Correct Traditional MNA**:

- **ALL Passive Components** → **G-matrix stamping** (consistent Ohm's law)
- **ONLY Voltage Sources** → **Branch current variables** (unknown currents)
- **Current Sources** → **RHS injection** (known currents)

**Expected Fixes**:

- ✅ Parameter independence (different R → different G → different I automatically)
- ✅ KCL compliance (all components use identical current calculation)
- ✅ Realistic wire currents (proper physics instead of numerical noise)
- ✅ Convergence stability (mathematically consistent system)

## IMPLEMENTATION PRIORITY

**Phase 0: Architectural Correction** (IMMEDIATE)

1. Convert wire stamping from branch current to G-matrix approach
2. Ensure ALL passive components use consistent G-matrix stamping
3. Validate basic resistor-wire series circuits achieve KCL compliance
4. Verify parameter independence restoration

## Test Architecture Definition

### Unit Tests

**Definition**: Test individual functions, classes, or modules in complete isolation
**Scope**: Individual component stampers, matrix operations, mathematical functions
**Dependencies**: None - all dependencies mocked or stubbed
**Examples**:

- `ResistorStamper.stampDC()` with known matrix inputs
- `NewtonRaphsonSolver.solve()` with controlled test matrices
- Individual diode current calculation functions

### Functional Tests

**Definition**: Test complete workflows and business logic with real dependencies
**Scope**: Full circuit simulation workflows, solver algorithms, component interactions
**Dependencies**: Real components, but controlled test circuits
**Examples**:

- Complete DC analysis of known circuits with expected outcomes
- Parameter sweep validation across component ranges
- Convergence behavior testing for non-linear circuits

### Integration Tests

**Definition**: Test system behavior with external interfaces and complex interactions
**Scope**: file I/O, complex multi-component circuits
**Dependencies**: Full system stack, external files, realistic user scenarios
**Examples**:

- Circuit loading/saving with simulation results
- Complex circuits with multiple non-linear elements

## Test Circuit Management

### Circuit Definition Files

**Location**: `src/components/__tests__/circuits/`
**Naming Convention**: `{test-type}-{component}-{scenario}-{variation}.json`

Examples:

- `unit-resistor-basic-1k.json` - Single 1kΩ resistor for unit testing
- `functional-diode-forward-silicon.json` - Silicon diode forward bias functional test
- `integration-mixed-complex-nonlinear.json` - Complex mixed circuit integration test
- **NEW**: `phase0-architecture-validation-*.json` - Pure MNA validation circuits

### Circuit Factory Pattern

```typescript
interface TestCircuitSpec {
  id: string
  description: string
  expectedResults: {
    voltages: Record<string, number>
    currents: Record<string, number>
    tolerances: ToleranceSpec
    kcl_compliance: boolean // NEW: Explicit KCL validation
    parameter_independence: boolean // NEW: Parameter sensitivity validation
  }
  circuit: Circuit
}
```

### Circuit Generation Utilities

- `createBasicResistorCircuit(resistance: number): TestCircuitSpec`
- `createVoltageDividerCircuit(r1: number, r2: number, vSource: number): TestCircuitSpec`
- `createDiodeCircuit(diodeParams: DiodeParams, seriesR: number): TestCircuitSpec`

## Tolerance Specifications

### Tolerance Categories

```typescript
interface ToleranceSpec {
  voltage: number // Volts
  current: number // Amperes
  relative: number // Percentage (0.01 = 1%)
  numerical: number // For pure mathematical operations
}
```

### Tolerance Standards

- **High Precision Linear**: `{ voltage: 1e-9, current: 1e-12, relative: 1e-6, numerical: 1e-15 }`
- **Standard Linear**: `{ voltage: 1e-6, current: 1e-9, relative: 1e-3, numerical: 1e-12 }`
- **Non-Linear Converged**: `{ voltage: 1e-3, current: 1e-6, relative: 1e-2, numerical: 1e-9 }`
- **Non-Linear Approximate**: `{ voltage: 1e-2, current: 1e-5, relative: 5e-2, numerical: 1e-6 }`

### Tolerance Justification

Each test must specify WHY a particular tolerance is chosen:

- Enhanced numerical solver should achieve high precision
- Newton-Raphson convergence may limit precision
- Component parameter sensitivity affects tolerance requirements
- Matrix conditioning impacts achievable precision

## Test Implementation Strategy

### Phase 0: Architectural Validation (IMMEDIATE PRIORITY)

**File**: `src/components/__tests__/unit/ArchitecturalValidation.unit.spec.ts`

#### 0.1 Pure MNA Stamping Validation

- Verify ALL passive components use G-matrix stamping
- Validate wire stamping produces realistic conductance values
- Ensure no hybrid branch current approaches remain
- **Circuits**: `phase0-stamping-*` series
- **Tolerance**: High Precision Linear
- **Dependencies**: Direct stamping method inspection

#### 0.2 KCL Compliance Restoration

- Series circuits: ALL components must have identical current
- Parallel circuits: Currents must sum correctly at nodes
- Mixed circuits: Both series and parallel KCL compliance
- **Circuits**: `phase0-kcl-*` series
- **Tolerance**: High Precision Linear (current differences < 1pA)
- **Dependencies**: Pure MNA implementation

#### 0.3 Parameter Independence Restoration

- Same topology, different values → proportional results
- Wire resistance changes → proportional current changes
- Resistor value changes → independent of wire calculations
- **Circuits**: `phase0-parameter-*` series
- **Tolerance**: Standard Linear
- **Dependencies**: Consistent G-matrix stamping

### Phase 1: Unit Tests (POST-ARCHITECTURE)

**File**: `src/components/__tests__/unit/`

#### 1.1 Matrix Assembly (`MatrixAssembly.unit.spec.ts`)

- **UPDATED**: Component stamping operations using pure G-matrix approach
- **UPDATED**: Wire stamping verification (conductance, not branch current)
- Matrix building and assembly logic
- Stamping pattern verification
- **Circuits**: `unit-assembly-*` series
- **Tolerance**: High Precision Linear
- **Dependencies**: Mock matrices, isolated component stampers

#### 1.2 Numerical Solver (`NumericalSolver.unit.spec.ts`)

- `EnhancedMNASolver` class testing
- `NewtonRaphsonSolver` class testing
- **UPDATED**: Matrix conditioning with pure MNA matrices
- **UPDATED**: Convergence testing without hybrid artifacts
- Iterative refinement logic
- Precision analysis functions
- **Circuits**: `unit-solver-*` series
- **Tolerance**: Numerical precision focused
- **Dependencies**: Known test matrices with controlled properties

#### 1.3 Ground Constraints (`GroundConstraints.unit.spec.ts`)

- Ground constraint application methods
- Reference voltage handling
- Matrix modification for ground nodes
- **Circuits**: `unit-ground-*` series
- **Tolerance**: High Precision Linear
- **Dependencies**: Controlled matrix structures

#### 1.4 Component Stampers (`ComponentStampers.unit.spec.ts`)

- **UPDATED**: Each stamper class using pure MNA approach
- **UPDATED**: Wire stamper validation (G-matrix, not branch current)
- Stamping mathematics verification
- Parameter handling validation
- **Circuits**: `unit-stamper-*` series
- **Tolerance**: High Precision Linear
- **Dependencies**: Mock MNA matrices and RHS vectors

### Phase 2: Functional Tests

**File**: `src/components/__tests__/functional/`

#### 2.1 Linear Circuit Analysis (`LinearAnalysis.functional.spec.ts`)

- Complete DC analysis workflows
- Parameter independence validation
- KCL/KVL compliance verification
- **Circuits**: `functional-linear-*` series
- **Tolerance**: Standard Linear

#### 2.2 Non-Linear Circuit Analysis (`NonLinearAnalysis.functional.spec.ts`)

- Single non-linear component circuits
- Convergence behavior testing
- Parameter sensitivity analysis
- **Circuits**: `functional-nonlinear-*` series
- **Tolerance**: Non-Linear Converged

#### 2.3 Mixed Circuit Analysis (`MixedAnalysis.functional.spec.ts`)

- Linear + non-linear combinations
- Complex parameter interactions
- Edge case handling
- **Circuits**: `functional-mixed-*` series
- **Tolerance**: Context-dependent

### Phase 3: Integration Tests

**File**: `src/components/__tests__/integration/`

#### 3.1 System Integration (`SystemIntegration.integration.spec.ts`)

- End-to-end simulation workflows
- Complex multi-component circuits
- Performance and stability testing
- **Circuits**: `integration-system-*` series
- **Tolerance**: Non-Linear Approximate

## Critical Regression Tests

### 0. Architectural Compliance (NEW - HIGHEST PRIORITY)

**Test**: Pure MNA implementation without hybrid artifacts
**Files**: `phase0-architecture-compliance-*.json`
**Tolerance**: High Precision Linear
**Validation**:

- No branch current variables for passive components
- All passive components use G-matrix stamping
- Only voltage sources have branch current variables

### 1. Parameter Independence Validation

**Test**: Same circuit topology, different component values → different results
**Files**: `functional-regression-parameter-independence-*.json`
**Tolerance**: Standard Linear for linear components, Non-Linear Converged for non-linear
**UPDATED**: Must pass with pure MNA (previously failing due to hybrid approach)

### 2. Series Circuit Current Conservation

**Test**: All components in series must have identical current (KCL)
**Files**: `functional-regression-kcl-series-*.json`
**Tolerance**: High Precision Linear (current differences < 1pA)
**UPDATED**: Should achieve perfect KCL with pure MNA

### 3. Newton-Raphson Convergence Reliability

**Test**: Non-linear circuits must converge within iteration limits
**Files**: `functional-regression-convergence-*.json`
**Tolerance**: Convergence required, final residual < 1e-6
**UPDATED**: Should converge reliably without hybrid math artifacts

### 4. Voltage Drop Physics Compliance

**Test**: Component voltage drops match expected physics
**Files**: `functional-regression-voltage-physics-*.json`
**Tolerance**: Component-specific (diode <1V, LED 2-4V, etc.)

## Implementation Checklist

### Phase 0: Architectural Correction (IMMEDIATE)

- [ ] **CRITICAL**: Convert wire stamping from branch current to G-matrix
- [ ] **CRITICAL**: Audit all passive component stampers for G-matrix consistency
- [ ] **CRITICAL**: Remove hybrid branch current approaches for passive components
- [ ] **CRITICAL**: Validate basic series circuit KCL compliance
- [ ] **CRITICAL**: Verify parameter independence restoration

### Circuit Definition Infrastructure

- [ ] Create `src/components/__tests__/circuits/` directory
- [ ] **UPDATED**: Implement `TestCircuitSpec` interface with KCL/parameter validation
- [ ] Create circuit factory functions
- [ ] **NEW**: Create Phase 0 architectural validation circuits
- [ ] Implement circuit loading utilities
- [ ] Create circuit validation functions

### Tolerance Management

- [ ] Define `ToleranceSpec` interface
- [ ] Implement tolerance validation functions
- [ ] Create tolerance preset constants
- [ ] Document tolerance justification requirements

### Test File Structure

- [ ] Create unit test directory structure
- [ ] Create functional test directory structure
- [ ] Create integration test directory structure
- [ ] Implement test base classes with circuit loading
- [ ] Create tolerance assertion helpers

### Regression Test Coverage

- [ ] Parameter independence tests
- [ ] KCL/KVL compliance tests
- [ ] Convergence reliability tests
- [ ] Physics compliance tests

## Success Criteria

### Phase 0 Success (Architectural Correction) - BLOCKING

- Pure MNA implementation without hybrid artifacts
- Perfect KCL compliance in series circuits (current differences < 1pA)
- Parameter independence fully restored
- Wire currents in realistic ranges (mA, not pA)
- **Metric**: All Phase 0 architectural validation tests passing

### Phase 1 Success (Unit Tests)

- All mathematical operations isolated and validated
- Component stampers verified independently using pure MNA
- Foundation ready for functional testing
- **Metric**: 100% unit test coverage for core MNA operations

### Phase 2 Success (Functional Tests)

- Complete simulation workflows validated
- Parameter independence demonstrated
- Non-linear convergence reliable
- **Metric**: All critical regression tests passing

### Phase 3 Success (Integration Tests)

- System stability under complex scenarios
- Performance acceptable for realistic circuits
- Ready for production refactoring
- **Metric**: Complex circuit simulations complete successfully

## Next Steps

1. **IMMEDIATE**: **Implement Pure MNA Architecture** - Convert wire stamping and validate consistency
2. **IMMEDIATE**: **Create Phase 0 Validation Tests** - Prove architectural soundness
3. **THEN**: Create Circuit Definition Infrastructure - Build the foundation for external circuit files
4. **THEN**: Implement Tolerance Management - Define and enforce precision requirements
5. **THEN**: Build Unit Test Foundation - Start with mathematical core validation
6. **THEN**: Develop Functional Test Suite - Validate complete workflows
7. **THEN**: Add Integration Test Coverage - Ensure system-level reliability
