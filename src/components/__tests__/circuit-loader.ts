import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { TestCircuitSpec, ExpectedResults, ToleranceSpec } from './test-types'
import type { Circuit, CircuitComponent, Wire } from '../../types/components'

/**
 * Circuit loading utilities for file-based test circuit definitions
 * Implements the circuit loading infrastructure outlined in the MNA Tests Plan
 */

/**
 * Load a circuit definition from a JSON file
 */
export function loadCircuitFile(filename: string): TestCircuitSpec {
  const filepath = join(__dirname, 'circuits', filename)

  try {
    const fileContent = readFileSync(filepath, 'utf-8')
    const rawSpec = JSON.parse(fileContent)

    // Validate and parse the circuit specification
    return parseCircuitSpec(rawSpec)
  } catch (error) {
    throw new Error(
      `Failed to load circuit file '${filename}': ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Parse and validate a raw circuit specification object
 */
export function parseCircuitSpec(rawSpec: unknown): TestCircuitSpec {
  if (!rawSpec || typeof rawSpec !== 'object') {
    throw new Error('Circuit specification must be an object')
  }

  const spec = rawSpec as Record<string, unknown>

  // Validate required fields
  validateRequiredFields(spec, [
    'id',
    'description',
    'category',
    'testType',
    'component',
    'scenario',
    'variation',
    'toleranceJustification',
    'circuit',
    'expectedResults',
  ])

  // Parse and validate circuit
  const circuit = parseCircuit(spec.circuit)

  // Parse and validate expected results
  const expectedResults = parseExpectedResults(spec.expectedResults)

  return {
    id: spec.id as string,
    description: spec.description as string,
    category: spec.category as 'unit' | 'functional' | 'integration',
    testType: spec.testType as
      | 'assembly'
      | 'solver'
      | 'ground'
      | 'stamper'
      | 'linear'
      | 'nonlinear'
      | 'mixed'
      | 'system',
    component: spec.component as string,
    scenario: spec.scenario as string,
    variation: spec.variation as string,
    circuit,
    expectedResults,
    toleranceJustification: spec.toleranceJustification as string,
  }
}

/**
 * Parse circuit definition from raw object
 */
function parseCircuit(rawCircuit: unknown): Circuit {
  if (!rawCircuit || typeof rawCircuit !== 'object') {
    throw new Error('Circuit definition must be an object')
  }

  const circuit = rawCircuit as Record<string, unknown>

  validateRequiredFields(circuit, ['id', 'name', 'components', 'wires', 'probes', 'nodes'])

  return {
    id: circuit.id as string,
    name: circuit.name as string,
    components: parseComponents(circuit.components),
    wires: parseWires(circuit.wires),
    probes: circuit.probes as [], // Simplified for now
    nodes: circuit.nodes as Record<string, never>, // Simplified for now
  }
}

/**
 * Parse components array from raw object
 */
function parseComponents(rawComponents: unknown): CircuitComponent[] {
  if (!Array.isArray(rawComponents)) {
    throw new Error('Components must be an array')
  }

  return rawComponents.map((rawComponent, index) => {
    if (!rawComponent || typeof rawComponent !== 'object') {
      throw new Error(`Component at index ${index} must be an object`)
    }

    const comp = rawComponent as Record<string, unknown>

    validateRequiredFields(comp, ['id', 'type', 'position', 'rotation', 'selected'])

    return {
      id: comp.id as string,
      type: comp.type as string,
      position: parsePosition(comp.position),
      rotation: comp.rotation as number,
      selected: comp.selected as boolean,
      properties: (comp.properties as Record<string, unknown>) || {},
    }
  })
}

/**
 * Parse wires array from raw object
 */
function parseWires(rawWires: unknown): Wire[] {
  if (!Array.isArray(rawWires)) {
    throw new Error('Wires must be an array')
  }

  return rawWires.map((rawWire, index) => {
    if (!rawWire || typeof rawWire !== 'object') {
      throw new Error(`Wire at index ${index} must be an object`)
    }

    const wire = rawWire as Record<string, unknown>

    validateRequiredFields(wire, ['id', 'type', 'position', 'rotation', 'selected'])

    return {
      id: wire.id as string,
      type: 'wire',
      position: parsePosition(wire.position),
      rotation: wire.rotation as number,
      selected: wire.selected as boolean,
      properties: (wire.properties as Record<string, unknown>) || {},
    }
  })
}

/**
 * Parse position object from raw object
 */
function parsePosition(rawPosition: unknown): { x: number; y: number } {
  if (!rawPosition || typeof rawPosition !== 'object') {
    throw new Error('Position must be an object')
  }

  const pos = rawPosition as Record<string, unknown>

  if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    throw new Error('Position must have numeric x and y properties')
  }

  return { x: pos.x, y: pos.y }
}

/**
 * Parse expected results from raw object
 */
function parseExpectedResults(rawResults: unknown): ExpectedResults {
  if (!rawResults || typeof rawResults !== 'object') {
    throw new Error('Expected results must be an object')
  }

  const results = rawResults as Record<string, unknown>

  validateRequiredFields(results, ['voltages', 'currents', 'tolerances'])

  return {
    voltages: parseNumberRecord(results.voltages, 'voltages'),
    currents: parseNumberRecord(results.currents, 'currents'),
    tolerances: parseTolerances(results.tolerances),
    powers: results.powers ? parseNumberRecord(results.powers, 'powers') : undefined,
    convergence: results.convergence ? parseConvergence(results.convergence) : undefined,
  }
}

/**
 * Parse tolerance specification from raw object
 */
function parseTolerances(rawTolerances: unknown): ToleranceSpec {
  if (!rawTolerances || typeof rawTolerances !== 'object') {
    throw new Error('Tolerances must be an object')
  }

  const tolerances = rawTolerances as Record<string, unknown>

  validateRequiredFields(tolerances, ['voltage', 'current', 'relative', 'numerical'])

  return {
    voltage: tolerances.voltage as number,
    current: tolerances.current as number,
    relative: tolerances.relative as number,
    numerical: tolerances.numerical as number,
  }
}

/**
 * Parse convergence specification from raw object
 */
function parseConvergence(rawConvergence: unknown): NonNullable<ExpectedResults['convergence']> {
  if (!rawConvergence || typeof rawConvergence !== 'object') {
    throw new Error('Convergence must be an object')
  }

  const convergence = rawConvergence as Record<string, unknown>

  return {
    required: convergence.required as boolean,
    maxIterations: convergence.maxIterations as number | undefined,
    finalResidual: convergence.finalResidual as number | undefined,
  }
}

/**
 * Parse a record of string -> number mappings
 */
function parseNumberRecord(rawRecord: unknown, fieldName: string): Record<string, number> {
  if (!rawRecord || typeof rawRecord !== 'object') {
    throw new Error(`${fieldName} must be an object`)
  }

  const record = rawRecord as Record<string, unknown>
  const result: Record<string, number> = {}

  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== 'number') {
      throw new Error(`${fieldName}.${key} must be a number`)
    }
    result[key] = value
  }

  return result
}

/**
 * Validate that required fields exist in an object
 */
function validateRequiredFields(obj: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    if (!(field in obj)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

/**
 * Validate circuit structure and connectivity
 */
export function validateCircuitStructure(spec: TestCircuitSpec): string[] {
  const warnings: string[] = []

  // Check component count
  if (spec.circuit.components.length === 0) {
    warnings.push('Circuit has no components')
  }

  // Check for ground reference
  const hasGround = spec.circuit.components.some((c) => c.type === 'ground')
  if (!hasGround) {
    warnings.push('Circuit has no ground reference')
  }

  // Check wire connectivity
  const componentIds = new Set(spec.circuit.components.map((c) => c.id))
  for (const wire of spec.circuit.wires) {
    const startTerminal = wire.properties?.startTerminal as string
    const endTerminal = wire.properties?.endTerminal as string

    if (startTerminal) {
      const startComponentId = startTerminal.split('_')[0]
      if (!componentIds.has(startComponentId)) {
        warnings.push(`Wire ${wire.id} references non-existent component ${startComponentId}`)
      }
    }

    if (endTerminal) {
      const endComponentId = endTerminal.split('_')[0]
      if (!componentIds.has(endComponentId)) {
        warnings.push(`Wire ${wire.id} references non-existent component ${endComponentId}`)
      }
    }
  }

  return warnings
}

/**
 * Get all circuit files in the circuits directory
 */
export function listCircuitFiles(): string[] {
  const circuitsDir = join(__dirname, 'circuits')

  try {
    const fs = require('fs')
    return fs
      .readdirSync(circuitsDir)
      .filter((file: string) => file.endsWith('.json'))
      .sort()
  } catch (error) {
    throw new Error(
      `Failed to list circuit files: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Load multiple circuit files by pattern
 */
export function loadCircuitsByPattern(pattern: RegExp): TestCircuitSpec[] {
  const files = listCircuitFiles()
  const matchingFiles = files.filter((file) => pattern.test(file))

  return matchingFiles.map((file) => loadCircuitFile(file))
}

/**
 * Load all circuit files of a specific category
 */
export function loadCircuitsByCategory(
  category: 'unit' | 'functional' | 'integration',
): TestCircuitSpec[] {
  const pattern = new RegExp(`^${category}-`)
  return loadCircuitsByPattern(pattern)
}
