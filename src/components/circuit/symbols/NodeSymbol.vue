<template>
  <svg :width="width" :height="height" viewBox="0 0 12 12" class="node-symbol">
    <!-- Standard node symbol - filled circle at wire junction -->
    <circle cx="6" cy="6" r="4" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
}

withDefaults(defineProps<Props>(), {
  width: 12,
  height: 12,
})
</script>

<style scoped>
.node-symbol {
  display: block;
}
</style>
