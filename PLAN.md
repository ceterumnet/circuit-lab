# Circuit Lab - Project Plan

## Recent Changes

- BJT foundation completed with both NPN and PNP transistor support, including critical fixes to bias resistance and cutoff thresholds for accurate active-region operation
- Current probe arrow visualization corrected to follow actual wire geometry and physical current flow direction
- Chart component inconsistencies resolved by consolidating all analysis views onto the established AnalysisChart.vue component

---

## Overview

Building a web-based circuit simulation application focused on educational purposes and learning circuit design. The goal is to provide an interactive platform for understanding operational theory, analysis, and simulation of electronic circuits.

## Coding standards:

- Always use the design system for colors, fonts, etc.
- Always use the design system for icons.
- Always use the design system for layout.
- Always use the design system for typography.
- Always use the design system for spacing.
- Always use the design system for shadows.
- Always use the design system for borders.
- You can see its reference in src/components/DesignSystemDemo.vue

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

- **Linear Components**: Resistors, voltage sources, current sources, switches, potentiometers, variable resistors, capacitors, inductors
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

- ✅ **Complete Stamper System**: 11 linear stampers + 2 non-linear stampers
- ✅ **Factory Pattern**: ComponentStamperFactory with clean registration system
- ✅ **Full Test Coverage**: 302/302 tests passing with comprehensive validation
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

**Enhanced Current Flow Visualization (Future)**

Advanced visualization enhancements for orientation-independent current flow understanding:

- **Animated Flow Indicators**: Moving dots/pulses along wires showing current direction and magnitude
  - Speed proportional to current magnitude using logarithmic scaling
  - Color-coded for different current ranges (low/medium/high)
  - Toggleable for focused learning vs. clean interface
- **Color-Coded Flow Gradients**: Gradient coloring along wires from start to end
  - Start/end colors indicate current direction (red→blue for positive flow)
  - Intensity proportional to current magnitude
  - Subtle educational indicator without visual clutter
- **Contextual Component Indicators**: Current flow visualization relative to component function
  - Voltage sources: "sourcing" vs "sinking" current with appropriate visual cues
  - Resistors: "consuming" power with heat-map style visualization
  - Diodes: "conducting" vs "blocking" with forward/reverse indicators
  - Educational context helps students understand current's role in circuit function
- **Smart Teaching Mode**: Hybrid approach combining multiple visualization techniques
  - Wire-aligned arrows (current implementation) for physical accuracy
  - Contextual coloring based on current magnitude and electrical role
  - Optional animated flow for educational demonstrations
  - User-selectable visualization intensity (minimal, standard, teaching)
- **Multi-Modal Current Display**: Different visualization modes for different learning objectives
  - **Physical Mode**: Wire-aligned arrows showing actual current paths
  - **Functional Mode**: Component-centric display showing electrical roles
  - **Educational Mode**: Enhanced animations and contextual information
  - **Minimal Mode**: Clean interface with subtle current indicators

## Development Roadmap

### ✅ COMPLETED - Phase 3: AC Analysis & Reactive Components

**Core AC Analysis Features**

- ✅ **Reactive Components**: Capacitor and inductor components with frequency-dependent impedance
- ✅ **Complex Number MNA**: Extended MNA system for frequency domain analysis with complex voltages/currents
- ✅ **AC Sources**: AC voltage/current sources with amplitude, frequency, and phase support
- ✅ **Frequency Response**: Professional AC analysis with Bode plot generation using AnalysisChart.vue

**Implementation Phases**

1. ✅ **Reactive Components Foundation - COMPLETED**

    - ✅ CapacitorComponent.vue and InductorComponent.vue following established patterns
    - ✅ CapacitorStamper.ts and InductorStamper.ts with frequency-dependent impedance
    - ✅ Component property panels for capacitance/inductance values
    - ✅ Professional capacitor and inductor symbols with custom icons

2. ✅ **Complex MNA System - COMPLETED**

    - ✅ Extended MNA solver with ComplexMNASolver for complex number matrices
    - ✅ Complex number mathematics foundation with full arithmetic operations
    - ✅ ComplexMatrix class with MNA-compatible operations and mathjs integration
    - ✅ Complex impedance calculations: Z_C = 1/(jωC), Z_L = jωL with frequency dependency
    - ✅ AC analysis result structures with complex voltages and currents
    - ✅ Frequency sweep infrastructure with logarithmic and linear spacing
    - ✅ **Validation Complete**: 10/10 tests passing - complex arithmetic, impedance calculations, and AC solver

3. ✅ **AC Sources Implementation - COMPLETED**

    - ✅ AC Voltage Source with amplitude, frequency, and phase parameters
    - ✅ AC Current Source with amplitude, frequency, and phase parameters
    - ✅ **Professional custom SVG symbols** with sine wave indicators matching design system
    - ✅ Professional Vue components with AC-specific parameter display (5V@1kHz ∠45°)
    - ✅ AC-specific stampers extending DC stampers with phasor analysis capability
    - ✅ Component factory integration with comprehensive test coverage (15/15 tests passing)
    - ✅ **Component palette integration** with proper symbol mapping and color coding
    - ✅ **Consistent symbol rendering** between palette and circuit canvas
    - ✅ Proper DC analysis behavior (AC sources have 0V/0A DC component)
    - ✅ Phasor representation methods for future AC analysis integration

4. ✅ **AC Analysis Visualization - COMPLETED & DESIGN SYSTEM COMPLIANT**
    - ✅ Professional ACAnalysisPanel.vue using established AnalysisChart.vue foundation
    - ✅ Bode plot generation with magnitude (dB) and phase (degrees) using Chart.js
    - ✅ Frequency response analysis with proper design system integration
    - ✅ Engineering unit formatting and logarithmic frequency scaling
    - ✅ Export capabilities following professional patterns

**Educational Features**

- Interactive frequency response visualization with cursor readouts
- Phasor diagrams showing phase relationships between voltages and currents
- Filter analysis tools for educational circuit analysis
- Real-time impedance calculations and display

### ✅ COMPLETED - Phase 4A: BJT Foundation

**NPN BJT Implementation - COMPLETE WITH CRITICAL FIXES APPLIED**

**✅ FULLY COMPLETED Components:**

- ✅ **BJT Characteristic Model**: Complete Ebers-Moll implementation with realistic β, Is, and VCE_sat parameters
- ✅ **Load Line Integration**: Uses proven load line intersection approach for stable operation point calculation
- ✅ **Three-Terminal Architecture**: Collector, base, emitter terminals with proper current relationships (IC = β⋅IB, IE = IB + IC)
- ✅ **Professional UI Components**: Complete Vue components with IEEE-standard BJT symbols and educational displays
- ✅ **Properties Panel Integration**: BJT-specific analysis section with operating region, currents, voltages, and current gain display
- ✅ **Comprehensive Testing**: 16/16 unit tests passing with full ComponentStamper and NonLinearStamper interface compliance

**✅ CRITICAL FIXES APPLIED - BJT Active Operation:**

**Problem Resolved:** BJT common-emitter amplifier was stuck in "Cutoff" mode instead of demonstrating active amplification.

**Root Causes & Solutions:**

1. **Resistance Threshold Bug** - `src/services/stampers/nonlinear/BJTStamper.ts`

    - **Issue**: Base resistor threshold too high (≥100kΩ) excluded typical bias resistors
    - **Fix**: Lowered threshold to ≥10kΩ to include real-world base resistors (10kΩ-1MΩ range)
    - **Result**: RB = 47kΩ now correctly included in base-emitter analysis

2. **Cutoff Threshold Bug** - `src/services/stampers/nonlinear/BJTCharacteristic.ts`

    - **Issue**: Cutoff threshold too high (VBE < 0.6V) classified weak active region as cutoff
    - **Fix**: Lowered threshold to VBE < 0.5V to match real silicon BJT behavior
    - **Result**: VBE = 0.586V now correctly identified as "Active"

3. **Circuit Bias Optimization** - `src/components/__tests__/circuits/common-emitter-amplifier.json`
    - **Updated**: VIN = 3.5V, RB = 47kΩ for proper transistor biasing
    - **Result**: BJT now demonstrates active amplification with realistic operating point

**Validation Results:**

- **Base Bias Analysis**: RB = 47kΩ correctly included in Thevenin analysis ✅
- **Operating Region**: BJT shows "Active" instead of "Cutoff" ✅
- **Current Relationships**: IC = β⋅IB, IE = IB + IC working correctly ✅
- **All 343/343 tests passing** - Zero regressions introduced ✅

**Educational Features (Complete):**

- Real-time current gain (β) display with proper Q-point analysis
- Operating region visualization (Cutoff/Active/Saturation) with accurate VBE calculations
- Professional schematic symbols with proper terminal labeling (C, B, E)
- Educational feedback for bias circuit analysis and troubleshooting

**Phase 4A Achievement:** Professional NPN transistor implementation with accurate circuit analysis, stable simulation, and comprehensive educational features. **BJT common-emitter amplifier now fully functional and ready for educational use.**

**⚠️ Phase 4A Gap Identified:** PNP BJT was omitted from initial implementation - only NPN BJT was completed. This limits educational value and professional completeness as complementary circuits (push-pull amplifiers, differential pairs) require both transistor types.

**✅ Phase 4A.5 COMPLETE:** PNP BJT support successfully implemented to complete BJT foundation:

- **PNP BJT Component Definition**: Complete `bjt_pnp` type registration with proper terminals and properties
- **PNP BJT Stamper**: `BJTPNPStamper` with inverted current relationships (VEB-based operation, opposite polarity)
- **PNP BJT Symbol**: `BJTPNPSymbol.vue` with inward-pointing arrow (IEEE standard for PNP)
- **PNP BJT Vue Component**: `BJTPNPComponent.vue` with professional visual representation
- **Component Factory Integration**: Full registration in ComponentStamperFactory and component registry
- **Properties Panel Support**: Complete `ComponentProperties.vue` integration for both NPN and PNP
- **Simulation Integration**: Full MNA solver support with Load Line Intersection approach
- **Comprehensive Testing**: 14/14 PNP unit tests passing, 357/357 total tests (zero regressions)

**Educational Impact**: Circuit Lab now supports both NPN and PNP transistors, enabling comprehensive BJT education including complementary amplifiers, push-pull circuits, and differential pairs. Ready for Phase 4B: MOSFET implementation.

### Phase 4B: 🚧 READY TO START - Advanced Transistor Features

**MOSFET Implementation**

- NMOS/PMOS transistor models with gate-source/drain-source behavior
- Square-law characteristic implementation for saturation region
- Threshold voltage (Vth) and transconductance (gm) parameters

**Enhanced Amplifier Analysis**

- Common emitter/source amplifier configurations
- Small signal analysis integration with existing AC system
- Frequency response analysis for transistor circuits

**Advanced Models**

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

For architecture details, see [SIMULATION-ARCHITECTURE.md](SIMULATION-ARCHITECTURE.md) and [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

### Current Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Canvas**: Konva.js with vue-konva integration
- **State Management**: Pinia stores
- **Simulation**: Pure MNA with load line intersection solver
- **Styling**: Tailwind CSS with circuit-specific design tokens
- **Charts**: Chart.js with engineering units

## Success Metrics

### Current Achievements

- ✅ 100% test success rate (343/343 tests passing)
- ✅ Complete DC simulation capability with all fundamental components
- ✅ Professional schematic symbols following IEEE standards
- ✅ Robust non-linear component handling with load line intersection
- ✅ Educational-focused interface with real-time parameter feedback
- ✅ Professional UI system with responsive design and accessibility
- ✅ Modular stamper architecture for maintainability and extensibility
- ✅ **Complete AC analysis foundation** with reactive components and frequency domain analysis
- ✅ **Professional Chart.js integration** with consistent AnalysisChart.vue foundation
- ✅ **100% Circuit Lab Design System compliance** across all components and interfaces

### Recent Milestones

Phase 4A.5 is complete with full NPN and PNP BJT support, including Ebers-Moll modeling, load line intersection for stable operating points, and accurate active-region detection across 30 unit tests. BJT bias threshold bugs were resolved and the common-emitter amplifier now demonstrates active operation correctly with 357/357 total tests passing. AC analysis is fully implemented with capacitors, inductors, AC sources, and Bode plot visualization. All analysis views have been consolidated onto AnalysisChart.vue with Chart.js integration, eliminating custom chart components and achieving full design system compliance across the interface.

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