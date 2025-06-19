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
  properties?: { [key: string]: string | number | boolean | Position } // Dynamic properties based on component definition
}

// Specific component types have been deprecated in favor of a generic `CircuitComponent`
// with a `properties` bag. The `type` stringdiscriminates between component types,
// and their definitions are stored in the `ComponentRegistry`.

export interface Wire extends CircuitComponent {
  type: 'wire'
  // start/end terminal IDs and positions are now stored in the generic `properties` object
  // e.g., properties: { startTerminal: 'R1_1', endTerminal: 'C1_2' }
}

export interface Ground extends CircuitComponent {
  type: 'ground'
}

export interface CircuitNode extends CircuitComponent {
  type: 'node'
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
  wires: Wire[]
  probes: Probe[]
  nodes: { [nodeId: string]: SimulationNode }
  lastSimulation?: SimulationResult
}

export interface Probe {
  id: string
  type: 'voltage' | 'current'
  targetId: string // ID of the wire or node being probed
  position: Position
  value?: number // Last measured value
}
