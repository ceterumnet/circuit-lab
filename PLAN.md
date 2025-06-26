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

## Development Roadmap

### Phase 1: ✅ COMPLETED - DC Circuit Foundation

Complete interactive DC circuit simulation with all fundamental components and professional-grade analysis capabilities.

### Phase 2: 📋 CURRENT FOCUS - Code Quality & Advanced Analysis

**Immediate Priorities:**

1. ✅ **Complete Stamper Architecture Refactoring** - Move all component stampers to modular files and ensure full test coverage
2. 🚧 **Interactive Parameter Analysis** - Real-time parameter sweeps with graphing capabilities
3. **Advanced Measurement Tools** - Enhanced probe system with statistical analysis

**Current Work:**

- ✅ Modular stamper architecture for maintainability (9/11 stampers tested)
- 🚧 Interactive parameter analysis with real-time plotting system
- Parameter study tools for educational circuit analysis

### Phase 3: 📋 PLANNED - AC Analysis & Reactive Components

**Core AC Analysis Features**

- Capacitor and inductor components with frequency-dependent impedance
- Complex number MNA system for frequency domain analysis
- AC voltage/current sources with phase support
- Basic Bode plot generation and transfer function analysis

**Educational Features**

- Interactive frequency response visualization
- Phasor diagrams and impedance analysis
- Filter response characterization tools

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
- **Simulation**: Custom Pure MNA implementation with load line intersection solver
- **Styling**: Scoped CSS with professional component styling

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
├── linear/                    # Linear component stampers
├── nonlinear/                 # Non-linear component stampers
├── ComponentStamperFactory.ts # Centralized stamper creation
└── index.ts                   # Clean public API
```

## Success Metrics

### Current Achievements

- ✅ 100% test success rate (170/170 tests passing)
- ✅ Complete DC simulation capability with all fundamental components
- ✅ Professional schematic symbols following IEEE standards
- ✅ Robust non-linear component handling with load line intersection
- ✅ Educational-focused interface with real-time parameter feedback

### Next Phase Goals

- [ ] Complete modular stamper architecture for maintainability
- [ ] Interactive parameter analysis with professional plotting
- [ ] AC analysis foundation with reactive components
- [ ] Advanced measurement and visualization tools

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
- [Educational Circuit References](https://www.allaboutcircuits.com/)
