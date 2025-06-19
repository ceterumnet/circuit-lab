<template>
  <v-group>
    <!-- Probe Lead Line -->
    <v-line :config="{
      points: [probe.position.x, probe.position.y, leadEndPoint.x, leadEndPoint.y],
      stroke: '#adb5bd',
      strokeWidth: 1,
      dash: [3, 3],
      listening: false,
    }" />

    <!-- Draggable probe group -->
    <v-group
      ref="groupRef"
      :config="groupConfig"
      @dragend="handleDragEnd"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Probe Icon -->
      <v-circle
        :config="{
          radius: 6,
          fill: probe.type === 'voltage' ? 'deeppink' : 'lightseagreen',
          stroke: 'white',
          strokeWidth: 2,
        }"
      />

      <!-- Readout Display -->
      <v-rect :config="{
        x: 10,
        y: -12,
        width: 70,
        height: 20,
        fill: '#f8f9fa',
        cornerRadius: 3,
        stroke: '#dee2e6',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 3,
        shadowOpacity: 0.1,
        shadowOffsetY: 1,
      }" />
      <v-text
        :config="{
          text: probeValue,
          x: 15,
          y: -8,
          fontSize: 12,
          fill: '#212529',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          listening: false,
          width: 60,
          align: 'right'
        }"
      />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCircuitStore } from '@/stores/circuit';
import type { Probe, Position } from '@/types/components';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getComponentDefinition } from '@/registry/components';
import { getTerminalWorldPosition } from '@/services/geometry';

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

const leadEndPoint = computed(() => {
  const wire = circuitStore.currentCircuit.components.find(c => c.id === props.probe.targetId);
  if (wire?.type !== 'wire' || !wire.properties) return props.probe.position;

  const wireProps = wire.properties;
  const components = circuitStore.currentCircuit.components;
  const startComp = components.find(c => c.id === wireProps.startComponentId);
  const endComp = components.find(c => c.id === wireProps.endComponentId);

  if (!startComp || !endComp) return props.probe.position;

  const p1 = getTerminalWorldPosition(startComp, wireProps.startTerminal as string);
  const p2 = getTerminalWorldPosition(endComp, wireProps.endTerminal as string);

  const probePos = props.probe.position;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (dx === 0 && dy === 0) return p1;

  const t = ((probePos.x - p1.x) * dx + (probePos.y - p1.y) * dy) / (dx * dx + dy * dy);

  if (t < 0) return p1;
  if (t > 1) return p2;

  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy
  };
});

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
