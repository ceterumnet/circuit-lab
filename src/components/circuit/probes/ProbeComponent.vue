<template>
  <v-group
    ref="groupRef"
    :config="groupConfig"
    @dragend="handleDragEnd"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <v-circle
      :config="{
        radius: 6,
        fill: probe.type === 'voltage' ? 'deeppink' : 'lightseagreen',
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
        fill: probe.type === 'voltage' ? 'deeppink' : 'lightseagreen',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupRef = ref<any>(null);

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

  const { voltages, currents, termToNodeIndex } = dcSolution;
  const targetId = props.probe.targetId;

  if (props.probe.type === 'voltage') {
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
  } else if (props.probe.type === 'current') {
    const wire = circuitStore.currentCircuit.components.find(c => c.id === targetId);
    if (wire?.type !== 'wire' || !wire.properties) return 'N/A';

    // Find the component (resistor, v-source) connected to the wire to get the current from.
    const startCompId = wire.properties.startComponentId as string;
    const endCompId = wire.properties.endComponentId as string;

    let componentCurrent = currents[startCompId];
    if (componentCurrent === undefined) {
      componentCurrent = currents[endCompId];
    }

    if (componentCurrent === undefined) return 'N/A';

    if (Math.abs(componentCurrent) < 1e-12) return '0A';

    const sign = componentCurrent > 0 ? '' : '-';
    const absCurrent = Math.abs(componentCurrent);
    let value: string;
    let unit: string;

    if (absCurrent >= 1) {
      value = absCurrent.toPrecision(3);
      unit = 'A';
    } else if (absCurrent >= 1e-3) {
      value = (absCurrent * 1e3).toPrecision(3);
      unit = 'mA';
    } else if (absCurrent >= 1e-6) {
      value = (absCurrent * 1e6).toPrecision(3);
      unit = 'µA';
    } else if (absCurrent >= 1e-9) {
      value = (absCurrent * 1e9).toPrecision(3);
      unit = 'nA';
    } else {
      value = (absCurrent * 1e12).toPrecision(3);
      unit = 'pA';
    }
    return `${sign}${value}${unit}`;
  }

  return 'N/A';
});

const groupConfig = computed(() => {
  const position = props.probe.position;
  return {
    ...position,
    draggable: true
  };
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
