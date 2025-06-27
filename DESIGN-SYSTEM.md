# Circuit Lab Design System

## Overview

A professional, open-source design system built with **Tailwind CSS**, **Headless UI**, and **Heroicons** for creating an IDE-like circuit simulation interface. This system provides a clean, technical aesthetic suitable for educational and professional electrical engineering tools.

## Technology Stack

- **🎨 Tailwind CSS** - Utility-first CSS framework with custom circuit-specific tokens
- **🧩 Headless UI** - Unstyled, accessible UI components for Vue 3
- **🎯 Heroicons** - Professional SVG icon library (outline + solid variants)
- **⚡ Vue 3 + TypeScript** - Modern reactive framework with type safety

## Quick Start

### CSS Switching (Clean Room Development)

In `src/main.ts`, toggle between the legacy and new design systems:

```typescript
// Legacy CSS (currently active)
import('./assets/main.css')

// New Tailwind System (comment out above, uncomment below to activate)
// import './assets/main-new.css'
```

### View the Demo

```bash
# To see the design system in action, add this route temporarily:
# In router/index.ts, add:
{
  path: '/design-system',
  component: () => import('@/components/design-system/DesignSystemDemo.vue')
}
```

## Design Tokens

### Color System

Our color system is optimized for technical interfaces with circuit-specific semantics:

```javascript
// tailwind.config.js
colors: {
  // Primary brand colors
  primary: { /* Blue scale 50-950 */ },

  // Circuit-specific semantic colors
  circuit: {
    voltage: '#dc2626',     // Red for voltage measurements
    current: '#059669',     // Green for current measurements
    resistance: '#7c3aed',  // Purple for resistance values
    power: '#ea580c',       // Orange for power calculations
    ground: '#374151',      // Dark gray for ground connections

    // Component states
    active: '#10b981',      // Green for active/on components
    inactive: '#6b7280',    // Gray for inactive/off components
    error: '#dc2626',       // Red for error states
    warning: '#f59e0b',     // Amber for warnings

    // Wire colors (electrical conventions)
    wire: {
      positive: '#dc2626',   // Red wire
      negative: '#1f2937',   // Black wire
      neutral: '#3b82f6',    // Blue wire
      ground: '#10b981',     // Green wire
      signal: '#7c3aed',     // Purple wire
    }
  },

  // IDE interface colors
  ide: {
    canvas: '#fafafa',       // Circuit drawing area
    grid: '#e5e7eb',         // Grid dots/lines
    panel: '#f8fafc',        // Panel backgrounds
    code: '#0f172a',         // Code display areas
  },

  // Simulation status colors
  simulation: {
    idle: '#6b7280',         // Not running
    running: '#f59e0b',      // Currently simulating
    success: '#10b981',      // Successful simulation
    error: '#dc2626',        // Simulation error
    warning: '#f59e0b',      // Warnings
  }
}
```

### Typography

```javascript
fontFamily: {
  'mono': ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
  'sans': ['Inter', 'system-ui', 'sans-serif'],
}
```

### Spacing & Sizing

```javascript
// IDE-optimized spacing
spacing: {
  '18': '4.5rem',   // 72px
  '88': '22rem',    // 352px - sidebar width
  '112': '28rem',   // 448px - panel width
},

// Component-specific sizing
width: {
  'sidebar': '240px',
  'palette': '200px',
  'properties': '320px',
  'analysis': '400px',
},

height: {
  'toolbar': '48px',
  'statusbar': '24px',
}
```

## Component Patterns

### Layout Components

#### IDE Layout Structure

```vue
<template>
  <div class="ide-layout">
    <div class="ide-toolbar"><!-- Top toolbar --></div>
    <div class="ide-main">
      <div class="component-palette"><!-- Left sidebar --></div>
      <div class="circuit-canvas-container"><!-- Center canvas --></div>
      <div class="properties-panel"><!-- Right panel --></div>
    </div>
  </div>
</template>
```

#### Panel System

```vue
<div class="ide-panel">
  <div class="ide-panel-header">
    <h3>Panel Title</h3>
  </div>
  <div class="ide-panel-content">
    <!-- Panel content -->
  </div>
</div>
```

### Form Components

#### Property Fields

```vue
<div class="property-field">
  <label class="property-label">Resistance</label>
  <input class="property-input" type="number" value="1000" />
</div>

<!-- Read-only property display -->
<div class="property-field">
  <label class="property-label">Voltage</label>
  <div class="property-value voltage-display">3.33 V</div>
</div>
```

### Button System

```vue
<!-- Primary actions (simulation, save) -->
<button class="btn btn-primary">
  <PlayIcon class="w-4 h-4 mr-2" />
  Simulate
</button>

<!-- Secondary actions (cancel, reset) -->
<button class="btn btn-secondary">
  Cancel
</button>

<!-- Ghost buttons (subtle actions) -->
<button class="btn btn-ghost">
  Clear
</button>

<!-- Icon-only buttons -->
<button class="btn btn-icon">
  <Cog6ToothIcon class="w-5 h-5" />
</button>
```

### Status Components

#### Simulation Status

```vue
<div class="simulation-status running">
  <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
  Running...
</div>
```

#### Measurement Displays

```vue
<div class="voltage-display">5.0 V</div>
<div class="current-display">2.5 mA</div>
<div class="resistance-display">2.0 kΩ</div>
<div class="power-display">12.5 mW</div>
```

### Component Palette

```vue
<div class="component-palette">
  <div class="component-group">
    <div class="component-group-title">Components</div>
    <div class="component-list">
      <div class="component-item active">
        <div class="component-icon">
          <ResistorIcon class="w-5 h-5" />
        </div>
        <span class="component-label">Resistor</span>
      </div>
    </div>
  </div>
</div>
```

## Icon Usage

### Heroicons Integration

```vue
<script setup>
// Outline icons for most UI elements
import { PlayIcon, PauseIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'

// Solid icons for active states and emphasis
import { PlayIcon as PlayIconSolid } from '@heroicons/vue/24/solid'
</script>

<template>
  <!-- Outline for normal state -->
  <PlayIcon class="w-5 h-5" />

  <!-- Solid for active/selected state -->
  <PlayIconSolid class="w-5 h-5" />
</template>
```

### Circuit Symbols vs UI Icons

- **Circuit Components**: Use existing professional SVG symbols from `src/components/circuit/symbols/`
- **UI Elements**: Use Heroicons for interface controls (play, pause, settings, save, etc.)

## Headless UI Integration

### Dropdown Menus

```vue
<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton class="btn btn-secondary">
      Options
      <ChevronDownIcon class="w-4 h-4 ml-2" />
    </MenuButton>

    <transition>
      <MenuItems class="floating-panel">
        <MenuItem v-slot="{ active }">
          <button :class="[active ? 'bg-slate-50' : '', 'w-full text-left px-3 py-2']">
            Save Circuit
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>
```

### Modal Dialogs

```vue
<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
</script>

<template>
  <Dialog :open="isOpen" @close="setIsOpen" class="relative z-50">
    <div class="fixed inset-0 bg-black/25" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="ide-panel max-w-md">
        <DialogTitle class="ide-panel-header"> Confirm Action </DialogTitle>
        <div class="ide-panel-content">
          <!-- Dialog content -->
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
```

## Debug & Development

### Debug Information Display

```vue
<div class="debug-section">
  <div class="debug-title">Component Debug</div>
  <div class="debug-table">
    <div class="debug-row">
      <span class="debug-label">Node Index</span>
      <span class="debug-value">{{ nodeIndex }}</span>
    </div>
  </div>
</div>
```

### Scrollable Areas

```vue
<!-- Apply custom scrollbar styling -->
<div class="overflow-auto scrollbar-thin">
  <!-- Content -->
</div>
```

## Migration Strategy

### Phase 1: Foundation (Current)

- ✅ Tailwind CSS configured with circuit-specific tokens
- ✅ Component patterns established
- ✅ Demo component created
- ✅ Documentation complete

### Phase 2: Component Migration

1. Switch CSS in `main.ts` to activate new system
2. Migrate one component at a time, starting with:
   - ComponentPalette.vue
   - ComponentProperties.vue
   - Toolbar components
3. Test functionality after each migration
4. Preserve existing circuit symbol components

### Phase 3: Advanced Features

- Integrate Headless UI for complex interactions
- Add analysis workspace panels
- Enhance chart styling with Tailwind
- Implement responsive breakpoints

## Quality Guidelines

### DO ✅

- Use established component patterns (`.ide-*`, `.component-*`, `.btn`)
- Apply circuit-semantic colors (`circuit-voltage`, `simulation-running`)
- Use Heroicons for UI elements, preserve circuit symbols
- Follow Tailwind spacing patterns (`p-4`, `gap-3`, `space-y-2`)
- Maintain professional, technical aesthetic

### DON'T ❌

- Add custom CSS without extending Tailwind config
- Use inline styles or hardcoded colors
- Mix icon libraries (stick to Heroicons + circuit symbols)
- Break existing circuit simulation functionality
- Create consumer-app styling (this is a technical tool)

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Headless UI Vue Documentation](https://headlessui.com/vue/menu)
- [Heroicons Browse](https://heroicons.com/)
- [Vue 3 Composition API](https://vuejs.org/guide/composition-api.html)

---

**Next Steps**: Switch the CSS import in `main.ts` and begin component migration. The design system is ready for professional circuit simulation interface development!
