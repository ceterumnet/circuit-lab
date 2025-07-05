<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Collector connection -->
    <line x1="30" y1="5" x2="30" y2="20" stroke="currentColor" stroke-width="1.5" />

    <!-- Base connection -->
    <line x1="5" y1="30" x2="18" y2="30" stroke="currentColor" stroke-width="1.5" />

    <!-- Emitter connection -->
    <line x1="30" y1="40" x2="30" y2="55" stroke="currentColor" stroke-width="1.5" />

    <!-- Base vertical line (main transistor body) -->
    <line x1="18" y1="18" x2="18" y2="42" stroke="currentColor" stroke-width="2.5" />

    <!-- Collector line (from base to collector terminal) -->
    <line x1="18" y1="22" x2="30" y2="20" stroke="currentColor" stroke-width="1.5" />

    <!-- Emitter line (from base to emitter terminal) -->
    <line x1="18" y1="38" x2="30" y2="40" stroke="currentColor" stroke-width="1.5" />

    <!-- NPN Arrow on emitter (pointing outward - conventional current flow) -->
    <polygon points="32,39 28,40 28,36" fill="currentColor" stroke="currentColor" />

    <!-- Terminal labels for educational clarity -->
    <text
      x="34"
      y="8"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      C
    </text>
    <text
      x="8"
      y="28"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      B
    </text>
    <text
      x="34"
      y="52"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="middle"
    >
      E
    </text>

    <!-- Transistor type indicator -->
    <text
      x="40"
      y="32"
      font-family="Arial, sans-serif"
      font-size="6"
      fill="currentColor"
      text-anchor="start"
    >
      NPN
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
