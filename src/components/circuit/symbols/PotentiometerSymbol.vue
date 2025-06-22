<template>
  <svg :width="width" :height="height" viewBox="0 0 60 40" class="potentiometer-symbol">
    <!-- Base resistor symbol (zigzag pattern) -->
    <path
      d="M0,20 L12,20 L15,12 L21,28 L27,12 L33,28 L39,12 L45,28 L48,20 L60,20"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Wiper arrow (adjustable tap) -->
    <path
      d="M30,5 L30,12 M27,8 L30,5 L33,8"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Optional wiper terminal line for 3-terminal potentiometer -->
    <line
      v-if="showWiperTerminal"
      x1="30"
      y1="5"
      x2="30"
      y2="0"
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
  showWiperTerminal?: boolean
}

withDefaults(defineProps<Props>(), {
  width: 60,
  height: 40,
  showWiperTerminal: false,
})
</script>

<style scoped>
.potentiometer-symbol {
  display: block;
}
</style>
