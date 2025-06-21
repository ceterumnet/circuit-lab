# Circuit Lab - Project Plan

## Overview

Building a web-based circuit simulation application focused on educational purposes and learning circuit design. The goal is to provide an interactive platform for understanding operational theory, analysis, and simulation of electronic circuits.

## Current Status

### ✅ COMPLETED Features

#### Interactive Circuit Building System

- **Component Placement:** Always-visible `ComponentPalette` with categorized components
- **Modeless Interaction:** No mode switching required - contextual interactions based on user actions
- **Ctrl+Key Wiring:** Hold Ctrl/Cmd to enter wiring mode with visual feedback
- **Advanced Canvas Navigation:**
  - Pan with spacebar+drag or middle mouse
  - Zoom with mouse wheel
  - Multi-select with Shift+click or marquee selection
- **Grid System:** 5px placement grid with 30px visual grid lines for alignment

#### Component System Architecture

- **Extensible Registry:** Dynamic component definitions in `ComponentRegistry`
- **String-Based Types:** Replaced rigid enums with flexible string types
- **Plugin-Ready:** Architecture supports future component plugins
- **Built-in Components:** Resistor, voltage source, ground, node, wire
- **Component Properties:** Dynamic property editing with rotation support

#### DC Circuit Simulation

- **Real-Time Analysis:** Modified nodal analysis algorithm
- **Live Updates:** Automatic re-simulation on circuit changes
- **Probe System:** Voltage and current probes with live measurements
- **Visual Feedback:** Probe placement and drag-to-reposition

#### Technical Foundation

- **Vue 3 + TypeScript + Vite:** Modern development stack
- **Konva.js Integration:** High-performance canvas rendering
- **Pinia State Management:** Reactive circuit and interaction stores
- **Component-Based Architecture:** Modular and maintainable codebase

## Development Phases

### Phase 1: ✅ COMPLETED - Circuit Building Foundation

- Interactive component placement and wiring
- Basic circuit topology support (voltage dividers, junctions)
- Component movement, rotation, and deletion
- Grid snapping and visual feedback

### Phase 1.5: ✅ COMPLETED - Modeless UX System

- Component palette with categorized components
- Ctrl+key modifier-based wiring system
- Advanced canvas navigation (pan, zoom, multi-select)
- Contextual interactions without mode switching

### Phase 1.8: ✅ COMPLETED - DC Simulation & Measurement

- Real-time DC circuit analysis engine
- Voltage and current probe system
- Live measurement display and updates
- Circuit validation and error handling

### Phase 1.85: ✅ COMPLETED - Professional Schematic Symbols

- [x] Enhancement: Use proper icons instead of glyphs - **replaced generic icons with professional IEEE-standard schematic symbols**
- [x] BUG: No icon for node component - added proper node symbol (filled circle)
- [x] BUG: Simulate button vs always running simulation - removed confusing simulate button, replaced with "Live Simulation" indicator
- [x] **NEW: Created custom schematic symbol library** - Professional SVG symbols for all components:
  - **ResistorSymbol**: Standard US-style zigzag pattern
  - **VoltageSourceSymbol**: Circle with polarity markings (+ and -)
  - **GroundSymbol**: Traditional ground symbol with decreasing horizontal lines
  - **NodeSymbol**: Simple filled circle for wire junctions
  - **ProbeSymbol**: Professional multimeter-style symbols (V/A)
- [x] **Educational compliance**: All symbols now follow standard circuit diagram conventions

### Phase 1.86: ✅ COMPLETED - Professional Current Measurement System

- [x] **Directional Current Probes**: Added directional arrows showing current flow reference direction
- [x] **Color-Coded Current Display**: Green for positive current, red for negative current flow
- [x] **Direction Toggle**: Added toggle in probe properties to flip measurement direction
- [x] **Fixed Sign Convention**: Corrected voltage source current to show positive when flowing out of positive terminal
- [x] **Traditional Circuit Analysis**: Current measurements now follow standard nodal/mesh analysis conventions
- [x] **Wire Current Calculation**: Fixed wire current measurements using KCL-based approach instead of voltage differences
- [x] **All Current Measurement Issues Resolved**: Wire currents now correctly show branch currents, voltage measurements accurate

### Phase 1.87: ✅ COMPLETED - Explicit Simulation with Error Validation

- [x] **Transitioned from Live to Explicit Simulation**: Removed automatic simulation watcher, now requires user-triggered simulation
- [x] **Comprehensive Circuit Validation**: Pre-simulation checks for ground connections, floating components, invalid properties
- [x] **Professional Error Reporting**: Clear error messages with hover tooltips showing specific validation issues
- [x] **Lucide Icon Integration**: Updated simulation button with proper Play/CheckCircle/Loader2 icons and error AlertTriangle
- [x] **Educational Error Feedback**: Detailed validation helps users understand circuit design requirements
- [x] **Simulation State Management**: Clear success/error/loading states with visual feedback

### Phase 1.9: ✅ COMPLETED - UX improvements

- [x] Add basic save / load circuits from browser store
- [x] Add rotation handle to components when selected so they can be directly rotated
- [x] Implement Copy and Paste for single and multiple selected components. We will have to deal with things like labels and IDs.
- [x] Undo / Redo
- [x] Copy, Cut, and Paste for components, wires, and probes with proper ID remapping
- [x] It is a pain every time I need to create a bunch of components to do regression and validation. We either need:

  - [x] have some canned circuits (only basic tests)
  - [x] implement a save feature so that I don't have to keep redoing circuits

- [x] Component placement:

  - [x] I have to select a component and then place the component, and then if I want to place another component I need to click that component on the left hand side again. We should consider making the selection persistent and entering a component placement mode.
  - [x] What about when I place a component and the pin intersects a wire or a terminal? I believe it should automatically connect. This would work well for NodeComponents as well as the other types. Currently it is cumbersome to place a component on an existing circuit because you have to delete a wire and then rebuild the connections
  - [x] When placing a component, I want to be able to hit the 'r' key to rotate it 90 degrees before placement
  - [x] Keyboard shortcuts to component placement. I'm thinking we should bind the '/' key which brings up an inline component selector with quick search so you can hit '/' -> type "r" or "re" and components starting with r or re (such as resistor) will be in the list. Then it becomes super easy to not have to leave the circuit context

### Phase 1.91: ✅ COMPLETED - Multi-Ground Circuit Support & Physical Current Direction

**Problem Identified:** The simulation system incorrectly handled multiple isolated circuits by applying only one ground reference, causing the second circuit's ground to float at non-zero potential (e.g., -2.5V instead of 0V).

**Critical Fix - Multi-Ground Support:**

- [x] **Root Cause:** `buildElectricalNodes()` only identified single ground node for entire circuit
- [x] **Solution:** Extended ground detection to find all ground nodes and reference nodes for isolated circuits
- [x] **Implementation:** Modified MNA matrix to apply multiple ground constraints (V = 0) for each isolated circuit
- [x] **Validation:** Tested with interconnected circuits showing proper 0V ground references

**Current Probe Direction Enhancement:**

- [x] **Problem:** Current probe arrows show arbitrary reference directions instead of actual current flow
- [x] **Educational Goal:** Probes should behave like real multimeters, showing physical current direction
- [x] **Solution Approach:** Physical Current Direction Algorithm
- [x] **CRITICAL BUG DISCOVERED & FIXED:** Simulation engine was stripping current signs in wire calculations

#### Physical Current Direction Specification

**Core Principle:** Current probe arrows always point in actual current flow direction, displaying positive magnitudes (like watching electrons move).

**Implementation Algorithm:**

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

**Key Features:**

- **Topology-Aware:** Recognizes current sources (voltage_source:positive) vs sinks (voltage_source:negative, ground:terminal)
- **Sign-Based Direction:** Uses simulation current sign to determine actual flow direction
- **Always Positive Display:** Shows magnitude only, direction indicated by arrow
- **Educational Intuition:** Matches physical understanding of electron flow

**Benefits:**

- ✅ Eliminates confusing arbitrary reference directions
- ✅ Shows actual current flow like real circuit behavior
- ✅ Removes need for manual direction toggling
- ✅ Improves educational value for circuit analysis learning

**Current Status:** ✅ **IMPLEMENTATION COMPLETE & BUG FIXED**

**Critical Simulation Engine Bug Fix:**

- [x] **Root Cause Discovered:** `WireStamper.calculateBranchCurrentByKCL()` was using `Math.abs(current)`
- [x] **Impact:** Wire current signs were stripped, breaking physical direction algorithm
- [x] **Example:** W4 (`V1:negative → GND1`) should show negative current (flows GND→V1) but showed positive
- [x] **Fix Applied:** Preserve raw signed current from voltage source calculations
- [x] **Result:** Current direction arrows now correctly show actual current flow direction

**Implementation Details:**

- [x] **ProbeComponent.vue**: Updated to use `physicalCurrentInfo` for arrow direction
- [x] **Physical Direction Algorithm**: Current sign determines actual flow direction (+ = start→end, - = end→start)
- [x] **Arrow Visualization**: Arrows now point in actual current flow direction
- [x] **Magnitude Display**: Always show positive values (direction shown by arrow)
- [x] **ProbeProperties.vue**: Updated to match ProbeComponent logic
- [x] **UI Simplification**: Removed manual direction toggle, added automatic direction indicator
- [x] **Color Coding**: Simplified to always green (positive magnitude with directional arrow)
- [x] **Simulation Fix**: Modified wire current calculation to preserve signs for direction analysis

**Debug System Implementation:**

- [x] **Comprehensive Debug Panels**: Added detailed debugging information to component and probe properties
- [x] **Wire Connection Analysis**: Shows start/end connections with component types and terminals
- [x] **Current Flow Debugging**: Displays simulation current, raw sign, and computed physical direction
- [x] **Node Mapping**: Shows internal simulation node indices for voltage measurements
- [x] **Topology Visualization**: Complete connection graph for debugging wire routing

**Educational Benefits Achieved:**

- ✅ Current probes now behave like real multimeters inserted in series
- ✅ Arrow direction matches actual electron flow in the circuit
- ✅ No more confusion about arbitrary reference directions
- ✅ Positive magnitude display is intuitive and clear
- ✅ Users can immediately see current flow patterns
- ✅ Debug system helps understand circuit topology and simulation internals

### Phase 1.97: ✅ COMPLETED - Current Source Implementation

**Goal:** Successfully implemented independent current sources as first step in Non-Linear DC Foundation

**MAJOR ACHIEVEMENTS:**

**MNA Simulation Engine:**

- ✅ **CurrentSourceStamper:** Implemented proper RHS vector injection for current sources
- ✅ **Mixed Source Support:** Current and voltage sources work together in same circuit
- ✅ **No Branch Variables:** Current sources don't add branch current variables (unlike voltage sources)
- ✅ **Sign Convention:** Positive current flows from positive to negative terminal

**Visual Component System:**

- ✅ **CurrentSourceSymbol.vue:** Professional IEEE-standard circle with current arrow
- ✅ **CurrentSourceComponent.vue:** Interactive placement with current value display and visual arrow
- ✅ **Current Formatting:** Automatic unit scaling (A, mA, µA) for educational clarity
- ✅ **Component Palette Integration:** Added to 'power' category with proper icon mapping

**Circuit Integration:**

- ✅ **Component Registry:** Full registration with terminals, properties, and validation
- ✅ **Circuit Validation:** Validates non-zero current values and proper connections
- ✅ **Property Editing:** Real-time current value modification with immediate simulation updates

**Test Suite Development:**

- ✅ **Basic Current Source Test:** 1mA through 1kΩ resistor validation (1V across resistor)
- ✅ **Mixed Source Circuit Test:** Current + voltage sources working together
- ✅ **Extended MNA Node Index Fixes:** Updated all basic tests for correct node indices
- ✅ **Wire Resistance Tolerance:** Adjusted tolerance to 1% for realistic 1mΩ wire effects

**Key Technical Details:**

- ✅ **MNA Stamp:** `I_source` injected to positive node, `-I_source` to negative node in RHS vector
- ✅ **No Matrix Expansion:** Current sources don't increase matrix size (no branch variables)
- ✅ **Educational Accuracy:** Current sources maintain exact specified current regardless of circuit
- ✅ **Norton Equivalent Ready:** Foundation for Norton equivalent circuit analysis

**Files Created/Modified:**

- ✅ `src/components/circuit/components/CurrentSourceComponent.vue`
- ✅ `src/components/circuit/symbols/CurrentSourceSymbol.vue`
- ✅ `src/services/simulation.ts` - CurrentSourceStamper implementation
- ✅ `src/registry/components.ts` - Component registration
- ✅ `src/components/circuit/ComponentPalette.vue` - Icon mapping
- ✅ `src/test-circuits/current-source-test.ts` - Test circuits
- ✅ `src/test-circuits/current-source-runner.ts` - Console testing
- ✅ `src/test-circuits/basic-tests.ts` - Fixed node indices for all tests

**Success Validation:**

- ✅ **All Tests Passing:** Current source and all basic circuit tests now pass
- ✅ **Multimeter Equivalent:** Current sources behave exactly like real current sources
- ✅ **Educational Value:** Students can now analyze mixed voltage/current source circuits
- ✅ **Professional Quality:** IEEE-standard symbols and proper circuit analysis

### Phase 1.965: ✅ COMPLETED - Real-Time Simulation Toggle

**Goal:** Implement real-time simulation toggle as essential foundation for interactive components (switches, potentiometers)

**Status:** ✅ **FULLY IMPLEMENTED**

**CRITICAL IMPORTANCE:** This was essential to implement **before** switches and potentiometers, as interactive components require immediate feedback for effective learning.

**MAJOR ACHIEVEMENTS:**

**Core Toggle System:**

- ✅ **Circuit Store Integration:** Added `isRealTimeSimulation` state with toggle controls
- ✅ **Automatic Circuit Watching:** Throttled watcher detects circuit changes and triggers simulation
- ✅ **Performance Optimization:** 100ms throttling prevents excessive simulation calls
- ✅ **Smart Circuit Tracking:** Only watches relevant changes (component properties, positions, wires)

**UI Integration:**

- ✅ **Toggle Button:** Clean toggle between "Live" and "Manual" simulation modes
- ✅ **Visual State Indicators:** Different icons and colors for Live (⚡) vs Manual (⚡🚫) modes
- ✅ **Conditional UI:** Simulate button hidden in Live mode, replaced with Live indicator
- ✅ **Professional Styling:** Green theme for Live mode, gray theme for Manual mode

**Educational Benefits:**

- ✅ **Immediate Feedback:** Students see instant results when modifying circuit parameters
- ✅ **Interactive Learning:** Real-time parameter studies without manual simulation clicks
- ✅ **Flexible Control:** Users can choose between Live (exploration) and Manual (analysis) modes
- ✅ **Performance Management:** Throttling ensures responsive UI even with complex circuits

**Technical Implementation:**

- ✅ **Vue 3 Reactivity:** Uses computed properties and watchers for efficient change detection
- ✅ **Throttled Execution:** Prevents simulation spam with configurable delay (50ms-1000ms range)
- ✅ **Cleanup Logic:** Proper timeout management to prevent memory leaks
- ✅ **Error Handling:** Real-time simulation respects validation and error states

**Files Modified:**

- ✅ **`src/stores/circuit.ts`:** Core toggle logic, watchers, and throttled simulation
- ✅ **`src/views/CircuitEditor.vue`:** UI toggle button, conditional display, and styling

**Ready for Interactive Components:**

- ✅ **Switch Implementation:** Users can now toggle switches and see immediate circuit response
- ✅ **Potentiometer Support:** Real-time parameter sweeps will work seamlessly
- ✅ **Educational Value:** Interactive exploration mode enhances learning experience
- ✅ **Professional UX:** Meets expectations for modern circuit simulation tools

**Key Features:**

```typescript
// Circuit Store API
circuitStore.toggleRealTimeSimulation() // Toggle between Live/Manual
circuitStore.enableRealTimeSimulation() // Force enable Live mode
circuitStore.disableRealTimeSimulation() // Force enable Manual mode
circuitStore.setSimulationThrottleMs(150) // Adjust throttling delay
```

**Success Validation:**

- ✅ **Immediate Response:** Circuit changes trigger simulation within 100ms
- ✅ **Performance:** No noticeable UI lag even with real-time updates
- ✅ **Visual Feedback:** Clear indication of Live vs Manual modes
- ✅ **Error Handling:** Real-time simulation respects circuit validation
- ✅ **Foundation Complete:** Ready for switches and potentiometers implementation

### Phase 1.97: Non-Linear DC Foundation (Current Sources)

**Goal:** Add fundamental DC components and establish non-linear solving capabilities

**Status:** ✅ **CURRENT SOURCES IMPLEMENTED SUCCESSFULLY**

#### Linear DC Components (High Priority)

- [x] **Independent Current Sources** ✅ **COMPLETED**

  - ✅ DC current source component with configurable current value (default 1mA)
  - ✅ Proper MNA stamping for current source constraints (RHS vector injection)
  - ✅ **Mixed Source Support:** Current sources work alongside voltage sources in same circuit
  - ✅ Norton equivalent circuit support and source transformation examples
  - ✅ Bidirectional current flow capability
  - ✅ **Educational Applications:** Superposition theorem, Thevenin/Norton equivalents, mixed source analysis
  - ✅ **Professional IEEE Symbol:** Circle with current arrow following standard conventions
  - ✅ **Component Integration:** Full integration with palette, properties, and circuit validation
  - ✅ **Test Suite:** Comprehensive validation with mixed-source circuit testing

- [ ] **Basic Switches**

  - Simple open/closed switch component
  - Interactive toggle functionality
  - Infinite/zero resistance modeling
  - Circuit topology modification support

- [ ] **Potentiometers/Variable Resistors**
  - Adjustable resistance with slider interface
  - Real-time resistance modification
  - Wiper position visualization
  - Parameter study support

#### Non-Linear DC Analysis (Medium Priority)

- [ ] **Simple Diode Model**

  - Basic exponential I-V characteristic
  - Forward/reverse bias behavior
  - Temperature-independent simplified model
  - Rectifier circuit support

- [ ] **Iterative Solver Implementation**

  - Newton-Raphson method for non-linear circuits
  - Convergence monitoring and error handling
  - Operating point calculation
  - Robust initial guess algorithms

- [ ] **LED Components**
  - Diode model with visual feedback
  - Color-coded LED symbols
  - Forward voltage drop modeling
  - Current limiting resistance calculations

#### Educational Features

- [ ] **DC Analysis Enhancement**

  - **Mixed Source Circuit Analysis:** Full support for voltage + current source combinations
  - Thevenin/Norton equivalent circuit calculations and transformations
  - Superposition principle demonstration with mixed sources
  - Maximum power transfer analysis
  - Operating point visualization
  - **Circuit Validation:** Detect invalid configurations (current source in series with open, etc.)

- [ ] **Interactive Circuit Analysis**
  - Parameter sweep for resistance/current values
  - Load line analysis for non-linear devices
  - Current/voltage divider calculations
  - Circuit behavior prediction tools

**SUCCESS CRITERIA:**

- [ ] **Mixed Source Support:** Voltage and current sources working together in same circuit
- [ ] **Linear Foundation:** Current sources, switches, and variable resistors working seamlessly
- [ ] **Non-Linear Capability:** Diodes functioning with iterative solver
- [ ] **Educational Value:** Enhanced circuit analysis problems including superposition and source transformations
- [ ] **Robust Solving:** Reliable convergence for common non-linear circuits with proper error handling

### Phase 1.98: 📋 PLANNED - Basic Transistor Implementation

**Goal:** Implement fundamental transistor models to enable amplifier and switching circuits

**Status:** Requires completion of Phase 1.97 non-linear foundation

#### BJT Transistor Implementation

- [ ] **Basic BJT Model (NPN/PNP)**

  - Simplified Ebers-Moll model
  - Current-controlled operation (β-based)
  - Saturation, active, and cutoff regions
  - Temperature-independent model

- [ ] **BJT Component Interface**

  - Three-terminal symbol (collector, base, emitter)
  - Configurable β (current gain) parameter
  - Saturation voltage settings
  - Visual orientation indicators

- [ ] **BJT Circuit Support**
  - Common emitter amplifier configurations
  - Switch mode operation
  - Current mirror circuits
  - Darlington pair configurations

#### FET Transistor Implementation

- [ ] **Basic MOSFET Model (NMOS/PMOS)**

  - Simplified square-law model
  - Voltage-controlled operation
  - Triode and saturation regions
  - Threshold voltage modeling

- [ ] **MOSFET Component Interface**

  - Three-terminal symbol (drain, gate, source)
  - Configurable threshold voltage and transconductance
  - Enhancement/depletion mode support
  - Body connection handling

- [ ] **MOSFET Circuit Support**
  - Common source amplifier configurations
  - Digital logic gate foundations
  - Current source circuits
  - Complementary CMOS pairs

#### Advanced Transistor Features

- [ ] **Operating Point Analysis**

  - Automatic Q-point calculation
  - Bias point stability analysis
  - Small-signal parameter extraction
  - Operating region identification

- [ ] **Transistor Modeling Enhancements**
  - Early effect modeling (finite output resistance)
  - Temperature coefficient support
  - Parasitic capacitance modeling (AC preparation)
  - Power dissipation calculations

#### Educational Applications

- [ ] **Amplifier Design Tools**

  - Gain calculation and visualization
  - Frequency response preparation
  - Bias network design assistance
  - Load line analysis

- [ ] **Digital Logic Foundations**
  - Inverter circuit analysis
  - Logic gate implementation
  - Switching time analysis
  - Power consumption calculations

**SUCCESS CRITERIA:**

- [ ] **Transistor Functionality:** Basic NPN/PNP BJT and NMOS/PMOS MOSFET models working
- [ ] **Circuit Applications:** Common amplifier and switch circuits operational
- [ ] **Educational Value:** Students can design and analyze transistor circuits
- [ ] **Foundation for Advanced Features:** Solid base for AC analysis and complex models

### Phase 2: 📋 PLANNED - AC Analysis & Reactive Components

**Goal:** Extend simulation capabilities beyond DC to support frequency-domain analysis

**Status:** The DC simulation engine foundation is complete with unified MNA stamping system, multiple voltage source support, and comprehensive testing infrastructure.

#### Core AC Analysis Features

- [ ] **Reactive Component Support**

  - Capacitor component with frequency-dependent impedance
  - Inductor component with inductive reactance
  - Complex impedance calculations in frequency domain

- [ ] **AC Analysis Engine**

  - Extend MNA system for complex number calculations
  - Frequency sweep analysis (AC sweep)
  - Phasor-based voltage and current calculations

- [ ] **AC Component Stampers**
  - `CapacitorStamper` with jωC impedance modeling
  - `InductorStamper` with jωL impedance modeling
  - AC voltage/current source stampers with phase support

#### Frequency Domain Analysis

- [ ] **Bode Plot Generation**

  - Magnitude and phase response plots
  - Transfer function analysis
  - Pole-zero identification

- [ ] **AC Measurement Tools**
  - RMS voltage and current measurements
  - Phase angle measurements between signals
  - Power calculations (real, reactive, apparent)

#### Educational Features

- [ ] **Interactive Frequency Response**

  - Real-time Bode plot updates as circuit changes
  - Visual phasor diagrams
  - Resonance frequency identification

- [ ] **AC Circuit Validation**
  - Impedance matching analysis
  - Filter response characterization
  - Stability analysis for feedback circuits

### Phase 4: 📋 PLANNED - Enhanced Plotting & Visualization

**Goal:** Professional-grade measurement and visualization capabilities

#### Advanced Plotting System

- [ ] **Chart.js Integration**

  - Waveform visualization with interactive plots
  - Time-domain plotting with oscilloscope-style interface
  - Parameter sweep visualization
  - Export plot data (CSV, image formats)

- [ ] **Multi-Channel Oscilloscope Interface**
  - Multiple probe channels with color coding
  - Trigger controls and time base adjustment
  - Cursor measurements and automatic measurements
  - FFT analysis for frequency content

#### Enhanced Measurement Tools

- [ ] **Advanced Probe System**

  - RMS and peak voltage/current measurements
  - Power measurements (instantaneous, average, RMS)
  - Phase angle measurements between signals
  - Harmonic distortion analysis

- [ ] **Circuit Analysis Tools**
  - Operating point analysis display
  - Small-signal parameter extraction
  - Sensitivity analysis capabilities
  - Circuit performance metrics dashboard

#### Visualization Improvements

- [ ] **Circuit Validation Engine**

  - Visual error indicators with hover tooltips
  - Component stress analysis with color coding
  - Real-time convergence monitoring
  - Power dissipation visualization

- [ ] **Interactive Analysis**

  - Parameter sweep with real-time plot updates
  - What-if analysis with component value sliders
  - Comparison mode for multiple circuit configurations
  - Performance optimization suggestions

- [ ] **Future enhancements**
  - [x] ~~Current probe rendering isn't super intuitive~~ → **COMPLETED in Phase 1.91**: Implemented Physical Current Direction with intuitive arrow visualization
  - [ ] Add the ability to select a group of items in the canvas and save them as a reusable fragment / building block. This will eventually allow us to have user created components and logical sub-components where we don't necessarily need to represent everything on the circuit all the time visually if that makes sense.
  - [ ] Better wire routing / avoidance of components?
  - [ ] Live simulation toggle
  - [ ] Button components
  - [ ] Wave generators
  - [ ] Mixed AC / DC analysis

### Phase 5: 📋 PLANNED - Advanced Components & Time-Domain Analysis

**Goal:** Add complex components and time-domain simulation capabilities

**Status:** Builds on Phase 2 AC analysis and Phase 1.98 transistor foundation

#### Advanced Passive Components

- [ ] **Transformers & Coupled Inductors**

  - Mutual inductance modeling
  - Ideal and realistic transformer models
  - Turns ratio configuration
  - Core saturation effects

- [ ] **Advanced Capacitor Models**
  - Parasitic series resistance (ESR)
  - Dielectric absorption effects
  - Voltage coefficient modeling
  - Frequency-dependent behavior

#### Advanced Semiconductor Models

- [ ] **Enhanced Transistor Models**

  - Gummel-Poon BJT model with temperature effects
  - BSIM MOSFET models with short-channel effects
  - Parasitic capacitance modeling
  - Noise analysis support

- [ ] **Operational Amplifiers**

  - Ideal op-amp model
  - Realistic op-amp with slew rate, bandwidth
  - Input/output impedance modeling
  - Common-mode rejection ratio (CMRR)

- [ ] **Advanced Diode Models**
  - Zener diode voltage regulation
  - Schottky diode high-frequency behavior
  - Temperature coefficient modeling
  - Reverse recovery time effects

#### Time-Domain Analysis

- [ ] **Transient Analysis Engine**

  - Numerical integration methods (Trapezoidal, Backward Euler)
  - Automatic timestep control
  - Initial condition handling
  - Convergence monitoring

- [ ] **Time-Domain Measurements**
  - Rise time, fall time, settling time
  - Overshoot and ringing analysis
  - Propagation delay measurements
  - Slew rate calculations

**SUCCESS CRITERIA:**

- [ ] **Advanced Models:** Realistic component behavior with parasitics
- [ ] **Time-Domain Capability:** Transient analysis with proper convergence
- [ ] **Educational Value:** Complex circuit analysis matching textbook problems
- [ ] **Professional Features:** Industry-standard component models

### Phase 6: 📋 FUTURE - Professional Features & Digital Integration

**Goal:** Complete professional-grade circuit simulation with digital components and advanced analysis

**Status:** Long-term vision for comprehensive circuit simulation platform

#### Digital Components & Mixed-Signal

- [ ] **Digital Logic Components**

  - Basic logic gates (AND, OR, NOT, NAND, NOR, XOR)
  - Flip-flops (D, JK, T, SR) with timing models
  - Counters, shift registers, multiplexers
  - Memory elements (latches, SRAM cells)

- [ ] **Mixed-Signal Analysis**
  - Combined analog/digital simulation
  - Logic threshold detection
  - Digital timing analysis
  - Interface between analog and digital domains

#### Advanced Simulation Capabilities

- [ ] **Statistical Analysis**

  - Monte Carlo simulation with component tolerances
  - Worst-case analysis
  - Yield analysis for manufacturing
  - Design centering and optimization

- [ ] **Advanced Measurement & Analysis**
  - Noise analysis (thermal, shot, flicker)
  - Distortion analysis (THD, IMD)
  - Stability analysis (phase/gain margins)
  - Sensitivity analysis

#### Educational & Professional Features

- [ ] **Educational Content Integration**

  - Interactive tutorials and guided exercises
  - Circuit analysis explanations and theory
  - Problem-solving assistance
  - Performance benchmarking

- [ ] **Collaboration & Sharing**
  - Cloud-based circuit storage and sharing
  - Team collaboration features
  - Circuit library and component sharing
  - Educational institution integration

**SUCCESS CRITERIA:**

- [ ] **Complete Simulation Suite:** Analog, digital, and mixed-signal capabilities
- [ ] **Professional Quality:** Industry-standard analysis and measurement tools
- [ ] **Educational Platform:** Comprehensive learning and teaching support
- [ ] **Collaboration Features:** Team-based circuit design and sharing

## Technical Architecture

### Current Stack

- **Frontend:** Vue 3 + TypeScript + Vite
- **Canvas:** Konva.js with vue-konva integration
- **State Management:** Pinia stores
- **Simulation:** Custom JavaScript DC analysis engine
- **Styling:** CSS with scoped component styles

### Component Registry System

```typescript
// Extensible component definitions
export interface ComponentDefinition {
  type: string
  name: string
  category: 'passive' | 'active' | 'digital' | 'power' | 'connection'
  terminals: TerminalDefinition[]
  properties: PropertyDefinition[]
  icon?: string
}

// Self-registering components
ComponentRegistry.set('resistor', {
  type: 'resistor',
  name: 'Resistor',
  category: 'passive',
  // ... full definition
})
```

### Interaction Model

```typescript
// Modeless interactions based on context
- Default: Component selection and movement
- Ctrl+Hold: Wiring mode with enhanced terminal targets
- Spacebar+Drag: Canvas panning
- Shift+Click: Multi-selection
- Component Palette Click: Placement mode
```

### Simulation Architecture

```typescript
// Real-time DC analysis
circuit → buildNetlist() → solveModifiedNodalAnalysis() → updateProbes()
```

## Immediate Next Steps

### 1. Continue Phase 1.97 - Non-Linear DC Foundation (Priority: High)

✅ **COMPLETED:** Independent Current Sources - Full implementation with mixed-source support

**Next Components to Implement:**

- **Basic Switches:** Interactive open/closed switch components with infinite/zero resistance
- **Potentiometers/Variable Resistors:** Adjustable resistance with slider interface and real-time updates
- **Simple Diode Model:** Basic exponential I-V characteristic with Newton-Raphson solver
- **Iterative Solver Implementation:** Non-linear circuit solving capability for diode circuits

### 2. Complete Phase 1.98 - Basic Transistor Implementation

- **BJT Transistor Models:** Simple NPN/PNP models with Ebers-Moll equations
- **MOSFET Models:** Basic NMOS/PMOS square-law models
- **Operating Point Analysis:** Q-point calculation and visualization
- **Amplifier Circuit Support:** Common emitter/source configurations

### 3. Phase 2 - AC Analysis Foundation

- **Reactive Components:** Add capacitor and inductor components
- **Complex Number MNA:** Extend simulation for frequency domain
- **AC Source Components:** Voltage/current sources with phase support
- **Basic Bode Plots:** Magnitude and phase response visualization

### 4. Phase 4 - Enhanced Plotting System

- **Chart.js Integration:** Professional plotting library integration
- **Oscilloscope Interface:** Multi-channel waveform visualization
- **Advanced Measurements:** RMS, peak, power, and phase measurements
- **Interactive Analysis:** Parameter sweeps and what-if scenarios

## Success Metrics

### Current Achievements

- ✅ Intuitive modeless interface requiring minimal learning
- ✅ Real-time DC simulation with live probe measurements
- ✅ Extensible architecture ready for complex components
- ✅ Professional canvas interaction (pan, zoom, multi-select)
- ✅ Robust component placement and wiring system

### Phase 2 Goals (AC Analysis)

- [ ] Reactive component library (capacitors, inductors)
- [ ] Frequency-domain analysis with complex number support
- [ ] Basic Bode plot generation and visualization
- [ ] AC voltage/current sources with phase control
- [ ] Educational phasor diagrams and AC circuit analysis

### Phase 3 Goals (Plotting & Visualization)

- [ ] Professional oscilloscope-style measurement interface
- [ ] Multi-channel waveform visualization with Chart.js
- [ ] Advanced measurement tools (RMS, power, phase)
- [ ] Parameter sweep and interactive analysis capabilities
- [ ] Comprehensive circuit validation and error reporting

### Long-term Vision (6-12 months)

- [ ] Full AC analysis with Bode plots and frequency response
- [ ] Semiconductor device library (transistors, op-amps)
- [ ] Mixed-signal capability with digital components
- [ ] Cloud-based circuit sharing and collaboration
- [ ] Curriculum integration with guided learning paths

## Resources & References

### Technical Documentation

- [Vue 3 Composition API](https://vuejs.org/guide/composition-api.html)
- [Konva.js Canvas Library](https://konvajs.org/)
- [Modified Nodal Analysis](https://en.wikipedia.org/wiki/Modified_nodal_analysis)
- [SPICE Circuit Simulation](https://ngspice.sourceforge.io/)

### Educational Resources

- [All About Circuits](https://www.allaboutcircuits.com/)
- [Electronic Circuit Analysis](https://www.electronics-tutorials.ws/)
- [MIT 6.002 Circuits and Electronics](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/)
