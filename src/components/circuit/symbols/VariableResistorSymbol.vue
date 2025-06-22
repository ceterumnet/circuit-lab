<template>
  <svg :width="width" :height="height" viewBox="0 0 60 25" class="variable-resistor-symbol">
    <!-- Standard US-style zigzag resistor symbol -->
    <path
      d="M0,12 L12,12 L15,4 L21,20 L27,4 L33,20 L39,4 L45,20 L48,12 L60,12"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Diagonal arrow indicating variability -->
    <path
      d="M20,0 L40,22 M37,18 L40,22 L36,19"
      stroke="currentColor"
      fill="none"
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
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
  height: 25,
})
</script>

<style scoped>
.variable-resistor-symbol {
  display: block;
}
</style>
