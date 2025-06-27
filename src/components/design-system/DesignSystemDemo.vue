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
            Tailwind v4
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
                  Colors
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'typography'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'typography'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Typography
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'cursors'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'cursors'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Mouse Cursors
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
                  @click="activeSection = 'charts'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'charts'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-400 cursor-not-allowed',
                  ]"
                  disabled
                >
                  Charts & Visualizations
                  <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2"
                    >Chart.js</span
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
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Colors</h2>
              <p class="text-lg text-slate-600">
                Circuit Lab uses a semantic color system designed for technical accuracy and
                educational clarity.
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
          </div>

          <!-- Typography Section -->
          <div v-if="activeSection === 'typography'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Typography</h2>
              <p class="text-lg text-slate-600">
                Professional typography system optimized for technical content and educational
                clarity.
              </p>
            </div>

            <!-- Font Families -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Font Families</h3>
              <p class="text-slate-600 mb-6">
                Two carefully chosen font families optimized for technical applications.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="text-sm font-semibold text-slate-900 mb-2">Sans-serif (UI)</h4>
                  <div class="font-sans text-lg mb-2">Inter</div>
                  <div class="text-sm text-slate-600 mb-3">
                    Clean, readable interface typography
                  </div>
                  <div class="text-xs text-slate-400 font-mono">var(--font-family-sans)</div>
                  <div class="text-xs text-slate-400">'Inter', system-ui, sans-serif</div>
                </div>
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="text-sm font-semibold text-slate-900 mb-2">Monospace (Technical)</h4>
                  <div class="font-mono text-lg mb-2">JetBrains Mono</div>
                  <div class="text-sm text-slate-600 mb-3">
                    Technical content, measurements, code
                  </div>
                  <div class="text-xs text-slate-400 font-mono">var(--font-family-mono)</div>
                  <div class="text-xs text-slate-400">'JetBrains Mono', 'Monaco', monospace</div>
                </div>
              </div>
            </section>

            <!-- Type Scale -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Type Scale</h3>
              <p class="text-slate-600 mb-6">
                Harmonious scale providing clear hierarchy for interface and content elements.
              </p>
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
            </section>

            <!-- Font Weights -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Font Weights</h3>
              <p class="text-slate-600 mb-6">
                Strategic weight selection for clear visual hierarchy and emphasis.
              </p>
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
            </section>

            <!-- Typography Examples -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Usage Examples</h3>
              <p class="text-slate-600 mb-6">
                Real examples showing typography in context with circuit simulation content.
              </p>
              <div class="space-y-6">
                <!-- Interface Typography -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Interface Typography</h4>
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
                  <h4 class="font-medium text-slate-900 mb-3">Technical Typography</h4>
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
            </section>
          </div>

          <!-- Mouse Cursors Section -->
          <div v-if="activeSection === 'cursors'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Mouse Cursors</h2>
              <p class="text-lg text-slate-600">
                Strategic cursor selection that communicates interaction affordances and tool states
                in the circuit simulation environment.
              </p>
            </div>

            <!-- Default System Cursors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Default System Cursors</h3>
              <p class="text-slate-600 mb-6">
                Standard cursor states for common interface interactions.
              </p>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  v-for="cursor in defaultCursors"
                  :key="cursor.name"
                  class="p-4 bg-slate-50 rounded-lg text-center"
                >
                  <div
                    :class="`w-16 h-16 mx-auto mb-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-50 ${cursor.class}`"
                  >
                    <div class="text-xs text-slate-400 font-medium">HOVER</div>
                  </div>
                  <div class="font-medium text-slate-900 mb-1">{{ cursor.name }}</div>
                  <div class="text-sm text-slate-600 mb-2">{{ cursor.usage }}</div>
                  <div class="text-xs text-slate-400 font-mono">{{ cursor.css }}</div>
                </div>
              </div>
            </section>

            <!-- Circuit-Specific Cursors -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Circuit-Specific Cursors</h3>
              <p class="text-slate-600 mb-6">
                Specialized cursors for circuit editing and analysis tools.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-for="category in circuitCursors" :key="category.name" class="space-y-3">
                  <h4 class="font-medium text-slate-900">{{ category.name }}</h4>
                  <div class="space-y-3">
                    <div
                      v-for="cursor in category.cursors"
                      :key="cursor.name"
                      class="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                    >
                      <div
                        class="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <component
                          v-if="cursor.component"
                          :is="cursor.component"
                          class="w-4 h-4 text-slate-600"
                        />
                        <div v-else class="w-4 h-4 text-slate-600">
                          <!-- Simple cross for crosshair -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M12 3v18m9-9H3"
                            />
                          </svg>
                        </div>
                      </div>
                      <div class="flex-1">
                        <div class="font-medium text-slate-900">{{ cursor.name }}</div>
                        <div class="text-sm text-slate-600">{{ cursor.usage }}</div>
                        <div class="text-xs text-slate-400 font-mono">{{ cursor.css }}</div>
                        <div class="text-xs text-blue-600 mt-1">
                          Lucide Icon: {{ cursor.lucideIcon }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Interactive Examples (Simplified) -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Interactive Examples</h3>
              <p class="text-slate-600 mb-6">
                Hover over each area to experience the cursor behavior in context.
              </p>
              <div class="space-y-6">
                <!-- Component Palette Example -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Component Palette</h4>
                  <div class="grid grid-cols-3 gap-3">
                    <div
                      class="cursor-pointer p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div class="text-center">
                        <div
                          class="w-8 h-8 mx-auto mb-2 text-purple-600 flex items-center justify-center"
                        >
                          <ResistorSymbol class="w-6 h-6" />
                        </div>
                        <div class="text-xs text-slate-600">Resistor</div>
                      </div>
                    </div>
                    <div
                      class="cursor-pointer p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div class="text-center">
                        <div
                          class="w-8 h-8 mx-auto mb-2 text-red-600 flex items-center justify-center"
                        >
                          <VoltageSourceSymbol class="w-6 h-6" />
                        </div>
                        <div class="text-xs text-slate-600">Voltage Source</div>
                      </div>
                    </div>
                    <div
                      class="cursor-not-allowed p-3 bg-slate-100 border border-slate-200 rounded-lg opacity-50"
                    >
                      <div class="text-center">
                        <div
                          class="w-8 h-8 mx-auto mb-2 text-slate-400 flex items-center justify-center"
                        >
                          <X class="w-6 h-6" />
                        </div>
                        <div class="text-xs text-slate-600">Disabled</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Circuit Canvas Example (Standard Cursors) -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Circuit Canvas Tools</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                      class="cursor-crosshair-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <Crosshair class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Measurement</div>
                    </div>
                    <div
                      class="cursor-grab-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <Grab class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Pan Canvas</div>
                    </div>
                    <div
                      class="cursor-move-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <Move class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Move Component</div>
                    </div>
                    <div
                      class="cursor-nwse-resize-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <MoveDiagonal class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Resize Component</div>
                    </div>
                    <div
                      class="cursor-help p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <HelpCircle class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Info Mode</div>
                    </div>
                  </div>
                </div>

                <!-- Form Controls Example -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">Form Controls</h4>
                  <div class="space-y-3">
                    <input
                      type="text"
                      placeholder="Component value (cursor: text)"
                      class="w-full px-3 py-2 border border-slate-300 rounded-md cursor-text"
                    />
                    <select
                      class="w-full px-3 py-2 border border-slate-300 rounded-md cursor-pointer"
                    >
                      <option>Select tolerance (cursor: pointer)</option>
                      <option>5%</option>
                      <option>1%</option>
                    </select>
                    <button
                      class="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Simulate Circuit
                    </button>
                    <button
                      disabled
                      class="px-4 py-2 bg-slate-200 text-slate-400 rounded-md cursor-not-allowed"
                    >
                      Disabled Action
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- SVG Extraction Tool -->
            <section class="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 class="text-xl font-semibold text-green-900 mb-4">🔍 SVG Extraction Tool</h3>
              <p class="text-green-800 mb-4">
                Click the button below to extract the actual SVG paths from the rendered Lucide
                icons.
              </p>
              <button
                @click="extractSVGs"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
              >
                Extract SVG Paths
              </button>
              <div v-if="extractedSVGs.length > 0" class="space-y-4">
                <div
                  v-for="svg in extractedSVGs"
                  :key="svg.name"
                  class="bg-white p-4 rounded border"
                >
                  <h4 class="font-medium text-green-900 mb-2">{{ svg.name }}</h4>
                  <pre
                    class="text-xs bg-gray-100 p-2 rounded overflow-x-auto"
                  ><code>{{ svg.content }}</code></pre>
                </div>
              </div>
            </section>

            <!-- Diagnostic Info -->
            <section class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 class="text-xl font-semibold text-blue-900 mb-4">🔧 Troubleshooting Mode</h3>
              <p class="text-blue-800 mb-4">
                This is a simplified version to help identify visual issues. Complex inline SVG
                cursors have been temporarily removed.
              </p>
              <div class="space-y-2 text-sm text-blue-700">
                <div><strong>What to check:</strong></div>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>Do the SVG icons render correctly in the circuit cursor section?</li>
                  <li>Do standard cursors (crosshair, grab, move, help) work when hovering?</li>
                  <li>Are there any layout issues or overlapping elements?</li>
                  <li>Do the hover states and transitions work properly?</li>
                </ul>
              </div>
            </section>
          </div>

          <!-- Placeholder for Future Sections -->
          <div v-else class="text-center py-12">
            <div class="text-slate-400 mb-4">
              <X class="w-16 h-16 mx-auto" />
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-2">Coming in Future Phases</h3>
            <p class="text-slate-600">This section will be available in upcoming iterations.</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom High-DPI Cursor Definitions using actual Lucide SVG paths */
.cursor-crosshair-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cline x1='22' x2='18' y1='12' y2='12'%3e%3c/line%3e%3cline x1='6' x2='2' y1='12' y2='12'%3e%3c/line%3e%3cline x1='12' x2='12' y1='6' y2='2'%3e%3c/line%3e%3cline x1='12' x2='12' y1='22' y2='18'%3e%3c/line%3e%3c/svg%3e")
      12 12,
    crosshair;
}

.cursor-grab-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4'%3e%3c/path%3e%3cpath d='M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2'%3e%3c/path%3e%3cpath d='M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5'%3e%3c/path%3e%3cpath d='M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2'%3e%3c/path%3e%3cpath d='M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0'%3e%3c/path%3e%3c/svg%3e")
      12 12,
    grab;
}

.cursor-move-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 2v20'%3e%3c/path%3e%3cpath d='m15 19-3 3-3-3'%3e%3c/path%3e%3cpath d='m19 9 3 3-3 3'%3e%3c/path%3e%3cpath d='M2 12h20'%3e%3c/path%3e%3cpath d='m5 9-3 3 3 3'%3e%3c/path%3e%3cpath d='m9 5 3-3 3 3'%3e%3c/path%3e%3c/svg%3e")
      12 12,
    move;
}

.cursor-nwse-resize-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M11 19H5v-6'%3e%3c/path%3e%3cpath d='M13 5h6v6'%3e%3c/path%3e%3cpath d='M19 5 5 19'%3e%3c/path%3e%3c/svg%3e")
      12 12,
    nwse-resize;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Crosshair,
  Grab,
  Move,
  MoveDiagonal,
  ArrowLeftRight,
  ArrowUpDown,
  HelpCircle,
  X,
} from 'lucide-vue-next'
import ResistorSymbol from '@/components/circuit/symbols/ResistorSymbol.vue'
import VoltageSourceSymbol from '@/components/circuit/symbols/VoltageSourceSymbol.vue'

const activeSection = ref('colors')
const extractedSVGs = ref<Array<{ name: string; content: string }>>([])

const extractSVGs = () => {
  const svgData: Array<{ name: string; content: string }> = []

  // Find all Lucide icons in the Circuit-Specific Cursors section
  const cursorIcons = [
    { name: 'Crosshair', selector: 'svg' },
    { name: 'Grab', selector: 'svg' },
    { name: 'Move', selector: 'svg' },
    { name: 'MoveDiagonal', selector: 'svg' },
    { name: 'ArrowLeftRight', selector: 'svg' },
    { name: 'ArrowUpDown', selector: 'svg' },
  ]

  cursorIcons.forEach((icon) => {
    // Try to find the SVG element for this icon
    const svgElements = document.querySelectorAll('svg')
    svgElements.forEach((svg) => {
      // Check if this SVG has the expected structure
      if (svg.innerHTML && svg.innerHTML.includes('stroke')) {
        const outerHTML = svg.outerHTML
        if (!svgData.some((item) => item.content === outerHTML)) {
          svgData.push({
            name: icon.name,
            content: outerHTML,
          })
        }
      }
    })
  })

  extractedSVGs.value = svgData
}

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

const defaultCursors = [
  {
    name: 'Default',
    class: 'cursor-default',
    css: 'cursor: default',
    usage: 'Standard arrow pointer',
  },
  {
    name: 'Pointer',
    class: 'cursor-pointer',
    css: 'cursor: pointer',
    usage: 'Interactive elements',
  },
  { name: 'Text', class: 'cursor-text', css: 'cursor: text', usage: 'Text selection and input' },
  { name: 'Wait', class: 'cursor-wait', css: 'cursor: wait', usage: 'Loading or processing' },
  {
    name: 'Not Allowed',
    class: 'cursor-not-allowed',
    css: 'cursor: not-allowed',
    usage: 'Disabled or forbidden',
  },
  { name: 'Help', class: 'cursor-help', css: 'cursor: help', usage: 'Contextual help available' },
]

const circuitCursors = [
  {
    name: 'Canvas Tools',
    cursors: [
      {
        name: 'Crosshair',
        class: 'cursor-crosshair-hd',
        css: "cursor: url('data:image/svg+xml;utf8,<svg...>') 10 10, crosshair",
        usage: 'Precision measurements and probing',
        lucideIcon: 'Crosshair',
        component: Crosshair,
      },
      {
        name: 'Grab',
        class: 'cursor-grab-hd',
        css: "cursor: url('data:image/svg+xml;utf8,<svg...>') 10 10, grab",
        usage: 'Pan canvas or viewport',
        lucideIcon: 'Grab',
        component: Grab,
      },
      {
        name: 'Move',
        class: 'cursor-move-hd',
        css: "cursor: url('data:image/svg+xml;utf8,<svg...>') 10 10, move",
        usage: 'Move components or elements',
        lucideIcon: 'Move',
        component: Move,
      },
    ],
  },
  {
    name: 'Editing Tools',
    cursors: [
      {
        name: 'Resize NW-SE',
        class: 'cursor-nwse-resize-hd',
        css: "cursor: url('data:image/svg+xml;utf8,<svg...>') 10 10, nwse-resize",
        usage: 'Resize component boundaries',
        lucideIcon: 'MoveDiagonal',
        component: MoveDiagonal,
      },
      {
        name: 'Column Resize',
        class: 'cursor-col-resize',
        css: 'cursor: col-resize',
        usage: 'Adjust panel widths',
        lucideIcon: 'ArrowLeftRight',
        component: ArrowLeftRight,
      },
      {
        name: 'Row Resize',
        class: 'cursor-row-resize',
        css: 'cursor: row-resize',
        usage: 'Adjust panel heights',
        lucideIcon: 'ArrowUpDown',
        component: ArrowUpDown,
      },
    ],
  },
]
</script>
