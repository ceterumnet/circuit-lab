<template>
  <v-group>
    <!-- Snap guide lines (shown during drag) -->
    <v-group v-if="isDragging">
      <!-- 0° guide line -->
      <v-line
        :config="{
          points: [
            component.position.x,
            component.position.y,
            component.position.x + snapGuideLength,
            component.position.y,
          ],
          stroke: '#007bff',
          strokeWidth: 1,
          opacity: 0.3,
          dash: [2, 2],
          listening: false,
        }"
      />
      <!-- 90° guide line -->
      <v-line
        :config="{
          points: [
            component.position.x,
            component.position.y,
            component.position.x,
            component.position.y - snapGuideLength,
          ],
          stroke: '#007bff',
          strokeWidth: 1,
          opacity: 0.3,
          dash: [2, 2],
          listening: false,
        }"
      />
      <!-- 180° guide line -->
      <v-line
        :config="{
          points: [
            component.position.x,
            component.position.y,
            component.position.x - snapGuideLength,
            component.position.y,
          ],
          stroke: '#007bff',
          strokeWidth: 1,
          opacity: 0.3,
          dash: [2, 2],
          listening: false,
        }"
      />
      <!-- 270° guide line -->
      <v-line
        :config="{
          points: [
            component.position.x,
            component.position.y,
            component.position.x,
            component.position.y + snapGuideLength,
          ],
          stroke: '#007bff',
          strokeWidth: 1,
          opacity: 0.3,
          dash: [2, 2],
          listening: false,
        }"
      />

      <!-- Snap preview line (where it will snap to) -->
      <v-line
        v-if="snapPreviewPosition"
        :config="{
          points: [
            component.position.x,
            component.position.y,
            snapPreviewPosition.x,
            snapPreviewPosition.y,
          ],
          stroke: '#28a745',
          strokeWidth: 2,
          opacity: 0.7,
          listening: false,
        }"
      />

      <!-- Angle indicator -->
      <v-text
        :config="{
          x: component.position.x + 60,
          y: component.position.y - 10,
          text: angleText,
          fontSize: 12,
          fill: '#007bff',
          fontFamily: 'Arial, sans-serif',
          listening: false,
        }"
      />
    </v-group>

    <!-- Connection line from component to handle -->
    <v-line
      :config="{
        points: [component.position.x, component.position.y, handlePosition.x, handlePosition.y],
        stroke: isDragging ? '#007bff' : '#007bff',
        strokeWidth: isDragging ? 2 : 1,
        dash: [3, 3],
        opacity: isDragging ? 0.8 : 0.6,
        listening: false,
      }"
    />

    <!-- Rotation handle circle -->
    <v-circle
      :config="{
        x: handlePosition.x,
        y: handlePosition.y,
        radius: isDragging ? 10 : 8,
        fill: isDragging ? '#0056b3' : '#007bff',
        stroke: '#ffffff',
        strokeWidth: 2,
        draggable: true,
        name: 'rotation-handle',
      }"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />

    <!-- Rotation handle icon (rotate symbol) -->
    <v-text
      :config="{
        x: handlePosition.x - 6,
        y: handlePosition.y - 6,
        text: '↻',
        fontSize: isDragging ? 14 : 12,
        fill: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        listening: false,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CircuitComponent, Position } from '@/types/components'
import type { KonvaEventObject } from 'konva/lib/Node'

interface Props {
  component: CircuitComponent
}

interface Emits {
  (e: 'rotate', componentId: string, rotation: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Handle positioning - place it at a fixed distance from the component
const handleDistance = 50
const snapGuideLength = 40
const handlePosition = computed(() => {
  // If dragging, use the drag position, otherwise use the default position
  if (isDragging.value && dragPosition.value) {
    return dragPosition.value
  }

  // Position the handle above and to the right of the component
  return {
    x: props.component.position.x + handleDistance * Math.cos(-Math.PI / 4),
    y: props.component.position.y + handleDistance * Math.sin(-Math.PI / 4),
  }
})

// Snap preview position (where component will snap to)
const snapPreviewPosition = computed(() => {
  if (!isDragging.value) return null

  const currentRotation = props.component.rotation
  const snappedAngle = Math.round(currentRotation / 90) * 90
  const angleInRadians = (snappedAngle * Math.PI) / 180

  return {
    x: props.component.position.x + handleDistance * Math.cos(angleInRadians),
    y: props.component.position.y + handleDistance * Math.sin(angleInRadians),
  }
})

// Angle display text
const angleText = computed(() => {
  if (!isDragging.value) return ''
  return `${Math.round(props.component.rotation)}°`
})

// Drag state
const isDragging = ref(false)
const dragPosition = ref<Position | null>(null)
const initialRotation = ref(0)
const dragStartPosition = ref<Position | null>(null)
const initialAngle = ref(0)
const hasStartedRotating = ref(false)

function handleDragStart(e: KonvaEventObject<DragEvent>) {
  isDragging.value = true
  initialRotation.value = props.component.rotation
  hasStartedRotating.value = false

  // Store the initial drag position
  const stage = e.target.getStage()
  if (stage) {
    const pointer = stage.getPointerPosition()
    if (pointer) {
      dragStartPosition.value = pointer
      dragPosition.value = pointer

      // Calculate the initial angle from component center to handle position
      const dx = pointer.x - props.component.position.x
      const dy = pointer.y - props.component.position.y
      initialAngle.value = Math.atan2(dy, dx) * (180 / Math.PI)
    }
  }
}

function handleDragMove(e: KonvaEventObject<DragEvent>) {
  if (!isDragging.value) return

  const stage = e.target.getStage()
  if (!stage) return

  const pointer = stage.getPointerPosition()
  if (!pointer || !dragStartPosition.value) return

  // Store the current drag position for line rendering
  dragPosition.value = pointer

  // Only start rotating after a minimum drag distance to avoid jumps
  const dragDistance = Math.sqrt(
    Math.pow(pointer.x - dragStartPosition.value.x, 2) +
      Math.pow(pointer.y - dragStartPosition.value.y, 2),
  )

  if (dragDistance < 5 && !hasStartedRotating.value) {
    // Not enough movement yet, don't start rotating
    return
  }

  hasStartedRotating.value = true

  // Calculate current angle from component center to current mouse position
  const dx = pointer.x - props.component.position.x
  const dy = pointer.y - props.component.position.y
  const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Calculate the change in angle from the initial grab position
  let angleDelta = currentAngle - initialAngle.value

  // Handle angle wraparound (e.g., from 350° to 10°)
  if (angleDelta > 180) {
    angleDelta -= 360
  } else if (angleDelta < -180) {
    angleDelta += 360
  }

  // Apply the angle change to the initial rotation
  const newRotation = initialRotation.value + angleDelta

  // Normalize to 0-360 range
  const normalizedAngle = ((newRotation % 360) + 360) % 360

  // Emit continuous rotation update for immediate visual feedback
  emit('rotate', props.component.id, normalizedAngle)
}

function handleDragEnd() {
  if (!isDragging.value) return

  // Only snap if we actually started rotating
  if (hasStartedRotating.value) {
    // Snap to 90-degree increments on release
    const currentRotation = props.component.rotation
    const snappedAngle = Math.round(currentRotation / 90) * 90
    const normalizedAngle = ((snappedAngle % 360) + 360) % 360

    // Emit final snapped rotation
    emit('rotate', props.component.id, normalizedAngle)
  }

  // Reset all drag state
  isDragging.value = false
  dragPosition.value = null
  dragStartPosition.value = null
  initialAngle.value = 0
  hasStartedRotating.value = false
}

function handleMouseEnter(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'grab'
  }
}

function handleMouseLeave(e: KonvaEventObject<MouseEvent>) {
  const stage = e.target.getStage()
  if (stage) {
    stage.container().style.cursor = 'default'
  }
}
</script>
