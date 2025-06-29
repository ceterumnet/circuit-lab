<template>
  <svg :width="width" :height="height" viewBox="0 0 60 20" class="inductor-symbol">
    <!-- Standard inductor symbol - series of arcs representing coils -->
    <!-- Left connection line -->
    <line
      x1="0"
      y1="10"
      x2="12"
      y2="10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />

    <!-- Coil arcs -->
    <path
      d="M12,10 Q18,2 24,10"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M24,10 Q30,2 36,10"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M36,10 Q42,2 48,10"
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      stroke-linecap="round"
    />

    <!-- Right connection line -->
    <line
      x1="48"
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
.inductor-symbol {
  display: block;
}
</style>
