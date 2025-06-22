<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 60 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Terminal connection lines -->
    <line x1="5" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="1.5" />
    <line x1="45" y1="20" x2="55" y2="20" stroke="currentColor" stroke-width="1.5" />

    <!-- LED triangle (anode side) -->
    <polygon
      points="15,10 15,30 30,20"
      :fill="isOn ? ledColor : 'none'"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />

    <!-- LED bar (cathode side) -->
    <line x1="30" y1="10" x2="30" y2="30" stroke="currentColor" stroke-width="2.5" />

    <!-- Light rays (visible when LED is on) -->
    <g v-if="isOn" :stroke="ledColor" stroke-width="1" opacity="0.8">
      <!-- First light ray -->
      <line x1="32" y1="12" x2="40" y2="8" />
      <polygon points="38,6 40,8 38,10" :fill="ledColor" />

      <!-- Second light ray -->
      <line x1="32" y1="16" x2="42" y2="12" />
      <polygon points="40,10 42,12 40,14" :fill="ledColor" />
    </g>

    <!-- Polarity markings -->
    <text
      x="10"
      y="8"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      A
    </text>
    <text
      x="35"
      y="8"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      K
    </text>

    <!-- Color indicator text -->
    <text
      x="30"
      y="36"
      font-family="Arial, sans-serif"
      font-size="6"
      :fill="ledColor"
      text-anchor="middle"
      opacity="0.7"
    >
      {{ colorName }}
    </text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  width?: number
  height?: number
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'white'
  isOn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 60,
  height: 40,
  color: 'red',
  isOn: false,
})

// LED color mapping for educational clarity
const colorMap = {
  red: '#ff4444',
  green: '#44ff44',
  blue: '#4444ff',
  yellow: '#ffff44',
  white: '#ffffff',
}

const ledColor = computed(() => colorMap[props.color])
const colorName = computed(() => props.color.toUpperCase())
</script>
