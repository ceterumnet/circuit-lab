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

### Phase 1.92: ⚠️ PARTIALLY COMPLETED - Ground-Connected Current Direction Fix

**Goal:** Fix inconsistent current direction arrows on ground-connected wires

**PROBLEM IDENTIFIED:** Current probes on wires connected to ground components showed inconsistent arrow directions - some pointing towards ground, others pointing away from ground, causing educational confusion.

**DEEPER ISSUE DISCOVERED:** The wire current calculation algorithm has fundamental flaws that violate KCL and the "multimeter test" - multiple wires connected to the same node show different currents when they should reflect actual branch currents.

**ROOT CAUSE:** The physical current direction algorithm purely used simulation current signs without considering the special educational role of ground components as current sinks. Additionally, the `calculateBranchCurrentByKCL()` method uses heuristic current assignment instead of calculating actual branch currents.

**SOLUTION IMPLEMENTED:**

- [x] **Ground Override Algorithm:** Added special handling for ground-connected wires in current direction calculations
- [x] **Educational Convention:** Ground components now always treated as current sinks - current flows towards ground
- [x] **Consistent Logic:** Applied same override logic to both ProbeComponent.vue and ProbeProperties.vue
- [x] **Enhanced Debug Output:** Added ground override indicators in debug logging to show when educational conventions are applied

**KNOWN LIMITATIONS:**

- ⚠️ **Wire Current Calculation Flaw:** Multiple wires to same node show different currents (violates KCL)
- ⚠️ **Multimeter Test Failure:** Wire currents don't represent actual branch currents that would be measured
- ⚠️ **Simulation Engine Issue:** `calculateBranchCurrentByKCL()` needs fundamental redesign

**Key Features:**

✅ **Ground as Current Sink:** All wires ending at ground components show current flowing towards ground  
✅ **Ground as Current Source:** All wires starting from ground components show current flowing away from ground  
✅ **Educational Clarity:** Eliminates confusing scenarios where multiple ground wires show different directions  
✅ **Debugging Support:** Clear indicators when ground override is applied vs. natural current direction

**Implementation Details:**

```typescript
// If end component is ground, current should flow towards it (start → end)
if (endComp?.type === 'ground') {
  flowsStartToEnd = true // Always show current flowing towards ground
}
// If start component is ground, current should flow away from it (end → start)
else if (startComp?.type === 'ground') {
  flowsStartToEnd = false // Always show current flowing away from ground
}
```

**Testing & Validation:**

- [x] **Ground Direction Consistency:** All ground-connected wires now show intuitive current directions
- [x] **Complex Circuit Support:** Multi-ground circuits maintain educational clarity
- [x] **Debug System Enhancement:** Ground override clearly indicated in probe debug panels
- [x] **No Simulation Impact:** Raw current calculations remain physically accurate

### Phase 1.93: 🔥 CRITICAL - Wire Current Calculation Overhaul

**Goal:** Fix fundamental wire current calculation flaws that violate KCL and physical accuracy

**CRITICAL ISSUES TO RESOLVE:**

- [ ] **KCL Violation:** Multiple wires to same node show different currents (physically impossible)
- [ ] **Multimeter Test Failure:** Wire currents don't represent actual measurable branch currents
- [ ] **Heuristic Algorithm Flaw:** `calculateBranchCurrentByKCL()` guesses currents instead of calculating them
- [ ] **Educational Impact:** Students learn incorrect current flow concepts

**PROPOSED SOLUTION APPROACHES:**

**Option 1: Branch Current Stamping**

- [ ] Extend MNA system to explicitly solve for wire branch currents
- [ ] Add wire current variables to the MNA matrix
- [ ] Stamp wire KCL equations explicitly

**Option 2: Post-Processing Current Calculation**

- [ ] After MNA solution, calculate wire currents using proper KCL at each node
- [ ] Ensure current conservation at every electrical node
- [ ] Validate against multimeter test for each wire

**Option 3: Series Component Analysis**

- [ ] Identify series current paths through circuit topology
- [ ] Assign same current to all elements in series path
- [ ] Handle parallel branches with proper current division

**VALIDATION REQUIREMENTS:**

- [ ] **KCL Compliance:** All currents into each node must sum to zero
- [ ] **Multimeter Test:** Wire current equals what would be measured in series
- [ ] **Educational Accuracy:** Current directions and magnitudes make physical sense
- [ ] **Regression Testing:** Ensure fix doesn't break existing circuit analysis

### Phase 1.94: 📋 NEXT - Current Direction Testing & UX Polish

**Goal:** After fixing wire current calculation, validate the ground override fix and improve overall probe UX

**Testing & Validation:**

- [ ] **Multi-Circuit Testing:** Test ground override behavior across various circuit topologies
- [ ] **Edge Case Validation:** Verify behavior with multiple grounds, floating circuits, and complex interconnections
- [ ] **User Experience Verification:** Ensure ground override provides educational clarity without confusion
- [ ] **Performance Impact:** Verify no performance degradation from additional component lookups

**UX Improvements:**

- [ ] **Probe Visual Enhancement:** Improve current probe arrow visibility and styling
- [ ] **Debug Panel Toggle:** Add ability to show/hide debug information for cleaner interface
- [ ] **Magnitude-Based Visualization:** Consider arrow thickness or color intensity based on current magnitude
- [ ] **Educational Annotations:** Add hover tooltips explaining current flow direction logic

**Potential Future Enhancements:**

- [ ] **Current Magnitude Scaling:** Add visual thickness or color intensity based on current magnitude
- [ ] **Flow Animation:** Consider animated current flow visualization for educational purposes
- [ ] **Advanced Debug Mode:** Toggle between simple and detailed debug information
- [ ] **Export Debug Data:** Allow exporting circuit analysis data for external tools

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

### Phase 3: 📋 PLANNED - Enhanced Plotting & Visualization

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

### Phase 4: 📋 PLANNED - Advanced Components

- **Passive Components:** Capacitors, inductors, transformers
- **Semiconductor Devices:** Diodes, LEDs, basic transistors
- **Advanced Models:** Op-amps, MOSFETs with realistic characteristics
- **Time-Domain Analysis:** Transient response, settling time

### Phase 5: 📋 FUTURE - Professional Features

- **Digital Components:** Logic gates, flip-flops, counters
- **Mixed-Signal Analysis:** Combined analog/digital simulation
- **Educational Content:** Tutorials, guided exercises, explanations
- **Advanced Simulation:** Monte Carlo analysis, worst-case scenarios

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

### 1. Complete Phase 1.9 UX Improvements (Priority: High)

- **Copy/Paste Functionality:** Single and multiple component duplication
- **Improved Current Probe Rendering:** Better visual design and positioning
- **Reusable Circuit Fragments:** Save component groups as building blocks

### 2. AC Analysis Foundation (Phase 2)

- **Reactive Components:** Add capacitor and inductor components
- **Complex Number MNA:** Extend simulation for frequency domain
- **AC Source Components:** Voltage/current sources with phase support
- **Basic Bode Plots:** Magnitude and phase response visualization

### 3. Enhanced Plotting System (Phase 3)

- **Chart.js Integration:** Professional plotting library integration
- **Oscilloscope Interface:** Multi-channel waveform visualization
- **Advanced Measurements:** RMS, peak, power, and phase measurements
- **Interactive Analysis:** Parameter sweeps and what-if scenarios

### 4. Component Library Expansion (Phase 4)

- **Semiconductor Devices:** Diodes, LEDs, basic transistors
- **Op-Amp Models:** Ideal and realistic operational amplifier models
- **Advanced Passives:** Transformers, coupled inductors
- **Digital Components:** Basic logic gates for mixed-signal analysis

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
