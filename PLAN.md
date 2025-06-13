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

### Phase 1 - Basic Circuit Elements

**Goal**: Foundation with simple DC circuits

- [x] Basic project structure and component types
- [x] Voltage sources (DC, AC, pulse) - UI components created
- [x] Resistors with value editing - UI components created
- [x] Ground components
- [x] Component toolbar for selection and placement
- [x] Basic circuit canvas (placeholder implementation)
- [x] Component properties panel
- [x] State management with Pinia store
- [ ] Wire connections
- [ ] Basic plotting of voltage/current vs time
- [ ] Basic Ohm's law calculations
- [ ] Drag-and-drop functionality with Konva canvas

### Phase 2 - Passive Components

**Goal**: AC analysis and energy storage elements

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

- **Circuit Drawing**: Konva.js or Fabric.js for interactive canvas
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
│   ├── circuit/          # Circuit drawing and interaction
│   ├── simulation/       # Simulation engine components
│   ├── plotting/         # Waveform and analysis plots
│   └── ui/              # Common UI components
├── core/
│   ├── simulation/       # Core simulation algorithms
│   ├── circuit/         # Circuit model and analysis
│   └── math/            # Mathematical utilities
├── stores/              # Pinia stores for state management
├── views/               # Main application views
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

### ✅ Completed (Phase 1 Foundation)

#### Project Setup & Architecture

- [x] Vue 3 + TypeScript + Vite project initialized
- [x] Konva.js and vue-konva installed for canvas interactions
- [x] Clean application layout focused on circuit editor
- [x] Router setup with circuit editor as default route

#### Type System & Data Models

- [x] TypeScript interfaces for all circuit components:
  - `CircuitComponent` base interface
  - `Resistor`, `VoltageSource`, `Ground` specific types
  - `Position`, `ComponentValue` utility types
  - `SimulationResult` and `Circuit` container types
- [x] Component type enumeration with extensible design

#### State Management

- [x] Pinia store (`useCircuitStore`) with complete API:
  - Component CRUD operations (add, remove, update, select)
  - Circuit management (clear, load, save state)
  - Component ID generation system
  - Selection management
  - Mock simulation state handling

#### UI Components Built

- [x] **CircuitEditor.vue** - Main application view
- [x] **ComponentToolbar.vue** - Tool selection and actions sidebar
- [x] **ComponentProperties.vue** - Dynamic property editing panel
- [x] **CircuitCanvas.vue** - Canvas wrapper (placeholder implementation)
- [x] **CircuitComponent.vue** - Component renderer dispatcher

#### Visual Component Implementations

- [x] **ResistorComponent.vue** - Zigzag resistor symbol with terminals
- [x] **VoltageSourceComponent.vue** - Circle with +/- symbols and terminals
- [x] **GroundComponent.vue** - Standard ground symbol with terminal

#### Features Working

- [x] Component placement by tool selection + canvas click
- [x] Component selection and highlighting
- [x] Dynamic property editing (resistance values, voltage, units)
- [x] Component deletion
- [x] Real-time component count display
- [x] Simulation status indicators
- [x] Component list view with selection

### 🚧 In Progress / Next Up

#### Immediate Next Steps (Current Phase 1)

- [ ] **Replace placeholder canvas with Konva implementation**

  - Integrate `CircuitCanvas.vue` with actual Konva components
  - Enable visual component rendering on canvas
  - Implement grid snapping and visual feedback

- [ ] **Drag & Drop Functionality**

  - Mouse-based component movement
  - Visual feedback during dragging
  - Collision detection and constraints

- [ ] **Wire Connection System**
  - Terminal-to-terminal wire drawing
  - Visual wire representation
  - Connection validation

#### Basic Simulation Engine

- [ ] **DC Circuit Analysis**
  - Node voltage calculation
  - Current flow computation
  - Basic Ohm's law implementation
  - Voltage divider analysis

### 📋 Remaining Phase 1 Tasks

1. **Canvas Integration** (Priority: High)

   - Replace `canvas-placeholder` with actual Konva stage
   - Fix component rendering on canvas
   - Implement visual component dragging

2. **Wire Connections** (Priority: High)

   - Terminal identification and highlighting
   - Wire drawing between terminals
   - Connection state management

3. **Basic Simulation** (Priority: Medium)

   - Simple DC analysis for resistor networks
   - Voltage/current calculations
   - Results display

4. **Basic Plotting** (Priority: Low)
   - Voltage vs position plots
   - Current flow visualization
   - Simple bar charts for component values

### 📝 Development Notes

#### Architecture Decisions Made

- **Component System**: Modular design with separate visual components for each circuit element
- **State Management**: Centralized Pinia store with reactive updates
- **Canvas Strategy**: Konva.js for interactive 2D graphics (installed but not yet integrated)
- **Styling**: Custom CSS with clean, professional appearance
- **Type Safety**: Comprehensive TypeScript coverage for all circuit data

#### Code Quality

- ✅ ESLint configuration active and errors resolved
- ✅ Consistent Vue 3 Composition API usage
- ✅ Proper TypeScript typing throughout
- ✅ Modular component architecture
- ✅ Clean separation of concerns

#### Testing Setup

- ✅ Vitest configured for unit testing
- ✅ Cypress configured for e2e testing
- [ ] Actual tests written (TODO)

### 🎯 Week-by-Week Plan (Updated)

1. **This Week**: Complete Konva canvas integration and drag & drop
2. **Next Week**: Wire connection system and terminal management
3. **Week 3**: Basic DC simulation engine (Ohm's law, voltage dividers)
4. **Week 4**: Simple plotting and visualization of results

## Resources & References

- [EEcircuit Repository](https://github.com/eelab-dev/EEcircuit)
- [ngspice Documentation](https://ngspice.sourceforge.io/docs.html)
- [SPICE Circuit Simulation](https://en.wikipedia.org/wiki/SPICE)
- [Electronic Circuit Analysis](https://www.allaboutcircuits.com/)

---

## 📸 Current Screenshot Status

**Application Layout**: ✅ Clean, professional interface
**Component Toolbar**: ✅ Working with Resistor, Voltage Source, Ground tools
**Canvas Area**: ⚠️ Placeholder implementation (needs Konva integration)
**Property Panel**: ✅ Dynamic editing for selected components
**Navigation**: ✅ Circuit editor as default route

**Demo Instructions**:

1. Navigate to `http://localhost:5173/` (auto-redirects to circuit editor)
2. Select a component tool from the left sidebar
3. Click on the canvas area to place components
4. Click on components in the list to select and edit properties
5. Use delete buttons to remove components

---

_Last Updated: January 2025_
_Project: Circuit Lab - Educational Circuit Simulator_
_Status: Phase 1 Foundation Complete - Ready for Konva Canvas Integration_
