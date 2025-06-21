<template>
  <svg :width="width" :height="height" viewBox="0 0 40 40" class="switch-symbol">
    <!-- Connection lines -->
    <line x1="20" y1="0" x2="20" y2="8" stroke="currentColor" stroke-width="1.5" />
    <line x1="20" y1="32" x2="20" y2="40" stroke="currentColor" stroke-width="1.5" />

    <!-- Contact points -->
    <circle cx="20" cy="8" r="2" fill="currentColor" />
    <circle cx="20" cy="32" r="2" fill="currentColor" />

    <!-- Switch blade/arm (angled when open, straight when closed) -->
    <line
      :x1="20"
      :y1="8"
      :x2="isOpen ? 28 : 20"
      :y2="isOpen ? 18 : 32"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- State indicator text (for clarity) -->
    <text
      x="32"
      y="22"
      font-family="Arial, sans-serif"
      font-size="8"
      fill="currentColor"
      text-anchor="start"
    >
      {{ isOpen ? 'OPEN' : 'CLOSED' }}
    </text>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
  isOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  width: 40,
  height: 40,
  isOpen: false,
})
</script>

<style scoped>
.switch-symbol {
  display: block;
}
</style>
