<template>
  <svg :width="width" :height="height" viewBox="0 0 60 20" class="capacitor-symbol">
    <!-- Standard capacitor symbol - two parallel plates -->
    <!-- Left connection line -->
    <line
      x1="0"
      y1="10"
      x2="22"
      y2="10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />

    <!-- Left plate -->
    <line
      x1="22"
      y1="4"
      x2="22"
      y2="16"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- Right plate -->
    <line
      x1="38"
      y1="4"
      x2="38"
      y2="16"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- Right connection line -->
    <line
      x1="38"
      y1="10"
      x2="60"
      y2="10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 60,
  height: 20,
})
</script>

<style scoped>
.capacitor-symbol {
  display: block;
}
</style>
