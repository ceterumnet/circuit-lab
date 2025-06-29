<template>
  <div class="properties-panel">
    <!-- Properties Panel Header -->
    <div class="ide-panel-header">
      <h3 class="text-base font-medium text-gray-900">{{ workspaceTitle }}</h3>
      <button
        v-if="hasCircuit && !selectedComponent && !selectedProbe"
        class="btn btn-icon btn-sm"
        @click="showFullscreenAnalysis = true"
        title="Open fullscreen analysis"
      >
        <BarChart3 class="w-4 h-4" />
      </button>
    </div>

    <!-- Properties Panel Content -->
    <div class="ide-panel-content">
      <!-- Component Properties -->
      <div v-if="selectedComponent" class="property-section">
        <div class="property-section-title">Component Properties</div>
        <component-properties :component="selectedComponent" />
      </div>

      <!-- Probe Properties -->
      <div v-else-if="selectedProbe" class="property-section">
        <div class="property-section-title">Probe Settings</div>
        <probe-properties :probe="selectedProbe" />
      </div>

      <!-- Multiple Selection State -->
      <div v-else-if="multipleSelection" class="property-section">
        <div class="property-section-title">Multiple Selection</div>
        <div class="flex flex-col items-center justify-center text-center py-8">
          <Settings class="w-8 h-8 text-gray-400 mb-3" />
          <p class="text-sm text-gray-600">Editing multiple items at once is not yet supported.</p>
        </div>
      </div>

      <!-- Analysis Panel (when circuit exists but no selection) -->
      <div v-else-if="hasCircuit" class="property-section">
        <div class="property-section-title">Circuit Analysis</div>
        <parameter-analysis-panel />
      </div>

      <!-- Empty State -->
      <div v-else class="property-section">
        <div class="property-section-title">Circuit Builder</div>
        <div class="flex flex-col items-center justify-center text-center py-8">
          <Wrench class="w-8 h-8 text-gray-400 mb-3" />
          <p class="text-sm text-gray-600">Select a component to edit its properties</p>
        </div>
      </div>
    </div>

    <!-- Fullscreen Analysis Workspace Overlay -->
    <div v-if="showFullscreenAnalysis" class="analysis-workspace">
      <div class="analysis-controls">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">Parameter Analysis</h4>
          <button class="btn btn-secondary btn-sm" @click="showFullscreenAnalysis = false">
            <X class="w-4 h-4 mr-2" />
            Close
          </button>
        </div>
      </div>

      <div class="analysis-content">
        <enhanced-parameter-analysis-panel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Wrench, Settings, BarChart3, X } from 'lucide-vue-next'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import ParameterAnalysisPanel from './ParameterAnalysisPanel.vue'
import EnhancedParameterAnalysisPanel from './EnhancedParameterAnalysisPanel.vue'
import type { CircuitComponent, Probe } from '@/types/components'

interface Props {
  selectedComponent: CircuitComponent | null
  selectedProbe: Probe | null
  multipleSelection: boolean
  hasCircuit: boolean
}

const props = defineProps<Props>()

const showFullscreenAnalysis = ref(false)

const workspaceTitle = computed(() => {
  if (props.selectedComponent) return 'Component Properties'
  if (props.selectedProbe) return 'Probe Settings'
  if (props.multipleSelection) return 'Multiple Selection'
  if (props.hasCircuit) return 'Circuit Analysis'
  return 'Circuit Builder'
})
</script>

<style scoped>
/* Custom styles for expanded/fullscreen modes using available design system */
.properties-panel.expanded {
  width: 600px;
}

.properties-panel.fullscreen {
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

/* Responsive adjustments */
@media (max-width: 1400px) {
  .properties-panel.expanded {
    width: 500px;
  }
}

@media (max-width: 1200px) {
  .properties-panel.expanded {
    width: 400px;
  }
}

@media (max-width: 800px) {
  .properties-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 100;
    border-left: none;
  }

  .properties-panel.expanded {
    width: 100vw;
  }
}
</style>
