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

    <!-- Rotation handle group -->
    <v-group
      :config="{
        x: handlePosition.x,
        y: handlePosition.y,
        draggable: true,
        name: 'rotation-handle',
      }"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @mousedown="handleMouseDown"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      :scaleX="isDragging ? 1.2 : 1"
      :scaleY="isDragging ? 1.2 : 1"
    >
      <!-- Rotation handle circle -->
      <v-circle
        :config="{
          x: 0,
          y: 0,
          radius: 8,
          fill: isDragging ? '#0056b3' : '#007bff',
          stroke: '#ffffff',
          strokeWidth: 2,
        }"
      />

      <!-- Rotation handle icon (rotate symbol) -->
      <v-path
        :config="{
          x: -6.9,
          y: -7.2,
          data: 'M11.5 20.5C6.80558 20.5 3 16.6944 3 12C3 7.30558 6.80558 3.5 11.5 3.5C16.1944 3.5 20 7.30558 20 12C20 13.5433 19.5887 14.9905 18.8698 16.238M22.5 15L18.8698 16.238M17.1747 12.3832L18.5289 16.3542L18.8698 16.238',
          stroke: '#ffffff',
          strokeWidth: isDragging ? 1.5 : 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: '',
          scaleX: 0.6,
          scaleY: 0.6,
          listening: false,
        }"
      />
    </v-group>
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
// Handle offset angle relative to component (always 45° to the top-right)
const handleOffsetAngle = -Math.PI / 4 // -45° in radians

const handlePosition = computed(() => {
  // Calculate handle position based on component rotation + handle offset
  const totalAngle = (props.component.rotation * Math.PI) / 180 + handleOffsetAngle

  return {
    x: props.component.position.x + handleDistance * Math.cos(totalAngle),
    y: props.component.position.y + handleDistance * Math.sin(totalAngle),
  }
})

// Snap preview position (where component will snap to)
const snapPreviewPosition = computed(() => {
  if (!isDragging.value) return null

  const currentRotation = props.component.rotation
  const snappedAngle = Math.round(currentRotation / 90) * 90
  const totalAngle = (snappedAngle * Math.PI) / 180 + handleOffsetAngle

  return {
    x: props.component.position.x + handleDistance * Math.cos(totalAngle),
    y: props.component.position.y + handleDistance * Math.sin(totalAngle),
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
const initialGrabAngle = ref(0) // Angle from component to where user grabbed
const initialHandleAngle = ref(0) // Angle of handle relative to component rotation
const hasStartedRotating = ref(false)

function handleDragStart(e: KonvaEventObject<DragEvent>) {
  e.evt.preventDefault()
  e.evt.stopPropagation()

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

      // Calculate where the user grabbed relative to component center
      const dx = pointer.x - props.component.position.x
      const dy = pointer.y - props.component.position.y
      initialGrabAngle.value = Math.atan2(dy, dx) * (180 / Math.PI)

      // The handle has a fixed offset angle relative to the component rotation
      initialHandleAngle.value = (handleOffsetAngle * 180) / Math.PI // Convert to degrees
    }
  }
}

function handleDragMove(e: KonvaEventObject<DragEvent>) {
  e.evt.preventDefault()
  e.evt.stopPropagation()

  if (!isDragging.value) return

  const stage = e.target.getStage()
  if (!stage) return

  const pointer = stage.getPointerPosition()
  if (!pointer || !dragStartPosition.value) return

  // Store the current drag position for line rendering (raw mouse position)
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
  const currentMouseAngle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Calculate how much the mouse has moved angularly from the initial grab
  let mouseAngleDelta = currentMouseAngle - initialGrabAngle.value

  // Handle angle wraparound (e.g., from 350° to 10°)
  if (mouseAngleDelta > 180) {
    mouseAngleDelta -= 360
  } else if (mouseAngleDelta < -180) {
    mouseAngleDelta += 360
  }

  // The component should rotate by the same amount the mouse moved around the circle
  const newRotation = initialRotation.value + mouseAngleDelta

  // Normalize to 0-360 range
  const normalizedAngle = ((newRotation % 360) + 360) % 360

  // Emit continuous rotation update for immediate visual feedback
  emit('rotate', props.component.id, normalizedAngle)
}

function handleDragEnd(e: KonvaEventObject<DragEvent>) {
  e.evt.preventDefault()
  e.evt.stopPropagation()

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
  initialGrabAngle.value = 0
  initialHandleAngle.value = 0
  hasStartedRotating.value = false
}

function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
  e.evt.preventDefault()
  e.evt.stopPropagation()
}

function handleClick(e: KonvaEventObject<MouseEvent>) {
  e.evt.preventDefault()
  e.evt.stopPropagation()
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
