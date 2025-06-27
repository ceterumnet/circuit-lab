# UI Development Prompts for Circuit Lab

## DESIGN SYSTEM FOUNDATION

**TECHNOLOGY STACK:**

- **Tailwind CSS** - Utility-first CSS framework for consistent styling
- **Headless UI** - Unstyled, accessible UI components for Vue
- **Heroicons** - Professional icon library (outline/solid variants)
- **Vue 3 + TypeScript** - Modern reactive framework

**CSS SWITCHING MECHANISM:**

- `src/main.ts` has two import lines for clean room development
- `import('./assets/main.css')` - Legacy CSS (currently active)
- `// import './assets/main-new.css'` - New Tailwind system (comment to activate)

## CRITICAL READING REQUIREMENTS

### 1. ALWAYS READ THESE FILES FIRST

- [ ] **PLAN.md** - Master project plan and technical architecture
- [ ] **Project context** - This is a SOPHISTICATED CIRCUIT SIMULATOR, not a generic web app
- [ ] **tailwind.config.js** - Design system tokens and circuit-specific colors
- [ ] **src/assets/main-new.css** - Component patterns and IDE layout classes

### 2. PROJECT SOPHISTICATION AWARENESS

**CRITICAL UNDERSTANDING**: This is a professional educational circuit simulation application with:

- [ ] **170/170 tests passing** - Extremely high quality codebase
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
- [ ] **USE DESIGN TOKENS FROM CONFIG** - Colors like `primary-500`, `circuit-voltage`, `ide-panel`
- [ ] **FOLLOW COMPONENT PATTERNS** - Use `.ide-layout`, `.component-palette`, `.btn` classes
- [ ] **USE HEADLESS UI COMPONENTS** - For dropdowns, modals, toggles, etc.
- [ ] **USE HEROICONS CONSISTENTLY** - Outline for most UI, solid for active states
- [ ] **ASK BEFORE CUSTOM CSS**: "I need [specific styling] but don't see a Tailwind class. Should I add custom CSS or extend the config?"

### 4. COMPONENT CONSISTENCY RULES

- [ ] **Use EXISTING components** from the design system
- [ ] **NEVER create new layout containers** without justification
- [ ] **NEVER invent new CSS classes** - use established utility classes
- [ ] **Match input heights** - all form controls should have consistent sizing
- [ ] **Follow established spacing patterns** using design system tokens

## CIRCUIT SIMULATOR CONTEXT REQUIREMENTS

### 5. EXISTING PROFESSIONAL IMPLEMENTATIONS

**BEFORE CREATING ANYTHING NEW, CHECK FOR EXISTING:**

- [ ] **Circuit symbols** - Professional SVG components in `src/components/circuit/symbols/`
- [ ] **Chart.js visualizations** - AnalysisChart.vue with real-time plotting
- [ ] **Parameter analysis panels** - EnhancedParameterAnalysisPanel.vue
- [ ] **Component libraries** - Complete stamper architecture for all components
- [ ] **Measurement tools** - Voltage/current probes with directional indicators

### 6. CIRCUIT-SPECIFIC ICONOGRAPHY

**FOR CIRCUIT COMPONENTS:**

- [ ] **Use EXISTING circuit symbols** from the professional SVG library in `src/components/circuit/symbols/`
- [ ] **LED ≠ Light Bulb** - Use existing LEDSymbol.vue (triangle with arrows)
- [ ] **Resistor ≠ Lightning Bolt** - Use existing ResistorSymbol.vue (zigzag)
- [ ] **Diode ≠ Triangle** - Use existing DiodeSymbol.vue (triangle with line)

**FOR UI ELEMENTS:**

- [ ] **Use Heroicons for interface** - Play/pause, settings, save, etc.
- [ ] **Outline variant for most UI** - Clean, professional appearance
- [ ] **Solid variant for active states** - Selected items, primary actions
- [ ] **Import from @heroicons/vue** - `import { PlayIcon } from '@heroicons/vue/24/outline'`

**WHEN TO ASK:**

- [ ] **Circuit symbols** - "Should I use existing [ComponentName]Symbol.vue instead of Heroicon?"
- [ ] **UI icons** - "Should this be outline or solid variant of [HeroiconName]?"

### 7. TECHNICAL ACCURACY & DOMAIN EXPERTISE

- [ ] **Understand the educational purpose** - This teaches electrical engineering concepts
- [ ] **Use proper electrical terminology** in labels and descriptions
- [ ] **Maintain technical accuracy** in component representations
- [ ] **Reference PLAN.md** for component specifications and requirements
- [ ] **Respect the MNA simulation engine** - Don't break existing circuit analysis

## UI QUALITY STANDARDS

### 8. VISUAL CONSISTENCY CHECKS

- [ ] **Form control heights MUST match** across all input types
- [ ] **Spacing MUST use design system tokens** (--cl-space-\*)
- [ ] **Colors MUST use design system variables** (--cl-\*)
- [ ] **Typography MUST use established scales** (--cl-text-\*)
- [ ] **Shadows and borders MUST use design tokens** (--cl-shadow-\*, --cl-border)

### 9. REGRESSION PREVENTION

- [ ] **Before making changes** - Screenshot current state for comparison
- [ ] **After making changes** - Verify no visual regressions occurred
- [ ] **Check responsive behavior** - Ensure layouts work on different screen sizes
- [ ] **Validate contrast ratios** - Ensure accessibility standards are met
- [ ] **Run tests** - Ensure 170/170 tests still pass after UI changes

### 10. CHART AND VISUALIZATION REQUIREMENTS

- [ ] **Charts MUST be functional** - Not placeholder content
- [ ] **Use existing Chart.js implementation** - AnalysisChart.vue is already professional
- [ ] **Match circuit analysis context** - Voltage/current plots, frequency response, parameter sweeps
- [ ] **Provide real circuit data** - Not generic placeholder data
- [ ] **Integrate with MNA solver** - Charts should show actual simulation results

## COMMUNICATION PROTOCOLS

### 11. WHEN TO ASK FOR CLARIFICATION

- [ ] **Before changing established design tokens**
- [ ] **Before adding new CSS custom properties**
- [ ] **Before modifying color schemes**
- [ ] **When unsure about circuit symbol representation**
- [ ] **When proposing new layout patterns**
- [ ] **When adding new component variants**
- [ ] **When you discover existing professional implementations**

### 12. HOW TO ASK FOR CLARIFICATION

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

### 13. PROGRESS REPORTING

- [ ] **State what you're about to do** before making changes
- [ ] **Acknowledge existing implementations** you discovered
- [ ] **Explain your reasoning** for design decisions
- [ ] **Highlight any deviations** from established patterns
- [ ] **Ask for confirmation** before major changes

## DESIGN SYSTEM BUILDING BLOCKS

### 14. TAILWIND COMPONENT PATTERNS TO FOLLOW

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

### 15. TAILWIND QUALITY GATES

Before submitting any UI work:

**DESIGN SYSTEM COMPLIANCE:**

- [ ] **All styling uses Tailwind classes** - No inline styles or custom CSS
- [ ] **All colors use design tokens** - `primary-*`, `circuit-*`, `simulation-*` from config
- [ ] **All spacing uses Tailwind spacing** - `p-4`, `gap-3`, `space-y-2`, etc.
- [ ] **All components use established patterns** - `.ide-*`, `.component-*`, `.btn` classes

**COMPONENT INTEGRATION:**

- [ ] **Headless UI used for interactive elements** - No custom dropdowns/modals
- [ ] **Heroicons used for all UI icons** - Consistent outline/solid usage
- [ ] **Circuit symbols preserved** - Professional IEEE-standard symbols maintained
- [ ] **Responsive behavior maintained** - IDE layout works on different screen sizes

**FUNCTIONALITY PRESERVATION:**

- [ ] **Circuit simulation unaffected** - MNA engine integration preserved
- [ ] **All interactive features work** - Component placement, wiring, probing
- [ ] **Charts remain functional** - Real circuit data, not placeholders
- [ ] **Tests still pass (170/170)** - No functionality regressions

**VISUAL QUALITY:**

- [ ] **Professional IDE appearance** - Clean, technical, purposeful design
- [ ] **Consistent form heights** - All inputs use `.property-input` pattern
- [ ] **Proper focus states** - Ring colors and accessibility maintained
- [ ] **Appropriate information density** - Technical tool, not consumer app

## EMERGENCY STOPS

### 16. STOP AND ASK IF:

- [ ] You're about to change a color value
- [ ] You're about to add a media query
- [ ] You're about to create a new layout container
- [ ] You're unsure about a circuit symbol
- [ ] You're about to modify established design tokens
- [ ] You notice the UI looks "ugly" or unprofessional
- [ ] You're creating placeholder content instead of functional components
- [ ] **You discover existing professional implementations that do what you're trying to build**
- [ ] **You're about to replace Chart.js with placeholder content**
- [ ] **You're about to use generic icons instead of circuit symbols**

## SUCCESS CRITERIA

### 17. DEFINITION OF DONE

A UI implementation is complete when:

- [ ] **Follows all established design patterns**
- [ ] **Uses only established design system tokens**
- [ ] **Maintains visual consistency with existing components**
- [ ] **Provides functional, not placeholder, content**
- [ ] **Uses appropriate circuit-specific iconography from existing library**
- [ ] **Meets accessibility standards**
- [ ] **Works responsively across screen sizes**
- [ ] **Has been tested for visual regressions**
- [ ] **Maintains the 170/170 test success rate**
- [ ] **Integrates properly with existing MNA simulation engine**
- [ ] **Respects the professional educational context**

---

## SUMMARY CHECKLIST

Before any UI work:

1. ✅ Read PLAN.md and understand project sophistication
2. ✅ Review existing design system and professional implementations
3. ✅ Understand circuit simulator context and educational purpose
4. ✅ Check for established patterns and existing components
5. ✅ Ask for clarification if uncertain

During UI work:

1. ✅ Use only established design tokens
2. ✅ Follow component patterns and existing architecture
3. ✅ Use appropriate circuit symbols from existing library
4. ✅ Maintain visual consistency with professional standards
5. ✅ Test for regressions and ensure tests still pass

After UI work:

1. ✅ Verify all quality gates and test success rate
2. ✅ Test responsive behavior and accessibility
3. ✅ Confirm integration with existing systems
4. ✅ Document any new patterns (if approved)
5. ✅ Report completion with reasoning and acknowledgment of existing implementations

**REMEMBER**: This is a sophisticated educational circuit simulator with professional implementations. Respect the existing codebase and ask before making assumptions about what needs to be built.
