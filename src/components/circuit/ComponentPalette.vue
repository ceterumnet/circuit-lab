<template>
  <div class="component-palette">
    <div class="category-group">
      <h4>Analysis</h4>
      <div class="component-buttons">
        <button
          :class="['component-btn', { active: probingType === 'voltage' }]"
          @click="toggleProbeType('voltage')"
          title="Voltage Probe"
        >
          <span class="component-icon" v-html="voltageProbeIcon"></span>
          <span class="component-label">Voltage Probe</span>
        </button>
        <button
          :class="['component-btn', { active: probingType === 'current' }]"
          @click="toggleProbeType('current')"
          title="Current Probe"
        >
          <span class="component-icon" v-html="currentProbeIcon"></span>
          <span class="component-label">Current Probe</span>
        </button>
      </div>
    </div>

    <div
      v-for="category in componentCategories"
      :key="category.name"
      class="category-group"
    >
      <h4>{{ category.label }}</h4>
      <div class="component-buttons">
        <button
          v-for="component in category.components"
          :key="component.type"
          :class="['component-btn', { active: componentToPlace === component.type }]"
          @click="selectComponentForPlacement(component.type)"
          :title="component.name"
        >
          <span class="component-icon" v-html="component.icon"></span>
          <span class="component-label">{{ component.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInteractionStore } from '@/stores/interaction';
import { getComponentsByCategory } from '@/registry/components';

const interactionStore = useInteractionStore();

const probingType = computed(() => interactionStore.probingType);

const voltageProbeIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.2 21.2l-4.2-4.2"/>
    <path d="M15.2 9.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    <path d="M13 11l5 5"/>
    <path d="M6.25 3.75l-2.5 2.5"/>
    <path d="M4.63 8.13l-2.13 2.13a1 1 0 0 0 0 1.42l.7.7a1 1 0 0 0 1.42 0l2.12-2.12"/>
    <path d="M13 11l-2.12 2.12a1 1 0 0 1-1.42 0l-.7-.7a1 1 0 0 1 0-1.42L11 9"/>
  </svg>
`;

const currentProbeIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 16l-4-4 4-4"/>
    <path d="M8 12h8"/>
    <circle cx="12" cy="12" r="10"/>
  </svg>
`;

const componentCategories = computed(() => [
  {
    name: 'passive',
    label: 'Passive',
    components: getComponentsByCategory('passive')
  },
  {
    name: 'power',
    label: 'Power',
    components: getComponentsByCategory('power')
  },
  {
    name: 'connection',
    label: 'Connections',
    components: getComponentsByCategory('connection').filter(c => c.type !== 'wire')
  }
]);

const componentToPlace = computed(() => interactionStore.componentToPlace);

function selectComponentForPlacement(componentType: string) {
  if (interactionStore.componentToPlace === componentType) {
    interactionStore.setComponentToPlace(null);
  } else {
    interactionStore.setComponentToPlace(componentType);
  }
}

function toggleProbeType(type: 'voltage' | 'current') {
  if (interactionStore.probingType === type) {
    interactionStore.setProbeType(null);
  } else {
    interactionStore.setProbeType(type);
  }
}
</script>

<style scoped>
.component-palette {
  width: 240px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
  overflow-y: auto;
  height: 100vh;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-group:last-child {
  margin-bottom: 0;
}

.category-group h4 {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.5rem;
}

.component-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.component-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  text-align: left;
  width: 100%;
}

.component-btn:hover {
  background: #e9ecef;
}

.component-btn.active {
  background: #e7f3ff;
  border-color: #007bff;
  color: #0056b3;
  font-weight: 500;
}

.component-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.component-label {
  font-weight: 500;
}
</style>
