<template>
  <svg :width="width" :height="height" viewBox="0 0 30 25" class="ground-symbol">
    <!-- Standard ground symbol - decreasing horizontal lines -->

    <!-- Connection line from top -->
    <line x1="15" y1="0" x2="15" y2="10" stroke="currentColor" stroke-width="1.5" />

    <!-- Ground symbol lines (decreasing width) -->
    <line x1="2" y1="10" x2="28" y2="10" stroke="currentColor" stroke-width="2" />
    <line x1="5" y1="14" x2="25" y2="14" stroke="currentColor" stroke-width="2" />
    <line x1="8" y1="18" x2="22" y2="18" stroke="currentColor" stroke-width="2" />
    <line x1="11" y1="22" x2="19" y2="22" stroke="currentColor" stroke-width="2" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 30,
  height: 25,
})
</script>

<style scoped>
.ground-symbol {
  display: block;
}
</style>
