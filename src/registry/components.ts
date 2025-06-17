import { ComponentRegistry, type ComponentDefinition } from '@/types/components'

// Register basic components
const resistorDefinition: ComponentDefinition = {
  type: 'resistor',
  name: 'Resistor',
  category: 'passive',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' }
  ],
  properties: [
    { key: 'resistance', type: 'number', label: 'Resistance', unit: 'Ω', default: 1000 }
  ],
  icon: '⚡'
}

const voltageSourceDefinition: ComponentDefinition = {
  type: 'voltage_source',
  name: 'Voltage Source',
  category: 'power',
  complexity: 'simple',
  terminals: [
    { id: 'positive', position: { x: 0, y: -30 }, type: 'power', label: '+' },
    { id: 'negative', position: { x: 0, y: 30 }, type: 'ground', label: '-' }
  ],
  properties: [
    { key: 'voltage', type: 'number', label: 'Voltage', unit: 'V', default: 5 },
    { key: 'sourceType', type: 'select', label: 'Type', default: 'dc', options: ['dc', 'ac', 'pulse'] }
  ],
  icon: '🔋'
}

const groundDefinition: ComponentDefinition = {
  type: 'ground',
  name: 'Ground',
  category: 'power',
  complexity: 'simple',
  terminals: [
    { id: 'terminal', position: { x: 0, y: -15 }, type: 'ground' }
  ],
  properties: [],
  icon: '🔌'
}

const nodeDefinition: ComponentDefinition = {
  type: 'node',
  name: 'Node',
  category: 'connection',
  complexity: 'simple',
  terminals: [
    { id: 'terminal', position: { x: 0, y: 0 }, type: 'io' }
  ],
  properties: [],
  icon: '⚫'
}

const wireDefinition: ComponentDefinition = {
  type: 'wire',
  name: 'Wire',
  category: 'connection',
  complexity: 'simple',
  terminals: [], // Wires don't have fixed terminals
  properties: [],
  icon: '➖'
}

// Register all components
ComponentRegistry.set('resistor', resistorDefinition)
ComponentRegistry.set('voltage_source', voltageSourceDefinition)
ComponentRegistry.set('ground', groundDefinition)
ComponentRegistry.set('node', nodeDefinition)
ComponentRegistry.set('wire', wireDefinition)

// Export definitions for backwards compatibility
export {
  resistorDefinition,
  voltageSourceDefinition,
  groundDefinition,
  nodeDefinition,
  wireDefinition
}

// Utility functions
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return ComponentRegistry.get(type)
}

export function getAllComponents(): ComponentDefinition[] {
  return Array.from(ComponentRegistry.values())
}

export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return getAllComponents().filter(comp => comp.category === category)
}
