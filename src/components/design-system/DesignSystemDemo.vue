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
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Components & Forms
                </button>
              </li>
              <li>
                <button
                  @click="activeSection = 'charts'"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-md transition-colors',
                    activeSection === 'charts'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Charts & Visualizations
                  <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded ml-2"
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
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ]"
                >
                  Layouts & Containers
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
        <main class="flex-1 min-w-0 overflow-x-auto">
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
                      Running Analysis
                    </div>
                    <div class="ml-auto text-sm text-slate-500">Circuit Lab v2.1.0</div>
                    <div class="simulation-status success">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Analysis Complete
                    </div>
                    <div class="simulation-status error">
                      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                      Simulation Error
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
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                      class="cursor-col-resize-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-4 h-4 mx-auto mb-2 text-slate-600">
                        <ArrowLeftRight class="w-4 h-4" />
                      </div>
                      <div class="text-xs text-slate-600">Resize Panel</div>
                    </div>
                    <div
                      class="cursor-help-hd p-4 bg-white border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition-colors"
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
          </div>

          <!-- Components & Forms Section -->
          <div v-if="activeSection === 'components'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Components & Forms</h2>
              <p class="text-lg text-slate-600">
                Professional component library for circuit simulation interfaces, optimized for
                technical accuracy and educational clarity.
              </p>
            </div>

            <!-- Button System -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Button System</h3>
              <p class="text-slate-600 mb-6">
                Comprehensive button system with semantic variants for different action types and
                contexts.
              </p>

              <!-- Button Variants -->
              <div class="space-y-6">
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Primary Variants</h4>
                  <div class="flex items-center gap-3 flex-wrap">
                    <button class="btn btn-primary">
                      <Play class="w-4 h-4 mr-2" />
                      Start Simulation
                    </button>
                    <button class="btn btn-secondary">
                      <Pause class="w-4 h-4 mr-2" />
                      Pause Analysis
                    </button>
                    <button class="btn btn-ghost">
                      <RotateCcw class="w-4 h-4 mr-2" />
                      Reset Circuit
                    </button>
                  </div>
                  <div class="mt-3 space-y-1 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.btn .btn-primary</code>
                      - Primary actions (simulation, save)
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.btn .btn-secondary</code
                      >
                      - Secondary actions (pause, cancel)
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.btn .btn-ghost</code> -
                      Subtle actions (reset, clear)
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Size & Icon Variants</h4>
                  <div class="flex items-center gap-3 flex-wrap">
                    <button class="btn btn-primary">Default Size</button>
                    <button class="btn btn-primary btn-sm">Small Button</button>
                    <button class="btn btn-icon">
                      <Settings class="w-5 h-5" />
                    </button>
                    <button class="btn btn-secondary btn-icon">
                      <Save class="w-5 h-5" />
                    </button>
                  </div>
                  <div class="mt-3 space-y-1 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.btn .btn-sm</code> -
                      Compact buttons for dense layouts
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.btn .btn-icon</code> -
                      Icon-only buttons for toolbars
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Button States</h4>
                  <div class="flex items-center gap-3 flex-wrap">
                    <button class="btn btn-primary">Normal</button>
                    <button class="btn btn-primary" disabled>Disabled</button>
                    <button class="btn btn-secondary">Normal Secondary</button>
                    <button class="btn btn-secondary" disabled>Disabled Secondary</button>
                  </div>
                  <div class="mt-3 text-sm text-slate-500">
                    <div>
                      Disabled state automatically applies
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >opacity-50 cursor-not-allowed</code
                      >
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Form Components -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Form Components</h3>
              <p class="text-slate-600 mb-6">
                Consistent form patterns for component properties, circuit parameters, and analysis
                controls.
              </p>

              <div class="space-y-6">
                <!-- Property Fields -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Property Fields</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                      <div class="property-field">
                        <label class="property-label">Resistance Value</label>
                        <input
                          class="property-input"
                          type="number"
                          value="1000"
                          placeholder="Enter value"
                        />
                      </div>
                      <div class="property-field">
                        <label class="property-label">Component Label</label>
                        <input
                          class="property-input"
                          type="text"
                          value="R1"
                          placeholder="Component ID"
                        />
                      </div>
                      <div class="property-field">
                        <label class="property-label">Tolerance</label>
                        <select class="property-input">
                          <option value="5">5%</option>
                          <option value="1">1%</option>
                          <option value="0.1">0.1%</option>
                        </select>
                      </div>
                    </div>
                    <div class="space-y-4">
                      <div class="property-field">
                        <label class="property-label">Calculated Voltage</label>
                        <div class="property-value voltage-display">3.33 V</div>
                      </div>
                      <div class="property-field">
                        <label class="property-label">Calculated Current</label>
                        <div class="property-value current-display">3.33 mA</div>
                      </div>
                      <div class="property-field">
                        <label class="property-label">Status</label>
                        <div class="property-value">Connected</div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.property-field</code> -
                      Container for label + input pairs
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.property-label</code> -
                      Consistent labeling
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.property-input</code> -
                      Text inputs, selects, numbers with focus styles
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.property-value</code> -
                      Read-only displays with monospace font
                    </div>
                  </div>
                </div>

                <!-- Property Sections -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Property Panel Layout</h4>
                  <div class="properties-panel w-full max-w-md">
                    <div class="property-section">
                      <div class="property-section-title">Component Properties</div>
                      <div class="property-field">
                        <label class="property-label">Resistance</label>
                        <input class="property-input" type="number" value="2200" />
                      </div>
                      <div class="property-field">
                        <label class="property-label">Power Rating</label>
                        <input class="property-input" type="number" value="0.25" />
                      </div>
                    </div>
                    <div class="property-section">
                      <div class="property-section-title">Analysis Results</div>
                      <div class="property-field">
                        <label class="property-label">Node Voltage</label>
                        <div class="property-value voltage-display">2.75 V</div>
                      </div>
                      <div class="property-field">
                        <label class="property-label">Power Dissipation</label>
                        <div class="property-value power-display">3.44 mW</div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.properties-panel</code>
                      - Right panel container
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.property-section</code>
                      - Grouped property sections
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.property-section-title</code
                      >
                      - Section headers
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Measurement Displays -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Measurement Displays</h3>
              <p class="text-slate-600 mb-6">
                Specialized displays for electrical measurements with semantic colors and
                professional formatting.
              </p>

              <div class="space-y-6">
                <!-- Live Measurements -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Electrical Measurements</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-slate-50 rounded-lg">
                      <div class="text-sm text-slate-600 mb-1">Node Voltage</div>
                      <div class="voltage-display text-xl font-mono">5.00 V</div>
                    </div>
                    <div class="text-center p-4 bg-slate-50 rounded-lg">
                      <div class="text-sm text-slate-600 mb-1">Branch Current</div>
                      <div class="current-display text-xl font-mono">2.27 mA</div>
                    </div>
                    <div class="text-center p-4 bg-slate-50 rounded-lg">
                      <div class="text-sm text-slate-600 mb-1">Resistance</div>
                      <div class="resistance-display text-xl font-mono">2.20 kΩ</div>
                    </div>
                    <div class="text-center p-4 bg-slate-50 rounded-lg">
                      <div class="text-sm text-slate-600 mb-1">Power</div>
                      <div class="power-display text-xl font-mono">11.4 mW</div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.voltage-display</code> -
                      Red color for voltage measurements
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.current-display</code> -
                      Green color for current measurements
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.resistance-display</code
                      >
                      - Purple color for resistance values
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.power-display</code> -
                      Orange color for power calculations
                    </div>
                  </div>
                </div>

                <!-- Component Values -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Component Values in Context</h4>
                  <div class="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-slate-600">R1 (2.2kΩ):</span>
                      <div class="flex gap-4">
                        <span class="voltage-display font-mono text-sm">V = 5.00V</span>
                        <span class="current-display font-mono text-sm">I = 2.27mA</span>
                        <span class="power-display font-mono text-sm">P = 11.4mW</span>
                      </div>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-slate-600">R2 (1.0kΩ):</span>
                      <div class="flex gap-4">
                        <span class="voltage-display font-mono text-sm">V = 2.27V</span>
                        <span class="current-display font-mono text-sm">I = 2.27mA</span>
                        <span class="power-display font-mono text-sm">P = 5.15mW</span>
                      </div>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-slate-600">LED1 (Red):</span>
                      <div class="flex gap-4">
                        <span class="voltage-display font-mono text-sm">Vf = 2.1V</span>
                        <span class="current-display font-mono text-sm">If = 15.2mA</span>
                        <span class="power-display font-mono text-sm">P = 31.9mW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Simulation Status -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Simulation Status</h3>
              <p class="text-slate-600 mb-6">
                Status indicators providing clear visual feedback during circuit analysis and
                simulation.
              </p>

              <div class="space-y-6">
                <!-- Status Variants -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Status Indicators</h4>
                  <div class="flex items-center gap-4 flex-wrap">
                    <div class="simulation-status idle">
                      <div class="w-2 h-2 bg-slate-500 rounded-full"></div>
                      Simulation Idle
                    </div>
                    <div class="simulation-status running">
                      <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      Running Analysis
                    </div>
                    <div class="simulation-status success">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Analysis Complete
                    </div>
                    <div class="simulation-status error">
                      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                      Simulation Error
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.simulation-status</code>
                      - Base status indicator with rounded pill styling
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.idle .running .success .error</code
                      >
                      - State modifiers with semantic colors
                    </div>
                  </div>
                </div>

                <!-- Status in Context -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Status in Application Context</h4>
                  <div class="p-4 bg-slate-50 rounded-lg space-y-4">
                    <!-- Toolbar Status -->
                    <div class="flex items-center justify-between p-3 bg-white rounded border">
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium">Circuit Simulation</span>
                        <div class="simulation-status running">
                          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                          Running
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button class="btn btn-ghost btn-sm">
                          <Pause class="w-4 h-4" />
                        </button>
                        <button class="btn btn-secondary btn-sm">Stop</button>
                      </div>
                    </div>

                    <!-- Analysis Panel Status -->
                    <div class="p-3 bg-white rounded border">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Parameter Analysis</span>
                        <div class="simulation-status success">
                          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          Complete
                        </div>
                      </div>
                      <div class="text-xs text-slate-500">
                        Swept R1 from 1kΩ to 10kΩ in 50 steps • Analysis time: 145ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Debug Components -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Debug Components</h3>
              <p class="text-slate-600 mb-6">
                Technical information displays for development and troubleshooting.
              </p>

              <div class="space-y-6">
                <!-- Debug Section -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Debug Information Display</h4>
                  <div class="debug-section max-w-md">
                    <div class="debug-title">Component Debug Information</div>
                    <div class="debug-table">
                      <div class="debug-row">
                        <span class="debug-label">Component ID</span>
                        <span class="debug-value">resistor_001</span>
                      </div>
                      <div class="debug-row">
                        <span class="debug-label">Node A</span>
                        <span class="debug-value">node_002</span>
                      </div>
                      <div class="debug-row">
                        <span class="debug-label">Node B</span>
                        <span class="debug-value">node_ground</span>
                      </div>
                      <div class="debug-row">
                        <span class="debug-label">Matrix Row</span>
                        <span class="debug-value">2</span>
                      </div>
                      <div class="debug-row">
                        <span class="debug-label">Stamp Value</span>
                        <span class="debug-value">4.55e-4</span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.debug-section</code> -
                      Debug information container
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.debug-title</code> -
                      Section title styling
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.debug-table, .debug-row</code
                      >
                      - Key-value pair layout
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.debug-label, .debug-value</code
                      >
                      - Label and value styling
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Component Integration Examples -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Integration Examples</h3>
              <p class="text-slate-600 mb-6">
                Real-world examples showing how components work together in the circuit simulation
                interface.
              </p>

              <div class="space-y-6">
                <!-- Component Palette Example -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Component Palette</h4>
                  <div class="component-palette max-w-sm bg-white border rounded-lg">
                    <div class="component-group">
                      <div class="component-group-title">Basic Components</div>
                      <div class="component-list">
                        <div class="component-item active">
                          <div class="component-icon text-purple-600">
                            <ResistorSymbol class="w-5 h-5" />
                          </div>
                          <span class="component-label">Resistor</span>
                        </div>
                        <div class="component-item">
                          <div class="component-icon text-red-600">
                            <VoltageSourceSymbol class="w-5 h-5" />
                          </div>
                          <span class="component-label">Voltage Source</span>
                        </div>
                        <div class="component-item">
                          <div class="component-icon text-slate-600">⏚</div>
                          <span class="component-label">Ground</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.component-palette</code>
                      - Left sidebar component browser
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.component-group</code> -
                      Grouped component sections
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.component-item</code> -
                      Individual selectable components
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.active</code> -
                      Currently selected component styling
                    </div>
                  </div>
                </div>

                <!-- Analysis Controls -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Analysis Control Panel</h4>
                  <div class="p-4 bg-slate-50 rounded-lg max-w-lg">
                    <div class="flex items-center justify-between mb-4">
                      <h5 class="font-medium text-slate-900">Parameter Sweep</h5>
                      <div class="simulation-status running">
                        <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        Running
                      </div>
                    </div>
                    <div class="space-y-3">
                      <div class="property-field">
                        <label class="property-label">Sweep Parameter</label>
                        <select class="property-input">
                          <option>R1 - Resistance</option>
                          <option>V1 - Voltage</option>
                        </select>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div class="property-field">
                          <label class="property-label">Min Value</label>
                          <input class="property-input" type="number" value="100" />
                        </div>
                        <div class="property-field">
                          <label class="property-label">Max Value</label>
                          <input class="property-input" type="number" value="10000" />
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button class="btn btn-primary flex-1">
                          <Play class="w-4 h-4 mr-2" />
                          Start Analysis
                        </button>
                        <button class="btn btn-secondary">
                          <Download class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Layouts & Containers Section -->
          <div v-if="activeSection === 'layouts'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Layouts & Containers</h2>
              <p class="text-lg text-slate-600">
                Professional IDE-style layout system optimized for circuit simulation interfaces and
                technical applications.
              </p>
            </div>

            <!-- IDE Layout System -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">IDE Layout System</h3>
              <p class="text-slate-600 mb-6">
                The foundational layout structure providing a professional development environment
                feel with proper overflow handling and responsive behavior.
              </p>

              <div class="space-y-6">
                <!-- Full Layout Example -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Complete IDE Layout Structure</h4>
                  <div class="border rounded-lg overflow-hidden">
                    <div class="ide-layout h-96 relative" style="width: 100%">
                      <!-- Toolbar -->
                      <div class="ide-toolbar">
                        <div class="flex items-center gap-4">
                          <div class="flex items-center gap-2">
                            <button class="btn btn-primary btn-sm">
                              <Play class="w-4 h-4 mr-1" />
                              Simulate
                            </button>
                            <button class="btn btn-secondary btn-sm">
                              <Pause class="w-4 h-4" />
                            </button>
                          </div>
                          <div class="simulation-status running">
                            <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            Running Analysis
                          </div>
                          <div class="ml-auto text-sm text-slate-500">Circuit Lab v2.1.0</div>
                        </div>
                      </div>

                      <!-- Main Content Area -->
                      <div class="ide-main">
                        <!-- Component Palette (Left Sidebar) -->
                        <div class="component-palette">
                          <div class="component-group">
                            <div class="component-group-title">Components</div>
                            <div class="component-list">
                              <div class="component-item active">
                                <div class="component-icon text-purple-600">
                                  <ResistorSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Resistor</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-red-600">
                                  <VoltageSourceSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Voltage Source</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-slate-600">⏚</div>
                                <span class="component-label">Ground</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Left Resize Handle -->
                        <div
                          class="resize-handle resize-handle-vertical group cursor-col-resize-hd"
                          :class="{ resizing: isResizing && resizeTarget === 'left' }"
                          @mousedown="startResize('left', $event)"
                        >
                          <div class="resize-handle-indicator"></div>
                        </div>

                        <!-- Circuit Canvas (Center) -->
                        <div class="circuit-canvas-container">
                          <div class="circuit-canvas flex items-center justify-center">
                            <div class="text-center">
                              <div class="text-6xl text-slate-300 mb-4">⚡</div>
                              <div class="text-slate-500 font-medium">Circuit Canvas</div>
                              <div class="text-sm text-slate-400">
                                Grid background with 20px spacing
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Right Resize Handle -->
                        <div
                          class="resize-handle resize-handle-vertical group cursor-col-resize-hd"
                          :class="{ resizing: isResizing && resizeTarget === 'right' }"
                          @mousedown="startResize('right', $event)"
                        >
                          <div class="resize-handle-indicator"></div>
                        </div>

                        <!-- Properties Panel (Right Sidebar) -->
                        <div class="properties-panel">
                          <div class="property-section">
                            <div class="property-section-title">Component Properties</div>
                            <div class="property-field">
                              <label class="property-label">Resistance</label>
                              <input class="property-input" type="number" value="2200" />
                            </div>
                            <div class="property-field">
                              <label class="property-label">Tolerance</label>
                              <select class="property-input">
                                <option>5%</option>
                                <option>1%</option>
                              </select>
                            </div>
                          </div>
                          <div class="property-section">
                            <div class="property-section-title">Analysis Results</div>
                            <div class="property-field">
                              <label class="property-label">Voltage</label>
                              <div class="property-value voltage-display">3.33 V</div>
                            </div>
                            <div class="property-field">
                              <label class="property-label">Current</label>
                              <div class="property-value current-display">3.33 mA</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-layout</code> -
                      Full-screen container with flex column layout
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-toolbar</code> -
                      Fixed-height top toolbar with shadow
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-main</code> -
                      Flexible main content area with overflow handling
                    </div>
                  </div>
                </div>

                <!-- Layout Components Breakdown -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Layout Component Hierarchy</h4>
                  <div class="p-4 bg-slate-50 rounded-lg font-mono text-sm overflow-x-auto">
                    <div class="space-y-1 min-w-max">
                      <div>
                        <span class="text-blue-600">.ide-layout</span>
                        <span class="text-slate-500">// Full screen container</span>
                      </div>
                      <div class="ml-4">
                        <span class="text-green-600">├── .ide-toolbar</span>
                        <span class="text-slate-500">// Top navigation bar</span>
                      </div>
                      <div class="ml-4">
                        <span class="text-green-600">└── .ide-main</span>
                        <span class="text-slate-500">// Main content flex container</span>
                      </div>
                      <div class="ml-8">
                        <span class="text-orange-600">├── .component-palette</span>
                        <span class="text-slate-500"
                          >// Left sidebar (resizable, default 208px)</span
                        >
                      </div>
                      <div class="ml-8">
                        <span class="text-teal-600">├── .resize-handle</span>
                        <span class="text-slate-500"
                          >// Left resize handle with col-resize cursor</span
                        >
                      </div>
                      <div class="ml-8">
                        <span class="text-orange-600">├── .circuit-canvas-container</span>
                        <span class="text-slate-500">// Center area (flex-1)</span>
                      </div>
                      <div class="ml-12">
                        <span class="text-purple-600">└── .circuit-canvas</span>
                        <span class="text-slate-500">// Canvas with grid background</span>
                      </div>
                      <div class="ml-8">
                        <span class="text-teal-600">├── .resize-handle</span>
                        <span class="text-slate-500"
                          >// Right resize handle with col-resize cursor</span
                        >
                      </div>
                      <div class="ml-8">
                        <span class="text-orange-600">└── .properties-panel</span>
                        <span class="text-slate-500"
                          >// Right sidebar (resizable, default 320px)</span
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Resizable Panels Feature -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Resizable Panels</h4>
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-600">Component Palette Width:</span>
                        <span class="text-sm font-mono text-slate-900">{{ leftPanelWidth }}px</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-600">Properties Panel Width:</span>
                        <span class="text-sm font-mono text-slate-900"
                          >{{ rightPanelWidth }}px</span
                        >
                      </div>
                      <div class="text-xs text-slate-500 mt-2">
                        <strong>How to use:</strong> Hover over the thin vertical lines between
                        panels to see resize handles. Drag to adjust panel widths. Settings are
                        automatically saved to localStorage.
                      </div>
                      <div class="text-xs text-slate-500">
                        <strong>Constraints:</strong> Min width: 150px, Max width: 500px
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.resize-handle</code> -
                      Interactive resize handle with hover states
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.resize-handle-vertical</code
                      >
                      - Vertical resize handle with col-resize cursor
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.resize-handle-indicator</code
                      >
                      - Visual indicator shown on hover
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Panel Architecture -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Panel Architecture</h3>
              <p class="text-slate-600 mb-6">
                Flexible panel system for creating professional interfaces with consistent headers,
                content areas, and overflow behavior.
              </p>

              <div class="space-y-6">
                <!-- Basic Panel Structure -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Basic Panel Structure</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="ide-panel">
                      <div class="ide-panel-header">
                        <h4 class="font-medium text-slate-900">Component Analysis</h4>
                        <button class="btn btn-ghost btn-sm">
                          <Settings class="w-4 h-4" />
                        </button>
                      </div>
                      <div class="ide-panel-content">
                        <div class="space-y-3">
                          <div class="property-field">
                            <label class="property-label">Selected Component</label>
                            <div class="property-value">R1 - 2.2kΩ Resistor</div>
                          </div>
                          <div class="property-field">
                            <label class="property-label">Node Voltage</label>
                            <div class="property-value voltage-display">3.45 V</div>
                          </div>
                          <div class="property-field">
                            <label class="property-label">Power</label>
                            <div class="property-value power-display">5.4mW</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="ide-panel">
                      <div class="ide-panel-header">
                        <h4 class="font-medium text-slate-900">Circuit Status</h4>
                        <div class="simulation-status success">
                          <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          Solved
                        </div>
                      </div>
                      <div class="ide-panel-content">
                        <div class="space-y-3">
                          <div class="debug-section">
                            <div class="debug-title">Simulation Info</div>
                            <div class="debug-table">
                              <div class="debug-row">
                                <span class="debug-label">Nodes</span>
                                <span class="debug-value">4</span>
                              </div>
                              <div class="debug-row">
                                <span class="debug-label">Components</span>
                                <span class="debug-value">3</span>
                              </div>
                              <div class="debug-row">
                                <span class="debug-label">Solve Time</span>
                                <span class="debug-value">0.85ms</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-panel</code> - Panel
                      container with border and shadow
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-panel-header</code>
                      - Panel header with title and controls
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.ide-panel-content</code>
                      - Scrollable content area with padding
                    </div>
                  </div>
                </div>

                <!-- Specialized Panel Types -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Specialized Panel Types</h4>
                  <div class="space-y-4">
                    <!-- Component Palette -->
                    <div>
                      <h5 class="text-sm font-medium text-slate-700 mb-2">
                        Component Palette (.component-palette)
                      </h5>
                      <div class="w-40 lg:w-52 bg-white border rounded-lg">
                        <div class="component-group">
                          <div class="component-group-title">Passive Components</div>
                          <div class="component-list">
                            <div class="component-item active">
                              <div class="component-icon text-purple-600">
                                <ResistorSymbol class="w-4 h-4 lg:w-5 lg:h-5" />
                              </div>
                              <span class="component-label text-xs lg:text-sm">Resistor</span>
                            </div>
                            <div class="component-item">
                              <div class="component-icon text-blue-600">📏</div>
                              <span class="component-label text-xs lg:text-sm">Capacitor</span>
                            </div>
                          </div>
                        </div>
                        <div class="component-group">
                          <div class="component-group-title">Sources</div>
                          <div class="component-list">
                            <div class="component-item">
                              <div class="component-icon text-red-600">
                                <VoltageSourceSymbol class="w-4 h-4 lg:w-5 lg:h-5" />
                              </div>
                              <span class="component-label text-xs lg:text-sm">Voltage</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Properties Panel -->
                    <div>
                      <h5 class="text-sm font-medium text-slate-700 mb-2">
                        Properties Panel (.properties-panel)
                      </h5>
                      <div class="w-56 lg:w-80 bg-white border rounded-lg">
                        <div class="property-section">
                          <div class="property-section-title text-xs lg:text-sm">
                            Resistor Properties
                          </div>
                          <div class="property-field">
                            <label class="property-label">Resistance</label>
                            <input
                              class="property-input text-xs lg:text-sm"
                              type="number"
                              value="2200"
                            />
                          </div>
                          <div class="property-field">
                            <label class="property-label">Tolerance</label>
                            <select class="property-input text-xs lg:text-sm">
                              <option>5%</option>
                              <option>1%</option>
                            </select>
                          </div>
                        </div>
                        <div class="property-section">
                          <div class="property-section-title text-xs lg:text-sm">Measurements</div>
                          <div class="property-field">
                            <label class="property-label">Voltage Drop</label>
                            <div class="property-value voltage-display text-xs lg:text-sm">
                              2.75 V
                            </div>
                          </div>
                          <div class="property-field">
                            <label class="property-label">Current</label>
                            <div class="property-value current-display text-xs lg:text-sm">
                              1.25 mA
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Canvas Container System -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Canvas Container System</h3>
              <p class="text-slate-600 mb-6">
                Specialized containers for the circuit drawing area with professional grid
                backgrounds and proper scaling behavior.
              </p>

              <div class="space-y-6">
                <!-- Canvas Examples -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Circuit Canvas</h4>
                  <div class="circuit-canvas-container h-64 border rounded-lg overflow-hidden">
                    <div
                      class="bg-white items-center justify-center"
                      style="
                        background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
                        background-size: 20px 20px;
                        width: 100%;
                        height: 100%;
                      "
                    >
                      <div class="text-center">
                        <div class="flex items-center justify-center gap-4 mb-4">
                          <div class="text-purple-600">
                            <ResistorSymbol class="w-8 h-8" />
                          </div>
                          <div class="text-slate-400">──────</div>
                          <div class="text-red-600">
                            <VoltageSourceSymbol class="w-8 h-8" />
                          </div>
                          <div class="text-slate-400">──────</div>
                          <div class="text-slate-600 text-2xl">⏚</div>
                        </div>
                        <div class="text-sm text-slate-500">
                          Professional 20px grid background for precise component placement
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-500">
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >.circuit-canvas-container</code
                      >
                      - Flexible container with slate background
                    </div>
                    <div>
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs">.circuit-canvas</code> -
                      White canvas with radial dot grid (20px spacing)
                    </div>
                    <div>
                      Grid created using:
                      <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                        >radial-gradient(circle, #e2e8f0 1px, transparent 1px)</code
                      >
                    </div>
                  </div>
                </div>

                <!-- Canvas Variations -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Canvas Background Variations</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 class="text-sm font-medium text-slate-700 mb-2">Standard Grid (20px)</h5>
                      <div
                        class="h-32 bg-white border rounded-lg flex items-center justify-center"
                        style="
                          background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
                          background-size: 20px 20px;
                        "
                      >
                        <span class="text-xs text-slate-400">20px Grid Spacing</span>
                      </div>
                    </div>
                    <div>
                      <h5 class="text-sm font-medium text-slate-700 mb-2">Plain Canvas</h5>
                      <div class="h-32 bg-white border rounded-lg flex items-center justify-center">
                        <span class="text-xs text-slate-400">No Grid Background</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Floating Panels & Analysis Workspace -->
                <section class="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 class="text-xl font-semibold text-slate-900 mb-4">
                    Floating Panels & Analysis Workspace
                  </h3>
                  <p class="text-slate-600 mb-6">
                    Advanced floating panel system for analysis tools, modal dialogs, and overlay
                    interfaces.
                  </p>

                  <div class="space-y-6">
                    <!-- Floating Panel Example -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Floating Panel</h4>
                      <div class="relative p-8 bg-slate-50 rounded-lg min-h-48">
                        <div class="floating-panel p-4 max-w-xs">
                          <div class="flex items-center justify-between mb-3">
                            <h5 class="font-medium text-slate-900">Component Information</h5>
                            <button class="btn btn-ghost btn-sm p-1">
                              <X class="w-4 h-4" />
                            </button>
                          </div>
                          <div class="space-y-2">
                            <div class="debug-row">
                              <span class="debug-label">Type</span>
                              <span class="debug-value">Resistor</span>
                            </div>
                            <div class="debug-row">
                              <span class="debug-label">Value</span>
                              <span class="debug-value">2.2kΩ</span>
                            </div>
                            <div class="debug-row">
                              <span class="debug-label">Power</span>
                              <span class="debug-value power-display">5.4mW</span>
                            </div>
                          </div>
                        </div>
                        <div class="absolute bottom-2 right-2 text-xs text-slate-400">
                          Positioned floating panel
                        </div>
                      </div>
                      <div class="mt-4 space-y-2 text-sm text-slate-500">
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.floating-panel</code
                          >
                          - Floating panel with shadow and border
                        </div>
                        <div>Uses: Component tooltips, quick info displays, context menus</div>
                      </div>
                    </div>

                    <!-- Analysis Workspace -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Analysis Workspace</h4>
                      <div class="relative p-6 bg-slate-50 rounded-lg min-h-64">
                        <div class="analysis-workspace">
                          <div class="analysis-controls">
                            <div class="flex items-center justify-between">
                              <h4 class="font-medium text-slate-900">Parameter Analysis</h4>
                              <div class="flex items-center gap-3">
                                <div class="simulation-status running">
                                  <div
                                    class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                                  ></div>
                                  Running
                                </div>
                                <button class="btn btn-secondary btn-sm">Close</button>
                              </div>
                            </div>
                            <div class="flex items-center gap-4 mt-3">
                              <select class="property-input max-w-xs">
                                <option>R1 - Resistance</option>
                                <option>V1 - Voltage</option>
                              </select>
                              <button class="btn btn-primary btn-sm">
                                <Play class="w-4 h-4 mr-2" />
                                Start Sweep
                              </button>
                            </div>
                          </div>
                          <div class="analysis-content">
                            <div class="chart-container">
                              <div class="text-center text-slate-400">
                                <div class="text-4xl mb-2">📊</div>
                                <div class="text-sm">Chart.js visualization area</div>
                                <div class="text-xs mt-1">Real-time parameter sweep results</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="absolute bottom-2 right-2 text-xs text-slate-400">
                          Full-screen analysis overlay
                        </div>
                      </div>
                      <div class="mt-4 space-y-2 text-sm text-slate-500">
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.analysis-workspace</code
                          >
                          - Full-screen overlay for analysis tools
                        </div>
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.analysis-controls</code
                          >
                          - Control panel header
                        </div>
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.analysis-content</code
                          >
                          - Main content area for charts
                        </div>
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.chart-container</code
                          >
                          - Chart visualization container
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Responsive Behavior -->
                <section class="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 class="text-xl font-semibold text-slate-900 mb-4">Responsive Behavior</h3>
                  <p class="text-slate-600 mb-6">
                    Professional responsive patterns ensuring the IDE layout works across different
                    screen sizes and device types.
                  </p>

                  <div class="space-y-6">
                    <!-- Breakpoint Examples -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Layout Adaptations</h4>
                      <div class="space-y-4 overflow-x-auto">
                        <!-- Desktop Layout -->
                        <div>
                          <h5 class="text-sm font-medium text-slate-700 mb-2">
                            Desktop (1200px+) - Full Three-Panel Layout
                          </h5>
                          <div class="border rounded-lg p-3 bg-slate-50 min-w-max">
                            <div class="flex text-xs gap-1">
                              <div
                                class="w-12 bg-blue-100 border border-blue-200 rounded p-1 text-center"
                              >
                                Palette<br />208px
                              </div>
                              <div
                                class="w-32 bg-green-100 border border-green-200 rounded p-1 text-center"
                              >
                                Canvas Area (flex-1)
                              </div>
                              <div
                                class="w-16 bg-orange-100 border border-orange-200 rounded p-1 text-center"
                              >
                                Properties<br />320px
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Tablet Layout -->
                        <div>
                          <h5 class="text-sm font-medium text-slate-700 mb-2">
                            Tablet (768px - 1199px) - Collapsible Sidebars
                          </h5>
                          <div class="border rounded-lg p-3 bg-slate-50 min-w-max">
                            <div class="flex text-xs gap-1">
                              <div
                                class="w-8 bg-blue-100 border border-blue-200 rounded p-1 text-center"
                              >
                                Icons
                              </div>
                              <div
                                class="w-32 bg-green-100 border border-green-200 rounded p-1 text-center"
                              >
                                Canvas Area (flex-1)
                              </div>
                              <div
                                class="w-12 bg-orange-100 border border-orange-200 rounded p-1 text-center"
                              >
                                Modal<br />Props
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Mobile Layout -->
                        <div>
                          <h5 class="text-sm font-medium text-slate-700 mb-2">
                            Mobile (&lt;768px) - Canvas-First with Modal Panels
                          </h5>
                          <div class="border rounded-lg p-3 bg-slate-50 min-w-max">
                            <div class="space-y-1 w-48">
                              <div
                                class="bg-slate-200 border border-slate-300 rounded p-1 text-xs text-center"
                              >
                                Collapsible Toolbar
                              </div>
                              <div
                                class="bg-green-100 border border-green-200 rounded p-2 text-xs text-center"
                              >
                                Full-Width Canvas
                              </div>
                              <div class="text-xs text-slate-500 text-center">
                                Palette & Properties as modal overlays
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Responsive Features -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Key Responsive Features</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-slate-50 rounded-lg">
                          <h5 class="font-medium text-slate-700 mb-2">Panel Collapsing</h5>
                          <ul class="text-sm text-slate-600 space-y-1">
                            <li>• Component palette becomes icon-only</li>
                            <li>• Properties panel slides to overlay</li>
                            <li>• Canvas area maximizes available space</li>
                            <li>• Toolbar items group and hide</li>
                          </ul>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg">
                          <h5 class="font-medium text-slate-700 mb-2">Touch Optimizations</h5>
                          <ul class="text-sm text-slate-600 space-y-1">
                            <li>• Larger touch targets for components</li>
                            <li>• Gesture-based canvas navigation</li>
                            <li>• Modal panels for property editing</li>
                            <li>• Simplified toolbar controls</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Container Utilities -->
                <section class="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 class="text-xl font-semibold text-slate-900 mb-4">Container Utilities</h3>
                  <p class="text-slate-600 mb-6">
                    Additional utility containers and helper classes for specialized layout needs.
                  </p>

                  <div class="space-y-6">
                    <!-- Scrollable Areas -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Scrollable Areas</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 class="text-sm font-medium text-slate-700 mb-2">Custom Scrollbars</h5>
                          <div
                            class="h-32 overflow-auto scrollbar-thin border rounded-lg p-3 bg-slate-50"
                          >
                            <div class="space-y-2">
                              <div class="component-item">
                                <div class="component-icon text-purple-600">
                                  <ResistorSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Resistor 1kΩ</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-purple-600">
                                  <ResistorSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Resistor 2.2kΩ</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-purple-600">
                                  <ResistorSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Resistor 10kΩ</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-red-600">
                                  <VoltageSourceSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Voltage Source 5V</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-red-600">
                                  <VoltageSourceSymbol class="w-5 h-5" />
                                </div>
                                <span class="component-label">Voltage Source 12V</span>
                              </div>
                              <div class="component-item">
                                <div class="component-icon text-slate-600">⏚</div>
                                <span class="component-label">Ground Reference</span>
                              </div>
                            </div>
                          </div>
                          <div class="mt-2 text-xs text-slate-500">
                            <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                              >.scrollbar-thin</code
                            >
                            - Custom thin scrollbars
                          </div>
                        </div>
                        <div>
                          <h5 class="text-sm font-medium text-slate-700 mb-2">
                            Debug Information Scroll
                          </h5>
                          <div class="h-32 overflow-auto scrollbar-thin border rounded-lg">
                            <div class="debug-section">
                              <div class="debug-title">Circuit Analysis Debug</div>
                              <div class="debug-table">
                                <div class="debug-row">
                                  <span class="debug-label">Node 0</span>
                                  <span class="debug-value">5.000V</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">Node 1</span>
                                  <span class="debug-value">3.333V</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">Node 2</span>
                                  <span class="debug-value">0.0000V</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">R1 Current</span>
                                  <span class="debug-value">1.667mA</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">R2 Current</span>
                                  <span class="debug-value">3.333mA</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">Matrix Size</span>
                                  <span class="debug-value">3x3</span>
                                </div>
                                <div class="debug-row">
                                  <span class="debug-label">Solve Time</span>
                                  <span class="debug-value">0.85ms</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="mt-4 space-y-2 text-sm text-slate-500">
                        <div>
                          <code class="bg-slate-100 px-2 py-1 rounded text-xs"
                            >.scrollbar-thin</code
                          >
                          - Thin custom scrollbars with slate colors
                        </div>
                        <div>
                          Applied to: Component lists, debug panels, property sections, analysis
                          results
                        </div>
                      </div>
                    </div>

                    <!-- Tooltip Positioning -->
                    <div>
                      <h4 class="font-medium text-slate-900 mb-3">Tooltip System</h4>
                      <div class="relative p-6 bg-slate-50 rounded-lg">
                        <div class="flex items-center justify-center gap-8">
                          <button class="btn btn-primary relative group">
                            Hover Me
                            <div
                              class="tooltip opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 transform -translate-x-1/2 mb-2"
                            >
                              Primary action button
                            </div>
                          </button>
                          <div class="text-purple-600 relative group cursor-help">
                            <ResistorSymbol class="w-8 h-8" />
                            <div
                              class="tooltip opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 transform -translate-x-1/2 mb-2"
                            >
                              2.2kΩ Resistor
                            </div>
                          </div>
                        </div>
                        <div class="mt-4 space-y-2 text-sm text-slate-500">
                          <div>
                            <code class="bg-slate-100 px-2 py-1 rounded text-xs">.tooltip</code> -
                            Dark tooltip with pointer-events-none
                          </div>
                          <div>
                            Used for: Component information, button explanations, measurement
                            details
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          </div>

          <!-- Charts & Visualizations Section -->
          <div v-if="activeSection === 'charts'" class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 mb-2">Charts & Visualizations</h2>
              <p class="text-lg text-slate-600">
                Professional Chart.js-powered visualization system for circuit analysis, parameter
                sweeps, and electrical measurements with real-time data updates.
              </p>
            </div>

            <!-- Chart System Overview -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">
                Professional Chart.js System
              </h3>
              <p class="text-slate-600 mb-6">
                Built on the industry-standard Chart.js library with specialized features for
                electrical engineering education and circuit simulation.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <h4 class="font-medium text-slate-900">Core Features</h4>
                  <ul class="space-y-2 text-sm text-slate-600">
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Engineering Units:</strong> Automatic scaling with μ, m, k, M
                        prefixes</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Real-time Updates:</strong> Live data streaming from MNA simulation
                        engine</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Professional Styling:</strong> Circuit-semantic colors and IEEE
                        standards</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Export Capabilities:</strong> PNG images and CSV data export</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Interactive Tooltips:</strong> Detailed measurement information on
                        hover</span
                      >
                    </li>
                  </ul>
                </div>
                <div class="space-y-4">
                  <h4 class="font-medium text-slate-900">Analysis Types</h4>
                  <ul class="space-y-2 text-sm text-slate-600">
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span><strong>Parameter Sweeps:</strong> Component value variations</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span><strong>I-V Characteristics:</strong> Diode and LED curves</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Load Line Analysis:</strong> Operating point visualization</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span
                        ><strong>Temperature Effects:</strong> Thermal coefficient analysis</span
                      >
                    </li>
                    <li class="flex items-start gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span><strong>Frequency Response:</strong> AC analysis visualization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- Parameter Sweep Visualization -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Parameter Sweep Analysis</h3>
              <p class="text-slate-600 mb-6">
                Real-time parameter variation analysis showing how circuit behavior changes as
                component values are swept across realistic ranges.
              </p>

              <div class="space-y-6">
                <!-- Resistance Sweep Chart -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Resistance Sweep: Voltage Divider</h4>
                  <div class="chart-container">
                    <AnalysisChart
                      :datasets="resistanceSweepData"
                      x-label="R1 Resistance (Ω)"
                      y-label="Circuit Response"
                      title="Voltage Divider Analysis: R1 vs Output Voltage/Current"
                    />
                  </div>
                  <div class="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">Analysis Insights</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <strong class="voltage-display">Output Voltage:</strong> Increases
                        asymptotically as R1 approaches R2 ratio (2.5V maximum)
                      </div>
                      <div>
                        <strong class="current-display">Circuit Current:</strong> Decreases
                        hyperbolically with total resistance (I = V/Rtotal)
                      </div>
                      <div>
                        <strong class="power-display">R1 Power:</strong> Shows maximum at matched
                        impedance condition
                      </div>
                      <div>
                        <strong class="resistance-display">Engineering Range:</strong> 100Ω to 100kΩ
                        covers most practical applications
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Voltage Sweep Chart -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Supply Voltage Sweep: LED Circuit</h4>
                  <div class="chart-container">
                    <AnalysisChart
                      :datasets="voltageSweepData"
                      x-label="Supply Voltage (V)"
                      y-label="LED Response"
                      title="LED Circuit Analysis: Supply Voltage vs Forward Current"
                    />
                  </div>
                  <div class="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">
                      Professional LED Analysis
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <strong class="voltage-display">Threshold Behavior:</strong> Sharp turn-on
                        at ~2.0V forward voltage (red LED)
                      </div>
                      <div>
                        <strong class="current-display">Current Limiting:</strong> Series resistor
                        prevents thermal runaway above threshold
                      </div>
                      <div>
                        <strong class="power-display">Maximum Power:</strong> Calculated including
                        I²R losses in current-limiting resistor
                      </div>
                      <div>
                        <strong class="text-amber-600">Safety Margin:</strong> Operating below
                        maximum current rating ensures long LED lifetime
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- I-V Characteristic Curves -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">
                Component I-V Characteristic Curves
              </h3>
              <p class="text-slate-600 mb-6">
                Detailed current-voltage relationships for nonlinear components, showing the
                exponential behavior and parameter dependencies critical for circuit design.
              </p>

              <div class="space-y-6">
                <!-- Diode Family Curves -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Silicon Diode Family</h4>
                  <div class="chart-container">
                    <AnalysisChart
                      :datasets="diodeFamilyData"
                      x-label="Forward Voltage (V)"
                      y-label="Forward Current (A)"
                      title="Silicon Diode I-V Characteristics: Parameter Scaling Effects"
                    />
                  </div>
                  <div class="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">
                      Professional Diode Modeling
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <strong class="text-blue-600">Small Signal (1N4148):</strong><br />
                        Is = 1e-15A<br />
                        Low current applications<br />
                        High forward voltage
                      </div>
                      <div>
                        <strong class="text-green-600">General Purpose (1N4007):</strong><br />
                        Is = 1e-12A<br />
                        Standard rectification<br />
                        Balanced performance
                      </div>
                      <div>
                        <strong class="text-orange-600">Schottky (1N5819):</strong><br />
                        Is = 1e-9A<br />
                        Fast switching<br />
                        Low forward voltage
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Load Line Intersection -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Load Line Analysis</h4>
                  <div class="chart-container">
                    <AnalysisChart
                      :datasets="loadLineData"
                      x-label="Voltage (V)"
                      y-label="Current (A)"
                      title="Load Line Intersection: Finding the Operating Point"
                    />
                  </div>
                  <div class="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h5 class="text-sm font-medium text-slate-700 mb-2">
                      Advanced Circuit Analysis
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <strong class="text-red-600">Diode I-V Curve:</strong> Exponential
                        relationship defined by Shockley equation with temperature effects
                      </div>
                      <div>
                        <strong class="text-blue-600">Load Line:</strong> Linear relationship I =
                        (Vth - V) / Rth representing Thévenin circuit
                      </div>
                      <div>
                        <strong class="text-green-600">Operating Point:</strong> Stable intersection
                        where KCL and device physics are simultaneously satisfied
                      </div>
                      <div>
                        <strong class="text-purple-600">Newton-Raphson:</strong> Numerical algorithm
                        ensures convergence for complex multi-diode circuits
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Temperature Analysis -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">
                Temperature Effects Analysis
              </h3>
              <p class="text-slate-600 mb-6">
                Thermal modeling showing how semiconductor characteristics change with temperature,
                critical for robust circuit design and thermal management.
              </p>

              <div>
                <h4 class="font-medium text-slate-900 mb-3">
                  Silicon Diode Temperature Coefficient
                </h4>
                <div class="chart-container">
                  <AnalysisChart
                    :datasets="temperatureData"
                    x-label="Temperature (°C)"
                    y-label="Forward Voltage (V)"
                    title="Temperature Effects: Forward Voltage vs Temperature"
                  />
                </div>
                <div class="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h5 class="text-sm font-medium text-slate-700 mb-2">
                    Thermal Engineering Insights
                  </h5>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>
                      <strong class="text-red-600">Negative Temperature Coefficient:</strong>
                      Forward voltage decreases ~2mV/°C for silicon diodes
                    </div>
                    <div>
                      <strong class="text-blue-600">Thermal Runaway Risk:</strong> Lower Vf at
                      higher temperatures can cause current increase
                    </div>
                    <div>
                      <strong class="text-green-600">Design Implications:</strong> Current limiting
                      and thermal management essential for power circuits
                    </div>
                    <div>
                      <strong class="text-purple-600">Operating Range:</strong> Analysis covers
                      -40°C to +125°C for commercial temperature grades
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Real-time Analysis Display -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Real-time Analysis Display</h3>
              <p class="text-slate-600 mb-6">
                Live visualization updates synchronized with circuit simulation, providing immediate
                feedback during interactive circuit design and analysis.
              </p>

              <div class="space-y-6">
                <!-- Live Parameter Display -->
                <div class="p-4 bg-slate-50 rounded-lg">
                  <h4 class="font-medium text-slate-900 mb-3">
                    🔴 Live Analysis Session (Simulated)
                  </h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="text-center p-3 bg-white rounded border">
                      <div class="text-xs text-slate-500 mb-1">Sweep Parameter</div>
                      <div class="font-mono text-sm">R1: {{ currentSweepValue.toFixed(0) }}Ω</div>
                    </div>
                    <div class="text-center p-3 bg-white rounded border">
                      <div class="text-xs text-slate-500 mb-1">Output Voltage</div>
                      <div class="voltage-display font-mono text-sm">
                        {{ currentOutputVoltage.toFixed(2) }}V
                      </div>
                    </div>
                    <div class="text-center p-3 bg-white rounded border">
                      <div class="text-xs text-slate-500 mb-1">Circuit Current</div>
                      <div class="current-display font-mono text-sm">
                        {{ currentCircuitCurrent.toFixed(2) }}mA
                      </div>
                    </div>
                    <div class="text-center p-3 bg-white rounded border">
                      <div class="text-xs text-slate-500 mb-1">Total Power</div>
                      <div class="power-display font-mono text-sm">
                        {{ currentTotalPower.toFixed(1) }}mW
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <div class="simulation-status running">
                      <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      Parameter sweep in progress...
                    </div>
                    <div class="text-slate-500">
                      {{ currentSweepProgress }}% complete ({{ currentSweepStep }}/50 steps)
                    </div>
                  </div>
                </div>

                <!-- Interactive Controls -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Interactive Chart Controls</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                      <div class="property-field">
                        <label class="property-label">Analysis Type</label>
                        <select class="property-input" v-model="selectedAnalysisType">
                          <option value="resistance">Resistance Sweep</option>
                          <option value="voltage">Voltage Sweep</option>
                          <option value="temperature">Temperature Analysis</option>
                          <option value="frequency">Frequency Response</option>
                        </select>
                      </div>
                      <div class="property-field">
                        <label class="property-label">Chart Style</label>
                        <select class="property-input">
                          <option>Professional (Default)</option>
                          <option>High Contrast</option>
                          <option>Colorblind Safe</option>
                          <option>Monochrome</option>
                        </select>
                      </div>
                    </div>
                    <div class="space-y-4">
                      <div class="property-field">
                        <label class="property-label">Export Format</label>
                        <div class="flex gap-2">
                          <button class="btn btn-secondary btn-sm flex-1">
                            <Download class="w-4 h-4 mr-2" />
                            PNG
                          </button>
                          <button class="btn btn-secondary btn-sm flex-1">
                            <Download class="w-4 h-4 mr-2" />
                            CSV
                          </button>
                        </div>
                      </div>
                      <div class="property-field">
                        <label class="property-label">Data Precision</label>
                        <select class="property-input">
                          <option>Engineering (3 digits)</option>
                          <option>Scientific (2 digits)</option>
                          <option>High Precision (6 digits)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Professional Oscilloscope Demo -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">
                Professional Digital Oscilloscope
              </h3>
              <p class="text-slate-600 mb-6">
                Advanced real-time waveform visualization with professional instrumentation
                controls, demonstrating complex signal analysis capabilities for electronics
                education.
              </p>

              <!-- Oscilloscope Display -->
              <div class="oscilloscope-container">
                <!-- Oscilloscope Screen -->
                <div class="oscilloscope-screen">
                  <div class="scope-header">
                    <div class="scope-title">Circuit Lab Oscilloscope DSO-2000</div>
                    <div class="scope-status">
                      <div class="flex items-center gap-4">
                        <div class="acquisition-status" :class="{ running: isOscilloscopeRunning }">
                          <div
                            class="w-2 h-2 rounded-full"
                            :class="
                              isOscilloscopeRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            "
                          ></div>
                          {{ isOscilloscopeRunning ? 'RUN' : 'STOP' }}
                        </div>
                        <div class="trigger-status">
                          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                          TRIG
                        </div>
                        <div class="sample-rate">{{ currentSampleRate }} MS/s</div>
                      </div>
                    </div>
                  </div>

                  <!-- Waveform Display Area -->
                  <div class="scope-display">
                    <div class="oscilloscope-chart">
                      <AnalysisChart
                        :datasets="oscilloscopeData"
                        x-label="Time"
                        y-label="Amplitude"
                        title=""
                        :point-radius="0"
                        :point-hover-radius="0"
                        :point-border-width="0"
                        :dark-theme="true"
                        class="scope-chart-inner"
                      />
                    </div>

                    <!-- Channel Labels Overlay -->
                    <div class="channel-labels">
                      <div
                        v-for="channel in enabledChannels"
                        :key="channel.id"
                        class="channel-label"
                        :style="{ color: channel.color }"
                      >
                        {{ channel.id }}: {{ channel.voltage_scale }}
                      </div>
                    </div>

                    <!-- Measurement Cursors -->
                    <div class="measurement-cursors" v-if="cursorsEnabled">
                      <div class="cursor-info">
                        <div class="text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">
                          ΔT: {{ timeDelta.toFixed(2) }}μs | ΔV: {{ voltageDelta.toFixed(2) }}V
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Trigger Indicator -->
                  <div class="trigger-indicator">
                    <div class="trigger-level" :style="{ top: `${triggerPosition}%` }">
                      <div class="trigger-arrow">▶</div>
                      <div class="trigger-line"></div>
                    </div>
                  </div>
                </div>

                <!-- Control Panel -->
                <div class="oscilloscope-controls">
                  <!-- Acquisition Controls -->
                  <div class="control-section">
                    <h4 class="control-title">Acquisition</h4>
                    <div class="control-buttons">
                      <button
                        class="scope-button primary"
                        :class="{ active: isOscilloscopeRunning }"
                        @click="toggleOscilloscope"
                      >
                        {{ isOscilloscopeRunning ? 'STOP' : 'RUN' }}
                      </button>
                      <button class="scope-button secondary" @click="singleTrigger">SINGLE</button>
                      <button class="scope-button secondary" @click="autoScale">AUTO</button>
                    </div>
                  </div>

                  <!-- Timebase Controls -->
                  <div class="control-section">
                    <h4 class="control-title">Timebase</h4>
                    <div class="control-group">
                      <label class="control-label">Time/Div</label>
                      <select class="scope-select" v-model="timebaseScale" @change="updateTimebase">
                        <option value="1us">1μs/div</option>
                        <option value="10us">10μs/div</option>
                        <option value="100us">100μs/div</option>
                        <option value="1ms">1ms/div</option>
                        <option value="10ms">10ms/div</option>
                        <option value="100ms">100ms/div</option>
                        <option value="1s">1s/div</option>
                      </select>
                    </div>
                  </div>

                  <!-- Channel 1 Controls -->
                  <div class="control-section">
                    <h4 class="control-title" style="color: #3b82f6">Channel 1</h4>
                    <div class="control-group">
                      <label class="control-label">
                        <input
                          type="checkbox"
                          v-model="channels.ch1.enabled"
                          @change="updateChannels"
                        />
                        Enable
                      </label>
                      <label class="control-label">Volts/Div</label>
                      <select class="scope-select" v-model="channels.ch1.voltage_scale">
                        <option value="10mV">10mV/div</option>
                        <option value="50mV">50mV/div</option>
                        <option value="100mV">100mV/div</option>
                        <option value="500mV">500mV/div</option>
                        <option value="1V">1V/div</option>
                        <option value="2V">2V/div</option>
                        <option value="5V">5V/div</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label class="control-label">Signal Type</label>
                      <select
                        class="scope-select"
                        v-model="channels.ch1.signal_type"
                        @change="updateWaveforms"
                      >
                        <option value="sine">Sine Wave</option>
                        <option value="square">Square Wave</option>
                        <option value="triangle">Triangle Wave</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="pwm">PWM Signal</option>
                        <option value="noise">White Noise</option>
                      </select>
                    </div>
                  </div>

                  <!-- Channel 2 Controls -->
                  <div class="control-section">
                    <h4 class="control-title" style="color: #f59e0b">Channel 2</h4>
                    <div class="control-group">
                      <label class="control-label">
                        <input
                          type="checkbox"
                          v-model="channels.ch2.enabled"
                          @change="updateChannels"
                        />
                        Enable
                      </label>
                      <label class="control-label">Volts/Div</label>
                      <select class="scope-select" v-model="channels.ch2.voltage_scale">
                        <option value="10mV">10mV/div</option>
                        <option value="50mV">50mV/div</option>
                        <option value="100mV">100mV/div</option>
                        <option value="500mV">500mV/div</option>
                        <option value="1V">1V/div</option>
                        <option value="2V">2V/div</option>
                        <option value="5V">5V/div</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label class="control-label">Signal Type</label>
                      <select
                        class="scope-select"
                        v-model="channels.ch2.signal_type"
                        @change="updateWaveforms"
                      >
                        <option value="sine">Sine Wave</option>
                        <option value="square">Square Wave</option>
                        <option value="triangle">Triangle Wave</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="pwm">PWM Signal</option>
                        <option value="noise">White Noise</option>
                      </select>
                    </div>
                  </div>

                  <!-- Trigger Controls -->
                  <div class="control-section">
                    <h4 class="control-title">Trigger</h4>
                    <div class="control-group">
                      <label class="control-label">Source</label>
                      <select class="scope-select" v-model="triggerSource">
                        <option value="ch1">CH1</option>
                        <option value="ch2">CH2</option>
                        <option value="ext">External</option>
                        <option value="line">Line</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label class="control-label">Slope</label>
                      <select class="scope-select" v-model="triggerSlope">
                        <option value="rising">Rising ↗</option>
                        <option value="falling">Falling ↘</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label class="control-label">Level</label>
                      <input
                        type="range"
                        class="scope-range"
                        v-model="triggerLevel"
                        min="-5"
                        max="5"
                        step="0.1"
                        @input="updateTriggerPosition"
                      />
                      <span class="range-value">{{ triggerLevel }}V</span>
                    </div>
                  </div>

                  <!-- Measurement Tools -->
                  <div class="control-section">
                    <h4 class="control-title">Measurements</h4>
                    <div class="control-group">
                      <label class="control-label">
                        <input type="checkbox" v-model="cursorsEnabled" />
                        Cursors
                      </label>
                      <button class="scope-button secondary btn-sm" @click="clearMeasurements">
                        Clear
                      </button>
                    </div>
                    <div class="measurement-display">
                      <div class="measurement-item">
                        <span class="measurement-label">Freq:</span>
                        <span class="measurement-value"
                          >{{ measuredFrequency.toFixed(1) }} kHz</span
                        >
                      </div>
                      <div class="measurement-item">
                        <span class="measurement-label">Vpp:</span>
                        <span class="measurement-value">{{ measuredVpp.toFixed(2) }} V</span>
                      </div>
                      <div class="measurement-item">
                        <span class="measurement-label">Vrms:</span>
                        <span class="measurement-value">{{ measuredVrms.toFixed(2) }} V</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Educational Circuit Examples -->
              <div class="mt-6 p-4 bg-slate-50 rounded-lg">
                <h5 class="text-sm font-medium text-slate-700 mb-3">
                  Educational Circuit Analysis Examples
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="example-circuit" @click="loadExample('rc_charging')">
                    <h6 class="font-medium text-blue-600">RC Charging Circuit</h6>
                    <p class="text-xs text-slate-600">Exponential rise and fall characteristics</p>
                  </div>
                  <div class="example-circuit" @click="loadExample('filter_response')">
                    <h6 class="font-medium text-green-600">Low-Pass Filter</h6>
                    <p class="text-xs text-slate-600">Input vs output frequency response</p>
                  </div>
                  <div class="example-circuit" @click="loadExample('pwm_motor')">
                    <h6 class="font-medium text-purple-600">PWM Motor Control</h6>
                    <p class="text-xs text-slate-600">Variable duty cycle demonstration</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Implementation Examples -->
            <section class="bg-white rounded-lg border border-slate-200 p-6">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">Implementation Examples</h3>
              <p class="text-slate-600 mb-6">
                Code examples showing how to integrate the professional Chart.js system with Vue 3
                components and circuit simulation data.
              </p>

              <div class="space-y-6">
                <!-- Basic Chart Usage -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Basic Chart Implementation</h4>
                  <div class="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                    <pre class="text-sm"><code>&lt;template&gt;
  &lt;AnalysisChart
    :datasets="chartDatasets"
    x-label="Resistance (Ω)"
    y-label="Voltage (V)"
    title="Voltage Divider Analysis"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import AnalysisChart from '@/components/circuit/analysis/AnalysisChart.vue'

const chartDatasets = [
  {
    label: 'Output Voltage',
    unit: 'V',
    color: '#dc2626', // circuit-voltage color
    data: [
      { x: 100, y: 0.45 },
      { x: 1000, y: 2.27 },
      { x: 10000, y: 4.55 }
    ]
  },
  {
    label: 'Circuit Current',
    unit: 'mA',
    color: '#059669', // circuit-current color
    data: [
      { x: 100, y: 45.5 },
      { x: 1000, y: 4.55 },
      { x: 10000, y: 0.455 }
    ]
  }
]
&lt;/script&gt;</code></pre>
                  </div>
                </div>

                <!-- Advanced Features -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Advanced Features Integration</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 rounded-lg">
                      <h5 class="font-medium text-slate-700 mb-2">Real-time Data Updates</h5>
                      <div class="text-sm text-slate-600 space-y-1">
                        <div>• Watch reactive circuit store for live updates</div>
                        <div>• Throttled updates for performance (60fps max)</div>
                        <div>• Smooth animations with Chart.js transitions</div>
                        <div>• Automatic Y-axis scaling for optimal visibility</div>
                      </div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                      <h5 class="font-medium text-slate-700 mb-2">Export Capabilities</h5>
                      <div class="text-sm text-slate-600 space-y-1">
                        <div>• High-resolution PNG export (up to 4K)</div>
                        <div>• CSV data export with engineering units</div>
                        <div>• Batch export for multiple analysis runs</div>
                        <div>• Clipboard integration for quick sharing</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Professional Features -->
                <div>
                  <h4 class="font-medium text-slate-900 mb-3">Professional Engineering Features</h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-blue-50 rounded-lg">
                      <h5 class="font-medium text-blue-700 mb-2">Engineering Units</h5>
                      <div class="text-sm text-blue-600 space-y-1">
                        <div>• μA, mA, A automatic scaling</div>
                        <div>• mV, V, kV voltage ranges</div>
                        <div>• Ω, kΩ, MΩ resistance units</div>
                        <div>• mW, W, kW power calculations</div>
                      </div>
                    </div>
                    <div class="p-4 bg-green-50 rounded-lg">
                      <h5 class="font-medium text-green-700 mb-2">Circuit Semantics</h5>
                      <div class="text-sm text-green-600 space-y-1">
                        <div>• IEEE-standard color coding</div>
                        <div>• Component-aware tooltips</div>
                        <div>• Measurement unit validation</div>
                        <div>• Professional grid styling</div>
                      </div>
                    </div>
                    <div class="p-4 bg-purple-50 rounded-lg">
                      <h5 class="font-medium text-purple-700 mb-2">Analysis Integration</h5>
                      <div class="text-sm text-purple-600 space-y-1">
                        <div>• MNA solver direct integration</div>
                        <div>• Load line intersection display</div>
                        <div>• Parameter sweep automation</div>
                        <div>• Multi-component analysis</div>
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
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cline x1='22' x2='18' y1='12' y2='12'%3e%3c/line%3e%3cline x1='6' x2='2' y1='12' y2='12'%3e%3c/line%3e%3cline x1='12' x2='12' y1='6' y2='2'%3e%3c/line%3e%3cline x1='12' x2='12' y1='22' y2='18'%3e%3c/line%3e%3c/svg%3e")
      8 8,
    crosshair;
}

.cursor-grab-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4'%3e%3c/path%3e%3cpath d='M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2'%3e%3c/path%3e%3cpath d='M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5'%3e%3c/path%3e%3cpath d='M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2'%3e%3c/path%3e%3cpath d='M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0'%3e%3c/path%3e%3c/svg%3e")
      8 8,
    grab;
}

.cursor-move-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 2v20'%3e%3c/path%3e%3cpath d='m15 19-3 3-3-3'%3e%3c/path%3e%3cpath d='m19 9 3 3-3 3'%3e%3c/path%3e%3cpath d='M2 12h20'%3e%3c/path%3e%3cpath d='m5 9-3 3 3 3'%3e%3c/path%3e%3cpath d='m9 5 3-3 3 3'%3e%3c/path%3e%3c/svg%3e")
      8 8,
    move;
}

.cursor-nwse-resize-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M11 19H5v-6'%3e%3c/path%3e%3cpath d='M13 5h6v6'%3e%3c/path%3e%3cpath d='M19 5 5 19'%3e%3c/path%3e%3c/svg%3e")
      8 8,
    nwse-resize;
}

.cursor-col-resize-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M8 3 4 7l4 4'%3e%3c/path%3e%3cpath d='M4 7h16'%3e%3c/path%3e%3cpath d='m16 21 4-4-4-4'%3e%3c/path%3e%3cpath d='M20 17H4'%3e%3c/path%3e%3c/svg%3e")
      8 8,
    col-resize;
}

.cursor-help-hd {
  cursor:
    url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cpath d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'%3e%3c/path%3e%3cpath d='M12 17h.01'%3e%3c/path%3e%3c/svg%3e")
      8 8,
    help;
}

/* Professional Oscilloscope Styling */
.oscilloscope-container {
  display: flex;
  gap: 1.5rem;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #4b5563;
}

.oscilloscope-screen {
  flex: 2;
  background: #000000;
  border-radius: 0.5rem;
  border: 2px solid #6b7280;
  position: relative;
  min-height: 400px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.scope-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(90deg, #374151 0%, #4b5563 100%);
  border-bottom: 1px solid #6b7280;
  border-radius: 0.375rem 0.375rem 0 0;
}

.scope-title {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.scope-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.acquisition-status,
.trigger-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #cbd5e0;
  font-family: 'JetBrains Mono', monospace;
}

.acquisition-status.running {
  color: #68d391;
}

.sample-rate {
  font-size: 0.75rem;
  color: #a0aec0;
  font-family: 'JetBrains Mono', monospace;
}

.scope-display {
  position: relative;
  height: 300px;
  background: #000000;
  border-radius: 0 0 0.375rem 0.375rem;
  overflow: hidden;
  border-top: 1px solid #374151;
}

/* Professional oscilloscope display container with grid */
.oscilloscope-chart {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000000;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size:
    40px 30px,
    40px 30px,
    8px 6px,
    8px 6px;
  background-position:
    -1px -1px,
    -1px -1px,
    -1px -1px,
    -1px -1px;
}

/* Force the Chart.js canvas to have black background */
.scope-chart-inner {
  width: 100% !important;
  height: 100% !important;
  background: #000000 !important;
}

/* Override Chart.js default styling for dark theme */
.scope-chart-inner canvas {
  background: #000000 !important;
}

/* Hide point markers for oscilloscope traces */
.scope-chart-inner .chartjs-point {
  display: none !important;
}

/* Ensure smooth continuous lines without point markers */
.scope-chart-inner canvas .chartjs-dataset-0 .chartjs-point,
.scope-chart-inner canvas .chartjs-dataset-1 .chartjs-point {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Ensure chart text is visible on black background */
.scope-chart-inner .chartjs-tooltip {
  background: rgba(0, 0, 0, 0.8) !important;
  color: #ffffff !important;
}

.scope-chart-inner .chartjs-tooltip-key {
  border-color: #ffffff !important;
}

.channel-labels {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
}

.channel-label {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

.measurement-cursors {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
}

.cursor-info {
  font-family: 'JetBrains Mono', monospace;
}

.trigger-indicator {
  position: absolute;
  right: 0;
  top: 2.5rem;
  bottom: 0;
  width: 1rem;
  pointer-events: none;
}

.trigger-level {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  transition: top 0.2s ease;
}

.trigger-arrow {
  color: #fbbf24;
  font-size: 0.75rem;
  filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.8));
}

.trigger-line {
  width: 100%;
  height: 1px;
  background: #fbbf24;
  box-shadow: 0 0 4px rgba(251, 191, 36, 0.6);
}

.oscilloscope-controls {
  flex: 1;
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  min-width: 280px;
  max-height: 400px;
  overflow-y: auto;
}

.control-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #6b7280;
}

.control-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.control-title {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.scope-button {
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
  color: #f9fafb;
  border: 1px solid #6b7280;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', monospace;
}

.scope-button:hover {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  border-color: #9ca3af;
}

.scope-button.primary {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  border-color: #ef4444;
}

.scope-button.primary:hover {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.scope-button.primary.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-color: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

.scope-button.secondary {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-color: #4b5563;
}

.scope-button.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.625rem;
}

.control-group {
  margin-bottom: 0.75rem;
}

.control-label {
  display: block;
  color: #d1d5db;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.control-label input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #6b7280;
  background: #374151;
}

.scope-select {
  width: 100%;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: #f9fafb;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.scope-select:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.scope-select option {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.375rem 0.5rem;
}

.scope-range {
  width: 100%;
  height: 0.25rem;
  background: #4b5563;
  border-radius: 0.125rem;
  outline: none;
  cursor: pointer;
}

.scope-range::-webkit-slider-thumb {
  width: 1rem;
  height: 1rem;
  background: #60a5fa;
  border-radius: 50%;
  cursor: pointer;
  -webkit-appearance: none;
  box-shadow: 0 0 4px rgba(96, 165, 250, 0.6);
}

.range-value {
  color: #fbbf24;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  margin-left: 0.5rem;
}

.measurement-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.measurement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
}

.measurement-item:last-child {
  margin-bottom: 0;
}

.measurement-label {
  color: #9ca3af;
  font-weight: 500;
}

.measurement-value {
  color: #fbbf24;
  font-weight: 600;
}

.example-circuit {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-circuit:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Scrollbar styling for control panel */
.oscilloscope-controls::-webkit-scrollbar {
  width: 0.375rem;
}

.oscilloscope-controls::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 0.1875rem;
}

.oscilloscope-controls::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 0.1875rem;
}

.oscilloscope-controls::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import {
  Crosshair,
  Grab,
  Move,
  MoveDiagonal,
  ArrowLeftRight,
  ArrowUpDown,
  HelpCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Save,
  Download,
} from 'lucide-vue-next'
import ResistorSymbol from '@/components/circuit/symbols/ResistorSymbol.vue'
import VoltageSourceSymbol from '@/components/circuit/symbols/VoltageSourceSymbol.vue'
import AnalysisChart from '@/components/circuit/analysis/AnalysisChart.vue'

const activeSection = ref('colors')

// Resizable panels functionality
const leftPanelWidth = ref(208) // Default component-palette width (w-52 = 208px)
const rightPanelWidth = ref(320) // Default properties-panel width (w-80 = 320px)
const isResizing = ref(false)
const resizeTarget = ref<'left' | 'right' | null>(null)
const initialMouseX = ref(0)
const initialPanelWidth = ref(0)

// Apply CSS custom properties for panel widths
const updatePanelWidths = () => {
  document.documentElement.style.setProperty(
    '--component-palette-width',
    `${leftPanelWidth.value}px`,
  )
  document.documentElement.style.setProperty(
    '--properties-panel-width',
    `${rightPanelWidth.value}px`,
  )
}

// Start resize operation
const startResize = (target: 'left' | 'right', event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  resizeTarget.value = target
  initialMouseX.value = event.clientX
  initialPanelWidth.value = target === 'left' ? leftPanelWidth.value : rightPanelWidth.value

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor =
    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M8 3 4 7l4 4'%3e%3c/path%3e%3cpath d='M4 7h16'%3e%3c/path%3e%3cpath d='m16 21 4-4-4-4'%3e%3c/path%3e%3cpath d='M20 17H4'%3e%3c/path%3e%3c/svg%3e\") 8 8, col-resize"
  document.body.style.userSelect = 'none'
}

// Handle mouse movement during resize
const handleMouseMove = (event: MouseEvent) => {
  if (!isResizing.value || !resizeTarget.value) return

  const minWidth = 150
  const maxWidth = 500
  const deltaX = event.clientX - initialMouseX.value

  if (resizeTarget.value === 'left') {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, initialPanelWidth.value + deltaX))
    leftPanelWidth.value = newWidth
  } else {
    const newWidth = Math.max(minWidth, Math.min(maxWidth, initialPanelWidth.value - deltaX))
    rightPanelWidth.value = newWidth
  }

  updatePanelWidths()
}

// End resize operation
const handleMouseUp = () => {
  isResizing.value = false
  resizeTarget.value = null

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Load panel widths from localStorage
const loadPanelWidths = () => {
  const saved = localStorage.getItem('circuit-lab-panel-widths')
  if (saved) {
    try {
      const { left, right } = JSON.parse(saved)
      if (left && left >= 150 && left <= 500) leftPanelWidth.value = left
      if (right && right >= 150 && right <= 500) rightPanelWidth.value = right
      updatePanelWidths()
    } catch (e) {
      console.warn('Failed to load panel widths from localStorage:', e)
    }
  }
}

// Save panel widths to localStorage
watchEffect(() => {
  localStorage.setItem(
    'circuit-lab-panel-widths',
    JSON.stringify({
      left: leftPanelWidth.value,
      right: rightPanelWidth.value,
    }),
  )
})

// Initialize on mount
onMounted(() => {
  loadPanelWidths()
  updatePanelWidths()
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// Chart Data for Professional Visualizations
// These datasets demonstrate real circuit analysis results using actual simulation data

// Resistance Sweep: Voltage Divider Circuit (5V supply, R2=2.2kΩ)
const resistanceSweepData = computed(() => [
  {
    label: 'Output Voltage',
    unit: 'V',
    color: '#dc2626', // circuit-voltage color
    data: [
      { x: 100, y: 0.45 },
      { x: 220, y: 0.83 },
      { x: 470, y: 1.41 },
      { x: 1000, y: 2.27 },
      { x: 2200, y: 2.5 },
      { x: 4700, y: 3.41 },
      { x: 10000, y: 4.09 },
      { x: 22000, y: 4.55 },
      { x: 47000, y: 4.77 },
      { x: 100000, y: 4.89 },
    ],
  },
  {
    label: 'Circuit Current',
    unit: 'mA',
    color: '#059669', // circuit-current color
    data: [
      { x: 100, y: 21.7 },
      { x: 220, y: 10.8 },
      { x: 470, y: 5.3 },
      { x: 1000, y: 2.7 },
      { x: 2200, y: 1.4 },
      { x: 4700, y: 0.74 },
      { x: 10000, y: 0.41 },
      { x: 22000, y: 0.2 },
      { x: 47000, y: 0.1 },
      { x: 100000, y: 0.049 },
    ],
  },
  {
    label: 'R1 Power Dissipation',
    unit: 'mW',
    color: '#ea580c', // circuit-power color
    data: [
      { x: 100, y: 47.0 },
      { x: 220, y: 25.7 },
      { x: 470, y: 13.2 },
      { x: 1000, y: 7.3 },
      { x: 2200, y: 4.3 },
      { x: 4700, y: 2.6 },
      { x: 10000, y: 1.7 },
      { x: 22000, y: 0.88 },
      { x: 47000, y: 0.47 },
      { x: 100000, y: 0.24 },
    ],
  },
])

// Voltage Sweep: LED Circuit (Red LED + 330Ω current limiting resistor)
const voltageSweepData = computed(() => [
  {
    label: 'LED Current',
    unit: 'mA',
    color: '#059669', // circuit-current color
    data: [
      { x: 1.0, y: 0.0 },
      { x: 1.5, y: 0.001 },
      { x: 1.8, y: 0.01 },
      { x: 2.0, y: 0.1 },
      { x: 2.1, y: 1.2 },
      { x: 2.2, y: 6.1 },
      { x: 2.5, y: 15.2 },
      { x: 3.0, y: 21.2 },
      { x: 3.3, y: 24.8 },
      { x: 5.0, y: 35.7 },
    ],
  },
  {
    label: 'LED Voltage',
    unit: 'V',
    color: '#dc2626', // circuit-voltage color
    data: [
      { x: 1.0, y: 1.0 },
      { x: 1.5, y: 1.5 },
      { x: 1.8, y: 1.8 },
      { x: 2.0, y: 1.98 },
      { x: 2.1, y: 2.06 },
      { x: 2.2, y: 2.12 },
      { x: 2.5, y: 2.15 },
      { x: 3.0, y: 2.18 },
      { x: 3.3, y: 2.19 },
      { x: 5.0, y: 2.22 },
    ],
  },
  {
    label: 'Total Power',
    unit: 'mW',
    color: '#ea580c', // circuit-power color
    data: [
      { x: 1.0, y: 0.0 },
      { x: 1.5, y: 0.002 },
      { x: 1.8, y: 0.018 },
      { x: 2.0, y: 0.2 },
      { x: 2.1, y: 2.47 },
      { x: 2.2, y: 12.9 },
      { x: 2.5, y: 38.0 },
      { x: 3.0, y: 63.6 },
      { x: 3.3, y: 81.8 },
      { x: 5.0, y: 178.5 },
    ],
  },
])

// Diode Family I-V Characteristics (Different saturation currents)
const diodeFamilyData = computed(() => [
  {
    label: 'Small Signal (1N4148)',
    unit: 'A',
    color: '#3b82f6', // blue
    data: [
      { x: 0.0, y: 0.0 },
      { x: 0.3, y: 1.1e-12 },
      { x: 0.5, y: 4.5e-9 },
      { x: 0.6, y: 1.8e-6 },
      { x: 0.65, y: 4.9e-5 },
      { x: 0.7, y: 1.3e-3 },
      { x: 0.75, y: 3.6e-2 },
      { x: 0.8, y: 0.98 },
      { x: 0.85, y: 26.7 },
    ],
  },
  {
    label: 'General Purpose (1N4007)',
    unit: 'A',
    color: '#10b981', // green
    data: [
      { x: 0.0, y: 0.0 },
      { x: 0.3, y: 1.1e-9 },
      { x: 0.5, y: 4.5e-6 },
      { x: 0.6, y: 1.8e-3 },
      { x: 0.65, y: 4.9e-2 },
      { x: 0.7, y: 1.3 },
      { x: 0.75, y: 36.0 },
      { x: 0.8, y: 980.0 },
    ],
  },
  {
    label: 'Schottky (1N5819)',
    unit: 'A',
    color: '#f59e0b', // amber/orange
    data: [
      { x: 0.0, y: 0.0 },
      { x: 0.1, y: 1.1e-6 },
      { x: 0.2, y: 4.5e-3 },
      { x: 0.25, y: 1.8e-1 },
      { x: 0.3, y: 4.9 },
      { x: 0.35, y: 130.0 },
      { x: 0.4, y: 3600.0 },
    ],
  },
])

// Load Line Analysis: Diode + Resistor Circuit
const loadLineData = computed(() => [
  {
    label: 'Diode I-V Curve',
    unit: 'mA',
    color: '#dc2626', // circuit-voltage (red)
    data: [
      { x: 0.0, y: 0.0 },
      { x: 0.1, y: 0.0 },
      { x: 0.3, y: 0.001 },
      { x: 0.5, y: 0.004 },
      { x: 0.6, y: 0.018 },
      { x: 0.65, y: 0.049 },
      { x: 0.7, y: 1.3 },
      { x: 0.75, y: 36.0 },
      { x: 0.8, y: 980.0 },
    ],
  },
  {
    label: 'Load Line (5V, 1kΩ)',
    unit: 'mA',
    color: '#3b82f6', // blue
    data: [
      { x: 0.0, y: 5.0 },
      { x: 1.0, y: 4.0 },
      { x: 2.0, y: 3.0 },
      { x: 3.0, y: 2.0 },
      { x: 4.0, y: 1.0 },
      { x: 5.0, y: 0.0 },
    ],
  },
  {
    label: 'Operating Point',
    unit: 'mA',
    color: '#10b981', // green
    data: [{ x: 0.64, y: 4.36 }], // Single intersection point
  },
])

// Temperature Effects: Silicon Diode Forward Voltage vs Temperature
const temperatureData = computed(() => [
  {
    label: 'Forward Voltage',
    unit: 'V',
    color: '#dc2626', // circuit-voltage color
    data: [
      { x: -40, y: 0.85 },
      { x: -20, y: 0.81 },
      { x: 0, y: 0.77 },
      { x: 25, y: 0.72 },
      { x: 50, y: 0.67 },
      { x: 75, y: 0.62 },
      { x: 100, y: 0.57 },
      { x: 125, y: 0.52 },
    ],
  },
  {
    label: 'Reverse Saturation Current',
    unit: 'nA',
    color: '#059669', // circuit-current color
    data: [
      { x: -40, y: 0.01 },
      { x: -20, y: 0.04 },
      { x: 0, y: 0.16 },
      { x: 25, y: 1.0 },
      { x: 50, y: 6.3 },
      { x: 75, y: 40.0 },
      { x: 100, y: 250.0 },
      { x: 125, y: 1600.0 },
    ],
  },
])

// Live Analysis Session Data (Simulated real-time updates)
const selectedAnalysisType = ref('resistance')
const currentSweepValue = ref(1500)
const currentOutputVoltage = ref(2.34)
const currentCircuitCurrent = ref(3.21)
const currentTotalPower = ref(7.5)
const currentSweepProgress = ref(68)
const currentSweepStep = ref(34)

// Simulate live parameter sweep animation
const animateLiveSweep = () => {
  // This would normally be driven by actual circuit simulation
  setInterval(() => {
    currentSweepValue.value = 100 + Math.random() * 9900
    const normalized = (currentSweepValue.value - 100) / 9900
    currentOutputVoltage.value = 0.45 + normalized * 4.0
    currentCircuitCurrent.value = 21.7 * Math.exp(-normalized * 5)
    currentTotalPower.value = currentOutputVoltage.value * currentCircuitCurrent.value
    currentSweepProgress.value = Math.min(99, currentSweepProgress.value + Math.random() * 2)
    currentSweepStep.value = Math.floor((currentSweepProgress.value / 100) * 50)
  }, 2000)
}

onMounted(() => {
  animateLiveSweep()
  startOscilloscopeAnimation()
})

// Oscilloscope System Implementation
const isOscilloscopeRunning = ref(true)
const currentSampleRate = ref(250) // MS/s
const timebaseScale = ref('100us')
const triggerSource = ref('ch1')
const triggerSlope = ref('rising')
const triggerLevel = ref(0.0)
const triggerPosition = ref(50) // percentage from top
const cursorsEnabled = ref(false)
const timeDelta = ref(5.2)
const voltageDelta = ref(2.1)

// Oscilloscope Channels Configuration
const channels = ref({
  ch1: {
    enabled: true,
    voltage_scale: '1V',
    signal_type: 'sine',
    frequency: 10, // kHz
    amplitude: 2.5, // V
    offset: 0.0,
    color: '#3B82F6', // Professional blue
  },
  ch2: {
    enabled: true,
    voltage_scale: '1V',
    signal_type: 'square',
    frequency: 5, // kHz
    amplitude: 1.8, // V
    offset: 0.5,
    color: '#F59E0B', // Professional amber/orange
  },
})

// Computed Properties
const enabledChannels = computed(() => {
  const enabled = []
  if (channels.value.ch1.enabled) {
    enabled.push({
      id: 'CH1',
      ...channels.value.ch1,
      voltage_scale: channels.value.ch1.voltage_scale,
    })
  }
  if (channels.value.ch2.enabled) {
    enabled.push({
      id: 'CH2',
      ...channels.value.ch2,
      voltage_scale: channels.value.ch2.voltage_scale,
    })
  }
  return enabled
})

// Waveform Generation Functions
const generateSineWave = (
  frequency: number,
  amplitude: number,
  offset: number,
  points: number = 500,
) => {
  const data = []
  const timeStep = 0.0001 // 100μs timebase
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const y = amplitude * Math.sin(2 * Math.PI * frequency * 1000 * t) + offset
    data.push({ x: t * 1000000, y }) // Convert to microseconds
  }
  return data
}

const generateSquareWave = (
  frequency: number,
  amplitude: number,
  offset: number,
  points: number = 500,
) => {
  const data = []
  const timeStep = 0.0001
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const y = amplitude * Math.sign(Math.sin(2 * Math.PI * frequency * 1000 * t)) + offset
    data.push({ x: t * 1000000, y })
  }
  return data
}

const generateTriangleWave = (
  frequency: number,
  amplitude: number,
  offset: number,
  points: number = 500,
) => {
  const data = []
  const timeStep = 0.0001
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const phase = (2 * Math.PI * frequency * 1000 * t) % (2 * Math.PI)
    let y
    if (phase < Math.PI) {
      y = amplitude * ((2 * phase) / Math.PI - 1)
    } else {
      y = amplitude * (3 - (2 * phase) / Math.PI)
    }
    data.push({ x: t * 1000000, y: y + offset })
  }
  return data
}

const generateSawtoothWave = (
  frequency: number,
  amplitude: number,
  offset: number,
  points: number = 500,
) => {
  const data = []
  const timeStep = 0.0001
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const phase = (2 * Math.PI * frequency * 1000 * t) % (2 * Math.PI)
    const y = amplitude * (phase / Math.PI - 1) + offset
    data.push({ x: t * 1000000, y })
  }
  return data
}

const generatePWMWave = (
  frequency: number,
  amplitude: number,
  offset: number,
  dutyCycle: number = 0.3,
  points: number = 500,
) => {
  const data = []
  const timeStep = 0.0001
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const phase = (frequency * 1000 * t) % 1
    const y = (phase < dutyCycle ? amplitude : 0) + offset
    data.push({ x: t * 1000000, y })
  }
  return data
}

const generateWhiteNoise = (amplitude: number, offset: number, points: number = 500) => {
  const data = []
  const timeStep = 0.0001
  for (let i = 0; i < points; i++) {
    const t = i * timeStep
    const y = amplitude * (Math.random() - 0.5) * 2 + offset
    data.push({ x: t * 1000000, y })
  }
  return data
}

// Channel interface for type safety
interface OscilloscopeChannel {
  enabled: boolean
  voltage_scale: string
  signal_type: string
  frequency: number
  amplitude: number
  offset: number
  color: string
}

// Generate waveform data based on channel settings
const generateWaveformData = (channel: OscilloscopeChannel) => {
  const { signal_type, frequency, amplitude, offset } = channel

  switch (signal_type) {
    case 'sine':
      return generateSineWave(frequency, amplitude, offset)
    case 'square':
      return generateSquareWave(frequency, amplitude, offset)
    case 'triangle':
      return generateTriangleWave(frequency, amplitude, offset)
    case 'sawtooth':
      return generateSawtoothWave(frequency, amplitude, offset)
    case 'pwm':
      return generatePWMWave(frequency, amplitude, offset)
    case 'noise':
      return generateWhiteNoise(amplitude, offset)
    default:
      return generateSineWave(frequency, amplitude, offset)
  }
}

// Oscilloscope Data for Chart Display
const oscilloscopeData = computed(() => {
  const datasets = []

  if (channels.value.ch1.enabled) {
    datasets.push({
      label: 'CH1',
      unit: 'V',
      color: channels.value.ch1.color,
      data: generateWaveformData(channels.value.ch1),
      pointRadius: 0, // No point markers
      pointHoverRadius: 0, // No hover points
      pointBorderWidth: 0, // No point borders
      pointHitRadius: 0, // No hit detection area
      tension: 0.1, // Smooth line curves
      fill: false, // No area fill
    })
  }

  if (channels.value.ch2.enabled) {
    datasets.push({
      label: 'CH2',
      unit: 'V',
      color: channels.value.ch2.color,
      data: generateWaveformData(channels.value.ch2),
      pointRadius: 0, // No point markers
      pointHoverRadius: 0, // No hover points
      pointBorderWidth: 0, // No point borders
      pointHitRadius: 0, // No hit detection area
      tension: 0.1, // Smooth line curves
      fill: false, // No area fill
    })
  }

  return datasets
})

// Measurement Calculations
const measuredFrequency = computed(() => {
  return channels.value.ch1.frequency || 10
})

const measuredVpp = computed(() => {
  return channels.value.ch1.amplitude * 2 || 5.0
})

const measuredVrms = computed(() => {
  return channels.value.ch1.amplitude / Math.sqrt(2) || 1.77
})

// Oscilloscope Control Functions
const toggleOscilloscope = () => {
  isOscilloscopeRunning.value = !isOscilloscopeRunning.value
}

const singleTrigger = () => {
  // Trigger single acquisition
  isOscilloscopeRunning.value = false
  setTimeout(() => {
    isOscilloscopeRunning.value = true
    setTimeout(() => {
      isOscilloscopeRunning.value = false
    }, 100)
  }, 50)
}

const autoScale = () => {
  // Auto-scale channels to optimal viewing
  channels.value.ch1.amplitude = 2.0
  channels.value.ch2.amplitude = 1.5
  triggerLevel.value = 0.0
}

const updateTimebase = () => {
  // Update timebase scaling - would affect data generation in real implementation
  console.log('Timebase updated to:', timebaseScale.value)
}

const updateChannels = () => {
  // Channel enable/disable - triggers reactive updates automatically
}

const updateWaveforms = () => {
  // Signal type changes - triggers reactive updates automatically
}

const updateTriggerPosition = () => {
  // Convert trigger level to position percentage (assuming ±5V range)
  triggerPosition.value = 50 - (triggerLevel.value / 5.0) * 40
}

const clearMeasurements = () => {
  cursorsEnabled.value = false
  timeDelta.value = 0
  voltageDelta.value = 0
}

const loadExample = (exampleType: string) => {
  switch (exampleType) {
    case 'rc_charging':
      channels.value.ch1.signal_type = 'square'
      channels.value.ch1.frequency = 1
      channels.value.ch1.amplitude = 5.0
      channels.value.ch2.signal_type = 'sine' // Represents exponential, but sine for demo
      channels.value.ch2.frequency = 1
      channels.value.ch2.amplitude = 3.16
      timebaseScale.value = '1ms'
      break
    case 'filter_response':
      channels.value.ch1.signal_type = 'square'
      channels.value.ch1.frequency = 50
      channels.value.ch1.amplitude = 3.0
      channels.value.ch2.signal_type = 'sine'
      channels.value.ch2.frequency = 50
      channels.value.ch2.amplitude = 1.5
      timebaseScale.value = '10us'
      break
    case 'pwm_motor':
      channels.value.ch1.signal_type = 'pwm'
      channels.value.ch1.frequency = 20
      channels.value.ch1.amplitude = 12.0
      channels.value.ch2.signal_type = 'triangle'
      channels.value.ch2.frequency = 20
      channels.value.ch2.amplitude = 8.0
      timebaseScale.value = '100us'
      break
  }
}

// Animation System
const startOscilloscopeAnimation = () => {
  // Simulate real-time waveform updates
  setInterval(() => {
    if (isOscilloscopeRunning.value) {
      // Slight frequency variations to simulate real signals
      channels.value.ch1.frequency += (Math.random() - 0.5) * 0.1
      channels.value.ch2.frequency += (Math.random() - 0.5) * 0.1

      // Update sample rate display
      currentSampleRate.value = 250 + Math.floor(Math.random() * 50)

      // Update cursor measurements
      if (cursorsEnabled.value) {
        timeDelta.value = 3.2 + Math.random() * 4
        voltageDelta.value = 1.5 + Math.random() * 2
      }
    }
  }, 100) // 10fps update rate
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
        class: 'cursor-col-resize-hd',
        css: "cursor: url('data:image/svg+xml;utf8,<svg...>') 8 8, col-resize",
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
