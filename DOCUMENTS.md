# Document Index

## Core Documentation

| Document | Purpose |
|---|---|
| [README.md](README.md) | Standard Vue 3/Vite setup instructions |
| [SIMULATION-ARCHITECTURE.md](SIMULATION-ARCHITECTURE.md) | Core architecture: MNA implementation, stamper system, solver flow, component stamping strategies, non-linear components, numerical stability |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | UI design system: Tailwind tokens, color semantics, component patterns, layout, Headless UI integration |

## Planning & Roadmap

| Document | Purpose |
|---|---|
| [PLAN.md](PLAN.md) | Roadmap & status: completed phases (DC, AC, BJT NPN/PNP), next up (Phase 4B: MOSFET), technical architecture, success metrics (357/357 tests) |
| [PLAN_LOG.md](PLAN_LOG.md) | Detailed development history: phased achievements from 1.0 through 1.98, technical discoveries (Pure MNA, Load Line, parameter scaling), test milestones |
| [MOTIVATION.md](MOTIVATION.md) | Personal motivation — building the simulator to learn circuit fundamentals through code |

## Testing & Validation

| Document | Purpose |
|---|---|
| [mna-tests-plan.md](mna-tests-plan.md) | Comprehensive test architecture: unit/functional/integration test plans, tolerance specs, circuit factory patterns, phase-by-phase validation checklists |
| [diode-test-notes.md](diode-test-notes.md) | Debugging journal from diode implementation: systemic MNA failures discovered, lessons on integration vs unit testing |
| [led-test-notes.md](led-test-notes.md) | LED convergence failure analysis: Newton-Raphson oscillations, parameter harness breakthrough, root cause tracing to MNA implementation bug |

## UX & Developer Guidelines

| Document | Purpose |
|---|---|
| [HOWTO.md](HOWTO.md) | Keyboard shortcuts and UX patterns: `/` fuzzy search, `R`/`V`/`G` quick placement, rotation, copy/cut/paste |
| [ui-prompts.md](ui-prompts.md) | AI/developer guidelines: golden rules for using existing implementations, emergency stops, quality gates, design system compliance checklist |
