# Circuit Test System

A comprehensive test system for validating circuit simulation functionality using JSON-based test circuits.

## Overview

This system provides automated testing for the circuit simulation engine by:

- Running predefined test circuits against the simulation engine
- Validating voltage and current results against expected values
- Providing detailed test reports and regression testing capabilities

## Quick Start

### Running Tests

**In Browser Console:**

```javascript
// Run all tests
circuitTests.runAll()

// Test the critical wire current fix
circuitTests.runWireRegression()

// Run specific test categories
circuitTests.library.runCategory('basic')
circuitTests.library.runCategory('regression')
```

**In Code:**

```typescript
import { runAllCircuitTests, runWireCurrentRegressionTest, testLibrary } from '@/test-circuits'

// Run all tests
await runAllCircuitTests()

// Run just the wire current regression test
await runWireCurrentRegressionTest()

// Run specific test suite
await testLibrary.runSuite('Basic Functionality')
```

## Architecture

### Key Components

1. **TestCircuit Interface** (`types.ts`)

   - Defines the structure for test circuit definitions
   - Includes circuit JSON, expected results, and metadata

2. **TestCircuitRunner** (`runner.ts`)

   - Executes test circuits against the simulation engine
   - Validates results and provides detailed error reporting

3. **TestCircuitLibrary** (`index.ts`)

   - Manages test suites and provides convenient access methods
   - Organizes tests by category, tags, and suites

4. **Test Definitions** (`basic-tests.ts`, etc.)
   - Actual test circuit definitions
   - Currently includes voltage divider, wire current regression, and multi-source tests

### Test Categories

- **`basic`**: Core functionality tests (voltage dividers, basic circuits)
- **`regression`**: Tests for specific bug fixes (wire current detection)
- **`edge-case`**: Boundary conditions and error handling
- **`performance`**: Large circuit performance validation

## Creating New Tests

### Method 1: From UI Circuit

1. Build your circuit in the Circuit Editor
2. Export the circuit:
   ```javascript
   const circuit = useCircuitStore().currentCircuit
   console.log(JSON.stringify(circuit, null, 2))
   ```
3. Create a test definition:
   ```typescript
   const myTest: TestCircuit = {
     name: "My Test Circuit",
     description: "Tests specific functionality",
     category: "basic",
     circuit: /* paste JSON here */,
     expected: {
       voltages: { "0": 5.0, "1": 2.5 },
       currents: { "R1": 0.0025, "W4": 0.002 }
     }
   }
   ```

### Method 2: Programmatic Creation

```typescript
import type { TestCircuit } from './types'

const voltageDiv0ider: TestCircuit = {
  name: 'Simple Voltage Divider',
  description: 'R1=1kΩ, R2=1kΩ, V1=5V',
  category: 'basic',
  tags: ['voltage-divider', 'basic'],
  circuit: {
    id: 'test-circuit',
    name: 'Test Circuit',
    components: [
      {
        id: 'V1',
        type: 'voltage_source',
        position: { x: 100, y: 100 },
        rotation: 0,
        selected: false,
        properties: { voltage: 5 },
      },
      // ... more components
    ],
    wires: [],
    probes: [],
    nodes: {},
  },
  expected: {
    voltages: { '0': 5.0, '1': 2.5, '2': 0.0 },
    currents: { V1: -0.0025, R1: 0.0025, R2: 0.0025 },
    tolerance: 0.001, // 0.1% tolerance
  },
}
```

## Current Test Cases

### Basic Functionality

- **Simple Voltage Divider**: R1=1kΩ, R2=1kΩ, V1=5V
- **Dual Voltage Sources**: Multi-source circuit with shared ground

### Regression Tests

- **Wire Current Detection**: Tests the critical fix for same-node wire currents
  - Validates that Wire W4 shows correct current (2mA) instead of 0mA
  - Ensures topology-based current analysis works correctly

## Test Results

Tests provide detailed validation with:

- **Pass/Fail status** for each test
- **Voltage validation** (node voltages vs expected)
- **Current validation** (component currents vs expected)
- **Execution time** tracking
- **Detailed error reporting** with percentage errors
- **Comprehensive test reports** in markdown format

### Example Output

```
🧪 Running test: Simple Voltage Divider
✅ PASS Simple Voltage Divider (5.2ms)

🧪 Running test: Wire Current Detection Regression
✅ PASS Wire Current Detection Regression (8.1ms)

📊 Test Summary: 2/2 passed
```

## File Structure

```
src/test-circuits/
├── types.ts           # TypeScript interfaces
├── runner.ts          # Test execution engine
├── index.ts           # Main library and API
├── basic-tests.ts     # Basic functionality tests
├── demo.ts            # Usage examples
└── README.md          # This documentation
```

## Integration

The test system integrates with:

- **Circuit Simulation Engine** (`src/services/simulation.ts`)
- **Circuit Store** (`src/stores/circuit.ts`)
- **Component System** (`src/types/components.ts`)

Tests run the same `solveDC()` function used by the main application, ensuring test results match real simulation behavior.

## Future Enhancements

- **JSON test circuit files** for external test definitions
- **Visual test circuit editor** for easier test creation
- **Automated CI/CD integration** for continuous testing
- **Performance benchmarking** for large circuits
- **Test coverage reporting** for simulation edge cases

---

**Usage**: Import the test system and run `circuitTests.runAll()` in the browser console to validate your simulation engine!
