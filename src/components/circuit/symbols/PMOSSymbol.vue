<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Gate connection (horizontal from left) -->
    <line x1="5" y1="30" x2="22" y2="30" stroke="currentColor" stroke-width="1.5" />

    <!-- Gate plate (vertical bar) -->
    <line x1="22" y1="14" x2="22" y2="46" stroke="currentColor" stroke-width="2.5" />

    <!-- Drain connection (top right) -->
    <line x1="40" y1="8" x2="40" y2="20" stroke="currentColor" stroke-width="1.5" />

    <!-- Source connection (bottom right) -->
    <line x1="40" y1="48" x2="40" y2="55" stroke="currentColor" stroke-width="1.5" />

    <!-- Channel line (vertical, dashed for MOSFET) -->
    <line x1="30" y1="16" x2="30" y2="44" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />

    <!-- Drain to channel horizontal -->
    <line x1="30" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1.5" />

    <!-- Source to channel horizontal -->
    <line x1="30" y1="40" x2="40" y2="40" stroke="currentColor" stroke-width="1.5" />

    <!-- Body diagonal lines (gate to channel, showing oxide gap) -->
    <line x1="22" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="1" />
    <line x1="22" y1="40" x2="30" y2="40" stroke="currentColor" stroke-width="1" />

    <!-- PMOS arrow on source (pointing inward, toward channel) -->
    <polygon points="32,40 28,41 28,39" fill="currentColor" stroke="currentColor" />

    <!-- Terminal labels -->
    <text
      x="44"
      y="11"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      D
    </text>
    <text
      x="8"
      y="28"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      G
    </text>
    <text
      x="44"
      y="52"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      S
    </text>

    <!-- Type indicator -->
    <text
      x="6"
      y="16"
      font-family="Arial, sans-serif"
      font-size="6"
      fill="currentColor"
      text-anchor="start"
    >
      PM
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
  height: 60,
})
</script>
