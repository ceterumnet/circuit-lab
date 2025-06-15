// Core circuit component types
export interface Position {
  x: number
  y: number
}

export interface ComponentValue {
  value: number
  unit: string
}

// Extensible component system
export interface TerminalDefinition {
  id: string
  pin?: number // For ICs: pin number
  label?: string // For ICs: pin label like "VCC", "A1"
  position: Position // Relative to component center
  type: 'input' | 'output' | 'io' | 'power' | 'ground'
}

export interface PropertyDefinition {
  key: string
  type: 'number' | 'string' | 'select' | 'boolean'
  label: string
  unit?: string
  default: string | number | boolean
  options?: string[] // For select type
}

export interface ComponentDefinition {
  type: string
  name: string
  category: 'passive' | 'active' | 'digital' | 'power' | 'measurement' | 'connection'
  complexity: 'simple' | 'moderate' | 'complex'
  terminals: TerminalDefinition[]
  properties: PropertyDefinition[]
  icon?: string
  package?: string // For ICs: "DIP-14", "SOIC-8", etc.
}

// Component registry for extensible system
export const ComponentRegistry = new Map<string, ComponentDefinition>()

// Interaction modes for modal toolbar system
export enum InteractionMode {
  SELECT_MOVE = 'select_move',
  WIRE = 'wire',
  PAN_ZOOM = 'pan_zoom',
  ROTATE = 'rotate',
  DELETE = 'delete',
  PLACE_COMPONENT = 'place_component', // Generic placement mode
}

// Base component interface
export interface CircuitComponent {
  id: string
  type: string // Now extensible string instead of enum
  position: Position
  rotation: number
  label?: string
  selected: boolean
  properties?: { [key: string]: string | number | boolean } // Dynamic properties based on component definition
}

// Specific component types (backwards compatibility)
export interface Resistor extends CircuitComponent {
  type: 'resistor'
  resistance: ComponentValue
  terminals: [string, string] // Terminal IDs
}

export interface VoltageSource extends CircuitComponent {
  type: 'voltage_source'
  voltage: ComponentValue
  sourceType: 'dc' | 'ac' | 'pulse'
  terminals: [string, string] // Terminal IDs
}

export interface Wire extends CircuitComponent {
  type: 'wire'
  startTerminal?: string // Optional - can connect to any terminal (component or node)
  endTerminal?: string // Optional - can connect to any terminal (component or node)
  startPosition?: Position // Optional - for free-floating wire ends
  endPosition?: Position // Optional - for free-floating wire ends
  points: Position[] // For curved wires
}

export interface Ground extends CircuitComponent {
  type: 'ground'
  terminal: string
}

export interface CircuitNode extends CircuitComponent {
  type: 'node'
  terminal: string // Single terminal ID, just like Ground
}

// Circuit simulation types
export interface SimulationNode {
  id: string
  voltage: number
  components: string[] // Component IDs connected to this node
}

export interface SimulationResult {
  nodes: SimulationNode[]
  currents: { [componentId: string]: number }
  timestamp: number
}

export interface Circuit {
  id: string
  name: string
  components: CircuitComponent[]
  nodes: { [nodeId: string]: SimulationNode }
  lastSimulation?: SimulationResult
}
