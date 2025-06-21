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

### Phase 1.9: UX improvements

- [x] Add basic save / load circuits from browser store
- [x] Add rotation handle to components when selected so they can be directly rotated
- [ ] Implement Copy and Paste for single and multiple selected components. We will have to deal with things like labels and IDs.
- [x] Undo / Redo
- [x] It is a pain every time I need to create a bunch of components to do regression and validation. We either need:

  - [ ] an E2E test for things (skipped for this phase. will address later)
  - [x] have some canned circuits (only basic tests)
  - [x] implement a save feature so that I don't have to keep redoing circuits

- [x] Component placement:

  - [x] I have to select a component and then place the component, and then if I want to place another component I need to click that component on the left hand side again. We should consider making the selection persistent and entering a component placement mode.
  - [x] What about when I place a component and the pin intersects a wire or a terminal? I believe it should automatically connect. This would work well for NodeComponents as well as the other types. Currently it is cumbersome to place a component on an existing circuit because you have to delete a wire and then rebuild the connections
  - [x] When placing a component, I want to be able to hit the 'r' key to rotate it 90 degrees before placement
  - [x] Keyboard shortcuts to component placement. I'm thinking we should bind the '/' key which brings up an inline component selector with quick search so you can hit '/' -> type "r" or "re" and components starting with r or re (such as resistor) will be in the list. Then it becomes super easy to not have to leave the circuit context

- [ ] Current probe rendering isn't super intuitive (arrows positioned above readout boxes, complex positioning). Consider redesigning probe visualization for better user experience - perhaps inline arrows, cleaner layout, or probe-specific UI patterns.
- [ ] Add the ability to select a group of items in the canvas and save them as a reusable fragment / building block. This will eventually allow us to have user created components and logical sub-components where we don't necessarily need to represent everything on the circuit all the time visually if that makes sense.

### Phase 2: 📋 NEXT - AC Analysis & Reactive Components

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
