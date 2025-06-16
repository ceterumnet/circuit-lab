import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Position, CircuitNode } from '@/types/components';
import { InteractionMode } from '@/types/components';
import { useCircuitStore } from './circuit';
import { getTerminalWorldPosition } from '@/services/geometry';

export const useInteractionStore = defineStore('interaction', () => {
  // State
  const selectedComponentId = ref<string | null>(null);
  const currentMode = ref<InteractionMode>(InteractionMode.SELECT_MOVE);
  const modeData = ref<Record<string, string | number | boolean> | null>(null);

  const wireCreationState = ref<{
    isActive: boolean;
    startTerminal: {
      terminalId: string;
      componentId: string;
      position: Position;
    } | null;
    previewPosition: Position | null;
  }>({
    isActive: false,
    startTerminal: null,
    previewPosition: null,
  });

  // Actions
  function setMode(mode: InteractionMode, data?: Record<string, string | number | boolean>) {
    currentMode.value = mode;
    modeData.value = data || null;

    // Clear other states when switching modes
    if (mode !== InteractionMode.WIRE) {
      cancelWireCreation();
    }
    if (mode !== InteractionMode.SELECT_MOVE) {
      // clearSelection(); // will be handled by component
    }
  }

  function setComponentPlacementMode(componentType: string) {
    setMode(InteractionMode.PLACE_COMPONENT, { componentType });
  }

  function selectComponent(componentId: string | null) {
    // This action will now only manage the ID. The circuit store will be responsible for updating the component state.
    selectedComponentId.value = componentId;
  }

  function clearSelection() {
    selectedComponentId.value = null;
  }

  function cancelWireCreation() {
    wireCreationState.value = {
      isActive: false,
      startTerminal: null,
      previewPosition: null,
    };
  }

  function startWireCreation(terminalId: string, componentId: string) {
    const circuitStore = useCircuitStore();
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId);
    if (component) {
      const worldPosition = getTerminalWorldPosition(component, terminalId);

      wireCreationState.value = {
        isActive: true,
        startTerminal: { terminalId, componentId, position: worldPosition },
        previewPosition: worldPosition,
      };
    }
  }

  function updateWirePreview(position: Position) {
    if (wireCreationState.value.isActive) {
      wireCreationState.value.previewPosition = position;
    }
  }

  function finishWireCreation(terminalId: string, componentId: string) {
    if (!wireCreationState.value.isActive || !wireCreationState.value.startTerminal) {
      cancelWireCreation();
      return;
    }

    const circuitStore = useCircuitStore();
    const component = circuitStore.currentCircuit.components.find((c) => c.id === componentId);
    if (component) {
      const worldPosition = getTerminalWorldPosition(component, terminalId);

      const startTerminal = wireCreationState.value.startTerminal;
      const endTerminal = { terminalId, componentId, position: worldPosition };

      // Don't allow connecting to same terminal or same component
      if (
        startTerminal.terminalId !== endTerminal.terminalId &&
        startTerminal.componentId !== endTerminal.componentId
      ) {
        circuitStore.createWire(startTerminal, endTerminal);
      }
    }

    cancelWireCreation();
  }

  function finishWireCreationToNode(nodeId: string) {
    if (!wireCreationState.value.startTerminal) return

    const circuitStore = useCircuitStore();
    const node = circuitStore.currentCircuit.components.find((c) => c.id === nodeId) as CircuitNode
    if (!node) return

    circuitStore.createWire(wireCreationState.value.startTerminal, {
      terminalId: node.terminal,
      componentId: nodeId,
      position: node.position,
    })

    cancelWireCreation()
  }

  return {
    // State
    selectedComponentId,
    currentMode,
    modeData,
    wireCreationState,
    // Actions
    setMode,
    setComponentPlacementMode,
    selectComponent,
    clearSelection,
    cancelWireCreation,
    startWireCreation,
    updateWirePreview,
    finishWireCreation,
    finishWireCreationToNode,
  };
});
