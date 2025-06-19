<template>
  <svg :width="width" :height="height" viewBox="0 0 30 16" class="wire-symbol">
    <!-- Simple wire connection - line with connection points -->
    <line
      x1="2"
      y1="8"
      x2="28"
      y2="8"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- Connection points at ends -->
    <circle cx="2" cy="8" r="2" fill="currentColor" />
    <circle cx="28" cy="8" r="2" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 30,
  height: 16,
})
</script>

<style scoped>
.wire-symbol {
  display: block;
}
</style>
