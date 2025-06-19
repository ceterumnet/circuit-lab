<template>
  <svg :width="width" :height="height" viewBox="0 0 60 20" class="resistor-symbol">
    <!-- Standard US-style zigzag resistor symbol -->
    <path
      d="M0,10 L12,10 L15,2 L21,18 L27,2 L33,18 L39,2 L45,18 L48,10 L60,10"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
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
  height: 20,
})
</script>

<style scoped>
.resistor-symbol {
  display: block;
}
</style>
