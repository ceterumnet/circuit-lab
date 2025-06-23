# MNA System Tests Plan

## Current Problem Analysis

Based on the test failures and notes, we have identified these critical issues:

1. **Newton-Raphson Convergence Failures**: Non-linear solver not converging after 50 iterations
2. **Current Mismatch in Series Circuits**: Diode current ≠ resistor current (violates KCL)
3. **Parameter Independence Failure**: Different saturation currents producing identical results
4. **Voltage Drop Issues**: Diode showing 2.16V (should be <1.0V for silicon)
5. **Code Maintainability**: simulation.ts is 1638 lines and growing

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

### Circuit Factory Pattern

```typescript
interface TestCircuitSpec {
  id: string
  description: string
  expectedResults: {
    voltages: Record<string, number>
    currents: Record<string, number>
    tolerances: ToleranceSpec
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

### Phase 1: Unit Tests

**File**: `src/components/__tests__/unit/`

#### 1.1 Matrix Assembly (`MatrixAssembly.unit.spec.ts`)

- Component stamping operations (how individual components modify MNA matrix)
- Matrix building and assembly logic
- Stamping pattern verification
- **Circuits**: `unit-assembly-*` series
- **Tolerance**: High Precision Linear
- **Dependencies**: Mock matrices, isolated component stampers

#### 1.2 Numerical Solver (`NumericalSolver.unit.spec.ts`)

- `EnhancedMNASolver` class testing
- `NewtonRaphsonSolver` class testing
- Matrix conditioning algorithms
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

- Each stamper class in isolation
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

### 1. Parameter Independence Validation

**Test**: Same circuit topology, different component values → different results
**Files**: `functional-regression-parameter-independence-*.json`
**Tolerance**: Standard Linear for linear components, Non-Linear Converged for non-linear

### 2. Series Circuit Current Conservation

**Test**: All components in series must have identical current (KCL)
**Files**: `functional-regression-kcl-series-*.json`
**Tolerance**: High Precision Linear (current differences < 1pA)

### 3. Newton-Raphson Convergence Reliability

**Test**: Non-linear circuits must converge within iteration limits
**Files**: `functional-regression-convergence-*.json`
**Tolerance**: Convergence required, final residual < 1e-6

### 4. Voltage Drop Physics Compliance

**Test**: Component voltage drops match expected physics
**Files**: `functional-regression-voltage-physics-*.json`
**Tolerance**: Component-specific (diode <1V, LED 2-4V, etc.)

## Implementation Checklist

### Circuit Definition Infrastructure

- [ ] Create `src/components/__tests__/circuits/` directory
- [ ] Implement `TestCircuitSpec` interface
- [ ] Create circuit factory functions
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

### Phase 1 Success (Unit Tests)

- All mathematical operations isolated and validated
- Component stampers verified independently
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

1. **Create Circuit Definition Infrastructure** - Build the foundation for external circuit files
2. **Implement Tolerance Management** - Define and enforce precision requirements
3. **Build Unit Test Foundation** - Start with mathematical core validation
4. **Develop Functional Test Suite** - Validate complete workflows
5. **Add Integration Test Coverage** - Ensure system-level reliability
