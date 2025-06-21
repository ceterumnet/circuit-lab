import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'

import App from './App.vue'
import router from './router'

// Load component registry
import '@/registry/components'

// Load test circuit system (provides browser console API)
import '@/test-circuits'

// Import precision test runner for development
import './test-circuits/precision-runner'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueKonva)

app.mount('#app')
