// Core circuit component types
export interface Position {
  x: number
  y: number
}

export interface ComponentValue {
  value: number
  unit: string
}

// Component types enum - must be declared before interfaces that use it
export enum ComponentType {
  RESISTOR = 'resistor',
  VOLTAGE_SOURCE = 'voltage_source',
  WIRE = 'wire',
  GROUND = 'ground',
  NODE = 'node',
}

// Base component interface
export interface CircuitComponent {
  id: string
  type: ComponentType
  position: Position
  rotation: number
  label?: string
  selected: boolean
}

// Specific component types
export interface Resistor extends CircuitComponent {
  type: ComponentType.RESISTOR
  resistance: ComponentValue
  terminals: [string, string] // Terminal IDs
}

export interface VoltageSource extends CircuitComponent {
  type: ComponentType.VOLTAGE_SOURCE
  voltage: ComponentValue
  sourceType: 'dc' | 'ac' | 'pulse'
  terminals: [string, string] // Terminal IDs
}

export interface Wire extends CircuitComponent {
  type: ComponentType.WIRE
  startTerminal?: string // Optional - can connect to any terminal (component or node)
  endTerminal?: string // Optional - can connect to any terminal (component or node)
  startPosition?: Position // Optional - for free-floating wire ends
  endPosition?: Position // Optional - for free-floating wire ends
  points: Position[] // For curved wires
}

export interface Ground extends CircuitComponent {
  type: ComponentType.GROUND
  terminal: string
}

export interface CircuitNode extends CircuitComponent {
  type: ComponentType.NODE
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
