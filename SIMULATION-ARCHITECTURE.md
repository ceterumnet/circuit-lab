# Circuit Simulation Architecture

## Overview

The circuit simulation system implements a **Modified Nodal Analysis (MNA)** approach for DC circuit analysis. The system uses a **Pure MNA** implementation where all passive components use conductance-based (G-matrix) stamping for mathematical consistency, while active components use branch current variables where necessary.

## Core Architecture Components

### 1. Circuit Representation

- **Circuit**: Contains components and their interconnections
- **CircuitComponent**: Individual circuit elements (resistors, voltage sources, diodes, etc.)
- **Electrical Nodes**: Connection points between components, automatically generated from terminal connections

### 2. Component Stamping System

- **ComponentStamper**: Interface for stamping components into MNA matrices
- **Specialized Stampers**: Different stamping strategies for different component types
- **StampResult**: Indicates what branch currents (if any) a component introduces

### 3. Numerical Solvers

- **EnhancedMNASolver**: Linear system solver with numerical stability enhancements
- **NewtonRaphsonSolver**: Non-linear solver for circuits with diodes, LEDs, etc.

## Simulation Flow

### Phase 1: Circuit Preprocessing

1. **Electrical Node Generation**: Analyze component connections to create node map
2. **Component Stamper Creation**: Create appropriate stamper objects for each component
3. **Linear vs Non-Linear Classification**: Separate components requiring Newton-Raphson iteration

### Phase 2: MNA Matrix Assembly

1. **Matrix Initialization**: Create G-matrix and RHS vector based on node count + branch currents
2. **Component Stamping**: Each component modifies the MNA system according to its physics
3. **GMIN Stabilization**: Add tiny conductances to prevent floating node numerical issues
4. **Ground Constraints**: Apply reference voltage constraints

### Phase 3: System Solution

- **Linear Circuits**: Direct matrix solve using enhanced linear solver
- **Non-Linear Circuits**: Newton-Raphson iteration with linearized stamping at each step

### Phase 4: Current Calculation

- **Post-Processing**: Calculate component currents from voltage solution
- **Results Assembly**: Package voltages and currents into DC_Result structure

## Component Stamping Strategies

### Pure MNA Philosophy

The system uses **Pure MNA** where:

- **Passive Components** (resistors, wires): Use G-matrix stamping only
- **Active Components** (voltage sources): Use branch current variables only when necessary
- **Mathematical Consistency**: All components in series use identical current calculation methods

### Passive Component Stamping (G-Matrix Approach)

All passive components use conductance-based stamping:

```
G = 1/R
mnaMatrix[n1][n1] += G    // Self-conductance at node 1
mnaMatrix[n2][n2] += G    // Self-conductance at node 2
mnaMatrix[n1][n2] -= G    // Mutual conductance
mnaMatrix[n2][n1] -= G    // Mutual conductance
```

**Components using this approach:**

- **ResistorStamper**: Fixed resistance values
- **WireStamper**: Very small resistance (1mΩ default) for near-ideal conductors
- **SwitchStamper**: Variable resistance (1mΩ closed, 1GΩ open)
- **VariableResistorStamper**: User-adjustable resistance values

### Active Component Stamping (Branch Current Approach)

Components that enforce voltage constraints use branch current variables:

```
// Voltage constraint: V1 - V2 = Vs
mnaMatrix[n1][branchIndex] = 1     // KCL at node 1
mnaMatrix[n2][branchIndex] = -1    // KCL at node 2
mnaMatrix[branchIndex][n1] = 1     // Voltage constraint equation
mnaMatrix[branchIndex][n2] = -1    // Voltage constraint equation
rhsVector[branchIndex] = Vs        // Voltage value
```

**Components using this approach:**

- **VoltageSourceStamper**: Enforces fixed voltage between terminals

### Current Source Stamping (RHS Injection)

Current sources inject known currents directly into the RHS vector:

```
rhsVector[n1] += I    // Current injection at positive terminal
rhsVector[n2] -= I    // Current extraction at negative terminal
```

**Components using this approach:**

- **CurrentSourceStamper**: Injects fixed current values

## Non-Linear Component Architecture

### Diode Implementation Strategy

Non-linear components like diodes use a **dual-phase approach**:

1. **Characteristic Modeling**: Complex physics models for accurate I-V behavior
2. **Linearization**: Convert non-linear characteristics to linear equivalents for MNA integration

### DiodeStamper Architecture

```typescript
class DiodeStamper implements ComponentStamper, NonLinearStamper {
  // Phase 1: Complex characteristic modeling
  diodeCharacteristic: DiodeCharacteristic // Shockley equation implementation

  // Phase 2: Load line intersection
  operatingPoint: { voltage: number; current: number }

  // Phase 3: Linearized MNA stamping
  stampLinearized(mnaMatrix, rhsVector, nodeMap, solution): void
}
```

### Non-Linear Solution Process

1. **Initial Guess**: Generate starting point for Newton-Raphson iteration
2. **Iterative Linearization**: At each iteration:
   - Calculate current and conductance at current voltage
   - Stamp linearized equivalent circuit
   - Solve linear system
   - Check convergence
3. **Operating Point**: Final converged solution represents stable operating point

### Parameter Scaling System

The system includes intelligent parameter selection:

```typescript
class DiodeParameterLibrary {
  // Multiple diode profiles for different applications
  selectOptimalProfile(supplyVoltage, expectedCurrent): DiodeParameterProfile
}
```

**Available Profiles:**

- Small Signal Silicon (1e-15A): Low voltage, small current applications
- General Purpose Silicon (1e-12A): Standard 5V logic circuits
- Schottky Diode (1e-9A): High speed, medium voltage applications
- Power Rectifier (1e-6A): High voltage, high current applications

## Numerical Stability Features

### Enhanced Linear Solver

- **Matrix Conditioning**: Automatic scaling for ill-conditioned systems
- **Iterative Refinement**: Improved solution accuracy through residual correction
- **Precision Monitoring**: Condition number analysis and precision metrics

### Floating Node Stabilization

- **GMIN Conductance**: Adds 1e-12 S (1 TΩ resistance) from each node to ground
- **Educational Warnings**: Identifies floating nodes for user feedback
- **Physical Realism**: Floating nodes settle near ground potential

### Newton-Raphson Enhancements

- **Adaptive Damping**: Variable step size for improved convergence
- **Convergence Monitoring**: Residual tracking and convergence metrics
- **Robust Initial Guess**: Smart initialization based on linear circuit analysis

## Wire Current Calculation

### KCL-Based Approach

Wires use **Kirchhoff's Current Law** instead of unstable Ohm's law calculations:

```typescript
// Instead of: I = (V1 - V2) / R_wire  (numerically unstable)
// Use: I = sum of currents from connected components (KCL)
calculateCurrent(solution, nodeMap, branchCurrents, allStampers): number
```

This ensures series circuit current consistency and eliminates numerical artifacts.

## Data Flow Architecture

### Input Processing

1. **Circuit Definition**: JSON representation of components and connections
2. **Component Validation**: Verify component properties and connections
3. **Terminal Mapping**: Create mapping from component terminals to electrical nodes

### Matrix Assembly

1. **Size Calculation**: `matrixSize = numNodes + numBranchCurrents`
2. **Sequential Stamping**: Each component modifies matrices according to its physics
3. **Ground Application**: Reference voltage constraints applied last

### Solution Processing

1. **Matrix Solving**: Linear algebra solution of MNA system
2. **Current Calculation**: Post-process voltages to get component currents
3. **Result Packaging**: Assemble voltages and currents into structured result

### Output Generation

```typescript
interface DC_Result {
  voltages: Record<number, number> // Node voltages
  currents: Record<string, number> // Component currents
  termToNodeIndex: Map<string, number> // Terminal to node mapping
  floatingNodeWarnings?: string[] // Educational warnings
  solverMetrics?: SolverMetrics // Numerical analysis data
}
```

## Error Handling and Validation

### Circuit Validation

- **Ground Connection**: Verify at least one ground or voltage reference exists
- **Component Properties**: Validate required properties for each component type
- **Connection Integrity**: Ensure all terminals are properly connected

### Numerical Validation

- **Matrix Singularity**: Detect and handle singular matrix conditions
- **Convergence Monitoring**: Track Newton-Raphson convergence progress
- **Precision Analysis**: Monitor solution quality and numerical stability

### Educational Features

- **Floating Node Detection**: Identify and explain floating node issues
- **Parameter Warnings**: Alert users to potentially problematic parameter choices
- **Convergence Metrics**: Provide insight into solver performance

## Extension Points

### Adding New Components

1. **Create ComponentStamper**: Implement stamping and current calculation
2. **Register in Factory**: Add to ComponentStamperFactory mapping
3. **Add Component Definition**: Define terminals and properties in registry

### Adding New Solvers

1. **Implement Solver Interface**: Follow established solver patterns
2. **Integration Points**: Connect to main simulation flow
3. **Options and Configuration**: Provide user-controllable solver parameters

### Educational Enhancements

1. **Visualization Hooks**: Integration points for educational UI
2. **Analysis Tools**: Load line analysis, parameter sweeps, etc.
3. **Debugging Features**: Matrix inspection, convergence visualization

## Testing Architecture

### Unit Test Coverage

- **Component Stampers**: Individual stamping verification
- **Matrix Operations**: MNA assembly and solving
- **Numerical Solvers**: Convergence and stability testing
- **Parameter Scaling**: Intelligent parameter selection validation

### Integration Testing

- **Complete Simulation Flow**: End-to-end circuit analysis
- **Multi-Component Circuits**: Complex circuit validation
- **Error Handling**: Graceful failure and recovery testing

### Performance Testing

- **Large Circuit Scaling**: Performance with increasing circuit complexity
- **Convergence Efficiency**: Newton-Raphson iteration optimization
- **Memory Usage**: Resource consumption analysis

This architecture provides a solid foundation for accurate, educational, and extensible circuit simulation with proper separation of concerns and robust numerical methods.
