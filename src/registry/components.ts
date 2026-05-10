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

const switchDefinition: ComponentDefinition = {
  type: 'switch',
  name: 'Switch',
  category: 'active',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: 0, y: -30 }, type: 'io' },
    { id: 'terminal2', position: { x: 0, y: 30 }, type: 'io' },
  ],
  properties: [{ key: 'isOpen', type: 'boolean', label: 'Open/Closed', default: false }],
  icon: 'SwitchSymbol', // Professional switch symbol with state indication
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

const variableResistorDefinition: ComponentDefinition = {
  type: 'variable_resistor',
  name: 'Variable Resistor',
  category: 'passive',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' },
  ],
  properties: [
    { key: 'resistance', type: 'number', label: 'Resistance', unit: 'Ω', default: 5000 },
    { key: 'minResistance', type: 'number', label: 'Min Resistance', unit: 'Ω', default: 0 },
    { key: 'maxResistance', type: 'number', label: 'Max Resistance', unit: 'Ω', default: 10000 },
  ],
  icon: 'VariableResistorSymbol', // Variable resistor with diagonal arrow
}

const potentiometerDefinition: ComponentDefinition = {
  type: 'potentiometer',
  name: 'Potentiometer',
  category: 'passive',
  complexity: 'moderate',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io', label: 'A' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io', label: 'B' },
    { id: 'wiper', position: { x: 0, y: -20 }, type: 'io', label: 'W' },
  ],
  properties: [
    {
      key: 'totalResistance',
      type: 'number',
      label: 'Total Resistance',
      unit: 'Ω',
      default: 10000,
    },
    { key: 'wiperPosition', type: 'number', label: 'Wiper Position', unit: '%', default: 50 },
  ],
  icon: 'PotentiometerSymbol', // Potentiometer with wiper arrow
}

const diodeDefinition: ComponentDefinition = {
  type: 'diode',
  name: 'Diode',
  category: 'active',
  complexity: 'moderate',
  terminals: [
    { id: 'anode', position: { x: -25, y: 0 }, type: 'io', label: 'A' },
    { id: 'cathode', position: { x: 25, y: 0 }, type: 'io', label: 'K' },
  ],
  properties: [
    {
      key: 'saturationCurrent',
      type: 'number',
      label: 'Saturation Current',
      unit: 'A',
      default: 1e-12,
    },
  ],
  icon: 'DiodeSymbol', // Professional IEEE-standard diode symbol
}

const ledDefinition: ComponentDefinition = {
  type: 'led',
  name: 'LED',
  category: 'active',
  complexity: 'moderate',
  terminals: [
    { id: 'anode', position: { x: -25, y: 0 }, type: 'io', label: 'A' },
    { id: 'cathode', position: { x: 25, y: 0 }, type: 'io', label: 'K' },
  ],
  properties: [
    {
      key: 'color',
      type: 'string',
      label: 'LED Color',
      unit: '',
      default: 'red',
    },
    // Removed saturationCurrent - LEDs should use color-specific parameters from LEDStamper
  ],
  icon: 'LEDSymbol', // Professional LED symbol with light rays
}

const bjtNPNDefinition: ComponentDefinition = {
  type: 'bjt_npn',
  name: 'NPN BJT',
  category: 'active',
  complexity: 'complex',
  terminals: [
    { id: 'collector', position: { x: 0, y: -30 }, type: 'io', label: 'C' },
    { id: 'base', position: { x: -30, y: 0 }, type: 'io', label: 'B' },
    { id: 'emitter', position: { x: 0, y: 30 }, type: 'io', label: 'E' },
  ],
  properties: [
    {
      key: 'saturationCurrent',
      type: 'number',
      label: 'Saturation Current',
      unit: 'A',
      default: 1e-14,
    },
    {
      key: 'currentGain',
      type: 'number',
      label: 'Current Gain (β)',
      unit: '',
      default: 100,
    },
  ],
  icon: 'BJTSymbol', // Professional BJT symbol with terminals
}

const bjtPNPDefinition: ComponentDefinition = {
  type: 'bjt_pnp',
  name: 'PNP BJT',
  category: 'active',
  complexity: 'complex',
  terminals: [
    { id: 'collector', position: { x: 0, y: -30 }, type: 'io', label: 'C' },
    { id: 'base', position: { x: -30, y: 0 }, type: 'io', label: 'B' },
    { id: 'emitter', position: { x: 0, y: 30 }, type: 'io', label: 'E' },
  ],
  properties: [
    {
      key: 'saturationCurrent',
      type: 'number',
      label: 'Saturation Current',
      unit: 'A',
      default: 1e-14,
    },
    {
      key: 'currentGain',
      type: 'number',
      label: 'Current Gain (β)',
      unit: '',
      default: 100,
    },
  ],
  icon: 'BJTPNPSymbol', // Professional PNP BJT symbol with inward-pointing arrow
}

const mosfetNDefinition: ComponentDefinition = {
  type: 'mosfet_n',
  name: 'NMOS',
  category: 'active',
  complexity: 'complex',
  terminals: [
    { id: 'drain', position: { x: 0, y: -30 }, type: 'io', label: 'D' },
    { id: 'gate', position: { x: -30, y: 0 }, type: 'io', label: 'G' },
    { id: 'source', position: { x: 0, y: 30 }, type: 'io', label: 'S' },
  ],
  properties: [
    { key: 'vThreshold', type: 'number', label: 'Threshold Voltage', unit: 'V', default: 1.0 },
    { key: 'kP', type: 'number', label: 'Transconductance (Kp)', unit: 'A/V²', default: 200e-6 },
    { key: 'lambda', type: 'number', label: 'Channel Length Modulation', unit: 'V⁻¹', default: 0.01 },
  ],
  icon: 'NMOSSymbol',
}

const mosfetPDefinition: ComponentDefinition = {
  type: 'mosfet_p',
  name: 'PMOS',
  category: 'active',
  complexity: 'complex',
  terminals: [
    { id: 'drain', position: { x: 0, y: -30 }, type: 'io', label: 'D' },
    { id: 'gate', position: { x: -30, y: 0 }, type: 'io', label: 'G' },
    { id: 'source', position: { x: 0, y: 30 }, type: 'io', label: 'S' },
  ],
  properties: [
    { key: 'vThreshold', type: 'number', label: 'Threshold Voltage', unit: 'V', default: -1.0 },
    { key: 'kP', type: 'number', label: 'Transconductance (Kp)', unit: 'A/V²', default: 200e-6 },
    { key: 'lambda', type: 'number', label: 'Channel Length Modulation', unit: 'V⁻¹', default: 0.01 },
  ],
  icon: 'PMOSSymbol',
}

const capacitorDefinition: ComponentDefinition = {
  type: 'capacitor',
  name: 'Capacitor',
  category: 'passive',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' },
  ],
  properties: [
    { key: 'capacitance', type: 'number', label: 'Capacitance', unit: 'F', default: 1e-6 },
  ],
  icon: 'CapacitorSymbol', // Professional parallel plates capacitor symbol
}

const inductorDefinition: ComponentDefinition = {
  type: 'inductor',
  name: 'Inductor',
  category: 'passive',
  complexity: 'simple',
  terminals: [
    { id: 'terminal1', position: { x: -30, y: 0 }, type: 'io' },
    { id: 'terminal2', position: { x: 30, y: 0 }, type: 'io' },
  ],
  properties: [
    { key: 'inductance', type: 'number', label: 'Inductance', unit: 'H', default: 1e-3 },
  ],
  icon: 'InductorSymbol', // Professional coil inductor symbol
}

const acVoltageSourceDefinition: ComponentDefinition = {
  type: 'ac_voltage_source',
  name: 'AC Voltage Source',
  category: 'power',
  complexity: 'moderate',
  terminals: [
    { id: 'positive', position: { x: 0, y: -30 }, type: 'power', label: '+' },
    { id: 'negative', position: { x: 0, y: 30 }, type: 'power', label: '-' },
  ],
  properties: [
    { key: 'amplitude', type: 'number', label: 'Amplitude', unit: 'V', default: 5 },
    { key: 'frequency', type: 'number', label: 'Frequency', unit: 'Hz', default: 1000 },
    { key: 'phase', type: 'number', label: 'Phase', unit: '°', default: 0 },
  ],
  icon: 'ACVoltageSourceSymbol', // AC voltage source with sine wave
}

const acCurrentSourceDefinition: ComponentDefinition = {
  type: 'ac_current_source',
  name: 'AC Current Source',
  category: 'power',
  complexity: 'moderate',
  terminals: [
    { id: 'positive', position: { x: 0, y: -30 }, type: 'power', label: '+' },
    { id: 'negative', position: { x: 0, y: 30 }, type: 'power', label: '-' },
  ],
  properties: [
    { key: 'amplitude', type: 'number', label: 'Amplitude', unit: 'A', default: 0.001 },
    { key: 'frequency', type: 'number', label: 'Frequency', unit: 'Hz', default: 1000 },
    { key: 'phase', type: 'number', label: 'Phase', unit: '°', default: 0 },
  ],
  icon: 'ACCurrentSourceSymbol', // AC current source with sine wave
}

// Register all components
ComponentRegistry.set('resistor', resistorDefinition)
ComponentRegistry.set('voltage_source', voltageSourceDefinition)
ComponentRegistry.set('current_source', currentSourceDefinition)
ComponentRegistry.set('switch', switchDefinition)
ComponentRegistry.set('ground', groundDefinition)
ComponentRegistry.set('node', nodeDefinition)
ComponentRegistry.set('variable_resistor', variableResistorDefinition)
ComponentRegistry.set('potentiometer', potentiometerDefinition)
ComponentRegistry.set('diode', diodeDefinition)
ComponentRegistry.set('led', ledDefinition)
ComponentRegistry.set('bjt_npn', bjtNPNDefinition)
ComponentRegistry.set('bjt_pnp', bjtPNPDefinition)
ComponentRegistry.set('mosfet_n', mosfetNDefinition)
ComponentRegistry.set('mosfet_p', mosfetPDefinition)
ComponentRegistry.set('wire', wireDefinition)
ComponentRegistry.set('capacitor', capacitorDefinition)
ComponentRegistry.set('inductor', inductorDefinition)
ComponentRegistry.set('ac_voltage_source', acVoltageSourceDefinition)
ComponentRegistry.set('ac_current_source', acCurrentSourceDefinition)

// Export definitions for backwards compatibility
export {
  resistorDefinition,
  voltageSourceDefinition,
  currentSourceDefinition,
  switchDefinition,
  groundDefinition,
  nodeDefinition,
  wireDefinition,
  variableResistorDefinition,
  potentiometerDefinition,
  diodeDefinition,
  ledDefinition,
  bjtNPNDefinition,
  bjtPNPDefinition,
  mosfetNDefinition,
  mosfetPDefinition,
  capacitorDefinition,
  inductorDefinition,
  acVoltageSourceDefinition,
  acCurrentSourceDefinition,
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

export const registry: Record<string, ComponentDefinition> = {
  resistor: resistorDefinition,
  voltage_source: voltageSourceDefinition,
  current_source: currentSourceDefinition,
  ac_voltage_source: acVoltageSourceDefinition,
  ac_current_source: acCurrentSourceDefinition,
  ground: groundDefinition,
  node: nodeDefinition,
  switch: switchDefinition,
  wire: wireDefinition,
  variable_resistor: variableResistorDefinition,
  potentiometer: potentiometerDefinition,
  diode: diodeDefinition,
  led: ledDefinition,
  bjt_npn: bjtNPNDefinition,
  bjt_pnp: bjtPNPDefinition,
  mosfet_n: mosfetNDefinition,
  mosfet_p: mosfetPDefinition,
  capacitor: capacitorDefinition,
  inductor: inductorDefinition,
}
