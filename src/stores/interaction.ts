import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Position, CircuitNode } from '@/types/components';
import { useCircuitStore } from './circuit';
import { getTerminalWorldPosition } from '@/services/geometry';
import * as componentFactory from '@/services/componentFactory';

export const useInteractionStore = defineStore('interaction', () => {
  // State
  const selectedComponentId = ref<string | null>(null);
  const componentToPlace = ref<string | null>(null);
  const hoveredTerminal = ref<{ componentId: string; terminalId: string } | null>(null);

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
  function setHoveredTerminal(info: { componentId: string; terminalId: string } | null) {
    hoveredTerminal.value = info;
  }

  function setComponentToPlace(type: string | null) {
    componentToPlace.value = type;
    // When entering placement mode, cancel any other actions
    if (type) {
      clearSelection();
      cancelWireCreation();
    }
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
    setHoveredTerminal(null); // Clear hovered terminal on cancel
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

  function finishWireCreationToPosition(position: Position) {
    if (!wireCreationState.value.isActive || !wireCreationState.value.startTerminal) {
      cancelWireCreation()
      return
    }

    const circuitStore = useCircuitStore()
    const newNode = componentFactory.createComponent(circuitStore.currentCircuit, 'node', position) as CircuitNode;
    if (newNode) {
      circuitStore.addComponent(newNode);
      circuitStore.createWire(wireCreationState.value.startTerminal, {
        terminalId: newNode.terminal,
        componentId: newNode.id,
        position: newNode.position,
      });
    }

    cancelWireCreation();
  }

  return {
    // State
    selectedComponentId,
    componentToPlace,
    hoveredTerminal,
    wireCreationState,
    // Actions
    setHoveredTerminal,
    setComponentToPlace,
    selectComponent,
    clearSelection,
    cancelWireCreation,
    startWireCreation,
    updateWirePreview,
    finishWireCreation,
    finishWireCreationToNode,
    finishWireCreationToPosition,
  };
});
