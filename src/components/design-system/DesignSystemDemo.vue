<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Design System Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Circuit Lab Design System</h1>
            <p class="text-slate-600 mt-1">Professional educational circuit simulator components</p>
          </div>
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            Tailwind v4 • 280/280 tests passing
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <!-- Navigation Sidebar -->
        <nav class="w-64 flex-shrink-0">
          <div class="bg-white rounded-lg border border-slate-200 p-4 sticky top-24">
            <h2 class="font-semibold text-slate-900 mb-4">Documentation</h2>
            <ul class="space-y-2">
              <li>
                <button
                  @click="activeSection = 'colors'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'colors'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Colors & Typography
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'components'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'components'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-400 cursor-not-allowed',
                  ]"
                  disabled
                >
                  Components & Forms
                  <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2"
                    >Phase 2</span
                  >
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'layouts'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'layouts'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-400 cursor-not-allowed',
                  ]"
                  disabled
                >
                  Layouts & Containers
                  <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2"
                    >Phase 3</span
                  >
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'guidelines'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'guidelines'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-400 cursor-not-allowed',
                  ]"
                  disabled
                >
                  Design Guidelines
                  <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2"
                    >Future</span
                  >
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1">
          <!-- Colors Section -->
          <div v-if="activeSection === 'colors'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Colors & Typography</h2>
              <p class="text-lg text-slate-600">
                Circuit Lab uses a semantic color system and professional typography designed for
                technical accuracy and educational clarity.
              </p>
            </div>

            <!-- Primary Brand Colors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Primary Brand Colors</h3>
              <p class="text-slate-600 mb-6">
                Core brand colors used for primary actions, focus states, and key UI elements.
              </p>
              <div class="grid grid-cols-5 gap-4">
                <div v-for="shade in primaryColors" :key="shade.name" class="text-center">
                  <div
                    :class="`w-20 h-20 rounded-lg border border-slate-200 mb-2 ${shade.class}`"
                    :style="{ backgroundColor: shade.hex }"
                  ></div>
                  <div class="text-sm font-medium text-slate-900">{{ shade.name }}</div>
                  <div class="text-xs text-slate-500 font-mono">{{ shade.hex }}</div>
                  <div class="text-xs text-slate-400 mt-1">{{ shade.token }}</div>
                </div>
              </div>
            </section>

            <!-- Circuit Semantic Colors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Circuit Semantic Colors</h3>
              <p class="text-slate-600 mb-6">
                Specialized colors for electrical measurements and circuit analysis. These colors
                are carefully chosen for technical accuracy and educational clarity.
              </p>
              <div class="grid grid-cols-2 gap-6">
                <div v-for="category in circuitColors" :key="category.name" class="space-y-3">
                  <h4 class="font-medium text-slate-900">{{ category.name }}</h4>
                  <div class="space-y-2">
                    <div
                      v-for="color in category.colors"
                      :key="color.name"
                      class="flex items-center gap-3"
                    >
                      <div
                        class="w-12 h-12 rounded-lg border border-slate-200 flex-shrink-0"
                        :style="{ backgroundColor: color.hex }"
                      ></div>
                      <div class="flex-1">
                        <div class="font-medium text-slate-900">{{ color.name }}</div>
                        <div class="text-sm text-slate-600">{{ color.usage }}</div>
                        <div class="text-xs text-slate-400 font-mono">
                          {{ color.token }} • {{ color.hex }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Simulation Status Colors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Simulation Status Colors</h3>
              <p class="text-slate-600 mb-6">
                Status indicators for simulation states, providing clear visual feedback during
                circuit analysis.
              </p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="status in simulationColors" :key="status.name" class="text-center">
                  <div
                    :class="`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${status.bg}`"
                  >
                    <div :class="`w-3 h-3 rounded-full ${status.dot}`"></div>
                  </div>
                  <div class="font-medium text-slate-900">{{ status.name }}</div>
                  <div class="text-sm text-slate-600">{{ status.usage }}</div>
                  <div class="text-xs text-slate-400 font-mono mt-1">{{ status.token }}</div>
                </div>
              </div>
            </section>

            <!-- Neutral Colors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Neutral Colors</h3>
              <p class="text-slate-600 mb-6">
                Slate-based neutral palette for text, backgrounds, and UI structure.
              </p>
              <div class="grid grid-cols-5 gap-4">
                <div v-for="shade in neutralColors" :key="shade.name" class="text-center">
                  <div
                    :class="`w-20 h-20 rounded-lg border mb-2 ${shade.class}`"
                    :style="{
                      backgroundColor: shade.hex,
                      borderColor: shade.name === 'slate-50' ? '#e2e8f0' : shade.hex,
                    }"
                  ></div>
                  <div class="text-sm font-medium text-slate-900">{{ shade.name }}</div>
                  <div class="text-xs text-slate-500 font-mono">{{ shade.hex }}</div>
                  <div class="text-xs text-slate-400 mt-1">{{ shade.usage }}</div>
                </div>
              </div>
            </section>

            <!-- Usage Examples -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Color Usage Examples</h3>
              <p class="text-slate-600 mb-6">
                Live examples showing how colors are applied in actual circuit simulation context.
              </p>
              <div class="space-y-6">
                <!-- Measurement Display Example -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Circuit Measurements</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <div class="text-sm text-slate-600">Voltage</div>
                      <div class="voltage-display font-mono text-lg font-semibold">5.00 V</div>
                    </div>
                    <div class="space-y-2">
                      <div class="text-sm text-slate-600">Current</div>
                      <div class="current-display font-mono text-lg font-semibold">2.50 mA</div>
                    </div>
                    <div class="space-y-2">
                      <div class="text-sm text-slate-600">Resistance</div>
                      <div class="resistance-display font-mono text-lg font-semibold">2.00 kΩ</div>
                    </div>
                    <div class="space-y-2">
                      <div class="text-sm text-slate-600">Power</div>
                      <div class="power-display font-mono text-lg font-semibold">12.5 mW</div>
                    </div>
                  </div>
                </div>

                <!-- Status Indicators Example -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Simulation Status</h4>
                  <div class="flex items-center gap-4 flex-wrap">
                    <div class="simulation-status idle">
                      <div class="w-2 h-2 bg-slate-500 rounded-full"></div>
                      Idle
                    </div>
                    <div class="simulation-status running">
                      <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      Running
                    </div>
                    <div class="simulation-status success">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Converged
                    </div>
                    <div class="simulation-status error">
                      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                      Error
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Typography System -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Typography System</h3>
              <p class="text-slate-600 mb-6">
                Professional typography optimized for technical content and educational clarity.
              </p>

              <!-- Font Families -->
              <div class="mb-8">
                <h4 class="font-medium text-slate-900 mb-4">Font Families</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-semibold text-slate-900 mb-2">Sans-serif (UI)</h5>
                    <div class="font-sans text-lg mb-2">Inter</div>
                    <div class="text-sm text-slate-600 mb-3">
                      Clean, readable interface typography
                    </div>
                    <div class="text-xs text-slate-400 font-mono">var(--font-family-sans)</div>
                    <div class="text-xs text-slate-400">'Inter', system-ui, sans-serif</div>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-semibold text-slate-900 mb-2">Monospace (Technical)</h5>
                    <div class="font-mono text-lg mb-2">JetBrains Mono</div>
                    <div class="text-sm text-slate-600 mb-3">
                      Technical content, measurements, code
                    </div>
                    <div class="text-xs text-slate-400 font-mono">var(--font-family-mono)</div>
                    <div class="text-xs text-slate-400">'JetBrains Mono', 'Monaco', monospace</div>
                  </div>
                </div>
              </div>

              <!-- Type Scale -->
              <div class="mb-8">
                <h4 class="font-medium text-slate-900 mb-4">Type Scale</h4>
                <div class="space-y-4">
                  <div
                    v-for="size in typeSizes"
                    :key="size.name"
                    class="flex items-baseline gap-6 py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <div class="w-20 text-xs text-slate-500 font-mono">{{ size.class }}</div>
                    <div :class="`${size.class} font-medium text-slate-900`">{{ size.name }}</div>
                    <div class="text-xs text-slate-400 ml-auto">
                      {{ size.size }} • {{ size.usage }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Font Weights -->
              <div class="mb-8">
                <h4 class="font-medium text-slate-900 mb-4">Font Weights</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div
                    v-for="weight in fontWeights"
                    :key="weight.name"
                    class="text-center p-3 bg-slate-50 rounded-lg"
                  >
                    <div :class="`text-lg mb-1 ${weight.class}`">{{ weight.name }}</div>
                    <div class="text-xs text-slate-500 font-mono">{{ weight.value }}</div>
                    <div class="text-xs text-slate-400 mt-1">{{ weight.usage }}</div>
                  </div>
                </div>
              </div>

              <!-- Typography Examples -->
              <div>
                <h4 class="font-medium text-slate-900 mb-4">Usage Examples</h4>
                <div class="space-y-6">
                  <!-- Interface Typography -->
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <h5 class="font-medium text-slate-900 mb-3">Interface Typography</h5>
                    <div class="space-y-3">
                      <h1 class="text-2xl font-bold text-slate-900">Page Heading</h1>
                      <h2 class="text-xl font-semibold text-slate-900">Section Title</h2>
                      <h3 class="text-lg font-medium text-slate-900">Subsection</h3>
                      <p class="text-base text-slate-600">
                        Body text for descriptions and explanations. This uses the Inter font family
                        for optimal readability in user interface contexts.
                      </p>
                      <div class="text-sm text-slate-500">Secondary text and captions</div>
                      <div class="text-xs text-slate-400">Small text and metadata</div>
                    </div>
                  </div>

                  <!-- Technical Typography -->
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <h5 class="font-medium text-slate-900 mb-3">Technical Typography</h5>
                    <div class="space-y-3">
                      <div class="space-y-2">
                        <div class="text-sm text-slate-600">Component Values</div>
                        <div class="grid grid-cols-2 gap-4">
                          <div class="font-mono text-sm">
                            <span class="text-slate-500">R1:</span>
                            <span class="font-semibold">1.00 kΩ</span>
                          </div>
                          <div class="font-mono text-sm">
                            <span class="text-slate-500">V1:</span>
                            <span class="voltage-display font-semibold">5.00 V</span>
                          </div>
                          <div class="font-mono text-sm">
                            <span class="text-slate-500">I:</span>
                            <span class="current-display font-semibold">5.00 mA</span>
                          </div>
                          <div class="font-mono text-sm">
                            <span class="text-slate-500">P:</span>
                            <span class="power-display font-semibold">25.0 mW</span>
                          </div>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-sm text-slate-600">Debug Information</div>
                        <div class="font-mono text-xs text-slate-500 bg-white p-2 rounded border">
                          Node[0]: 5.0000V<br />
                          Node[1]: 0.0000V<br />
                          Matrix[2x2]: Solved in 0.15ms
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Placeholder for Future Sections -->
          <div v-else class="text-center py-12">
            <div class="text-slate-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-2">Coming in Future Phases</h3>
            <p class="text-slate-600">This section will be available in upcoming iterations.</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeSection = ref('colors')

const primaryColors = [
  { name: 'primary-400', hex: '#60a5fa', token: '--color-primary-400', class: 'bg-blue-400' },
  { name: 'primary-500', hex: '#3b82f6', token: '--color-primary-500', class: 'bg-blue-500' },
  { name: 'primary-600', hex: '#2563eb', token: '--color-primary-600', class: 'bg-blue-600' },
  { name: 'primary-700', hex: '#1d4ed8', token: '--color-primary-700', class: 'bg-blue-700' },
  { name: 'primary-800', hex: '#1e40af', token: '--color-primary-800', class: 'bg-blue-800' },
]

const circuitColors = [
  {
    name: 'Electrical Measurements',
    colors: [
      {
        name: 'Voltage',
        hex: '#dc2626',
        token: '--color-circuit-voltage',
        usage: 'Voltage measurements and indicators',
      },
      {
        name: 'Current',
        hex: '#059669',
        token: '--color-circuit-current',
        usage: 'Current flow and measurements',
      },
      {
        name: 'Resistance',
        hex: '#7c3aed',
        token: '--color-circuit-resistance',
        usage: 'Resistance values and impedance',
      },
      {
        name: 'Power',
        hex: '#ea580c',
        token: '--color-circuit-power',
        usage: 'Power calculations and dissipation',
      },
    ],
  },
  {
    name: 'Circuit Elements',
    colors: [
      {
        name: 'Ground',
        hex: '#374151',
        token: '--color-circuit-ground',
        usage: 'Ground references and connections',
      },
      {
        name: 'Active',
        hex: '#10b981',
        token: '--color-circuit-active',
        usage: 'Active components and connections',
      },
      {
        name: 'Inactive',
        hex: '#6b7280',
        token: '--color-circuit-inactive',
        usage: 'Inactive or disabled elements',
      },
      {
        name: 'Warning',
        hex: '#f59e0b',
        token: '--color-circuit-warning',
        usage: 'Warnings and caution states',
      },
    ],
  },
]

const simulationColors = [
  {
    name: 'Idle',
    hex: '#6b7280',
    token: '--color-simulation-idle',
    usage: 'Simulation not running',
    bg: 'bg-slate-100',
    dot: 'bg-slate-500',
  },
  {
    name: 'Running',
    hex: '#f59e0b',
    token: '--color-simulation-running',
    usage: 'Simulation in progress',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  {
    name: 'Success',
    hex: '#10b981',
    token: '--color-simulation-success',
    usage: 'Simulation converged',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    name: 'Error',
    hex: '#dc2626',
    token: '--color-simulation-error',
    usage: 'Simulation failed',
    bg: 'bg-red-100',
    dot: 'bg-red-500',
  },
]

const neutralColors = [
  { name: 'slate-50', hex: '#f8fafc', usage: 'Light backgrounds', class: 'bg-slate-50' },
  { name: 'slate-100', hex: '#f1f5f9', usage: 'Panel backgrounds', class: 'bg-slate-100' },
  { name: 'slate-200', hex: '#e2e8f0', usage: 'Borders and dividers', class: 'bg-slate-200' },
  { name: 'slate-600', hex: '#475569', usage: 'Secondary text', class: 'bg-slate-600' },
  { name: 'slate-900', hex: '#0f172a', usage: 'Primary text', class: 'bg-slate-900' },
]

const typeSizes = [
  { name: 'Large Heading', class: 'text-3xl', size: '1.875rem (30px)', usage: 'Page titles' },
  { name: 'Medium Heading', class: 'text-2xl', size: '1.5rem (24px)', usage: 'Section titles' },
  { name: 'Small Heading', class: 'text-xl', size: '1.25rem (20px)', usage: 'Subsections' },
  { name: 'Large Text', class: 'text-lg', size: '1.125rem (18px)', usage: 'Emphasized content' },
  { name: 'Body Text', class: 'text-base', size: '1rem (16px)', usage: 'Default body text' },
  { name: 'Small Text', class: 'text-sm', size: '0.875rem (14px)', usage: 'Captions, labels' },
  { name: 'Extra Small', class: 'text-xs', size: '0.75rem (12px)', usage: 'Metadata, fine print' },
]

const fontWeights = [
  { name: 'Light', class: 'font-light', value: '300', usage: 'Subtle text' },
  { name: 'Regular', class: 'font-normal', value: '400', usage: 'Body text' },
  { name: 'Medium', class: 'font-medium', value: '500', usage: 'Emphasis' },
  { name: 'Semibold', class: 'font-semibold', value: '600', usage: 'Headings' },
  { name: 'Bold', class: 'font-bold', value: '700', usage: 'Strong emphasis' },
]
</script>
