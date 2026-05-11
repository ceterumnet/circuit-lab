# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise

## PLANNING MODE

- Always ask clarifying questions
- Implement one thing at a time
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Always write unit tests along with new code
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- After completing features (large or small), always run commands like lint, type check, unit tests, and next build to check code quality
- Always verify a linter's "unused" claim by checking the source** — especially for runtime imports (not type imports). Prefix with _ instead of removing.
- 
## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI GUARDRAILS

### Read Before Building

Always read these files first:
- `src/assets/main-new.css` — all design tokens and component patterns
- `src/components/design-system/DesignSystemDemo.vue` — see what's already built

### Search Before Creating

Check for existing implementations before building anything new:
- `src/components/circuit/symbols/` — 12 professional IEEE-standard circuit symbols
- `src/components/circuit/analysis/` — Chart.js-based analysis charts
- `src/components/circuit/components/` — professional component library
- `src/components/circuit/probes/` — measurement tools (ProbeComponent.vue)

### Design System Compliance

- **Colors**: Only use `--color-primary-*`, `--color-circuit-*`, `--color-simulation-*` design tokens from `main-new.css`
- **Layout**: Only use `.ide-layout`, `.component-palette`, `.properties-panel`, `.btn` classes
- **Icons**: Lucide for UI elements, existing circuit symbols for components — never use generic icons for circuit components
- **Cursors**: Use `.cursor-crosshair-hd`, `.cursor-grab-hd`, etc. already in the design system
- **Form controls**: Match heights using `.property-input`

### Tech Stack

- **Tailwind CSS only** — no custom CSS unless absolutely necessary
- **Headless UI** — for dropdowns, modals, toggles
- **Lucide Icons** — for UI elements only
- **Vue 3 + TypeScript** — proper types, never use `any`

### Emergency Stops — Ask Before Doing

If you're about to do any of the following, STOP and ask first:

- Create charts, circuit symbols, or measurement tools (professional implementations already exist)
- Change color values in `main-new.css`
- Add custom CSS instead of Tailwind classes
- Replace functional components with placeholders
- Use generic icons for circuit components

Default question: "I need to [task]. A professional implementation exists at [file]. Should I use/modify it or create something new?"

### Quality Gates

- All 170+ tests pass
- MNA simulation engine remains intact
- Real circuit data in charts, never placeholder content
- Professional IDE appearance maintained

### Success Formula

1. **Search** → find existing implementation
2. **Read** → understand design tokens and patterns
3. **Use** → apply existing patterns and professional components
4. **Ask** → when uncertain about existing vs. new
5. **Test** → verify tests pass and no visual regressions

### Context

This is a professional educational circuit simulator — NOT a generic web app. It has:
- Complete DC simulation engine (MNA)
- 12 IEEE-standard circuit symbols
- Real-time parameter analysis with Chart.js
- Advanced component library with realistic physics
- Professional design system with custom cursors

When in doubt: default to using existing implementations and established patterns.

# Project

## Project at a Glance

Vue 3 + TypeScript + Vite circuit simulator. Canvas rendering via vue-konva/Konva. State via Pinia. Tailwind v4. MNA-based DC/AC circuit simulation engine lives in `src/services/`.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install deps (runs `cypress install` via prepare hook) |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check **then** `vite build` (via npm-run-all2) |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | `vue-tsc --build` (incremental, uses tsconfig references) |
| `npm run test:unit` | Run Vitest once (`--run`, jsdom environment) |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier `src/` |

**Build order matters**: `npm run build` runs `type-check` before `build-only`. Fix type errors first or the build will abort.

**Never use `tsc`** — the project uses `vue-tsc --build` for type-checking `.vue` files.

---

## TypeScript

Three tsconfig references:
- `tsconfig.app.json` — app source (excludes `__tests__`)
- `tsconfig.vitest.json` — test files (extends app, adds `node`/`jsdom` types)
- `tsconfig.node.json` — build tooling

Path alias `@/*` resolves to `./src/*`.

---

## Testing

- **Unit tests**: `vitest`, jsdom. Specs live in `src/components/__tests__/`
  - `unit/` — component stamper, solver, and matrix tests
  - `functional/` — end-to-end linear analysis tests
  - `integration/` — multi-component circuit tests
  - `circuits/` — JSON circuit fixtures; use `circuit-loader.ts` / `circuit-factory.ts` helpers
- **E2E**: Cypress against `preview` (prod) or `vite dev` (`test:e2e:dev`). Specs in `cypress/e2e/`.

Run a single file: `npx vitest run <file>`. Use `vitest.config.ts` (not `vite.config.ts`) for test config.

---

## Simulation Engine (`src/services/`)

Core architecture documented in `SIMULATION-ARCHITECTURE.md` — read it before modifying any solver or stamper code.

Key structure:
- `services/stampers/linear/` — passive component stampers (resistor, wire, switch, etc.)
- `services/stampers/nonlinear/` — diode, LED, BJT (Newton-Raphson)
- `services/stampers/ComponentStamperFactory.ts` — mapping from component type to stamper
- `services/simulation.ts` — orchestration: node generation → MNA assembly → solve → result
- `services/numerical-solver.ts` / `complex-mna-solver.ts` — linear solvers

Adding a new component type:
1. Implement a `ComponentStamper` (linear or nonlinear)
2. Register in `ComponentStamperFactory`
3. Define component in `src/registry/components.ts`
4. Add type declaration in `src/types/components.ts`

---

## App Structure

- `src/main.ts` — entry: creates app, installs Pinia / router / VueKonva, loads `@/registry/components`
- `src/router/index.ts` — routes (`/`, `/about`, `/editor`)
- `src/stores/` — Pinia stores (`circuit.ts` is the main one)
- `src/components/circuit/` — canvas editor, palettes, properties panel, probes, symbols
- `src/composables/` — shared composables

---

## Style

Prettier: no semicolons, single quotes, 100 char print width. Run `npm run format` before committing.
ESLint: flat config, targets `.ts`/`.tsx`/`.vue`. `_`-prefixed vars/args ignored for unused-vars rule.

---

## Toolchain Quirks

- Tailwind v4 via `@tailwindcss/vite` plugin (not PostCSS-based config); `tailwind.config.js` only sets `content`
- CSS entry is `src/assets/main-new.css` (not `main.css`)
- `npm-run-all2` composes `type-check` + `build-only` into the `build` script
