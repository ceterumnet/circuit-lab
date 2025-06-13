<template>
  <div class="component-properties">
    <div class="property-item">
      <label>ID:</label>
      <span class="property-value">{{ component.id }}</span>
    </div>

    <div class="property-item">
      <label for="component-label">Label:</label>
      <input
        id="component-label"
        v-model="labelValue"
        type="text"
        class="property-input"
        @blur="updateLabel"
      />
    </div>

    <!-- Resistor specific properties -->
    <template v-if="component.type === ComponentType.RESISTOR">
      <div class="property-item">
        <label for="resistance-value">Resistance:</label>
        <div class="value-input-group">
          <input
            id="resistance-value"
            v-model="resistanceValue"
            type="number"
            class="property-input"
            @blur="updateResistance"
          />
          <select v-model="resistanceUnit" class="unit-select" @change="updateResistance">
            <option value="Ω">Ω</option>
            <option value="kΩ">kΩ</option>
            <option value="MΩ">MΩ</option>
          </select>
        </div>
      </div>
    </template>

    <!-- Voltage source specific properties -->
    <template v-else-if="component.type === ComponentType.VOLTAGE_SOURCE">
      <div class="property-item">
        <label for="voltage-value">Voltage:</label>
        <div class="value-input-group">
          <input
            id="voltage-value"
            v-model="voltageValue"
            type="number"
            class="property-input"
            @blur="updateVoltage"
          />
          <select v-model="voltageUnit" class="unit-select" @change="updateVoltage">
            <option value="V">V</option>
            <option value="mV">mV</option>
            <option value="kV">kV</option>
          </select>
        </div>
      </div>

      <div class="property-item">
        <label for="source-type">Type:</label>
        <select
          id="source-type"
          v-model="sourceType"
          class="property-input"
          @change="updateSourceType"
        >
          <option value="dc">DC</option>
          <option value="ac">AC</option>
          <option value="pulse">Pulse</option>
        </select>
      </div>
    </template>

    <div class="property-item">
      <label for="rotation">Rotation:</label>
      <input
        id="rotation"
        v-model="rotationValue"
        type="number"
        class="property-input"
        min="0"
        max="360"
        step="90"
        @blur="updateRotation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import type { CircuitComponent, Resistor, VoltageSource } from '@/types/circuit'
import { ComponentType } from '@/types/circuit'

interface Props {
  component: CircuitComponent
}

const props = defineProps<Props>()
const circuitStore = useCircuitStore()

// Reactive properties
const labelValue = ref(props.component.label || '')
const rotationValue = ref(props.component.rotation)

// Resistor properties
const resistanceValue = ref(0)
const resistanceUnit = ref('Ω')

// Voltage source properties
const voltageValue = ref(0)
const voltageUnit = ref('V')
const sourceType = ref<'dc' | 'ac' | 'pulse'>('dc')

// Initialize component-specific values
watch(
  () => props.component,
  (newComponent) => {
    labelValue.value = newComponent.label || ''
    rotationValue.value = newComponent.rotation

    if (newComponent.type === ComponentType.RESISTOR) {
      const resistor = newComponent as Resistor
      resistanceValue.value = resistor.resistance.value
      resistanceUnit.value = resistor.resistance.unit
    } else if (newComponent.type === ComponentType.VOLTAGE_SOURCE) {
      const source = newComponent as VoltageSource
      voltageValue.value = source.voltage.value
      voltageUnit.value = source.voltage.unit
      sourceType.value = source.sourceType
    }
  },
  { immediate: true },
)

// Update functions
function updateLabel() {
  circuitStore.updateComponent(props.component.id, {
    label: labelValue.value || undefined,
  })
}

function updateRotation() {
  circuitStore.updateComponent(props.component.id, {
    rotation: rotationValue.value,
  })
}

function updateResistance() {
  if (props.component.type === ComponentType.RESISTOR) {
    const resistor = props.component as Resistor
    circuitStore.updateComponent(props.component.id, {
      ...resistor,
      resistance: {
        value: resistanceValue.value,
        unit: resistanceUnit.value,
      },
    })
  }
}

function updateVoltage() {
  if (props.component.type === ComponentType.VOLTAGE_SOURCE) {
    const source = props.component as VoltageSource
    circuitStore.updateComponent(props.component.id, {
      ...source,
      voltage: {
        value: voltageValue.value,
        unit: voltageUnit.value,
      },
    })
  }
}

function updateSourceType() {
  if (props.component.type === ComponentType.VOLTAGE_SOURCE) {
    const source = props.component as VoltageSource
    circuitStore.updateComponent(props.component.id, {
      ...source,
      sourceType: sourceType.value,
    })
  }
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
  gap: 0.25rem;
  width: 100%;
}

.value-input-group .property-input {
  flex: 1;
  min-width: 0;
}

.unit-select {
  padding: 0.25rem 0.375rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background: white;
  width: 50px;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
}

.unit-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
