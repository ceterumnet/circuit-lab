# UI Development Prompts for Circuit Lab

## DESIGN SYSTEM FOUNDATION

**TECHNOLOGY STACK:**

- **Tailwind CSS** - Utility-first CSS framework for consistent styling
- **Headless UI** - Unstyled, accessible UI components for Vue
- **Lucide Icons** - Professional icon library with comprehensive cursor support
- **Vue 3 + TypeScript** - Modern reactive framework

**CSS SWITCHING MECHANISM:**

- `src/main.ts` has two import lines for clean room development
- `// import('./assets/main.css')` - Legacy CSS
- `import './assets/main-new.css'` - New Tailwind system (currently active)

## CRITICAL READING REQUIREMENTS

### 1. ALWAYS READ THESE FILES FIRST

- [ ] **PLAN.md** - Master project plan and technical architecture
- [ ] **Project context** - This is a SOPHISTICATED CIRCUIT SIMULATOR, not a generic web app
- [ ] **src/assets/main-new.css** - Component patterns and IDE layout classes (NOT tailwind.config.js)
- [ ] **src/registry/components.ts** - Available professional circuit components

### 2. PROJECT SOPHISTICATION AWARENESS

**CRITICAL UNDERSTANDING**: This is a professional educational circuit simulation application with:

- [ ] **Extremely high quality codebase** with comprehensive test coverage (170 tests)
- [ ] **Complete DC simulation engine** with Modified Nodal Analysis (MNA)
- [ ] **Professional IEEE-standard schematic symbols** already implemented
- [ ] **Real-time parameter analysis** with Chart.js visualizations
- [ ] **Load line intersection solver** for non-linear components
- [ ] **Advanced component library** (resistors, diodes, LEDs, voltage sources, etc.)
- [ ] **Floating node detection** with GMIN stabilization
- [ ] **Modular stamper architecture** for component behavior

**NEVER ASSUME**: This project needs basic components, placeholder charts, or generic icons. It already has sophisticated professional implementations.

### 3. TAILWIND DESIGN SYSTEM GOSPEL

- [ ] **USE TAILWIND CLASSES ONLY** - No custom CSS unless absolutely necessary
- [ ] **USE DESIGN TOKENS FROM main-new.css** - Colors like `primary-500`, `circuit-voltage`, `simulation-*`
- [ ] **FOLLOW COMPONENT PATTERNS** - Use `.ide-layout`, `.component-palette`, `.btn` classes
- [ ] **USE HEADLESS UI COMPONENTS** - For dropdowns, modals, toggles, etc.
- [ ] **USE LUCIDE ICONS CONSISTENTLY** - Professional icon library with comprehensive coverage
- [ ] **ASK BEFORE CUSTOM CSS**: "I need [specific styling] but don't see a Tailwind class. Should I add custom CSS or extend the config?"

### 4. COMPONENT CONSISTENCY RULES

- [ ] **Use EXISTING components** from the design system
- [ ] **NEVER create new layout containers** without justification
- [ ] **NEVER invent new CSS classes** - use established utility classes
- [ ] **Match input heights** - all form controls should have consistent sizing
- [ ] **Follow established spacing patterns** using design system tokens

## CRITICAL VERIFICATION WORKFLOW

### 5. MANDATORY CHECKS BEFORE CREATING ANYTHING

**Step 1: Search for Existing Implementations**

```bash
# Check for existing symbols
ls src/components/circuit/symbols/

# Check for existing analysis tools
ls src/components/circuit/analysis/

# Check for existing components
ls src/components/circuit/components/
```

**Step 2: Verify Design System Classes**

```bash
# Check available layout classes
grep -r "\.ide-" src/assets/main-new.css

# Check button patterns
grep -r "\.btn" src/assets/main-new.css

# Check measurement displays
grep -r "\.voltage-display\|\.current-display" src/assets/main-new.css
```

**Step 3: Check Simulation Features**

```bash
# Verify professional features exist
grep -r "GMIN\|floating" src/services/simulation.ts
```

## EXISTING PROFESSIONAL IMPLEMENTATIONS

### 6. COMPLETE CIRCUIT SYMBOL LIBRARY

**Available Professional Symbols** (src/components/circuit/symbols/):

- ✅ **ResistorSymbol.vue** - US-style zigzag pattern
- ✅ **VoltageSourceSymbol.vue** - Circle with polarity markings (+ and -)
- ✅ **CurrentSourceSymbol.vue** - Circle with current arrow
- ✅ **DiodeSymbol.vue** - Triangle with cathode bar + polarity labels (A/K)
- ✅ **LEDSymbol.vue** - Triangle with light rays + color indication
- ✅ **GroundSymbol.vue** - Traditional decreasing horizontal lines
- ✅ **NodeSymbol.vue** - Simple filled circle for wire junctions
- ✅ **WireSymbol.vue** - Line with connection points
- ✅ **SwitchSymbol.vue** - Professional switch with open/closed state indication
- ✅ **VariableResistorSymbol.vue** - Zigzag with diagonal arrow
- ✅ **PotentiometerSymbol.vue** - Zigzag with wiper arrow
- ✅ **ProbeSymbol.vue** - Professional measurement symbols (V/A)

**NEVER**: Replace these with generic icons or recreate them. They are professionally designed and IEEE-compliant.

### 7. COMPLETE ANALYSIS & VISUALIZATION SYSTEM

**Professional Chart.js Implementation** (src/components/circuit/analysis/):

- ✅ **AnalysisChart.vue** - 346 lines, full Chart.js implementation with:
  - Real circuit data visualization (not placeholders)
  - Professional formatting with engineering units (μ, m, k, M)
  - Multiple dataset support with color coding
  - Interactive tooltips and legends
  - Export functionality (PNG, CSV)
- ✅ **ParameterAnalysisPanel.vue** - 793 lines, real-time parameter sweeping
- ✅ **EnhancedParameterAnalysisPanel.vue** - 742 lines, advanced analysis interface
- ✅ **AnalysisWorkspace.vue** - 364 lines, professional IDE-style analysis environment

**NEVER**: Create placeholder charts or generic visualizations. The existing Chart.js implementation is production-ready.

### 8. PROFESSIONAL MEASUREMENT SYSTEM

**Complete Probe Infrastructure** (src/components/circuit/probes/):

- ✅ **ProbeComponent.vue** - 409 lines of voltage/current measurement
- ✅ **ProbeProperties.vue** - 481 lines of measurement configuration
- ✅ **Real-time Updates** - Live measurement display with proper units
- ✅ **Directional Indicators** - Shows current flow direction

### 9. PRODUCTION-GRADE SIMULATION ENGINE

**Professional SPICE-Standard MNA** (src/services/):

- ✅ **simulation.ts** - 934 lines of professional DC analysis engine
- ✅ **GMIN Stabilization** - 1e-12 S conductance to ground (professional SPICE standard)
- ✅ **Floating Node Detection** - BFS graph traversal algorithm with educational warnings
- ✅ **Incomplete Circuit Loop Detection** - Advanced dead-end node analysis
- ✅ **Switch-Aware Logic** - Distinguishes expected vs unexpected floating nodes

**Component Stamper Architecture** (src/services/stampers/):

- ✅ **Linear Stampers**: Resistor, VoltageSource, CurrentSource, Wire, Ground, Node, Switch, VariableResistor, Potentiometer
- ✅ **Nonlinear Stampers**: DiodeStamper (437 lines), LEDStamper, DiodeParameterLibrary
- ✅ **Load Line Intersection Solver** - Professional diode/LED analysis
- ✅ **Newton-Raphson Fallback** - Multi-diode circuit support

### 10. COMPLETE DESIGN SYSTEM

**Professional Design Tokens** (src/assets/main-new.css):

- ✅ **Circuit-specific Colors**: `--color-circuit-voltage`, `--color-circuit-current`, `--color-circuit-resistance`, `--color-circuit-power`
- ✅ **Simulation Status Colors**: `--color-simulation-idle`, `--color-simulation-running`, etc.
- ✅ **Complete Component Patterns**: `.ide-layout`, `.component-palette`, `.properties-panel`, `.btn` system
- ✅ **Measurement Displays**: `.voltage-display`, `.current-display`, `.resistance-display`, `.power-display`

**Custom High-DPI Cursor System**:

- ✅ **Professional Cursor Classes**: `.cursor-crosshair-hd`, `.cursor-grab-hd`, `.cursor-move-hd`, `.cursor-nwse-resize-hd`, `.cursor-help-hd`
- ✅ **Lucide SVG Integration**: URL-encoded SVG data with 16x16 size, 1.5px stroke width
- ✅ **Proper Hotspot Positioning**: (8,8) for accurate cursor alignment

### 11. ADDITIONAL PROFESSIONAL SYSTEMS

**Component Palette** (src/components/circuit/ComponentPalette.vue):

- ✅ **Professional Implementation** - 189 lines with proper icon integration
- ✅ **Uses Actual Circuit Symbols** - Not generic icons

**Save/Load System** (src/components/circuit/CircuitSaveLoad.vue):

- ✅ **Professional Data Management** - 447 lines with local storage, import/export

**Testing Infrastructure**:

- ✅ **170 Comprehensive Tests** - Unit, integration, functional test coverage

## CIRCUIT SIMULATOR CONTEXT REQUIREMENTS

### 12. CIRCUIT-SPECIFIC ICONOGRAPHY

**FOR CIRCUIT COMPONENTS:**

- [ ] **Use EXISTING circuit symbols** from the professional SVG library in `src/components/circuit/symbols/` or create new ones if the component is not in the library

**FOR UI ELEMENTS:**

- [ ] **Use Lucide icons for interface** - Play/pause, settings, save, etc.
- [ ] **Import from lucide-vue-next** - `import { Play } from 'lucide-vue-next'`
- [ ] **Consistent stroke width** - Use default Lucide styling for uniformity
- [ ] **Custom cursors available** - High-DPI cursor system implemented

**WHEN TO ASK:**

- [ ] **Circuit symbols** - "Should I use existing [ComponentName]Symbol.vue instead of Lucide icon?"
- [ ] **UI icons** - "Should this use a Lucide icon or existing circuit symbol?"

### 13. TECHNICAL ACCURACY & DOMAIN EXPERTISE

- [ ] **Understand the educational purpose** - This teaches electrical engineering concepts
- [ ] **Use proper electrical terminology** in labels and descriptions
- [ ] **Maintain technical accuracy** in component representations
- [ ] **Reference PLAN.md** for component specifications and requirements
- [ ] **Respect the MNA simulation engine** - Don't break existing circuit analysis

## UI QUALITY STANDARDS

### 14. VISUAL CONSISTENCY CHECKS

- [ ] **Form control heights MUST match** across all input types
- [ ] **Spacing MUST use design system tokens** (--color-\*)
- [ ] **Colors MUST use design system variables** from main-new.css
- [ ] **Typography MUST use established scales**
- [ ] **Shadows and borders MUST use design tokens**

### 15. REGRESSION PREVENTION

- [ ] **Before making changes** - Verify existing implementations don't already exist
- [ ] **After making changes** - Verify no visual regressions occurred
- [ ] **Check responsive behavior** - Ensure layouts work on different screen sizes
- [ ] **Validate contrast ratios** - Ensure accessibility standards are met
- [ ] **Run tests** - Ensure 170/170 tests still pass after UI changes

### 16. CHART AND VISUALIZATION REQUIREMENTS

- [ ] **Charts MUST be functional** - Not placeholder content
- [ ] **Use existing Chart.js implementation** - AnalysisChart.vue is already professional
- [ ] **Match circuit analysis context** - Voltage/current plots, frequency response, parameter sweeps
- [ ] **Provide real circuit data** - Not generic placeholder data
- [ ] **Integrate with MNA solver** - Charts should show actual simulation results

## COMMUNICATION PROTOCOLS

### 17. WHEN TO ASK FOR CLARIFICATION

- [ ] **Before changing established design tokens**
- [ ] **Before adding new CSS custom properties**
- [ ] **Before modifying color schemes**
- [ ] **When unsure about circuit symbol representation**
- [ ] **When proposing new layout patterns**
- [ ] **When adding new component variants**
- [ ] **When you discover existing professional implementations**

### 18. HOW TO ASK FOR CLARIFICATION

Use this format:

```
CLARIFICATION NEEDED:
Context: [What I'm trying to accomplish]
Existing Implementation: [What I found in the codebase]
Issue: [Specific problem or uncertainty]
Options: [2-3 specific alternatives with pros/cons]
Recommendation: [My preferred option with reasoning]
Question: [Specific yes/no or choice question]
```

### 19. PROGRESS REPORTING

- [ ] **State what you're about to do** before making changes
- [ ] **Acknowledge existing implementations** you discovered
- [ ] **Explain your reasoning** for design decisions
- [ ] **Highlight any deviations** from established patterns
- [ ] **Ask for confirmation** before major changes

## DESIGN SYSTEM BUILDING BLOCKS

### 20. TAILWIND COMPONENT PATTERNS TO FOLLOW

**LAYOUT PATTERNS:**

- [ ] **IDE Layout** - Use `.ide-layout`, `.ide-toolbar`, `.ide-main`, `.ide-sidebar`
- [ ] **Panel System** - Use `.ide-panel`, `.ide-panel-header`, `.ide-panel-content`
- [ ] **Component Palette** - Use `.component-palette`, `.component-group`, `.component-item`
- [ ] **Properties Panel** - Use `.properties-panel`, `.property-section`, `.property-field`

**FORM PATTERNS:**

- [ ] **Form Fields** - Use `.property-field`, `.property-label`, `.property-input`
- [ ] **Property Values** - Use `.property-value` for read-only displays
- [ ] **Input Focus** - Automatic focus:ring-primary-500 styling

**BUTTON PATTERNS:**

- [ ] **Primary Actions** - Use `.btn .btn-primary` (simulation, save)
- [ ] **Secondary Actions** - Use `.btn .btn-secondary` (cancel, reset)
- [ ] **Ghost Actions** - Use `.btn .btn-ghost` (icons, subtle actions)
- [ ] **Icon Buttons** - Use `.btn .btn-icon` for toolbar buttons

**MEASUREMENT DISPLAYS:**

- [ ] **Electrical Values** - Use `.voltage-display`, `.current-display`, `.resistance-display`, `.power-display`
- [ ] **Simulation Status** - Use `.simulation-status` with state classes (.idle, .running, .success, .error)

**HEADLESS UI INTEGRATION:**

- [ ] **Dropdowns** - Use `<Listbox>`, `<Menu>` components with Tailwind styling
- [ ] **Modals** - Use `<Dialog>` component with `.floating-panel` classes
- [ ] **Toggles** - Use `<Switch>` component with circuit-semantic colors

**CURSOR SYSTEM:**

- [ ] **Custom high-DPI cursors** - Use `.cursor-crosshair-hd`, `.cursor-grab-hd`, `.cursor-move-hd`, `.cursor-nwse-resize-hd`, `.cursor-help-hd`
- [ ] **Professional cursor design** - Matches Lucide icon design language
- [ ] **Consistent sizing** - 16x16 pixels with 1.5px stroke width

### 21. TAILWIND QUALITY GATES

Before submitting any UI work:

**DESIGN SYSTEM COMPLIANCE:**

- [ ] **All styling uses Tailwind classes** - No inline styles or custom CSS
- [ ] **All colors use design tokens** - `primary-*`, `circuit-*`, `simulation-*` from main-new.css
- [ ] **All design tokens are defined in main-new.css**
- [ ] **All spacing uses Tailwind spacing** - `p-4`, `gap-3`, `space-y-2`, etc.
- [ ] **All components use established patterns** - `.ide-*`, `.component-*`, `.btn` classes

**COMPONENT INTEGRATION:**

- [ ] **Headless UI used for interactive elements** - No custom dropdowns/modals
- [ ] **Lucide icons used for all UI icons** - Consistent design language
- [ ] **Circuit symbols preserved** - Professional IEEE-standard symbols maintained
- [ ] **Custom cursors implemented** - High-DPI cursor system for professional interactions
- [ ] **Responsive behavior maintained** - IDE layout works on different screen sizes

**FUNCTIONALITY PRESERVATION:**

- [ ] **Circuit simulation unaffected** - MNA engine integration preserved
- [ ] **All interactive features work** - Component placement, wiring, probing
- [ ] **Charts remain functional** - Real circuit data, not placeholders
- [ ] **Tests still pass** - No functionality regressions

**VISUAL QUALITY:**

- [ ] **Professional IDE appearance** - Clean, technical, purposeful design
- [ ] **Consistent form heights** - All inputs use `.property-input` pattern
- [ ] **Proper focus states** - Ring colors and accessibility maintained
- [ ] **Appropriate information density** - Technical tool, not consumer app

## EMERGENCY STOPS

### 22. STOP AND ASK IF:

**BEFORE CREATING NEW IMPLEMENTATIONS:**

- [ ] You're about to create a chart component (AnalysisChart.vue exists with 346 lines)
- [ ] You're about to create circuit symbols (12 professional symbols exist)
- [ ] You're about to create measurement tools (ProbeComponent.vue exists with 409 lines)
- [ ] You're about to add SPICE features (Professional MNA engine exists with 934 lines)
- [ ] You're about to create component palette (Professional implementation exists with 189 lines)
- [ ] You're about to add save/load features (CircuitSaveLoad.vue exists with 447 lines)

**BEFORE MODIFYING DESIGN SYSTEM:**

- [ ] You're about to change a color value
- [ ] You're about to add a media query
- [ ] You're about to create a new layout container
- [ ] You're about to modify established design tokens
- [ ] You're about to add cursors (High-DPI system exists)

**BEFORE REPLACING PROFESSIONAL IMPLEMENTATIONS:**

- [ ] You notice the UI looks "ugly" or unprofessional
- [ ] You're creating placeholder content instead of functional components
- [ ] **You discover existing professional implementations that do what you're trying to build**
- [ ] **You're about to replace Chart.js with placeholder content**
- [ ] **You're about to use generic icons instead of circuit symbols**

## SUCCESS CRITERIA

### 23. DEFINITION OF DONE

A UI implementation is complete when:

- [ ] **Follows all established design patterns**
- [ ] **Uses only established design system tokens**
- [ ] **Maintains visual consistency with existing components**
- [ ] **Provides functional, not placeholder, content**
- [ ] **Uses appropriate circuit-specific iconography from existing library**
- [ ] **Meets accessibility standards**
- [ ] **Works responsively across screen sizes**
- [ ] **Has been tested for visual regressions**
- [ ] **Maintains test success rate (170/170 tests)**
- [ ] **Integrates properly with existing MNA simulation engine**
- [ ] **Respects the professional educational context**

---

## SUMMARY CHECKLIST

Before any UI work:

1. ✅ Verify no existing implementation exists using verification workflow
2. ✅ Read PLAN.md and understand project sophistication
3. ✅ Review existing design system (main-new.css) and professional implementations
4. ✅ Understand circuit simulator context and educational purpose
5. ✅ Check for established patterns and existing components
6. ✅ Ask for clarification if uncertain

During UI work:

1. ✅ Use only established design tokens from main-new.css
2. ✅ Follow component patterns and existing architecture
3. ✅ Use appropriate circuit symbols from existing library (12 professional symbols)
4. ✅ Maintain visual consistency with professional standards
5. ✅ Test for regressions and ensure 170 tests still pass

After UI work:

1. ✅ Verify all quality gates and test success rate
2. ✅ Test responsive behavior and accessibility
3. ✅ Confirm integration with existing systems
4. ✅ Document any new patterns (if approved)
5. ✅ Report completion with reasoning and acknowledgment of existing implementations

**REMEMBER**: This is a sophisticated educational circuit simulator with professional implementations. Always check for existing solutions before creating new ones.
