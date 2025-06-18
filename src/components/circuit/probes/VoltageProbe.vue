<template>
  <v-group
    ref="groupRef"
    :config="{
      x: probe.position.x,
      y: probe.position.y,
      draggable: true,
      name: 'probe',
    }"
    @dragend="handleDragEnd"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <v-circle
      :config="{
        radius: 6,
        fill: 'deeppink',
        stroke: 'white',
        strokeWidth: 2,
      }"
    />
    <v-text
      :config="{
        text: probeValue,
        x: 10,
        y: -10,
        fontSize: 14,
        fill: 'deeppink',
        fontFamily: 'monospace',
        listening: false,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCircuitStore } from '@/stores/circuit';
import type { Probe } from '@/types/components';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getComponentDefinition } from '@/registry/components';
import type { Group } from 'vue-konva';

interface Props {
  probe: Probe;
}

interface Emits {
  (e: 'select', probeId: string, event: KonvaEventObject<MouseEvent>): void;
  (e: 'dragend', probeId: string, event: KonvaEventObject<DragEvent>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const circuitStore = useCircuitStore();

const groupRef = ref<InstanceType<typeof Group> | null>(null);

watch(() => props.probe.position, (newPosition) => {
  const node = groupRef.value?.getNode();
  if (node) {
    node.to({
      x: newPosition.x,
      y: newPosition.y,
      duration: 0.1, // A short animation can smooth the transition
    });
  }
}, { deep: true });

const probeValue = computed(() => {
    const dcSolution = circuitStore.dcSolution;
    if (!dcSolution) return 'N/A';

    const { voltages, termToNodeIndex } = dcSolution;
    const targetId = props.probe.targetId;
    const targetComponent = circuitStore.currentCircuit.components.find(c => c.id === targetId);

    if (targetComponent?.type === 'wire' && targetComponent.properties) {
        const startCompId = targetComponent.properties.startComponentId as string;
        const startTermId = targetComponent.properties.startTerminal as string;

        const fullTerminalId = `${startCompId}:${startTermId}`;
        const nodeIndex = termToNodeIndex.get(fullTerminalId);

        if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
            return `${voltages[nodeIndex].toFixed(3)}V`;
        }
    } else if (targetComponent?.type === 'node') {
        const nodeDef = getComponentDefinition('node');
        if (!nodeDef) return 'N/A';
        const fullTerminalId = `${targetId}:${nodeDef.terminals[0].id}`;
        const nodeIndex = termToNodeIndex.get(fullTerminalId);

        if (nodeIndex !== undefined && voltages[nodeIndex] !== undefined) {
            return `${voltages[nodeIndex].toFixed(3)}V`;
        }
    }

    return 'N/A';
});

function handleClick(event: KonvaEventObject<MouseEvent>) {
  emit('select', props.probe.id, event);
}

function handleDragEnd(event: KonvaEventObject<DragEvent>) {
  // Prevent emitting the event if the position hasn't changed
  if (event.target.x() === props.probe.position.x && event.target.y() === props.probe.position.y) {
    return;
  }
  emit('dragend', props.probe.id, event);
}

function handleMouseEnter(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage();
  if (stage) {
    stage.container().style.cursor = 'pointer';
  }
}

function handleMouseLeave(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage();
  if (stage) {
    stage.container().style.cursor = 'default';
  }
}
</script>
