# Circuit Lab - Project Plan

## Overview

Building a web-based circuit simulation application focused on educational purposes and learning circuit design. The goal is to provide an interactive platform for understanding operational theory, analysis, and simulation of electronic circuits.

## Current Status

**Architecture:** Modeless interaction with component palette  
**Phase:** 1.86 - Professional Current Measurement System  
**Next Phase:** Phase 1.9 - UX Improvements

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

### Phase 1.9: UX improvements

- [x] Add basic save / load circuits from browser store
- [x] Add rotation handle to components when selected so they can be directly rotated
- [ ] Implement Copy and Paste for single and multiple selected components. We will have to deal with things like labels and IDs.
- [x] Undo / Redo
- [ ] It is a pain every time I need to create a bunch of components to do regression and validation. We either need:
  - [ ] an E2E test for things
  - [x] have some canned circuits (only basic tests)
  - [x] implement a save feature so that I don't have to keep redoing circuits
- [ ] Component placement

  - [x] I have to select a component and then place the component, and then if I want to place another component I need to click that component on the left hand side again. We should consider making the selection persistent and entering a component placement mode.
  - [x] What about when I place a component and the pin intersects a wire or a terminal? I believe it should automatically connect. This would work well for NodeComponents as well as the other types. Currently it is cumbersome to place a component on an existing circuit because you have to delete a wire and then rebuild the connections
  - [x] When placing a component, I want to be able to hit the 'r' key to rotate it 90 degrees before placement
  - [ ] Keyboard shortcuts to component placement. I'm thinking we should bind the '/' key which brings up an inline component selector with quick search so you can hit '/' -> type "r" or "re" and components starting with r or re (such as resistor) will be in the list. Then it becomes super easy to not have to leave the circuit context

    **Proposed Implementation:**

    **Primary Shortcuts (Direct Access):**

    - **`/`** - Opens inline component selector with fuzzy search overlay
    - **`R`** - Quick place Resistor (most common component)
    - **`V`** - Quick place Voltage source
    - **`G`** - Quick place Ground
    - **`N`** - Quick place Node

    **Component Selector (`/` key) Features:**

    - Fuzzy search: Type "r" → shows Resistor, "res" → Resistor, "v" → Voltage source
    - Persistent placement mode: After selection, enters placement mode like current palette behavior
    - **Escape** to close selector and return to normal mode
    - **Enter** to confirm first match, **Arrow keys** to navigate results
    - **Tab** to cycle through available components
    - Semi-transparent overlay positioned at cursor/center of canvas

    **Integration with Existing System:**

    - Reuses current `interactionStore.setComponentToPlace()` system
    - Maintains existing placement behavior (rotation with R, persistent mode, auto-connect)
    - Works alongside existing component palette (both methods available)
    - Respects current escape handling and mode management

    **Enhanced Rotation Controls (during placement):**

    - **`R`** - Rotate clockwise (current behavior)
    - **`Shift+R`** - Rotate counter-clockwise (new enhancement)

- [ ] Current probe rendering isn't super intuitive (arrows positioned above readout boxes, complex positioning). Consider redesigning probe visualization for better user experience - perhaps inline arrows, cleaner layout, or probe-specific UI patterns.
- [ ] Add the ability to select a group of items in the canvas and save them as a reusable fragment / building block. This will eventually allow us to have user created components and logical sub-components where we don't necessarily need to represent everything on the circuit all the time visually if that makes sense.

### Phase 2: 📋 NEXT - Enhanced Simulation Features

**Goal:** Professional-grade simulation capabilities with rock-solid foundation

#### Critical Priority: Simulation Engine Overhaul

**Problem**: Current simulation engine has fundamental architectural flaws that prevent scaling to complex circuits:

1. **Wire Treatment Issues**: Wires defined with resistance properties but treated as perfect conductors in simulation
2. **Current Direction Problems**: Hardcoded assumptions about current flow break with complex topologies
3. **Multiple Voltage Source Limitation**: Artificial restriction prevents realistic circuit analysis
4. **Component-Specific Logic**: Separate loops for different components instead of unified approach

**Solution**: Complete simulation architecture rebuild with unified Modified Nodal Analysis (MNA) system:

- **Unified Component Stamping System**

  - Replace component-type specific loops with extensible stamping interfaces
  - Each component type implements `ComponentStamper` interface
  - Eliminates conditional logic based on component types
  - Supports easy addition of new component types

- **Proper Wire Resistance Handling**

  - Treat wires as resistive elements with configurable resistance (default: 1mΩ)
  - Participate fully in circuit equations rather than connectivity-only
  - Enable modeling of wire voltage drops and power dissipation

- **Multiple Voltage Source Support**

  - Remove artificial single voltage source limitation
  - Implement proper MNA stamping for multiple independent sources
  - Support realistic multi-rail power supply circuits

- **Robust Current Calculation**

  - Eliminate hardcoded current direction assumptions
  - Calculate currents directly from MNA solution for all components
  - Proper sign conventions based on circuit analysis theory

- **Extensible Component Registry**
  - Factory pattern for component stampers
  - Easy registration of new component types
  - Prepare foundation for AC analysis and reactive components

#### Scope Boundaries

**Educational-Appropriate Complexity** ✅

- Multiple voltage/current sources
- Reactive components (L, C)
- Basic semiconductor models (ideal diode, basic transistor)
- Frequency domain analysis
- Time domain simulation

**Too Complex for Educational Tool** ❌

- Dynamic thermal modeling with temperature-dependent resistance
- Parasitic extraction and electromagnetic field effects
- SPICE-level device modeling and manufacturing variations
- Advanced semiconductor physics modeling

#### Implementation Strategy

**Phase 2a: Foundation Rebuild** ✅ **COMPLETED**

- [x] Implement unified MNA stamping system
- [x] Add proper wire resistance handling in simulation
- [x] Remove multiple voltage source limitation
- [x] Fix current calculation logic
- [x] **CRITICAL BUG: Wire Branch Current Detection** ✅ **RESOLVED**
  - **Solution**: Implemented topology-based current analysis using series current conservation
  - **Key Insight**: Distinguished between electrical node equivalence and physical current paths
  - **Implementation**: Same-node wires use circuit topology analysis instead of MNA branch variables
  - **Result**: Wire currents now accurately reflect physical current flow (e.g., W4 shows correct 2.67mA)
  - **Architecture**: Prevented singular matrix issues while maintaining accurate current measurements
- [x] **Comprehensive Test Circuit System** ✅ **IMPLEMENTED**
  - **Architecture**: Created robust testing infrastructure with `TestCircuit` interface, `TestCircuitRunner` class, and `TestCircuitLibrary`
  - **Browser Console API**: Added `window.circuitTests` for easy developer testing and validation
  - **Test Cases**: Implemented regression tests including:
    - Simple Voltage Divider (basic nodal analysis validation)
    - Wire Current Detection Regression (specifically tests W4 wire current fix)
    - Dual Voltage Sources (multi-source circuit validation)
  - **Validation Features**: JSON-based circuit definitions, automated tolerance checking, detailed error reporting with percentage errors
  - **Integration**: Automatically loaded via `main.ts` with comprehensive documentation in `src/test-circuits/README.md`
  - **Results**: Confirmed fix success - Wire W4 now correctly shows 2mA instead of 0mA, all measurements match expected values

**Phase 2b: Enhanced Features** (After solid foundation)

- [ ] **Advanced Plotting System**

  - Integrate Chart.js for waveform visualization
  - Time-domain plotting with oscilloscope-style interface
  - Parameter sweep visualization
  - Export plot data (CSV, image)

- [ ] **Circuit Validation Engine**
  - Detect floating nodes and short circuits
  - Component limit checking (power dissipation, voltage ratings)
  - Visual error indicators and helpful messages
  - Simulation convergence monitoring

#### Secondary Features

- **Enhanced Measurement Tools**

  - Multi-channel oscilloscope interface
  - FFT analysis for frequency content
  - RMS and peak measurements
  - Cursor measurements on plots

- **Circuit Analysis Tools**
  - Operating point analysis display
  - Small-signal parameter extraction
  - Sensitivity analysis
  - Circuit performance metrics

### Phase 3: 📋 PLANNED - Advanced Components

- **Passive Components:** Capacitors, inductors, transformers
- **Semiconductor Devices:** Diodes, LEDs, basic transistors
- **AC Analysis:** Frequency response, Bode plots, impedance
- **Time-Domain Analysis:** Transient response, settling time

### Phase 4: 📋 FUTURE - Professional Features

- **Advanced Semiconductors:** Op-amps, MOSFETs, complex models
- **Digital Components:** Logic gates, flip-flops, counters
- **Mixed-Signal Analysis:** Combined analog/digital simulation
- **Educational Content:** Tutorials, guided exercises, explanations

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

### 1. Enhanced Plotting System (Priority: High)

- **Chart.js Integration:** Add charting library for data visualization
- **Oscilloscope Interface:** Time-domain waveform display
- **Plot Controls:** Zoom, pan, cursor measurements
- **Data Export:** CSV and image export capabilities

### 2. Circuit Validation

- **Error Detection:** Floating nodes, short circuits, convergence issues
- **Visual Feedback:** Error highlighting on canvas
- **User Guidance:** Helpful error messages and suggestions
- **Simulation Health:** Status indicators and warnings

### 3. Component Library Expansion

- **Capacitor Component:** With reactive impedance modeling
- **Inductor Component:** With inductive impedance
- **LED Component:** With forward voltage characteristics
- **Basic Op-Amp:** Ideal amplifier model

### 4. Testing Infrastructure (Priority: Medium)

- **Unit Tests:** Component behavior and simulation accuracy
- **E2E Tests:** User workflow validation
- **Performance Tests:** Large circuit handling
- **Regression Tests:** Feature stability

## Success Metrics

### Current Achievements

- ✅ Intuitive modeless interface requiring minimal learning
- ✅ Real-time DC simulation with live probe measurements
- ✅ Extensible architecture ready for complex components
- ✅ Professional canvas interaction (pan, zoom, multi-select)
- ✅ Robust component placement and wiring system

### Phase 2 Goals

- [ ] Professional oscilloscope-style measurement interface
- [ ] Comprehensive circuit validation and error reporting
- [ ] Expanded component library with AC-capable elements
- [ ] Performance handling of 50+ component circuits
- [ ] Educational content integration

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

---

_Last Updated: January 2025_  
_Project: Circuit Lab - Educational Circuit Simulator_  
_Status: **Phase 1.86 COMPLETED** - Professional Current Measurement System_  
_Next: **Phase 1.9** - UX Improvements_  
_Development Server: `npm run dev` → http://localhost:5173/_
