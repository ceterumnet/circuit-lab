<template>
  <div class="analysis-workspace" :class="workspaceClasses">
    <!-- Analysis Toolbar -->
    <div class="analysis-toolbar">
      <div class="toolbar-left">
        <h3>{{ workspaceTitle }}</h3>
        <div class="analysis-tabs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            :class="['tab-button', { active: currentTab === tab.id }]"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.icon }} {{ tab.name }}
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          class="expand-button"
          :class="{ active: isExpanded }"
          @click="toggleExpanded"
          title="Expand analysis workspace"
        >
          <ArrowRightFromLine v-if="!isExpanded" />
          <ArrowLeftToLine v-else />
        </button>

        <button
          class="fullscreen-button"
          :class="{ active: isFullscreen }"
          @click="toggleFullscreen"
          title="Fullscreen analysis"
        >
          <Maximize2 v-if="!isFullscreen" />
          <Minimize2 v-else />
        </button>
      </div>
    </div>

    <!-- Analysis Content -->
    <div class="analysis-content">
      <!-- Properties Tab -->
      <div v-if="currentTab === 'properties'" class="analysis-panel">
        <component-properties v-if="selectedComponent" :component="selectedComponent" />
        <probe-properties v-else-if="selectedProbe" :probe="selectedProbe" />
        <div v-else-if="multipleSelection" class="info-panel">
          <div class="info-icon">🔧</div>
          <h4>Multiple Items Selected</h4>
          <p>Editing multiple items at once is not yet supported.</p>
        </div>
        <div v-else class="info-panel">
          <div class="info-icon">🏗️</div>
          <h4>No Selection</h4>
          <p>Select a component to edit its properties</p>
        </div>
      </div>

      <!-- Analysis Tab -->
      <div v-if="currentTab === 'analysis'" class="analysis-panel">
        <parameter-analysis-panel v-if="hasCircuit" />
        <div v-else class="info-panel">
          <div class="info-icon">📊</div>
          <h4>No Circuit</h4>
          <p>Add components to start circuit analysis</p>
        </div>
      </div>

      <!-- Debug Tab -->
      <div v-if="currentTab === 'debug'" class="analysis-panel">
        <div class="info-panel">
          <div class="info-icon">🔍</div>
          <h4>Debug Tools</h4>
          <p>Debug panel coming soon...</p>
        </div>
      </div>

      <!-- Results Tab -->
      <div v-if="currentTab === 'results'" class="analysis-panel">
        <div class="info-panel">
          <div class="info-icon">📋</div>
          <h4>Analysis Results</h4>
          <p>Results panel coming soon...</p>
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
.analysis-workspace {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  background: white;
  border-left: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 50;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
}

.analysis-workspace.expanded {
  width: 800px;
}

.analysis-workspace.fullscreen {
  width: 100vw;
  left: 0;
  background: white;
  z-index: 1000;
}

.analysis-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  flex-shrink: 0;
  min-height: 60px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.toolbar-left h3 {
  margin: 0;
  font-size: 1rem;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analysis-tabs {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-button {
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.tab-button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.expand-button,
.fullscreen-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-button:hover,
.fullscreen-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.expand-button.active,
.fullscreen-button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.analysis-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.analysis-panel {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.info-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  color: #6c757d;
  padding: 2rem;
}

.info-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.info-panel h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #495057;
}

.info-panel p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .analysis-workspace.expanded {
    width: 600px;
  }
}

@media (max-width: 1200px) {
  .analysis-workspace.expanded {
    width: 500px;
  }

  .toolbar-left h3 {
    font-size: 0.9rem;
  }

  .tab-button {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

@media (max-width: 800px) {
  .analysis-workspace {
    width: 100vw;
    left: 0;
  }

  .analysis-workspace.expanded {
    width: 100vw;
  }
}
</style>
