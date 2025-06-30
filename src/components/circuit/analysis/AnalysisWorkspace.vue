<template>
  <div class="properties-panel">
    <!-- Properties Panel Header -->
    <div class="ide-panel-header">
      <h3 class="text-base font-medium text-slate-900">{{ workspaceTitle }}</h3>
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
          <Settings class="w-8 h-8 text-slate-400 mb-3" />
          <p class="text-sm text-slate-600">Editing multiple items at once is not yet supported.</p>
        </div>
      </div>

      <!-- Analysis Panel (when circuit exists but no selection) -->
      <div v-else-if="hasCircuit" class="property-section">
        <div class="property-section-title">Circuit Analysis</div>

        <!-- Analysis Type Tabs -->
        <div class="flex gap-1 mb-4 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            @click="analysisMode = 'dc'"
            :class="[
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center',
              analysisMode === 'dc'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            ]"
          >
            <Zap class="w-4 h-4 mr-2" />
            DC Analysis
          </button>
          <button
            @click="analysisMode = 'ac'"
            :class="[
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center',
              analysisMode === 'ac'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            ]"
          >
            <BarChart3 class="w-4 h-4 mr-2" />
            AC Analysis
          </button>
        </div>

        <!-- Analysis Panel Content -->
        <div class="analysis-content">
          <parameter-analysis-panel v-if="analysisMode === 'dc'" />
          <a-c-analysis-panel v-else-if="analysisMode === 'ac'" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="property-section">
        <div class="property-section-title">Circuit Builder</div>
        <div class="flex flex-col items-center justify-center text-center py-8">
          <Wrench class="w-8 h-8 text-slate-400 mb-3" />
          <p class="text-sm text-slate-600">Select a component to edit its properties</p>
        </div>
      </div>
    </div>

    <!-- Fullscreen Analysis Workspace Overlay -->
    <div v-if="showFullscreenAnalysis" class="floating-panel fixed inset-0 z-50 bg-white">
      <div class="ide-panel-header">
        <h4 class="text-lg font-semibold text-slate-900">Parameter Analysis</h4>
        <button class="btn btn-secondary btn-sm" @click="showFullscreenAnalysis = false">
          <X class="w-4 h-4 mr-2" />
          Close
        </button>
      </div>

      <div class="ide-panel-content">
        <enhanced-parameter-analysis-panel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Wrench, Settings, BarChart3, X, Zap } from 'lucide-vue-next'
import ComponentProperties from '@/components/circuit/ComponentProperties.vue'
import ProbeProperties from '@/components/circuit/probes/ProbeProperties.vue'
import ParameterAnalysisPanel from './ParameterAnalysisPanel.vue'
import ACAnalysisPanel from './ACAnalysisPanel.vue'
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
const analysisMode = ref<'dc' | 'ac'>('dc')

const workspaceTitle = computed(() => {
  if (props.selectedComponent) return 'Component Properties'
  if (props.selectedProbe) return 'Probe Settings'
  if (props.multipleSelection) return 'Multiple Selection'
  if (props.hasCircuit) return 'Circuit Analysis'
  return 'Circuit Builder'
})
</script>

<style scoped>
/* Using design system classes only - no custom CSS */
</style>
