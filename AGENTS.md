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
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.
- Design System: @DESIGN-SYSTEM.md

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
