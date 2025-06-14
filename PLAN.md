# Circuit Lab - Project Plan

## Overview

Building a web-based circuit simulation application focused on educational purposes and learning circuit design. The goal is to provide an interactive platform for understanding operational theory, analysis, and simulation of electronic circuits.

## Research Findings - Existing Libraries/Frameworks

### Top Recommendations

1. **EEcircuit (formerly EEsim.dev)** ⭐ Most Promising

   - Browser-based SPICE simulator using WebAssembly
   - Built with TypeScript/Vue-compatible stack
   - Uses ngspice engine compiled to WebAssembly
   - Excellent plotting with webgl-plot
   - MIT licensed
   - Repository: https://github.com/eelab-dev/EEcircuit
   - Live demo: https://eecircuit.com

2. **ngspicejs** - JavaScript frontend to ngspice

   - More programmatic approach
   - Extensive examples and documentation
   - Built for educational purposes
   - Repository: https://github.com/dvhx/ngspicejs

3. **SimcirJS** - Lightweight HTML5/JavaScript simulator
   - Good for digital logic circuits
   - Easy to embed and customize
   - JSON-based circuit descriptions
   - Demo: https://kazuhikoarase.github.io/simcirjs/

### Other Notable Options

- **Falstad Circuit Simulator** (JavaScript port available)
- **Maxwell** - Simple educational circuit simulator
- **CircuitLab** (commercial but has good educational features)

## Development Phases

### Phase 1 - Basic Circuit Elements ✅ COMPLETED

**Goal**: Foundation with simple DC circuits

- [x] Basic project structure and component types
- [x] Voltage sources (DC, AC, pulse) - UI components created
- [x] Resistors with value editing - UI components created
- [x] Ground components
- [x] Component toolbar for selection and placement
- [x] Basic circuit canvas with Konva integration
- [x] Component properties panel
- [x] State management with Pinia store
- [x] Wire connections with drag-to-connect functionality
- [x] Node system for circuit junctions
- [x] Drag-and-drop functionality with Konva canvas
- [x] Component rotation support
- [x] Visual feedback during wire creation
- [x] Complex circuit topology support (voltage dividers, etc.)

### Phase 2 - Passive Components

**Goal**: AC analysis and energy storage elements

- [ ] Basic plotting of voltage/current vs time
- [ ] Basic Ohm's law calculations
- [ ] Capacitors and inductors
- [ ] AC analysis (frequency response)
- [ ] Bode plots
- [ ] RLC circuits
- [ ] Time-domain analysis
- [ ] Impedance calculations

### Phase 3 - Active Components

**Goal**: Semiconductor devices and amplification

- [ ] Diodes and LEDs
- [ ] Basic transistors (BJT, MOSFET)
- [ ] Op-amps
- [ ] Simple amplifier circuits
- [ ] Small-signal analysis
- [ ] Biasing circuits

### Phase 4 - Advanced Features

**Goal**: Digital integration and advanced analysis

- [ ] Digital components (gates, flip-flops)
- [ ] Mixed-signal simulation
- [ ] Oscilloscope-style measurements
- [ ] Circuit optimization tools
- [ ] Parameter sweeping
- [ ] Monte Carlo analysis

### Phase 5 - Educational Features

**Goal**: Learning and teaching tools

- [ ] Interactive tutorials
- [ ] Guided circuit design exercises
- [ ] Component explanations and tooltips
- [ ] Circuit analysis explanations
- [ ] Save/share circuits
- [ ] Circuit library/examples

## Technical Stack

### Core Framework

- **Frontend**: Vue 3 + TypeScript + Vite ✅ (already set up)
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm

### Visualization & Interaction

- **Circuit Drawing**: Konva.js ✅ (fully integrated with interactive canvas)
- **Plotting**: Chart.js or D3.js for waveforms and analysis plots
- **UI Components**: Consider Vuetify or PrimeVue for component library
- **Styling**: Tailwind CSS for rapid UI development

### Simulation Engine Options

1. **Phase 1**: Pure JavaScript implementation (simple resistive circuits)
2. **Phase 2**: Consider integrating with existing JS libraries
3. **Phase 3**: WebAssembly implementation (compile ngspice or custom engine)

### Additional Libraries

- **Math**: Math.js for expression parsing and calculations
- **File Handling**: For import/export of circuit files
- **Testing**: Vitest (already configured)

## Architecture Strategy

### Development Approach

1. **Start Simple**: Build basic voltage divider calculator first
2. **Incremental Complexity**: Each feature builds on previous ones
3. **Educational Focus**: Add explanations and guided learning
4. **Interactive Design**: Real-time parameter adjustment with visual feedback

### Code Organization

```
src/
├── components/
│   ├── circuit/          # Circuit drawing and interaction ✅
│   ├── simulation/       # Simulation engine components
│   ├── plotting/         # Waveform and analysis plots
│   └── ui/              # Common UI components
├── core/
│   ├── simulation/       # Core simulation algorithms
│   ├── circuit/         # Circuit model and analysis
│   └── math/            # Mathematical utilities
├── stores/              # Pinia stores for state management ✅
├── views/               # Main application views ✅
└── utils/               # Utility functions
```

### Key Features to Prioritize

1. **Real-time Simulation**: Updates as user modifies circuit
2. **Visual Feedback**: Color-coded voltages, animated current flow
3. **Educational Content**: Tooltips, explanations, tutorials
4. **Responsive Design**: Works on desktop and tablets
5. **Shareable Circuits**: URL-based circuit sharing

## Learning Objectives

### For Users

- Understand Ohm's law and basic circuit analysis
- Learn about frequency response and AC circuits
- Explore transistor behavior and amplifier design
- Practice digital logic design
- Gain intuition about circuit behavior through visualization

### For Development Team

- Circuit simulation algorithms
- WebAssembly integration
- Advanced canvas manipulation
- Mathematical modeling of electronic components
- Educational software design principles

## Success Metrics

### Short-term (3-6 months)

- Basic resistive circuit simulation working
- Clean, intuitive user interface
- At least 10 example circuits
- Basic plotting functionality

### Medium-term (6-12 months)

- AC analysis capabilities
- Active components (diodes, transistors)
- Educational content and tutorials
- Community sharing features

### Long-term (1+ years)

- Full-featured SPICE-level simulation
- Digital circuit support
- Advanced analysis tools
- Established user community

## Current Progress Status

### ✅ Completed (Phase 1 - Circuit Foundation)

#### Project Setup & Architecture

- [x] Vue 3 + TypeScript + Vite project initialized
- [x] Konva.js and vue-konva fully integrated for interactive canvas
- [x] Clean application layout focused on circuit editor
- [x] Router setup with circuit editor as default route

#### Advanced Circuit Interaction System

- [x] **Drag-to-Connect Wire System**: Complete replacement of click-to-connect with intuitive drag-and-drop
  - Drag from any terminal to any other terminal to create connections
  - Drag from terminal to empty space to create free-form wires with automatic nodes
  - Visual feedback during drag operations (green terminals, preview lines)
  - Proper handling of rotated components with rotation-aware terminal positioning

#### Node System & Circuit Junctions

- [x] **Unified Component Architecture**: Nodes implemented as regular components with single terminals
  - Consistent terminal-based connection system across all components
  - Automatic node creation when dragging wires to empty space
  - Manual node placement via Node tool in toolbar
  - Support for complex circuit topologies (voltage dividers, multi-point connections)

#### Component System & Rotation

- [x] **Component Rotation Support**: All components can be rotated with proper terminal positioning
  - Rotation-aware wire connections that follow rotated components
  - Fixed double-rotation bug in terminal positioning calculations
  - Proper drag start positions for rotated component terminals

#### Type System & Data Models

- [x] **Comprehensive TypeScript Architecture**:
  - `CircuitComponent` base interface with rotation support
  - `Resistor`, `VoltageSource`, `Ground`, `CircuitNode` specific types
  - `Wire` interface with flexible connection options (terminal-to-terminal, terminal-to-position)
  - `Position`, `ComponentValue` utility types
  - `SimulationResult` and `Circuit` container types

#### State Management

- [x] **Advanced Pinia Store** (`useCircuitStore`) with complete wire management:
  - Component CRUD operations with rotation support
  - Drag connection state management with visual preview
  - Wire creation and management (terminal-to-terminal, free-form)
  - Node creation and positioning with grid snapping
  - Terminal world position calculations with rotation handling
  - Component selection and property management

#### UI Components Built

- [x] **CircuitEditor.vue** - Main application view with full interaction support
- [x] **ComponentToolbar.vue** - Tool selection including Node tool
- [x] **ComponentProperties.vue** - Dynamic property editing with rotation controls
- [x] **CircuitCanvas.vue** - Full Konva integration with drag handling
- [x] **CircuitComponent.vue** - Component renderer with drag and terminal events
- [x] **CircuitTerminal.vue** - Interactive terminal component with drag support

#### Visual Component Implementations

- [x] **ResistorComponent.vue** - Zigzag resistor with draggable terminals
- [x] **VoltageSourceComponent.vue** - Circle with +/- symbols and draggable terminals
- [x] **GroundComponent.vue** - Standard ground symbol with draggable terminal
- [x] **NodeComponent.vue** - Small circle junction point with single terminal
- [x] **WireComponent.vue** - Dynamic wire rendering with real-time position updates

#### Advanced Features Working

- [x] **Interactive Circuit Building**:

  - Component placement by tool selection + canvas click
  - Drag-and-drop component movement with grid snapping
  - Drag-to-connect wire creation between any terminals
  - Automatic node creation for circuit junctions
  - Component rotation with proper wire following
  - Component selection and highlighting
  - Dynamic property editing (resistance, voltage, rotation)
  - Component deletion with wire cleanup

- [x] **Visual Feedback System**:
  - Terminal highlighting during drag operations
  - Wire preview lines during connection creation
  - Component selection indicators
  - Grid snapping visual feedback
  - Real-time wire position updates when components move

### 🚧 Next Phase - Basic Simulation Engine

#### Immediate Next Steps (Phase 2 Start)

- [ ] **DC Circuit Analysis Engine**

  - Node voltage calculation using modified nodal analysis
  - Current flow computation through components
  - Basic Ohm's law implementation for resistor networks
  - Voltage divider analysis and verification

- [ ] **Simulation Results Display**

  - Voltage and current value overlays on components
  - Simple bar charts or numeric displays
  - Real-time updates as circuit is modified
  - Error handling for invalid circuits (shorts, open circuits)

- [ ] **Basic Plotting System**
  - Voltage vs position plots for resistor networks
  - Current flow visualization
  - Component value charts
  - Integration with Chart.js or similar library

### 📋 Remaining Phase 2 Tasks

1. **Circuit Analysis** (Priority: High)

   - Implement modified nodal analysis algorithm
   - Handle ground reference and floating nodes
   - Calculate steady-state DC solutions

2. **Results Visualization** (Priority: High)

   - Overlay voltage/current values on circuit
   - Color-coded voltage levels
   - Current flow direction indicators

3. **Plotting Integration** (Priority: Medium)

   - Add Chart.js or D3.js for data visualization
   - Create voltage/current vs time plots
   - Parameter sweep visualization

4. **Circuit Validation** (Priority: Medium)
   - Detect and handle circuit errors
   - Validate component connections
   - Provide helpful error messages

### 📝 Development Notes

#### Architecture Decisions Made

- **Unified Component System**: All components (including nodes) use consistent terminal-based connections
- **Drag-to-Connect**: Intuitive wire creation replacing complex multi-click workflows
- **Rotation Support**: Full rotation handling with proper terminal positioning calculations
- **Real-time Updates**: Wires dynamically follow components as they move
- **Grid Snapping**: Consistent 20px grid for clean circuit layouts

#### Key Technical Achievements

- **Solved Double-Rotation Bug**: Fixed terminal positioning for rotated components
- **Unified Node Architecture**: Nodes as regular components with terminals (not special cases)
- **Dynamic Wire Positioning**: Wires calculate positions in real-time from component positions
- **Comprehensive Drag System**: Full drag-and-drop for both components and wire creation

#### Code Quality

- ✅ ESLint configuration active (only unrelated config errors remain)
- ✅ Consistent Vue 3 Composition API usage throughout
- ✅ Comprehensive TypeScript typing with no 'any' types
- ✅ Modular component architecture with clear separation
- ✅ Memory system for preserving architectural decisions

#### Testing Setup

- ✅ Vitest configured for unit testing
- ✅ Cypress configured for e2e testing
- [ ] Comprehensive test suite (TODO for Phase 2)

### 🎯 Updated Development Roadmap

**Phase 1**: ✅ **COMPLETE** - Interactive Circuit Building

- Full drag-to-connect wire system
- Node-based circuit junctions
- Component rotation and movement
- Visual feedback and grid snapping

**Phase 2**: 🚧 **STARTING** - Basic Simulation Engine

- DC circuit analysis (modified nodal analysis)
- Voltage/current calculation and display
- Basic plotting and visualization
- Circuit validation and error handling

**Phase 3**: 📋 **PLANNED** - Advanced Components

- Capacitors and inductors
- AC analysis capabilities
- Time-domain simulation
- Frequency response analysis

## Resources & References

- [EEcircuit Repository](https://github.com/eelab-dev/EEcircuit)
- [ngspice Documentation](https://ngspice.sourceforge.io/docs.html)
- [SPICE Circuit Simulation](https://en.wikipedia.org/wiki/SPICE)
- [Electronic Circuit Analysis](https://www.allaboutcircuits.com/)
- [Modified Nodal Analysis](https://en.wikipedia.org/wiki/Modified_nodal_analysis)

---

## 📸 Current Application Status

**Application Layout**: ✅ Professional interface with full Konva integration
**Component Toolbar**: ✅ Complete with Resistor, Voltage Source, Ground, Node, Wire tools
**Interactive Canvas**: ✅ Full drag-and-drop with wire creation and component movement
**Property Panel**: ✅ Dynamic editing including rotation controls
**Wire System**: ✅ Drag-to-connect with automatic node creation
**Circuit Junctions**: ✅ Node-based junction system supporting complex topologies

**Demo Instructions**:

1. Navigate to `http://localhost:5176/` (circuit editor)
2. Select component tools and click to place on canvas
3. Drag components to move them around (with grid snapping)
4. Drag from any terminal to another terminal to create wires
5. Drag from terminal to empty space to create wire + automatic node
6. Use Node tool to manually place junction points
7. Rotate components using property panel
8. Build complex circuits like voltage dividers with multiple connection points

**Key Features Demonstrated**:

- Intuitive drag-to-connect wire creation
- Automatic junction node creation
- Component rotation with proper wire following
- Real-time wire position updates
- Grid snapping and visual feedback
- Complex circuit topology support

---

_Last Updated: January 2025_
_Project: Circuit Lab - Educational Circuit Simulator_
_Status: Phase 1 Complete - Advanced Circuit Building System Implemented_
_Next: Phase 2 - Basic DC Simulation Engine_
