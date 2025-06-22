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

    <!-- Diode triangle (anode side) -->
    <polygon
      points="15,10 15,30 30,20"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />

    <!-- Diode bar (cathode side) -->
    <line x1="30" y1="10" x2="30" y2="30" stroke="currentColor" stroke-width="2.5" />

    <!-- Polarity markings for educational clarity -->
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
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 60,
  height: 40,
})
</script>
