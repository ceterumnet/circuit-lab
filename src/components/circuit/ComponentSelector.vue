<template>
  <div v-if="isOpen" class="component-selector-overlay" @click.self="closeSelector">
    <div class="component-selector" :style="selectorPosition">
      <div class="selector-header">
        <input
          ref="searchInput"
          v-model="searchQuery"
          class="search-input"
          placeholder="Search components..."
          @keydown="handleKeyDown"
          @input="handleSearchInput"
        />
      </div>
      <div class="selector-results">
        <div
          v-for="(component, index) in filteredComponents"
          :key="component.type"
          :class="['result-item', { selected: index === selectedIndex }]"
          @click="selectComponent(component.type)"
          @mouseenter="selectedIndex = index"
        >
          <component :is="getIconComponent(component.icon)" class="result-icon" />
          <span class="result-name">{{ component.name }}</span>
          <span class="result-shortcut">{{ getShortcutKey(component.type) }}</span>
        </div>
        <div v-if="filteredComponents.length === 0" class="no-results">No components found</div>
      </div>
      <div class="selector-footer">
        <span class="help-text flex items-center gap-2">
          <ArrowUp class="w-3 h-3" />
          <ArrowDown class="w-3 h-3" />
          Navigate • Enter Select • Esc Cancel
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useInteractionStore } from '@/stores/interaction'
import { getAllComponents } from '@/registry/components'
import type { ComponentDefinition } from '@/types/components'

// Import component symbols
import ResistorSymbol from './symbols/ResistorSymbol.vue'
import VoltageSourceSymbol from './symbols/VoltageSourceSymbol.vue'
import GroundSymbol from './symbols/GroundSymbol.vue'
import NodeSymbol from './symbols/NodeSymbol.vue'
import WireSymbol from './symbols/WireSymbol.vue'

const interactionStore = useInteractionStore()
const searchInput = ref<HTMLInputElement | null>(null)

// Reactive state
const isOpen = computed(() => interactionStore.componentSelectorState.isOpen)
const searchQuery = ref('')
const selectedIndex = ref(0)

// Position calculation
const selectorPosition = computed(() => {
  const position = interactionStore.componentSelectorState.position
  if (position) {
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
    }
  }
  // Default to center of screen
  return {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  }
})

// Get available components (excluding non-placeable ones)
const availableComponents = computed(() => {
  return getAllComponents().filter((component) => {
    const nonPlaceableTypes = ['wire']
    return !nonPlaceableTypes.includes(component.type)
  })
})

// Fuzzy search implementation
const filteredComponents = computed(() => {
  if (!searchQuery.value) {
    return availableComponents.value
  }

  const query = searchQuery.value.toLowerCase()
  return availableComponents.value.filter((component) => {
    const name = component.name.toLowerCase()
    const type = component.type.toLowerCase()

    // Simple fuzzy matching: check if all query characters appear in order
    return (
      name.includes(query) ||
      type.includes(query) ||
      fuzzyMatch(name, query) ||
      fuzzyMatch(type, query)
    )
  })
})

// Simple fuzzy matching function
function fuzzyMatch(text: string, query: string): boolean {
  let textIndex = 0
  let queryIndex = 0

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      queryIndex++
    }
    textIndex++
  }

  return queryIndex === query.length
}

// Get component icon
function getIconComponent(iconName?: string) {
  const iconMap = {
    ResistorSymbol: ResistorSymbol,
    VoltageSourceSymbol: VoltageSourceSymbol,
    GroundSymbol: GroundSymbol,
    NodeSymbol: NodeSymbol,
    WireSymbol: WireSymbol,
  }

  return iconMap[iconName as keyof typeof iconMap] || NodeSymbol
}

// Get shortcut key for component
function getShortcutKey(componentType: string): string {
  const shortcuts: { [key: string]: string } = {
    resistor: 'R',
    voltage_source: 'V',
    ground: 'G',
    node: 'N',
  }
  return shortcuts[componentType] || ''
}

// Handle keyboard navigation
function handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredComponents.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      selectCurrentComponent()
      break
    case 'Escape':
      e.preventDefault()
      closeSelector()
      break
  }
}

// Handle search input
function handleSearchInput() {
  selectedIndex.value = 0 // Reset selection when search changes
}

// Select component and close selector
function selectComponent(componentType: string) {
  interactionStore.setComponentToPlace(componentType)
  closeSelector()
}

// Select currently highlighted component
function selectCurrentComponent() {
  if (filteredComponents.value.length > 0 && selectedIndex.value >= 0) {
    const selectedComponent = filteredComponents.value[selectedIndex.value]
    selectComponent(selectedComponent.type)
  }
}

// Close selector
function closeSelector() {
  interactionStore.closeComponentSelector()
  searchQuery.value = ''
  selectedIndex.value = 0
}

// Watch for selector opening to focus input
watch(isOpen, (newIsOpen) => {
  if (newIsOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

// Watch for filtered results changes to adjust selection
watch(filteredComponents, (newComponents) => {
  if (selectedIndex.value >= newComponents.length) {
    selectedIndex.value = Math.max(0, newComponents.length - 1)
  }
})
</script>

<style scoped>
.component-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.component-selector {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  min-width: 320px;
  max-width: 400px;
  max-height: 500px;
  overflow: hidden;
}

.selector-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.selector-results {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.15s ease;
}

.result-item:hover,
.result-item.selected {
  background-color: #f8f9fa;
}

.result-item.selected {
  background-color: #e7f3ff;
  border-left: 3px solid #007bff;
}

.result-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.result-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.result-shortcut {
  background: #f1f3f4;
  color: #5f6368;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.selector-footer {
  padding: 8px 12px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.help-text {
  font-size: 12px;
  color: #666;
}
</style>
