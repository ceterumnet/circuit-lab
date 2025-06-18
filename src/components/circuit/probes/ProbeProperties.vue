<template>
  <div class="probe-properties">
    <div class="property-item">
      <label>ID:</label>
      <span class="property-value">{{ probe.id }}</span>
    </div>

    <div class="property-item">
      <label>Type:</label>
      <span class="property-value">Voltage Probe</span>
    </div>

    <div class="property-item">
      <label>Target:</label>
      <span class="property-value">{{ probe.targetId }}</span>
    </div>

    <div class="property-item">
        <label>Value:</label>
        <span class="property-value">{{ probeValue }} V</span>
    </div>

    <div class="property-item">
      <button class="delete-button" @click="deleteProbe">
        🗑️ Delete Probe
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCircuitStore } from '@/stores/circuit';
import type { Probe } from '@/types/components';
import { getComponentDefinition } from '@/registry/components';

interface Props {
  probe: Probe;
}

const props = defineProps<Props>();
const circuitStore = useCircuitStore();

const probeValue = computed(() => {
    const dcSolution = circuitStore.dcSolution;
    if (!dcSolution) return 'N/A';

    const { voltages, termToNodeIndex } = dcSolution;

    // A probe can be on a wire or a node directly.
    const targetId = props.probe.targetId;
    const targetComponent = circuitStore.currentCircuit.components.find(c => c.id === targetId);

    if (targetComponent?.type === 'wire' && targetComponent.properties) {
        // A wire connects two terminals. We can show the voltage of the first terminal's node.
        // A more advanced probe could show differential voltage.
        const startCompId = targetComponent.properties.startComponentId as string;
        const startTermId = targetComponent.properties.startTerminal as string;

        const fullTerminalId = `${startCompId}:${startTermId}`;
        const nodeIndex = termToNodeIndex.get(fullTerminalId);

        if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
            return voltages[nodeIndex].toFixed(3);
        }
    } else if (targetComponent?.type === 'node') {
        // The target is a node component. Its terminal is the node itself.
        const nodeDef = getComponentDefinition('node');
        if (!nodeDef) return 'N/A';
        const fullTerminalId = `${targetId}:${nodeDef.terminals[0].id}`;
        const nodeIndex = termToNodeIndex.get(fullTerminalId);

        if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
            return voltages[nodeIndex].toFixed(3);
        }
    }

    return 'N/A';
});

function deleteProbe() {
  circuitStore.removeProbe(props.probe.id);
}
</script>

<style scoped>
.probe-properties {
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

.property-value {
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
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
</style>
