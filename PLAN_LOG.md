# Circuit Lab - Development History & Achievements Log

> This document archives the detailed development history, technical discoveries, and implementation achievements from the Circuit Lab project. For current status and roadmap, see PLAN.md.

## Historical Phase Structure

This section preserves the original phase numbering system for reference.

### Phase 1: ✅ COMPLETED - Circuit Building Foundation

Interactive component placement and wiring, basic circuit topology support (voltage dividers, junctions), component movement, rotation, and deletion, grid snapping and visual feedback.

### Phase 1.5: ✅ COMPLETED - Modeless UX System

Component palette with categorized components, Ctrl+key modifier-based wiring system, advanced canvas navigation (pan, zoom, multi-select), contextual interactions without mode switching.

### Phase 1.8: ✅ COMPLETED - DC Simulation & Measurement

Real-time DC circuit analysis engine, voltage and current probe system, live measurement display and updates, circuit validation and error handling.

### Phase 1.85: ✅ COMPLETED - Professional Schematic Symbols

**Major Achievement**: Complete replacement of generic icons with professional IEEE-standard schematic symbols.

**Created Custom Schematic Symbol Library**:

- **ResistorSymbol**: Standard US-style zigzag pattern
- **VoltageSourceSymbol**: Circle with polarity markings (+ and -)
- **GroundSymbol**: Traditional ground symbol with decreasing horizontal lines
- **NodeSymbol**: Simple filled circle for wire junctions
- **ProbeSymbol**: Professional multimeter-style symbols (V/A)

**Key Improvements**:

- Enhancement: Use proper icons instead of glyphs - replaced generic icons with professional IEEE-standard schematic symbols
- BUG FIX: No icon for node component - added proper node symbol (filled circle)
- BUG FIX: Simulate button vs always running simulation - removed confusing simulate button, replaced with "Live Simulation" indicator
- Educational compliance: All symbols now follow standard circuit diagram conventions

### Phase 1.86: ✅ COMPLETED - Professional Current Measurement System

**Revolutionary Current Direction Implementation**:

**Key Achievements**:

- **Directional Current Probes**: Added directional arrows showing current flow reference direction
- **Color-Coded Current Display**: Green for positive current, red for negative current flow
- **Direction Toggle**: Added toggle in probe properties to flip measurement direction
- **Fixed Sign Convention**: Corrected voltage source current to show positive when flowing out of positive terminal
- **Traditional Circuit Analysis**: Current measurements now follow standard nodal/mesh analysis conventions
- **Wire Current Calculation**: Fixed wire current measurements using KCL-based approach instead of voltage differences
- **All Current Measurement Issues Resolved**: Wire currents now correctly show branch currents, voltage measurements accurate

### Phase 1.87: ✅ COMPLETED - Explicit Simulation with Error Validation

**Major System Transition**:

- **Transitioned from Live to Explicit Simulation**: Removed automatic simulation watcher, now requires user-triggered simulation
- **Comprehensive Circuit Validation**: Pre-simulation checks for ground connections, floating components, invalid properties
- **Professional Error Reporting**: Clear error messages with hover tooltips showing specific validation issues
- **Lucide Icon Integration**: Updated simulation button with proper Play/CheckCircle/Loader2 icons and error AlertTriangle
- **Educational Error Feedback**: Detailed validation helps users understand circuit design requirements
- **Simulation State Management**: Clear success/error/loading states with visual feedback

### Phase 1.9: ✅ COMPLETED - UX Improvements

**Comprehensive UX Enhancement Package**:

**Save/Load System**:

- Add basic save / load circuits from browser store
- Component placement persistence and circuit restoration

**Component Manipulation**:

- Add rotation handle to components when selected so they can be directly rotated
- Implement Copy and Paste for single and multiple selected components with proper ID handling
- Copy, Cut, and Paste for components, wires, and probes with proper ID remapping

**Workflow Optimization**:

- Undo / Redo functionality for all operations
- Persistent component selection and placement mode to reduce repetitive clicking
- Keyboard shortcuts to component placement with '/' key inline component selector
- Quick search functionality for components (type "r" or "re" for resistor)

**Smart Component Placement**:

- Automatic connection when component pins intersect wires or terminals
- Pre-placement rotation with 'r' key during component placement
- Enhanced connection detection for NodeComponents and other component types

**Canned Circuits**:

- Basic test circuits to eliminate repetitive circuit creation for regression testing
- Circuit library for common educational examples

### Phase 1.91: ✅ COMPLETED - Multi-Ground Circuit Support & Physical Current Direction

**Critical Multi-Ground Circuit Fix**:

**Problem Identified**: The simulation system incorrectly handled multiple isolated circuits by applying only one ground reference, causing the second circuit's ground to float at non-zero potential (e.g., -2.5V instead of 0V).

**Revolutionary Solution - Multi-Ground Support**:

- **Root Cause**: `buildElectricalNodes()` only identified single ground node for entire circuit
- **Solution**: Extended ground detection to find all ground nodes and reference nodes for isolated circuits
- **Implementation**: Modified MNA matrix to apply multiple ground constraints (V = 0) for each isolated circuit
- **Validation**: Tested with interconnected circuits showing proper 0V ground references

**Physical Current Direction Enhancement**:

**Problem**: Current probe arrows show arbitrary reference directions instead of actual current flow
**Educational Goal**: Probes should behave like real multimeters, showing physical current direction

**Physical Current Direction Algorithm**:

```typescript
function getPhysicalCurrentDirection(wire: Wire, current: number) {
  // Step 1: Determine actual flow direction from current sign
  const flowsStartToEnd = current >= 0

  // Step 2: Analyze wire topology
  const { startComp, startTerminal, endComp, endTerminal } = getWireComponents(wire)

  // Step 3: Return physical direction and positive magnitude
  return {
    direction: flowsStartToEnd ? 'start-to-end' : 'end-to-start',
    magnitude: Math.abs(current),
    arrowDirection: flowsStartToEnd ? 'forward' : 'reverse',
  }
}
```

**Key Features**:

- **Topology-Aware**: Recognizes current sources (voltage_source:positive) vs sinks (voltage_source:negative, ground:terminal)
- **Sign-Based Direction**: Uses simulation current sign to determine actual flow direction
- **Always Positive Display**: Shows magnitude only, direction indicated by arrow
- **Educational Intuition**: Matches physical understanding of electron flow

**CRITICAL BUG DISCOVERY & FIX**:

- **Root Cause**: `WireStamper.calculateBranchCurrentByKCL()` was using `Math.abs(current)`
- **Impact**: Wire current signs were stripped, breaking physical direction algorithm
- **Example**: W4 (`V1:negative → GND1`) should show negative current (flows GND→V1) but showed positive
- **Fix Applied**: Preserve raw signed current from voltage source calculations
- **Result**: Current direction arrows now correctly show actual current flow direction

**Educational Benefits Achieved**:

- ✅ Current probes now behave like real multimeters inserted in series
- ✅ Arrow direction matches actual electron flow in the circuit
- ✅ No more confusion about arbitrary reference directions
- ✅ Positive magnitude display is intuitive and clear
- ✅ Users can immediately see current flow patterns
- ✅ Debug system helps understand circuit topology and simulation internals

### Phase 1.965: ✅ COMPLETED - Real-Time Simulation Toggle

**Essential Interactive Foundation**:

**CRITICAL IMPORTANCE**: This was essential to implement **before** switches and potentiometers, as interactive components require immediate feedback for effective learning.

**Core Toggle System**:

- **Circuit Store Integration**: Added `isRealTimeSimulation` state with toggle controls
- **Automatic Circuit Watching**: Throttled watcher detects circuit changes and triggers simulation
- **Performance Optimization**: 100ms throttling prevents excessive simulation calls
- **Smart Circuit Tracking**: Only watches relevant changes (component properties, positions, wires)

**UI Integration**:

- **Toggle Button**: Clean toggle between "Live" and "Manual" simulation modes
- **Visual State Indicators**: Different icons and colors for Live (⚡) vs Manual (⚡🚫) modes
- **Conditional UI**: Simulate button hidden in Live mode, replaced with Live indicator
- **Professional Styling**: Green theme for Live mode, gray theme for Manual mode

**Educational Benefits**:

- ✅ **Immediate Feedback**: Students see instant results when modifying circuit parameters
- ✅ **Interactive Learning**: Real-time parameter studies without manual simulation clicks
- ✅ **Flexible Control**: Users can choose between Live (exploration) and Manual (analysis) modes
- ✅ **Performance Management**: Throttling ensures responsive UI even with complex circuits

### Phase 1.97: ✅ COMPLETED - Current Source & Switch Implementation

**Major Achievement**: Successfully implemented independent current sources and basic switches with IEEE-standard symbols and realistic electrical behavior.

**MNA Simulation Engine**:

- ✅ **CurrentSourceStamper**: Implemented proper RHS vector injection for current sources
- ✅ **Mixed Source Support**: Current and voltage sources work together in same circuit
- ✅ **No Branch Variables**: Current sources don't add branch current variables (unlike voltage sources)
- ✅ **Sign Convention**: Positive current flows from positive to negative terminal

**Visual Component System**:

- ✅ **CurrentSourceSymbol.vue**: Professional IEEE-standard circle with current arrow
- ✅ **CurrentSourceComponent.vue**: Interactive placement with current value display and visual arrow
- ✅ **Current Formatting**: Automatic unit scaling (A, mA, µA) for educational clarity
- ✅ **Component Palette Integration**: Added to 'power' category with proper icon mapping

**Circuit Integration**:

- ✅ **Component Registry**: Full registration with terminals, properties, and validation
- ✅ **Circuit Validation**: Validates non-zero current values and proper connections
- ✅ **Property Editing**: Real-time current value modification with immediate simulation updates

**Test Suite Development**:

- ✅ **Basic Current Source Test**: 1mA through 1kΩ resistor validation (1V across resistor)
- ✅ **Mixed Source Circuit Test**: Current + voltage sources working together
- ✅ **Extended MNA Node Index Fixes**: Updated all basic tests for correct node indices
- ✅ **Wire Resistance Tolerance**: Adjusted tolerance to 1% for realistic 1mΩ wire effects

**Key Technical Details**:

- ✅ **MNA Stamp**: `I_source` injected to positive node, `-I_source` to negative node in RHS vector
- ✅ **No Matrix Expansion**: Current sources don't increase matrix size (no branch variables)
- ✅ **Educational Accuracy**: Current sources maintain exact specified current regardless of circuit
- ✅ **Norton Equivalent Ready**: Foundation for Norton equivalent circuit analysis

### Phase 1.97 Continued: ✅ COMPLETED - Basic Switch Implementation

**Professional Switch Component System**:

**Interactive Switch Implementation**:

- ✅ Interactive open/closed switch component with click-to-toggle functionality
- ✅ Professional IEEE-standard symbol with visual state indication (blade position + text)
- ✅ Realistic electrical modeling: 1mΩ (closed) vs 1GΩ (open) resistance
- ✅ MNA simulation integration using existing resistive stamping infrastructure

**Educational Value**:

- ✅ **Component Integration**: Full integration with palette, properties, and circuit validation
- ✅ **Real-time Updates**: Simulation updates and circuit topology modification support
- ✅ **Educational Value**: Students can explore switching effects and circuit topology changes
- ✅ **Test Suite**: Comprehensive validation with both open and closed switch scenarios
- ✅ **Foundation for Advanced Components**: Ready for relay circuits, logic gates, and complex switching

### Phase 1.97 Final: ✅ COMPLETED - Professional Floating Node Detection System

**Comprehensive SPICE-Standard Implementation**:

**GMIN Stabilization**:

- ✅ **Professional SPICE-standard approach**: Using 1e-12 S conductance to ground
- ✅ **Numerical Stability**: Prevents singular matrix conditions
- ✅ **Educational Accuracy**: Floating nodes settle near ground potential instead of arbitrary voltages

**Advanced Detection Algorithms**:

- ✅ **Graph-Based Detection**: BFS algorithm finds nodes unreachable from ground references
- ✅ **Incomplete Circuit Detection**: Advanced algorithm detects missing return paths in current loops
- ✅ **Switch-Aware Logic**: Distinguishes between expected floating (open switches) vs circuit errors
- ✅ **Dual-Phase Analysis**: Basic floating nodes + incomplete current loop detection

**Educational UI Integration**:

- ✅ **Educational Warnings**: Clear UI warnings with yellow info icons and hover tooltips
- ✅ **UI Integration**: Warnings displayed alongside simulation errors in circuit editor
- ✅ **SPICE Compliance**: Matches professional simulator behavior for floating node handling

### Phase 1.98: ✅ COMPLETED - Potentiometers & Variable Resistors

**Complete Interactive Resistance Components**:

**Variable Resistor Implementation**:

- ✅ **Adjustable Resistance**: Configurable range (0-10kΩ default, customizable min/max)
- ✅ **Real-time Modification**: Slider interface with bounds checking and immediate simulation feedback
- ✅ **Professional Symbol**: IEEE-standard symbol with diagonal arrow indicating variability
- ✅ **Two-terminal Configuration**: Proper MNA simulation integration

**Three-Terminal Potentiometer**:

- ✅ **Full 3-terminal Potentiometer**: With wiper terminal access (terminals A, B, wiper W)
- ✅ **Voltage Divider Support**: Dynamic resistance calculation with wiper position
- ✅ **Resistance Calculation**: R1 = wiperPosition% × totalResistance, R2 = remainder
- ✅ **Professional Symbol**: Potentiometer symbol with dynamic wiper arrow and connection line

**Educational Applications**:

- ✅ **Parameter Study Tools**: Real-time resistance sweep analysis through interactive sliders
- ✅ **Circuit Sensitivity**: Studies with immediate visual feedback during adjustment
- ✅ **Voltage Divider Exploration**: Dynamic wiper positioning with visual movement
- ✅ **Interactive Controls**: Property panel sliders for resistance and wiper position adjustment (0-100%)

**Enhanced Circuit Analysis**:

- ✅ **Critical Bug Fixes**: Enhanced floating node detection for potentiometer and variable resistor connectivity
- ✅ **Dead-End Branch Detection**: Enhanced algorithm to detect degree-1 nodes and impossible current flows
- ✅ **Current Flow Physics**: Improved detection logic to prevent false connectivity reports
- ✅ **Educational Warnings**: Proper circuit validation for incomplete current loops

## Major Technical Discoveries & Breakthroughs

### Discovery 1: Pure MNA Architecture Revolution

**PROBLEM SOLVED**: Original hybrid approach mixed G-matrix stamping (resistors) with branch current variables (wires), violating fundamental circuit physics.

**SOLUTION**: Implemented Pure MNA where:

- **ALL passive components** → G-matrix stamping (consistent Ohm's law)
- **ONLY voltage sources** → Branch current variables (unknown currents)
- **Current sources** → RHS injection (known currents)

**RESULT**: Perfect KCL compliance, parameter independence restored, realistic wire currents.

### Discovery 2: Load Line Intersection Modeling Separation

**KEY INSIGHT**: **Modeling happens at different times for different reasons**

**PROBLEM SOLVED**: Non-linear behavior embedded within MNA loop was causing:

- Companion model domination ✅ **RESOLVED**
- Newton-Raphson oscillations ✅ **ELIMINATED**
- Parameter independence failures ✅ **FIXED**

**IMPLEMENTED APPROACH - Load Line Intersection**:

1. **Educational Time**: Complex models for I-V curve plotting and analysis ✅
2. **Operating Point Time**: Load line intersection using circuit constraints ✅
3. **Simulation Time**: Simple linear equivalent circuits for MNA stability ✅

**ACHIEVED BENEFITS**:

- ✅ **Educational Value**: Classic load line analysis students learn in textbooks
- ✅ **Numerical Stability**: No companion model contamination - "Load Line + Linear solver succeeded"
- ✅ **Fast Performance**: Single intersection solve vs iterative methods - no Newton-Raphson needed
- ✅ **Accurate Physics**: Complex models where needed, simple where stable

### Discovery 3: Parameter Independence System Breakthrough

**CRITICAL ACHIEVEMENT**: The enhanced parameter scaling algorithm now successfully differentiates between circuit voltage ranges and selects appropriate diode profiles:

**Successful Differentiation**:

- 1.5V → Small Signal Silicon (1e-15A)
- 3.3V → Small Signal Silicon (1e-15A)
- 5.0V → General Purpose Silicon (1e-12A)
- 12.0V → Schottky Diode (1e-9A)
- 24.0V → Power Rectifier (1e-6A)

**Fixed by**:

1. Enhanced voltage-based scoring with preference bonuses
2. Reduced voltage range overlaps for cleaner boundaries
3. De-emphasized current scoring to prioritize voltage differentiation

**Result**: The system now provides realistic parameter selection across the full range of circuit conditions, solving the "identical results" problem where all circuits previously received the same General Purpose Silicon profile.

### Discovery 4: LED Parameter Scaling Breakthrough

**CRITICAL DISCOVERY**: The LED parameter scaling approach (Is=1e-6, Vt=0.1, Vf=2.0) does NOT work for silicon diodes. When applied to silicon diodes, it produces 1.33A current (440x too high) and 2.01V forward voltage (3x too high).

**Root Cause Analysis**:

- Silicon diodes need much lower parameters: Vf should be ~0.3-0.4V (not 0.6V)
- Current scaling must be adjusted accordingly
- LED scaling works for LEDs because they have high forward voltages (2-3V)
- Silicon diodes operate at much lower voltages (~0.7V)

**Solution**: Separate parameter scaling systems for different semiconductor types.

## Complete Test Suite Achievements

### Phase 1.97 Test Results: ✅ COMPLETE SUCCESS

**Current Source & Switch Implementation:**

- ✅ **All Tests Passing**: Current source and all basic circuit tests now pass
- ✅ **Current Source Test**: 1mA through 1kΩ resistor validation (1V across resistor)
- ✅ **Mixed Source Circuit**: Current + voltage sources working together
- ✅ **Switch Test**: Both open and closed switch scenarios validated

### Final Test Suite Success: ✅ 170/170 TESTS PASSING

**Complete Validation Achievement**:

- ✅ **100% Success Rate**: All 170 tests passing across all components and features
- ✅ **LED Tests**: 6/6 passing - All physics, KCL, and architectural issues resolved
- ✅ **Diode Tests**: 10/10 passing - Load line intersection and parameter scaling working perfectly
- ✅ **Basic Circuit Tests**: 8/8 passing - Voltage dividers, current sources, switches
- ✅ **MNA System Tests**: 9/9 passing - KCL/KVL compliance, numerical stability
- ✅ **Unit Tests**: Complete validation of all core building blocks

**Performance Achievements**:

- ✅ **Perfect KCL Compliance**: 0.00% current mismatch in all series circuits
- ✅ **Parameter Independence**: Different saturation currents → different operating points (WORKING PERFECTLY)
- ✅ **Numerical Stability**: No Newton-Raphson oscillations - stable load line convergence
- ✅ **Educational Value**: Visual I-V curves and load line analysis implemented

## Files Created/Modified Archive

### Major Component Implementations

**Current Source System**:

- `src/components/circuit/components/CurrentSourceComponent.vue`
- `src/components/circuit/symbols/CurrentSourceSymbol.vue`
- `src/services/simulation.ts` - CurrentSourceStamper implementation
- `src/registry/components.ts` - Component registration
- `src/components/circuit/ComponentPalette.vue` - Icon mapping

**Switch System**:

- `src/components/circuit/components/SwitchComponent.vue`
- `src/components/circuit/symbols/SwitchSymbol.vue`
- Switch stamper implementation in simulation engine

**Potentiometer System**:

- `src/components/circuit/components/PotentiometerComponent.vue`
- `src/components/circuit/components/VariableResistorComponent.vue`
- `src/components/circuit/symbols/PotentiometerSymbol.vue`
- `src/components/circuit/symbols/VariableResistorSymbol.vue`
- `src/services/simulation.ts` - PotentiometerStamper, VariableResistorStamper
- `src/components/circuit/ComponentProperties.vue` - Interactive slider controls

**Diode & LED System**:

- `src/components/circuit/components/DiodeComponent.vue`
- `src/components/circuit/components/LEDComponent.vue`
- `src/components/circuit/symbols/DiodeSymbol.vue`
- `src/components/circuit/symbols/LEDSymbol.vue`
- Complete non-linear stamper architecture

### Simulation Engine Evolution

**Stamper Architecture Refactoring**:

```
src/services/stampers/
├── shared.ts                  # Core interfaces & ResistiveStamper
├── linear/                    # All linear stampers
│   ├── ResistorStamper.ts
│   ├── VoltageSourceStamper.ts
│   ├── CurrentSourceStamper.ts
│   ├── WireStamper.ts
│   ├── GroundStamper.ts
│   ├── NodeStamper.ts
│   ├── SwitchStamper.ts
│   ├── VariableResistorStamper.ts
│   └── PotentiometerStamper.ts
├── nonlinear/                 # All non-linear stampers & utilities
│   ├── DiodeCharacteristic.ts
│   ├── LoadLineIntersection.ts
│   ├── DiodeParameterLibrary.ts
│   ├── CircuitAnalyzer.ts
│   ├── DiodeStamper.ts
│   └── LEDStamper.ts
├── ComponentStamperFactory.ts
└── index.ts                   # Complete public API
```

**Test Infrastructure**:

- Complete unit test suite for all stampers
- Integration tests for circuit scenarios
- Functional tests for educational use cases
- Performance validation and regression testing

## Memory Integration Notes

**Key Memories Referenced**:

- Parameter scaling system breakthrough with voltage-based differentiation
- ESLint configuration requiring proper TypeScript types
- Test execution using "npm run test:unit <filename_of_test>"
- LED vs silicon diode parameter scaling discoveries
- Floating node detection implementation details
- Non-linear DC foundation completion status
- Diode parameter independence fixes
- Console.log preservation requirements
- Development server management preferences

**Architectural Principles Established**:

- Pure MNA approach for all passive components
- Load line intersection for non-linear component modeling
- Modular stamper architecture for maintainability
- Educational-focused interface design with real-time feedback
- Professional IEEE-standard component symbols
- Comprehensive test-driven development approach
