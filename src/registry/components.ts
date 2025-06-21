import { ComponentRegistry, type ComponentDefinition } from '@/types/components'

// Register basic components with professional schematic symbols
const resistorDefinition: ComponentDefinition = {
  type: 'resistor',
  name: 'Resistor',
  category: 'passive',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' },
  ],
  properties: [
    { key: 'resistance', type: 'number', label: 'Resistance', unit: 'Ω', default: 1000 },
  ],
  icon: 'ResistorSymbol', // Professional zigzag resistor symbol
}

const voltageSourceDefinition: ComponentDefinition = {
  type: 'voltage_source',
  name: 'Voltage Source',
  category: 'power',
  complexity: 'simple',
  terminals: [
    { id: 'positive', position: { x: 0, y: -30 }, type: 'power', label: '+' },
    { id: 'negative', position: { x: 0, y: 30 }, type: 'power', label: '-' },
  ],
  properties: [{ key: 'voltage', type: 'number', label: 'Voltage', unit: 'V', default: 5 }],
  icon: 'VoltageSourceSymbol', // Professional circle with polarity markings
}

const currentSourceDefinition: ComponentDefinition = {
  type: 'current_source',
  name: 'Current Source',
  category: 'power',
  complexity: 'simple',
  terminals: [
    { id: 'positive', position: { x: 0, y: -30 }, type: 'power', label: '+' },
    { id: 'negative', position: { x: 0, y: 30 }, type: 'power', label: '-' },
  ],
  properties: [{ key: 'current', type: 'number', label: 'Current', unit: 'A', default: 0.001 }],
  icon: 'CurrentSourceSymbol', // Professional circle with current arrow
}

const groundDefinition: ComponentDefinition = {
  type: 'ground',
  name: 'Ground',
  category: 'connection',
  complexity: 'simple',
  terminals: [{ id: 'terminal', position: { x: 0, y: -15 }, type: 'power' }],
  properties: [],
  icon: 'GroundSymbol', // Standard ground symbol with decreasing lines
}

const nodeDefinition: ComponentDefinition = {
  type: 'node',
  name: 'Node',
  category: 'connection',
  complexity: 'simple',
  terminals: [{ id: 'terminal', position: { x: 0, y: 0 }, type: 'io' }],
  properties: [{ key: 'label', type: 'string', label: 'Label', default: '' }],
  icon: 'NodeSymbol', // Simple filled circle for wire junctions
}

const wireDefinition: ComponentDefinition = {
  type: 'wire',
  name: 'Wire',
  category: 'connection',
  complexity: 'simple',
  terminals: [
    { id: 'start', position: { x: -20, y: 0 }, type: 'io' },
    { id: 'end', position: { x: 20, y: 0 }, type: 'io' },
  ],
  properties: [
    { key: 'resistance', type: 'number', label: 'Resistance', unit: 'Ω', default: 1e-6 },
  ],
  icon: 'WireSymbol', // Line with connection points to show wire connectivity
}

// Register all components
ComponentRegistry.set('resistor', resistorDefinition)
ComponentRegistry.set('voltage_source', voltageSourceDefinition)
ComponentRegistry.set('current_source', currentSourceDefinition)
ComponentRegistry.set('ground', groundDefinition)
ComponentRegistry.set('node', nodeDefinition)
ComponentRegistry.set('wire', wireDefinition)

// Export definitions for backwards compatibility
export {
  resistorDefinition,
  voltageSourceDefinition,
  currentSourceDefinition,
  groundDefinition,
  nodeDefinition,
  wireDefinition,
}

// Utility functions
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return ComponentRegistry.get(type)
}

export function getAllComponents(): ComponentDefinition[] {
  return Array.from(ComponentRegistry.values())
}

export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return Array.from(ComponentRegistry.values()).filter(
    (component) => component.category === category,
  )
}
