<template>
  <div class="component-properties">
    <div v-if="componentDefinition">
      <div class="property-item">
        <label>ID:</label>
        <span class="property-value">{{ component.id }}</span>
      </div>

      <div class="property-item">
        <label>Type:</label>
        <span class="property-value">{{ componentDefinition.name }}</span>
      </div>

      <div class="property-item">
        <label for="component-label">Label:</label>
        <input
          id="component-label"
          v-model="editableLabel"
          type="text"
          class="property-input"
          @blur="updateLabel"
        />
      </div>

      <!-- Dynamically generated properties -->
      <div
        v-for="propDef in componentDefinition.properties"
        :key="propDef.key"
        class="property-item"
      >
        <label :for="`prop-${propDef.key}`">{{ propDef.label }}:</label>

        <!-- Number Input -->
        <div v-if="propDef.type === 'number'" class="value-input-group">
          <input
            :id="`prop-${propDef.key}`"
            v-model.number="editableProperties[propDef.key]"
            type="number"
            class="property-input"
            @blur="updateProperty(propDef.key)"
          />
          <span v-if="propDef.unit" class="unit-span">{{ propDef.unit }}</span>
        </div>

        <!-- Select Dropdown -->
        <select
          v-else-if="propDef.type === 'select'"
          :id="`prop-${propDef.key}`"
          v-model="editableProperties[propDef.key]"
          class="property-input"
          @change="updateProperty(propDef.key)"
        >
          <option v-for="option in propDef.options" :key="option" :value="option">
            {{ option }}
          </option>
        </select>

        <!-- String Input -->
        <input
          v-else
          :id="`prop-${propDef.key}`"
          v-model="editableProperties[propDef.key]"
          type="text"
          class="property-input"
          @blur="updateProperty(propDef.key)"
        />
      </div>

      <!-- Common properties for non-wire components -->
      <div v-if="component.type !== 'wire'" class="property-item">
        <label for="rotation">Rotation:</label>
        <input
          id="rotation"
          v-model="editableRotation"
          type="number"
          class="property-input"
          min="0"
          max="360"
          step="90"
          @blur="updateRotation"
        />
      </div>

      <!-- Delete button for all components -->
      <div class="property-item">
        <button class="delete-button" @click="deleteComponent">
          🗑️ Delete {{ componentDefinition.name }}
        </button>
      </div>
    </div>
    <div v-else class="property-item">
      <span>No definition found for component type: {{ component.type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useHistoryStore } from '@/stores/history'
import type { CircuitComponent } from '@/types/components'
import { getComponentDefinition } from '@/registry/components'

interface Props {
  component: CircuitComponent
}

const props = defineProps<Props>()
const circuitStore = useCircuitStore()
const historyStore = useHistoryStore()

// Get the component definition from the registry
const componentDefinition = computed(() => getComponentDefinition(props.component.type))

// Create local, editable copies of the component's data
const editableLabel = ref('')
const editableRotation = ref(0)
const editableProperties = ref<Record<string, string | number | boolean>>({})

// Watch for the component prop changing and reset local state
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      editableLabel.value = newComponent.label || ''
      editableRotation.value = newComponent.rotation
      // Deep copy of properties to avoid direct mutation
      editableProperties.value = JSON.parse(JSON.stringify(newComponent.properties || {}))
    }
  },
  { immediate: true, deep: true },
)

// Update functions that commit changes to the store
function updateLabel() {
  circuitStore.updateComponent(props.component.id, {
    label: editableLabel.value || undefined,
  })
  historyStore.saveState(circuitStore.currentCircuit, 'Update label')
}

function updateRotation() {
  circuitStore.updateComponent(props.component.id, {
    rotation: editableRotation.value,
  })
  historyStore.saveState(circuitStore.currentCircuit, 'Rotate component')
}

function updateProperty(key: string) {
  // We need to update the whole properties object for reactivity
  const newProperties = {
    ...props.component.properties,
    [key]: editableProperties.value[key],
  }
  circuitStore.updateComponent(props.component.id, {
    properties: newProperties,
  })
  historyStore.saveState(circuitStore.currentCircuit, `Update ${key}`)
}

function deleteComponent() {
  circuitStore.removeComponent(props.component.id)
  historyStore.saveState(circuitStore.currentCircuit, 'Delete component')
}
</script>

<style scoped>
.component-properties {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
}

.property-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.property-item:last-child {
  margin-bottom: 0;
}

.property-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
}

.property-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.property-value {
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.value-input-group {
  display: flex;
  align-items: center;
}

.unit-span {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  width: 100%;
}

.delete-button:hover {
  background: #c82333;
}

.delete-button:active {
  background: #a71e2a;
}

.property-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out;
  position: relative;
  z-index: 20;
}
</style>
