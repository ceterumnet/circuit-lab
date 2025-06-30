<template>
  <svg :width="width" :height="height" viewBox="0 0 40 40" class="ac-voltage-source-symbol">
    <!-- AC voltage source - circle with polarity markings and sine wave -->
    <circle cx="20" cy="20" r="16" stroke="currentColor" fill="none" stroke-width="1.5" />

    <!-- Sine wave inside circle to indicate AC -->
    <path
      d="M 8 20 Q 12 12, 16 20 T 24 20 T 32 20"
      stroke="currentColor"
      stroke-width="1.5"
      fill="none"
    />

    <!-- Positive terminal marking -->
    <text x="20" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor">
      +
    </text>

    <!-- Negative terminal marking -->
    <text x="20" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor">
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
.ac-voltage-source-symbol {
  display: block;
}
</style>
