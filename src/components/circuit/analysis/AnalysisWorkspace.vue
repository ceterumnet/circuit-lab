<template>
  <div class="properties-panel-container" :class="workspaceClasses">
    <!-- Properties Panel Header -->
    <div class="properties-panel-header">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <h3 class="text-base font-semibold text-slate-900 truncate">{{ workspaceTitle }}</h3>
        <div class="analysis-tabs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            :class="['tab-button', { active: currentTab === tab.id }]"
            @click="setActiveTab(tab.id)"
          >
            <span class="mr-1">{{ tab.icon }}</span>
            <span class="hidden sm:inline">{{ tab.name }}</span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="btn btn-icon btn-sm"
          :class="{ 'btn-primary': isExpanded }"
          @click="toggleExpanded"
          title="Expand analysis workspace"
        >
          <ArrowRightFromLine v-if="!isExpanded" class="w-4 h-4" />
          <ArrowLeftToLine v-else class="w-4 h-4" />
        </button>

        <button
          class="btn btn-icon btn-sm"
          :class="{ 'btn-primary': isFullscreen }"
          @click="toggleFullscreen"
          title="Fullscreen analysis"
        >
          <Maximize2 v-if="!isFullscreen" class="w-4 h-4" />
          <Minimize2 v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Analysis Content -->
    <div class="properties-panel-content">
      <!-- Properties Tab -->
      <div v-if="currentTab === 'properties'" class="properties-panel-section">
        <component-properties v-if="selectedComponent" :component="selectedComponent" />
        <probe-properties v-else-if="selectedProbe" :probe="selectedProbe" />
        <div v-else-if="multipleSelection" class="info-panel">
          <div class="info-icon">🔧</div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">Multiple Items Selected</h4>
          <p class="text-slate-600">Editing multiple items at once is not yet supported.</p>
        </div>
        <div v-else class="info-panel">
          <div class="info-icon">🏗️</div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">No Selection</h4>
          <p class="text-slate-600">Select a component to edit its properties</p>
        </div>
      </div>

      <!-- Analysis Tab -->
      <div v-if="currentTab === 'analysis'" class="properties-panel-section">
        <parameter-analysis-panel v-if="hasCircuit" />
        <div v-else class="info-panel">
          <div class="info-icon">📊</div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">No Circuit</h4>
          <p class="text-slate-600">Add components to start circuit analysis</p>
        </div>
      </div>

      <!-- Debug Tab -->
      <div v-if="currentTab === 'debug'" class="properties-panel-section">
        <div class="info-panel">
          <div class="info-icon">🔍</div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">Debug Tools</h4>
          <p class="text-slate-600">Debug panel coming soon...</p>
        </div>
      </div>

      <!-- Results Tab -->
      <div v-if="currentTab === 'results'" class="properties-panel-section">
        <div class="info-panel">
          <div class="info-icon">📋</div>
          <h4 class="text-lg font-semibold text-slate-900 mb-2">Analysis Results</h4>
          <p class="text-slate-600">Results panel coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowRightFromLine, ArrowLeftToLine, Maximize2, Minimize2 } from 'lucide-vue-next'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import ParameterAnalysisPanel from './ParameterAnalysisPanel.vue'
import type { CircuitComponent, Probe } from '@/types/components'

interface Props {
  selectedComponent: CircuitComponent | null
  selectedProbe: Probe | null
  multipleSelection: boolean
  hasCircuit: boolean
}

const props = defineProps<Props>()

const isExpanded = ref(false)
const isFullscreen = ref(false)
const activeTab = ref('properties')

const workspaceClasses = computed(() => ({
  expanded: isExpanded.value,
  fullscreen: isFullscreen.value,
}))

const workspaceTitle = computed(() => {
  if (props.selectedComponent) return '🔧 Component Properties'
  if (props.selectedProbe) return '🔍 Probe Settings'
  if (props.multipleSelection) return '📦 Multiple Selection'
  if (props.hasCircuit) return '📊 Circuit Analysis'
  return '🏗️ Circuit Builder'
})

const availableTabs = computed(() => {
  const tabs = []

  // Always show properties tab
  tabs.push({ id: 'properties', name: 'Properties', icon: '🔧' })

  // Show analysis tab if we have a circuit
  if (props.hasCircuit) {
    tabs.push({ id: 'analysis', name: 'Analysis', icon: '📊' })
    tabs.push({ id: 'debug', name: 'Debug', icon: '🔍' })
    tabs.push({ id: 'results', name: 'Results', icon: '📋' })
  }

  return tabs
})

// Auto-switch to appropriate tab based on selection
const currentTab = computed(() => {
  if (props.selectedComponent || props.selectedProbe || props.multipleSelection) {
    return 'properties'
  }
  if (props.hasCircuit && activeTab.value === 'properties') {
    return 'analysis'
  }
  return activeTab.value
})

function setActiveTab(tabId: string) {
  activeTab.value = tabId
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    isFullscreen.value = false
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    isExpanded.value = false
  }
}
</script>

<style scoped>
/* Properties Panel - Professional Design System */
.properties-panel-container {
  height: 100%;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.properties-panel-container.expanded {
  width: 600px;
}

.properties-panel-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  border-left: none;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.properties-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  min-height: 56px;
}

.analysis-tabs {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-button {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.tab-button.active {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #3b82f6;
}

.properties-panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.properties-panel-section {
  flex: 1;
  overflow: auto;
  background: #fefefe;
}

.info-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 2rem;
}

.info-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

/* Scrollbar styling */
.properties-panel-section::-webkit-scrollbar {
  width: 4px;
}

.properties-panel-section::-webkit-scrollbar-track {
  background: transparent;
}

.properties-panel-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.properties-panel-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .properties-panel-container.expanded {
    width: 500px;
  }
}

@media (max-width: 1200px) {
  .properties-panel-container.expanded {
    width: 400px;
  }

  .tab-button {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
}

@media (max-width: 800px) {
  .properties-panel-container {
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
  }

  .properties-panel-container.expanded {
    width: 100vw;
  }

  .properties-panel-header {
    padding: 0.5rem 1rem;
    min-height: 48px;
  }
}
</style>
