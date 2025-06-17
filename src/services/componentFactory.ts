import type { Circuit, CircuitComponent, Position } from '@/types/components';
import { getComponentDefinition } from '@/registry/components';

export function generateComponentId(circuit: Circuit, type: string): string {
  const typePrefix = type.substring(0, 1).toUpperCase();
  const existingIds = circuit.components
    .filter((c) => c.type === type)
    .map((c) => c.id);

  let counter = 1;
  let newId = `${typePrefix}${counter}`;

  while (existingIds.includes(newId)) {
    counter++;
    newId = `${typePrefix}${counter}`;
  }

  return newId;
}

export function createComponent(circuit: Circuit, type: string, position: Position): CircuitComponent | null {
  const definition = getComponentDefinition(type);
  if (!definition) {
    console.error(`Component definition not found for type: ${type}`);
    return null;
  }

  const id = generateComponentId(circuit, type);

  const newComponent: CircuitComponent = {
    id,
    type,
    position,
    rotation: 0,
    selected: false,
    properties: {},
  };

  // Populate default properties
  if (definition.properties) {
    for (const propDef of definition.properties) {
      newComponent.properties![propDef.key] = propDef.default;
    }
  }

  return newComponent;
}
