<template>
  <v-group>
    <!-- The hit area is now a complex path to match the visible wire -->
    <v-path
      :config="{
        data: wirePathData,
        stroke: 'transparent',
        strokeWidth: 12,
        lineCap: 'round',
        lineJoin: 'round',
      }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mouseup="handleMouseUp"
    />

    <!-- The visible wire path, which includes hops -->
    <v-path
      :config="{
        data: wirePathData,
        stroke: isHovered ? '#00e500' : (component.selected ? '#ff4d4d' : '#333'),
        strokeWidth: isHovered ? 4 : (component.selected ? 3 : 2),
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      }"
    />
    <v-text
      v-if="formattedCurrent"
      :config="{
        x: annotationPosition.text.x,
        y: annotationPosition.text.y,
        text: formattedCurrent,
        fontSize: 10,
        fontFamily: 'monospace',
        fill: '#00A',
        align: 'center',
        verticalAlign: 'middle',
        rotation: textRotation
      }"
    />
    <v-path
      v-if="isFlowing"
      :config="{
        data: 'M -5 0 L 5 0 M 0 -4 L 5 0 L 0 4',
        stroke: '#00A',
        strokeWidth: 1.5,
        x: annotationPosition.arrow.x,
        y: annotationPosition.arrow.y,
        rotation: arrowRotation,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useCircuitStore } from '@/stores/circuit'
import { useInteractionStore } from '@/stores/interaction'
import { calculateWireIntersections } from '@/services/intersections'

interface Props {
  component: CircuitComponent
  startPosition?: Position
  endPosition?: Position
}

interface Emits {
  (e: 'select', event: KonvaEventObject<MouseEvent>): void
  (e: 'probe', event: KonvaEventObject<MouseEvent>): void
  (e: 'delete'): void
  (e: 'wire-mouseenter', event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseleave', event: KonvaEventObject<MouseEvent>): void
  (e: 'wire-mouseup', event: KonvaEventObject<MouseEvent>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const circuitStore = useCircuitStore()
const interactionStore = useInteractionStore()

const isHovered = computed(() => {
  return interactionStore.wireCreationState.isActive && interactionStore.hoveredWireId === props.component.id
})

const wireCurrent = computed(() => {
  if (!circuitStore.dcSolution || !circuitStore.dcSolution.currents) {
    return null;
  }
  const startComponentId = props.component.properties?.startComponentId as string;
  if (!startComponentId) return null;

  return circuitStore.dcSolution.currents[startComponentId] ?? null;
});

const formattedCurrent = computed(() => {
  if (wireCurrent.value === null || wireCurrent.value === undefined) return '';
  const current = wireCurrent.value;
  if (Math.abs(current) < 1e-12) return '0A';

  const sign = current > 0 ? '' : '-';
  const absCurrent = Math.abs(current);
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
});

const isFlowing = computed(() => {
  return wireCurrent.value !== null && Math.abs(wireCurrent.value) > 1e-12;
});

const midpoint = computed(() => ({
  x: (startPos.value.x + endPos.value.x) / 2,
  y: (startPos.value.y + endPos.value.y) / 2
}))

const arrowRotation = computed(() => {
  const dx = endPos.value.x - startPos.value.x;
  const dy = endPos.value.y - startPos.value.y;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (wireCurrent.value && wireCurrent.value < 0) {
    angle += 180;
  }
  return angle;
})

const textRotation = computed(() => {
  const dx = endPos.value.x - startPos.value.x;
  const dy = endPos.value.y - startPos.value.y;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Keep text right-side up
  if (angle > 90) {
    angle -= 180;
  } else if (angle < -90) {
    angle += 180;
  }

  return angle;
});

const annotationPosition = computed(() => {
  const dx = endPos.value.x - startPos.value.x;
  const dy = endPos.value.y - startPos.value.y;
  const angleRad = Math.atan2(dy, dx);
  const perpAngleRad = angleRad - Math.PI / 2;

  const arrowOffset = 10;
  const textOffset = 22;

  return {
    arrow: {
      x: midpoint.value.x + arrowOffset * Math.cos(perpAngleRad),
      y: midpoint.value.y + arrowOffset * Math.sin(perpAngleRad),
    },
    text: {
      x: midpoint.value.x + textOffset * Math.cos(perpAngleRad),
      y: midpoint.value.y + textOffset * Math.sin(perpAngleRad),
    }
  }
});

const allIntersections = computed(() => {
  return calculateWireIntersections(circuitStore.currentCircuit.components)
})

const intersections = computed(() => {
  const allHops = allIntersections.value.get(props.component.id) || []
  return allHops.filter(hop => {
    for (const [wireId, hops] of allIntersections.value.entries()) {
      if (wireId === props.component.id) continue
      const hasSameHop = hops.some(h => Math.abs(h.x - hop.x) < 1e-6 && Math.abs(h.y - hop.y) < 1e-6)
      if (hasSameHop) {
        return props.component.id < wireId
      }
    }
    return true
  })
})

const startPos = computed(() => {
  const p = props.startPosition || props.component.properties?.startPosition || { x: 0, y: 0 }
  return {
    x: isNaN((p as Position).x) ? 0 : (p as Position).x,
    y: isNaN((p as Position).y) ? 0 : (p as Position).y,
  }
})

const endPos = computed(() => {
  const p = props.endPosition || props.component.properties?.endPosition || { x: 0, y: 0 }
  return {
    x: isNaN((p as Position).x) ? 0 : (p as Position).x,
    y: isNaN((p as Position).y) ? 0 : (p as Position).y,
  }
})

const wirePathData = computed(() => {
  const hopRadius = 6
  const start = startPos.value
  const end = endPos.value
  const hops = intersections.value

  // If there are no intersections, draw a simple straight line.
  if (!hops || hops.length === 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  const wireVec = { x: end.x - start.x, y: end.y - start.y }
  const length = Math.sqrt(wireVec.x ** 2 + wireVec.y ** 2)
  if (length < 1e-9) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`

  const unitVec = { x: wireVec.x / length, y: wireVec.y / length }
  const angle = (Math.atan2(unitVec.y, unitVec.x) * 180) / Math.PI

  // Sort intersection points based on their distance from the start of the wire
  const sortedHops = [...hops].sort((a, b) => {
    const distA = (a.x - start.x) * unitVec.x + (a.y - start.y) * unitVec.y
    const distB = (b.x - start.x) * unitVec.x + (b.y - start.y) * unitVec.y
    return distA - distB
  })

  let path = `M ${start.x} ${start.y}`

  for (const hopCenter of sortedHops) {
    const distFromStart = Math.sqrt((hopCenter.x - start.x)**2 + (hopCenter.y - start.y)**2)
    const distFromEnd = length - distFromStart

    // Don't draw a hop if it's too close to an endpoint
    if (distFromStart < hopRadius * 2 || distFromEnd < hopRadius * 2) {
      continue
    }

    const pointBefore = {
      x: hopCenter.x - unitVec.x * hopRadius,
      y: hopCenter.y - unitVec.y * hopRadius,
    }
    const pointAfter = {
      x: hopCenter.x + unitVec.x * hopRadius,
      y: hopCenter.y + unitVec.y * hopRadius,
    }

    // Line to the start of the hop
    path += ` L ${pointBefore.x} ${pointBefore.y}`
    // Arc over the intersection point
    path += ` A ${hopRadius} ${hopRadius} ${angle} 0 1 ${pointAfter.x} ${pointAfter.y}`
  }

  // Final line to the end of the wire
  path += ` L ${end.x} ${end.y}`

  return path
})

function handleClick(e: KonvaEventObject<MouseEvent>) {
  if (interactionStore.isProbing) {
    emit('probe', e);
  } else {
    emit('select', e)
  }
}

function handleDoubleClick() {
  emit('delete')
}

function handleMouseEnter(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'pointer'
  }
  emit('wire-mouseenter', e)
}

function handleMouseLeave(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
  emit('wire-mouseleave', e)
}

function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
  emit('wire-mouseup', e)
}
</script>
