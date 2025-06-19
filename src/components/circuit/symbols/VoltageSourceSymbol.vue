<template>
  <svg :width="width" :height="height" viewBox="0 0 40 40" class="voltage-source-symbol">
    <!-- DC voltage source - circle with polarity markings -->
    <circle cx="20" cy="20" r="16" stroke="currentColor" fill="none" stroke-width="1.5" />

    <!-- Positive terminal marking -->
    <text x="20" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor">
      +
    </text>

    <!-- Negative terminal marking -->
    <text x="20" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">
      −
    </text>

    <!-- Connection lines -->
    <line x1="20" y1="4" x2="20" y2="0" stroke="currentColor" stroke-width="1.5" />
    <line x1="20" y1="36" x2="20" y2="40" stroke="currentColor" stroke-width="1.5" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 40,
  height: 40,
})
</script>

<style scoped>
.voltage-source-symbol {
  display: block;
}
</style>
