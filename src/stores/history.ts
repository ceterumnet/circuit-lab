import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Circuit } from '@/types/components'
import { useCircuitStore } from './circuit'

interface HistoryState {
  circuit: Circuit
  timestamp: number
  description: string
}

export const useHistoryStore = defineStore('history', () => {
  // State
  const history = ref<HistoryState[]>([])
  const currentIndex = ref(-1)
  const maxHistorySize = 50 // Limit history to prevent memory issues
  const isInitialized = ref(false)

  // Getters
  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)
  const currentState = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value]
    }
    return null
  })

  // Actions
  function saveState(circuit: Circuit, description: string = 'Action') {
    // Deep clone the circuit to avoid reference issues
    const clonedCircuit: Circuit = JSON.parse(JSON.stringify(circuit))

    const newState: HistoryState = {
      circuit: clonedCircuit,
      timestamp: Date.now(),
      description,
    }

    // Remove any states after current index (when undoing then making new changes)
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Add new state
    history.value.push(newState)
    currentIndex.value = history.value.length - 1

    // Optional: Log history saves for debugging
    // console.log(`[History] Saved state: "${description}", index: ${currentIndex.value}, total: ${history.value.length}`)

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift()
      currentIndex.value--
    }
  }

  function undo(): boolean {
    if (!canUndo.value) return false

    currentIndex.value--

    const circuitStore = useCircuitStore()
    const targetState = history.value[currentIndex.value]

    // Restore the circuit state
    circuitStore.restoreCircuit(targetState.circuit)

    return true
  }

  function redo(): boolean {
    if (!canRedo.value) return false

    currentIndex.value++

    const circuitStore = useCircuitStore()
    const targetState = history.value[currentIndex.value]

    // Restore the circuit state
    circuitStore.restoreCircuit(targetState.circuit)

    return true
  }

  function initializeHistory(circuit: Circuit) {
    // Only initialize once
    if (isInitialized.value) return

    console.log('[History] Initializing history with circuit:', circuit)

    // Initialize with current state
    history.value = []
    currentIndex.value = -1
    saveState(circuit, 'Initial state')
    isInitialized.value = true
  }

  function clearHistory() {
    history.value = []
    currentIndex.value = -1
    isInitialized.value = false
  }

  function getHistoryList() {
    return history.value.map((state, index) => ({
      index,
      description: state.description,
      timestamp: state.timestamp,
      isCurrent: index === currentIndex.value,
    }))
  }

  return {
    // State
    history,
    currentIndex,
    maxHistorySize,
    isInitialized,

    // Getters
    canUndo,
    canRedo,
    currentState,

    // Actions
    saveState,
    undo,
    redo,
    initializeHistory,
    clearHistory,
    getHistoryList,
  }
})
