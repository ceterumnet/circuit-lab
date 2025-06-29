# Circuit Lab Design System Guidelines

## THE GOLDEN RULES (NEVER BREAK THESE)

### 1. ALWAYS READ FIRST

- **PLAN.md** - Understand this is a sophisticated circuit simulator
- **src/assets/main-new.css** - All design tokens and component patterns
- **src/components/design-system/DesignSystemDemo.vue** - See what's already built

### 2. SEARCH BEFORE CREATING

```bash
# Check if it already exists
ls src/components/circuit/symbols/     # 12 professional circuit symbols exist
ls src/components/circuit/analysis/    # Professional Chart.js implementation exists
ls src/components/circuit/components/  # Professional component library exists
```

### 3. USE EXISTING PROFESSIONAL IMPLEMENTATIONS

- **AnalysisChart.vue** (346 lines) - Real Chart.js charts, not placeholders
- **ProbeComponent.vue** (409 lines) - Professional measurement tools
- **12 IEEE-standard circuit symbols** - Never replace with generic icons
- **MNA simulation engine** (934 lines) - Don't break the physics

### 4. DESIGN SYSTEM COMPLIANCE

- **Colors**: Only use `--color-primary-*`, `--color-circuit-*`, `--color-simulation-*` from main-new.css
- **Layout**: Only use `.ide-layout`, `.component-palette`, `.properties-panel`, `.btn` classes
- **Icons**: Lucide for UI, existing circuit symbols for components
- **Cursors**: Use `.cursor-crosshair-hd`, `.cursor-grab-hd`, etc. (already implemented)

### 5. TECHNOLOGY STACK

- **Tailwind CSS only** - No custom CSS unless absolutely necessary
- **Headless UI** - For dropdowns, modals, toggles
- **Lucide Icons** - For UI elements only
- **Vue 3 + TypeScript** - Proper types, no `any`

## EMERGENCY STOPS (ASK BEFORE DOING)

### STOP if you're about to:

- Create charts (professional Chart.js exists)
- Create circuit symbols (12 professional symbols exist)
- Create measurement tools (professional probes exist)
- Change color values in main-new.css
- Add custom CSS instead of Tailwind classes
- Replace functional components with placeholders
- Use generic icons for circuit components

### ASK FIRST:

"I need to [specific task]. I found [existing implementation]. Should I use/modify the existing one or create new?"

## QUALITY GATES (CHECK BEFORE SUBMITTING)

### Visual Consistency

- All form controls have matching heights using `.property-input`
- All colors use design tokens from main-new.css
- All spacing uses Tailwind classes (`p-4`, `gap-3`, `space-y-2`)
- Professional IDE appearance maintained

### Functionality Preservation

- All 170+ tests still pass
- Circuit simulation works (MNA engine intact)
- Real circuit data in charts (not placeholder content)
- Existing professional features preserved

## SIMPLE SUCCESS FORMULA

1. **Search** → Find existing implementation
2. **Read** → Understand design tokens and patterns
3. **Use** → Apply existing patterns and professional components
4. **Ask** → When uncertain about existing vs new
5. **Test** → Verify tests pass and no visual regressions

## WHEN IN DOUBT

**Default Action**: Use existing implementations and established patterns
**Default Question**: "Does a professional implementation of this already exist?"
**Default Response**: "I found [existing component] that does this. Should I use it instead?"

---

## CONTEXT REMINDER

This is a **professional educational circuit simulator** with:

- 170+ comprehensive tests
- Complete DC simulation engine with Modified Nodal Analysis
- Professional IEEE-standard circuit symbols
- Real-time parameter analysis with Chart.js
- Advanced component library with realistic physics
- Professional design system with custom cursors

**NOT** a generic web app needing basic components or placeholder content.
