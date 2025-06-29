# Circuit Lab - Project Plan

## Overview

Building a web-based circuit simulation application focused on educational purposes and learning circuit design. The goal is to provide an interactive platform for understanding operational theory, analysis, and simulation of electronic circuits.

## Current Status

### ✅ COMPLETED - Core Foundation

**Interactive Circuit Building System**

- Component placement with always-visible categorized palette
- Modeless interaction with contextual actions (Ctrl+key wiring, spacebar+drag panning)
- Advanced canvas navigation with multi-select and grid snapping
- Professional IEEE-standard schematic symbols for all components

**DC Circuit Simulation Engine**

- Real-time Modified Nodal Analysis (MNA) with live measurements
- Professional floating node detection with GMIN stabilization
- Voltage/current probe system with physical current direction visualization
- Multi-ground circuit support for isolated circuit analysis

**Complete Component Library**

- **Linear Components**: Resistors, voltage sources, current sources, switches, potentiometers, variable resistors
- **Non-linear Components**: Diodes and LEDs with intelligent parameter scaling
- **Connection Components**: Wires, nodes, ground symbols
- **Measurement Tools**: Voltage and current probes with directional indicators

**Advanced Simulation Features**

- Load line intersection solver for non-linear components (eliminates Newton-Raphson oscillations)
- Parameter independence with component-specific electrical behavior
- Real-time/manual simulation toggle for interactive learning
- Comprehensive circuit validation with educational error feedback

**Professional UI System**

- **Design System Complete**: Tailwind CSS-based professional interface with circuit-specific design tokens
- **IDE Layout**: Full `.ide-layout` system with resizable panels, component palette, and properties panel
- **Custom HD Cursors**: Professional Lucide-based cursors for circuit simulation interactions
- **Responsive Design**: Mobile-optimized with collapsible panels and touch-friendly controls

### ✅ COMPLETED - Modular Architecture & Analysis

**Modular Stamper Architecture**

- ✅ **Complete Stamper System**: 9 linear stampers + 2 non-linear stampers
- ✅ **Factory Pattern**: ComponentStamperFactory with clean registration system
- ✅ **Full Test Coverage**: 280/280 tests passing with comprehensive validation
- ✅ **Professional Organization**: Separated linear/nonlinear with shared interfaces

**Interactive Parameter Analysis**

- ✅ **Parameter Sweep System**: Real-time component value sweeps with live plotting
- ✅ **Professional Chart.js Integration**: AnalysisChart.vue with engineering units and export capabilities
- ✅ **Multiple Analysis Outputs**: Voltage, current, power measurements with statistical analysis
- ✅ **Export Features**: CSV data export and PNG image export for analysis results

**Enhancement Opportunities**

- Multi-parameter sweeps (currently single parameter)
- Additional analysis types (temperature effects, statistical analysis)
- Advanced visualization options (3D plots, contour maps)

## Development Roadmap

### Phase 3: 🚧 NEXT PRIORITY - AC Analysis & Reactive Components

**Core AC Analysis Features**

- **Reactive Components**: Capacitor and inductor components with frequency-dependent impedance
- **Complex Number MNA**: Extended MNA system for frequency domain analysis with complex voltages/currents
- **AC Sources**: AC voltage/current sources with amplitude, frequency, and phase support
- **Frequency Response**: Bode plot generation and transfer function analysis

**Implementation Phases**

1. **Reactive Components Foundation**

   - CapacitorComponent.vue and InductorComponent.vue following established patterns
   - CapacitorStamper.ts and InductorStamper.ts with frequency-dependent impedance
   - Component property panels for capacitance/inductance values
   - Professional capacitor and inductor symbols

2. **Complex MNA System**

   - Extend existing MNA solver to support complex number matrices
   - Frequency-dependent stamping for reactive components: Z_C = 1/(jωC), Z_L = jωL
   - AC analysis result structure with complex voltages and currents
   - Frequency sweep controller with logarithmic and linear spacing

3. **AC Analysis Visualization**
   - Extend AnalysisChart.vue for frequency response plotting
   - Bode plots with magnitude (dB) and phase (degrees) display
   - Phasor diagram visualization for AC steady-state analysis
   - Filter response characterization (low-pass, high-pass, band-pass)

**Educational Features**

- Interactive frequency response visualization with cursor readouts
- Phasor diagrams showing phase relationships between voltages and currents
- Filter analysis tools for educational circuit analysis
- Real-time impedance calculations and display

### Phase 4: 📋 PLANNED - Advanced Components & Transistor Models

**Semiconductor Components**

- BJT and MOSFET transistor models using proven load line intersection approach
- Operating point (Q-point) analysis with educational visualization
- Basic amplifier circuit support (common emitter/source configurations)

**Enhanced Models**

- Temperature effects and parasitic modeling
- Enhanced component libraries with realistic behavior
- Advanced measurement and analysis capabilities

### Phase 5: 📋 FUTURE - Professional Features & Mixed-Signal

**Advanced Simulation**

- Time-domain transient analysis
- Statistical analysis with Monte Carlo simulation
- Digital logic components and mixed-signal analysis

**Professional Tools**

- Advanced plotting and visualization suite
- Circuit optimization and design centering
- Collaboration features and circuit sharing

## Technical Architecture

### Current Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Canvas**: Konva.js with vue-konva integration
- **State Management**: Pinia stores
- **Simulation**: Pure MNA implementation with load line intersection solver
- **Styling**: Tailwind CSS with professional circuit-specific design tokens
- **Charts**: Chart.js integration with engineering units and real-time updates

### Key Architectural Principles

**Pure MNA Implementation**

- All passive components use G-matrix stamping for consistent physics
- Only voltage sources add branch current variables
- Current sources use RHS injection for known currents

**Load Line Intersection Approach**

- Complex I-V models for educational analysis and visualization
- Simple linear equivalent circuits for MNA stability
- Eliminates Newton-Raphson oscillations while maintaining accuracy

**Modular Component System**

```
src/services/stampers/
├── shared.ts                  # Core interfaces & base classes
├── linear/                    # Linear component stampers (9 complete)
├── nonlinear/                 # Non-linear component stampers (2 complete)
├── ComponentStamperFactory.ts # Centralized stamper creation
└── index.ts                   # Clean public API
```

**Professional Design System**

```
src/assets/main-new.css        # Circuit-specific design tokens
src/components/design-system/  # Comprehensive design system demo
- IDE layout patterns (.ide-layout, .component-palette, .properties-panel)
- Circuit semantic colors (voltage-red, current-blue, resistance-purple)
- Professional measurement displays with engineering units
- Custom HD cursors for circuit simulation interactions
```

## Success Metrics

### Current Achievements

- ✅ 100% test success rate (280/280 tests passing)
- ✅ Complete DC simulation capability with all fundamental components
- ✅ Professional schematic symbols following IEEE standards
- ✅ Robust non-linear component handling with load line intersection
- ✅ Educational-focused interface with real-time parameter feedback
- ✅ Professional UI system with responsive design and accessibility
- ✅ Modular stamper architecture for maintainability and extensibility

### Next Phase Goals

- [ ] AC analysis foundation with capacitors and inductors
- [ ] Complex number MNA system for frequency domain analysis
- [ ] Bode plot generation and frequency response visualization
- [ ] Phasor diagram display for AC steady-state analysis

### Long-term Vision

- [ ] Complete analog simulation suite with AC and transient analysis
- [ ] Semiconductor device library with transistors and op-amps
- [ ] Mixed-signal capability with digital components
- [ ] Educational platform with guided learning and collaboration

## Technical Resources

- [Vue 3 Composition API](https://vuejs.org/guide/composition-api.html)
- [Konva.js Canvas Library](https://konvajs.org/)
- [Modified Nodal Analysis](https://en.wikipedia.org/wiki/Modified_nodal_analysis)
- [SPICE Circuit Simulation](https://ngspice.sourceforge.io/)
- [Chart.js Visualization](https://www.chartjs.org/)
- [Tailwind CSS Design System](https://tailwindcss.com/)
- [Educational Circuit References](https://www.allaboutcircuits.com/)
