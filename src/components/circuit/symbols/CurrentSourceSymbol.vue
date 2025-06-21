<template>
  <svg :width="width" :height="height" viewBox="0 0 40 40" class="current-source-symbol">
    <!-- DC current source - circle with current arrow -->
    <circle cx="20" cy="20" r="16" stroke="currentColor" fill="none" stroke-width="1.5" />

    <!-- Current flow arrow pointing from positive to negative -->
    <path
      d="M 12 20 L 28 20 M 25 17 L 28 20 L 25 23"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

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
.current-source-symbol {
  display: block;
}
</style>
