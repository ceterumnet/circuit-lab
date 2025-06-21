<template>
  <div class="save-load-panel">
    <!-- Save Section -->
    <div class="section">
      <h3>Save Circuit</h3>
      <div class="save-form">
        <input
          v-model="saveCircuitName"
          type="text"
          placeholder="Enter circuit name..."
          class="name-input"
          @keyup.enter="handleSave"
        />
        <button class="save-button" :disabled="!saveCircuitName.trim()" @click="handleSave">
          <Save class="icon" />
          Save
        </button>
      </div>
    </div>

    <!-- Load Section -->
    <div class="section">
      <h3>Load Circuit</h3>
      <div v-if="savedCircuits.length === 0" class="empty-state">
        <p>No saved circuits found.</p>
        <button class="seed-button" @click="seedTestCircuits">
          <Database class="icon" />
          Load Test Circuits
        </button>
      </div>
      <div v-else class="circuit-list">
        <div v-for="circuit in savedCircuits" :key="circuit.name" class="circuit-item">
          <div class="circuit-info">
            <span class="circuit-name">{{ circuit.name }}</span>
            <span class="circuit-date">{{ formatDate(circuit.savedAt) }}</span>
          </div>
          <div class="circuit-actions">
            <button class="load-button" @click="handleLoad(circuit.name)" title="Load circuit">
              <FolderOpen class="icon" />
            </button>
            <button
              class="delete-button"
              @click="handleDelete(circuit.name)"
              title="Delete circuit"
            >
              <Trash2 class="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import/Export Section -->
    <div class="section">
      <h3>Import / Export</h3>
      <div class="import-export-actions">
        <button class="export-button" @click="handleExport">
          <Download class="icon" />
          Export JSON
        </button>
        <div class="import-area">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
          />
          <button class="import-button" @click="triggerFileImport">
            <Upload class="icon" />
            Import JSON
          </button>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCircuitStore } from '@/stores/circuit'
import { useHistoryStore } from '@/stores/history'
import { Save, FolderOpen, Trash2, Download, Upload, Database } from 'lucide-vue-next'
import { seedSavedCircuitsWithTests } from '@/test-circuits'

const circuitStore = useCircuitStore()
const historyStore = useHistoryStore()

// Component state
const saveCircuitName = ref('')
const statusMessage = ref('')
const statusType = ref<'success' | 'error'>('success')
const fileInput = ref<HTMLInputElement>()
const refreshTrigger = ref(0) // Force reactivity for localStorage changes

// Computed
const savedCircuits = computed(() => {
  // Force reactivity by accessing refreshTrigger
  void refreshTrigger.value
  return circuitStore.getSavedCircuits()
})

// Load saved circuits on mount
onMounted(() => {
  // This will trigger the computed property to update
})

// Save functionality
function handleSave() {
  const name = saveCircuitName.value.trim()
  if (!name) return

  const success = circuitStore.saveCircuitToStorage(name)
  if (success) {
    showStatus(`Circuit "${name}" saved successfully!`, 'success')
    saveCircuitName.value = ''
    // Save to history as well
    historyStore.saveState(circuitStore.currentCircuit, `Save circuit: ${name}`)
    // Trigger UI refresh
    refreshTrigger.value++
  } else {
    showStatus('Failed to save circuit', 'error')
  }
}

// Load functionality
function handleLoad(name: string) {
  const success = circuitStore.loadCircuitFromStorage(name)
  if (success) {
    showStatus(`Circuit "${name}" loaded successfully!`, 'success')
    // Reinitialize history after loading
    historyStore.clearHistory()
    historyStore.initializeHistory(circuitStore.currentCircuit)
  } else {
    showStatus(`Failed to load circuit "${name}"`, 'error')
  }
}

// Delete functionality
function handleDelete(name: string) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return

  const success = circuitStore.deleteCircuitFromStorage(name)
  if (success) {
    showStatus(`Circuit "${name}" deleted`, 'success')
    // Trigger UI refresh
    refreshTrigger.value++
  } else {
    showStatus(`Failed to delete circuit "${name}"`, 'error')
  }
}

// Export functionality
function handleExport() {
  try {
    const jsonData = circuitStore.exportCircuitAsJSON()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${circuitStore.currentCircuit.name || 'circuit'}.json`
    a.click()

    URL.revokeObjectURL(url)
    showStatus('Circuit exported successfully!', 'success')
  } catch (error) {
    showStatus('Failed to export circuit', 'error')
  }
}

// Import functionality
function triggerFileImport() {
  fileInput.value?.click()
}

function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonString = e.target?.result as string
      const success = circuitStore.importCircuitFromJSON(jsonString)
      if (success) {
        showStatus('Circuit imported successfully!', 'success')
        // Reinitialize history after importing
        historyStore.clearHistory()
        historyStore.initializeHistory(circuitStore.currentCircuit)
      } else {
        showStatus('Failed to import circuit - invalid format', 'error')
      }
    } catch (error) {
      showStatus('Failed to read file', 'error')
    }
  }
  reader.readAsText(file)

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Seed test circuits
async function seedTestCircuits() {
  try {
    const count = await seedSavedCircuitsWithTests()
    showStatus(`${count} test circuits loaded!`, 'success')
    // Trigger UI refresh to show the newly seeded circuits
    refreshTrigger.value++
  } catch (error) {
    showStatus('Failed to load test circuits', 'error')
  }
}

// Utility functions
function showStatus(message: string, type: 'success' | 'error') {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>

<style scoped>
.save-load-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

/* Save Section */
.save-form {
  display: flex;
  gap: 8px;
}

.name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.save-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.save-button:hover:not(:disabled) {
  background: #2563eb;
}

.save-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Load Section */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.seed-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin: 0 auto;
}

.seed-button:hover {
  background: #059669;
}

.circuit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.circuit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.circuit-item:hover {
  background: #f3f4f6;
}

.circuit-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.circuit-name {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
}

.circuit-date {
  font-size: 12px;
  color: #6b7280;
}

.circuit-actions {
  display: flex;
  gap: 4px;
}

.load-button,
.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.load-button {
  background: #3b82f6;
  color: white;
}

.load-button:hover {
  background: #2563eb;
}

.delete-button {
  background: #ef4444;
  color: white;
}

.delete-button:hover {
  background: #dc2626;
}

/* Import/Export Section */
.import-export-actions {
  display: flex;
  gap: 8px;
}

.export-button,
.import-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  color: #374151;
  flex: 1;
  justify-content: center;
}

.export-button:hover,
.import-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Status Messages */
.status-message {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.status-message.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.icon {
  width: 16px;
  height: 16px;
}
</style>
