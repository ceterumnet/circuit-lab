<template>
  <svg :width="width" :height="height" viewBox="0 0 30 30" class="probe-symbol">
    <!-- Probe symbol - circle with measurement indicator -->
    <circle cx="15" cy="15" r="12" stroke="currentColor" fill="none" stroke-width="2" />

    <!-- Voltage probe - V symbol -->
    <text
      v-if="type === 'voltage'"
      x="15"
      y="20"
      text-anchor="middle"
      font-size="12"
      font-weight="bold"
      fill="currentColor"
    >
      V
    </text>

    <!-- Current probe - A symbol -->
    <text
      v-if="type === 'current'"
      x="15"
      y="20"
      text-anchor="middle"
      font-size="12"
      font-weight="bold"
      fill="currentColor"
    >
      A
    </text>

    <!-- Probe tip indicator -->
    <circle cx="15" cy="8" r="2" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  type: 'voltage' | 'current'
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 30,
  height: 30,
})
</script>

<style scoped>
.probe-symbol {
  display: block;
}
</style>
