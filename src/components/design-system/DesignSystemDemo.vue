<template>
  <div class="ide-layout">
    <!-- IDE Toolbar -->
    <div class="ide-toolbar">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold text-slate-900">Circuit Lab IDE</h1>
        <div class="flex items-center gap-2">
          <button class="btn btn-primary">
            <PlayIcon class="w-4 h-4 mr-2" />
            Simulate
          </button>
          <button class="btn btn-secondary">
            <StopIcon class="w-4 h-4 mr-2" />
            Stop
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="simulation-status running">
          <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Running...
        </div>
        <button class="btn btn-ghost btn-icon">
          <Cog6ToothIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- IDE Main Area -->
    <div class="ide-main">
      <!-- Component Palette -->
      <div class="component-palette">
        <div class="component-group">
          <div class="component-group-title">Components</div>
          <div class="component-list">
            <div class="component-item active">
              <div class="component-icon bg-blue-100 text-blue-600 rounded p-1">
                <BoltIcon class="w-3 h-3" />
              </div>
              <span class="component-label">Resistor</span>
            </div>
            <div class="component-item">
              <div class="component-icon bg-red-100 text-red-600 rounded p-1">
                <BatteryIcon class="w-3 h-3" />
              </div>
              <span class="component-label">Voltage Source</span>
            </div>
            <div class="component-item">
              <div class="component-icon bg-green-100 text-green-600 rounded p-1">
                <LightBulbIcon class="w-3 h-3" />
              </div>
              <span class="component-label">LED</span>
            </div>
          </div>
        </div>

        <div class="component-group">
          <div class="component-group-title">Analysis</div>
          <div class="component-list">
            <div class="component-item">
              <div class="component-icon bg-purple-100 text-purple-600 rounded p-1">
                <ChartBarIcon class="w-3 h-3" />
              </div>
              <span class="component-label">Voltage Probe</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Circuit Canvas -->
      <div class="circuit-canvas-container">
        <div class="circuit-canvas">
          <div class="flex items-center justify-center h-full text-slate-400">
            <div class="text-center">
              <CircuitBoardIcon class="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p class="text-lg font-medium mb-2">Circuit Canvas</p>
              <p class="text-sm">Professional schematic symbols will be rendered here</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Properties Panel -->
      <div class="properties-panel">
        <div class="property-section">
          <div class="property-section-title">Component Properties</div>

          <div class="property-field">
            <label class="property-label">Component ID</label>
            <div class="property-value">R1</div>
          </div>

          <div class="property-field">
            <label class="property-label">Resistance</label>
            <input
              type="number"
              class="property-input"
              value="1000"
              placeholder="Enter resistance"
            />
          </div>

          <div class="property-field">
            <label class="property-label">Tolerance</label>
            <select class="property-input">
              <option>5%</option>
              <option>1%</option>
              <option>0.1%</option>
            </select>
          </div>
        </div>

        <div class="property-section">
          <div class="property-section-title">Measurements</div>

          <div class="property-field">
            <label class="property-label">Voltage</label>
            <div class="property-value voltage-display">3.33 V</div>
          </div>

          <div class="property-field">
            <label class="property-label">Current</label>
            <div class="property-value current-display">3.33 mA</div>
          </div>

          <div class="property-field">
            <label class="property-label">Power</label>
            <div class="property-value power-display">11.09 mW</div>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-title">Debug Information</div>
          <div class="debug-table">
            <div class="debug-row">
              <span class="debug-label">Node Index</span>
              <span class="debug-value">1</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">Matrix Position</span>
              <span class="debug-value">[0,0]</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">Stamp Type</span>
              <span class="debug-value">Resistor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  BoltIcon,
  ChartBarIcon,
  LightBulbIcon,
  CircuitBoardIcon,
} from '@heroicons/vue/24/outline'
import { BatteryIcon } from '@heroicons/vue/24/solid'
</script>
