<template>
  <div class="component-palette">
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
