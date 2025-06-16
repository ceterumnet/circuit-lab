import type { Circuit, Resistor, VoltageSource, Ground, CircuitNode, Position, CircuitComponent } from '@/types/components';

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
  const id = generateComponentId(circuit, type);

  const baseComponent = {
    id,
    type,
    position,
    rotation: 0,
    selected: false,
  };

  let component: CircuitComponent | null = null;

  switch (type) {
    case 'resistor':
      component = {
        ...baseComponent,
        type: 'resistor',
        resistance: { value: 1000, unit: 'Ω' },
        terminals: [`${id}_1`, `${id}_2`],
      } as Resistor;
      break;

    case 'voltage_source':
      component = {
        ...baseComponent,
        type: 'voltage_source',
        voltage: { value: 5, unit: 'V' },
        sourceType: 'dc' as const,
        terminals: [`${id}_pos`, `${id}_neg`],
      } as VoltageSource;
      break;

    case 'ground':
      component = {
        ...baseComponent,
        type: 'ground',
        terminal: `${id}_gnd`,
      } as Ground;
      break;

    case 'node':
      component = {
        ...baseComponent,
        type: 'node',
        terminal: `${id}_terminal`,
      } as CircuitNode;
      break;
  }

  return component;
}
