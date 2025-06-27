<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app">
    <!-- Simple header bar -->
    <!-- <header class="app-header" v-if="route.name !== 'circuit'">
      <div class="header-content">
        <h1 class="app-title">
          <RouterLink to="/circuit" class="title-link">Circuit Lab</RouterLink>
        </h1>
        <nav class="app-nav">
          <RouterLink to="/circuit" class="nav-link primary">Circuit Editor</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
        </nav>
      </div>
    </header> -->

    <!-- Main content -->
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 0;
  flex-shrink: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.title-link {
  color: #1f2937;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title-link:hover {
  color: #3b82f6;
}

.app-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #6b7280;
}

.nav-link:hover {
  color: #374151;
  background: #f3f4f6;
}

.nav-link.primary {
  background: #3b82f6;
  color: white;
}

.nav-link.primary:hover {
  background: #2563eb;
  color: white;
}

.nav-link.router-link-exact-active {
  color: #3b82f6;
  background: #eff6ff;
}

.nav-link.primary.router-link-exact-active {
  background: #1d4ed8;
  color: white;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
