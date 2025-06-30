<template>
  <svg :width="width" :height="height" viewBox="0 0 40 40" class="ac-current-source-symbol">
    <!-- AC current source - circle with current arrow and sine wave -->
    <circle cx="20" cy="20" r="16" stroke="currentColor" fill="none" stroke-width="1.5" />

    <!-- Current flow arrow pointing from positive to negative -->
    <path
      d="M 10 17 L 24 17 M 21 14 L 24 17 L 21 20"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Small sine wave below arrow to indicate AC -->
    <path
      d="M 12 24 Q 14 22, 16 24 T 20 24 T 24 24 T 28 24"
      stroke="currentColor"
      stroke-width="1"
      fill="none"
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
.ac-current-source-symbol {
  display: block;
}
</style>
