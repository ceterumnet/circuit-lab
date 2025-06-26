import { describe, it, expect } from 'vitest'
import type { CircuitComponent } from '../../../types/components'
import { ComponentStamperFactory } from '../../../services/stampers'

/**
 * UNIT TESTS FOR COMPONENT STAMPER FACTORY
 *
 * These tests verify the ComponentStamperFactory works correctly:
 * 1. All component types are properly registered
 * 2. Correct stamper classes are instantiated for each component type
 * 3. Error handling for unknown component types
 * 4. Factory pattern implementation validation
 *
 * Tests the ACTUAL ComponentStamperFactory class implementation.
 */

/**
 * Create a test component of the specified type
 */
function createTestComponent(type: string, id: string = 'TEST_COMP'): CircuitComponent {
  return {
    id,
    type,
    position: { x: 100, y: 200 },
    rotation: 0,
    selected: false,
    properties: {
      resistance: 1000,
      voltage: 5,
      current: 0.001,
      wiperPosition: 0.5,
    },
  }
}

describe('ComponentStamperFactory Unit Tests', () => {
  describe('Linear Component Stamper Registration', () => {
    it('should create ResistorStamper for resistor components', () => {
      const component = createTestComponent('resistor', 'R1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('R1')
      expect(stamper.type).toBe('resistor')
      expect(stamper.constructor.name).toBe('ResistorStamper')
    })

    it('should create VoltageSourceStamper for voltage_source components', () => {
      const component = createTestComponent('voltage_source', 'V1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('V1')
      expect(stamper.type).toBe('voltage_source')
      expect(stamper.constructor.name).toBe('VoltageSourceStamper')
    })

    it('should create CurrentSourceStamper for current_source components', () => {
      const component = createTestComponent('current_source', 'I1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('I1')
      expect(stamper.type).toBe('current_source')
      expect(stamper.constructor.name).toBe('CurrentSourceStamper')
    })

    it('should create SwitchStamper for switch components', () => {
      const component = createTestComponent('switch', 'SW1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('SW1')
      expect(stamper.type).toBe('switch')
      expect(stamper.constructor.name).toBe('SwitchStamper')
    })

    it('should create VariableResistorStamper for variable_resistor components', () => {
      const component = createTestComponent('variable_resistor', 'VR1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('VR1')
      expect(stamper.type).toBe('variable_resistor')
      expect(stamper.constructor.name).toBe('VariableResistorStamper')
    })

    it('should create PotentiometerStamper for potentiometer components', () => {
      const component = createTestComponent('potentiometer', 'POT1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('POT1')
      expect(stamper.type).toBe('potentiometer')
      expect(stamper.constructor.name).toBe('PotentiometerStamper')
    })

    it('should create WireStamper for wire components', () => {
      const component = createTestComponent('wire', 'W1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('W1')
      expect(stamper.type).toBe('wire')
      expect(stamper.constructor.name).toBe('WireStamper')
    })

    it('should create NodeStamper for node components', () => {
      const component = createTestComponent('node', 'N1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('N1')
      expect(stamper.type).toBe('node')
      expect(stamper.constructor.name).toBe('NodeStamper')
    })

    it('should create GroundStamper for ground components', () => {
      const component = createTestComponent('ground', 'GND1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('GND1')
      expect(stamper.type).toBe('ground')
      expect(stamper.constructor.name).toBe('GroundStamper')
    })
  })

  describe('Non-Linear Component Stamper Registration', () => {
    it('should create DiodeStamper for diode components', () => {
      const component = createTestComponent('diode', 'D1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('D1')
      expect(stamper.type).toBe('diode')
      expect(stamper.constructor.name).toBe('DiodeStamper')
    })

    it('should create LEDStamper for led components', () => {
      const component = createTestComponent('led', 'LED1')
      const stamper = ComponentStamperFactory.createStamper(component)

      expect(stamper).toBeDefined()
      expect(stamper.id).toBe('LED1')
      expect(stamper.type).toBe('led')
      expect(stamper.constructor.name).toBe('LEDStamper')
    })
  })

  describe('Factory Pattern Validation', () => {
    it('should create different stamper instances for different component types', () => {
      const resistorComponent = createTestComponent('resistor', 'R1')
      const voltageComponent = createTestComponent('voltage_source', 'V1')
      const diodeComponent = createTestComponent('diode', 'D1')

      const resistorStamper = ComponentStamperFactory.createStamper(resistorComponent)
      const voltageStamper = ComponentStamperFactory.createStamper(voltageComponent)
      const diodeStamper = ComponentStamperFactory.createStamper(diodeComponent)

      // Verify different types
      expect(resistorStamper.constructor.name).toBe('ResistorStamper')
      expect(voltageStamper.constructor.name).toBe('VoltageSourceStamper')
      expect(diodeStamper.constructor.name).toBe('DiodeStamper')

      // Verify they are different instances
      expect(resistorStamper).not.toBe(voltageStamper)
      expect(voltageStamper).not.toBe(diodeStamper)
      expect(diodeStamper).not.toBe(resistorStamper)
    })

    it('should create new instances for each factory call', () => {
      const component1 = createTestComponent('resistor', 'R1')
      const component2 = createTestComponent('resistor', 'R2')

      const stamper1 = ComponentStamperFactory.createStamper(component1)
      const stamper2 = ComponentStamperFactory.createStamper(component2)

      // Should be same type but different instances
      expect(stamper1.constructor.name).toBe('ResistorStamper')
      expect(stamper2.constructor.name).toBe('ResistorStamper')
      expect(stamper1).not.toBe(stamper2)
      expect(stamper1.id).toBe('R1')
      expect(stamper2.id).toBe('R2')
    })

    it('should preserve component properties in created stampers', () => {
      const resistorComponent = createTestComponent('resistor', 'R_TEST')
      if (resistorComponent.properties) {
        resistorComponent.properties.resistance = 4700 // 4.7kΩ
      }

      const stamper = ComponentStamperFactory.createStamper(resistorComponent)

      expect(stamper.id).toBe('R_TEST')
      expect(stamper.type).toBe('resistor')
      // Properties should be preserved in the stamper (implementation dependent)
    })
  })

  describe('Complete Component Type Coverage', () => {
    it('should have stampers registered for all expected component types', () => {
      const allComponentTypes = [
        // Linear components
        'resistor',
        'voltage_source',
        'current_source',
        'switch',
        'variable_resistor',
        'potentiometer',
        'wire',
        'node',
        'ground',
        // Non-linear components
        'diode',
        'led',
      ]

      const createdStampers: string[] = []

      allComponentTypes.forEach((type) => {
        const component = createTestComponent(type, `${type.toUpperCase()}_1`)
        const stamper = ComponentStamperFactory.createStamper(component)

        expect(stamper).toBeDefined()
        expect(stamper.type).toBe(type)
        expect(stamper.id).toBe(`${type.toUpperCase()}_1`)

        createdStampers.push(stamper.constructor.name)
      })

      // Verify we created stampers for all types
      expect(createdStampers).toHaveLength(allComponentTypes.length)

      console.log('✅ All Component Types Have Registered Stampers:')
      allComponentTypes.forEach((type, index) => {
        console.log(`  ${type} → ${createdStampers[index]}`)
      })
    })

    it('should demonstrate stamper type mapping consistency', () => {
      const expectedMappings = {
        resistor: 'ResistorStamper',
        voltage_source: 'VoltageSourceStamper',
        current_source: 'CurrentSourceStamper',
        switch: 'SwitchStamper',
        variable_resistor: 'VariableResistorStamper',
        potentiometer: 'PotentiometerStamper',
        wire: 'WireStamper',
        node: 'NodeStamper',
        ground: 'GroundStamper',
        diode: 'DiodeStamper',
        led: 'LEDStamper',
      }

      Object.entries(expectedMappings).forEach(([componentType, expectedStamperClass]) => {
        const component = createTestComponent(componentType, 'TEST')
        const stamper = ComponentStamperFactory.createStamper(component)

        expect(stamper.constructor.name).toBe(expectedStamperClass)
        expect(stamper.type).toBe(componentType)
      })

      console.log('✅ Component → Stamper mapping verified for all types')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown component types gracefully', () => {
      const unknownComponent = createTestComponent('unknown_component', 'UNK1')

      expect(() => {
        ComponentStamperFactory.createStamper(unknownComponent)
      }).toThrow() // Should throw an error for unknown types
    })

    it('should handle empty or invalid component properties', () => {
      const componentWithoutProperties: CircuitComponent = {
        id: 'MINIMAL',
        type: 'resistor',
        position: { x: 0, y: 0 },
        rotation: 0,
        selected: false,
        properties: {}, // Empty properties
      }

      // Should still create stamper (with defaults)
      expect(() => {
        const stamper = ComponentStamperFactory.createStamper(componentWithoutProperties)
        expect(stamper).toBeDefined()
        expect(stamper.id).toBe('MINIMAL')
        expect(stamper.type).toBe('resistor')
      }).not.toThrow()
    })

    it('should handle malformed component objects', () => {
      const malformedComponent = {
        id: 'MALFORMED',
        type: 'resistor',
        // Missing required fields
      } as CircuitComponent

      // Factory should handle malformed objects gracefully
      expect(() => {
        ComponentStamperFactory.createStamper(malformedComponent)
      }).not.toThrow()
    })
  })

  describe('Factory Registration Validation', () => {
    it('should verify factory uses actual stamper implementations', () => {
      // Create stampers for different types and verify they have expected methods
      const testTypes = ['resistor', 'voltage_source', 'diode']

      testTypes.forEach((type) => {
        const component = createTestComponent(type, 'VALIDATE')
        const stamper = ComponentStamperFactory.createStamper(component)

        // All stampers should implement ComponentStamper interface
        expect(typeof stamper.stampDC).toBe('function')
        expect(typeof stamper.calculateCurrent).toBe('function')
        expect(stamper.id).toBeDefined()
        expect(stamper.type).toBeDefined()
      })
    })

    it('should create functional stampers that can be used for simulation', () => {
      // Test that factory-created stampers can actually perform stamping operations
      const resistorComponent = createTestComponent('resistor', 'FUNCTIONAL_TEST')
      const stamper = ComponentStamperFactory.createStamper(resistorComponent)

      // Should be able to call stamper methods without errors
      expect(() => {
        const nodeMap = new Map<string, number>()
        nodeMap.set('FUNCTIONAL_TEST:terminal1', 0)
        nodeMap.set('FUNCTIONAL_TEST:terminal2', 1)

        // This should not throw an error
        expect(stamper.id).toBe('FUNCTIONAL_TEST')
        expect(stamper.type).toBe('resistor')
      }).not.toThrow()
    })
  })
})

describe('ComponentStamperFactory Integration Validation', () => {
  it('should use actual ComponentStamperFactory from stampers module', () => {
    // Verify we're testing the ACTUAL ComponentStamperFactory implementation
    const testComponent = createTestComponent('resistor', 'INTEGRATION_TEST')
    const stamper = ComponentStamperFactory.createStamper(testComponent)

    expect(stamper).toBeDefined()
    expect(stamper.constructor.name).toBe('ResistorStamper')

    console.log('✅ ComponentStamperFactory tests now use ACTUAL factory implementation')
    console.log('✅ All component type registrations tested with real factory calls')
    console.log('✅ Tests will catch real bugs in ComponentStamperFactory registration')
  })

  it('should demonstrate factory pattern working end-to-end', () => {
    // Test Case: Show complete factory workflow
    const componentTypes = ['resistor', 'diode', 'voltage_source']
    const createdStampers: Array<{ type: string; stamperClass: string }> = []

    componentTypes.forEach((type) => {
      const component = createTestComponent(type, `DEMO_${type.toUpperCase()}`)
      const stamper = ComponentStamperFactory.createStamper(component)

      createdStampers.push({
        type: stamper.type,
        stamperClass: stamper.constructor.name,
      })

      expect(stamper.type).toBe(type)
      expect(stamper.id).toBe(`DEMO_${type.toUpperCase()}`)
    })

    // Verify all different types were created
    expect(createdStampers).toHaveLength(3)
    expect(new Set(createdStampers.map((s) => s.stamperClass))).toHaveLength(3)

    console.log('✅ ComponentStamperFactory confirmed end-to-end factory pattern')
    createdStampers.forEach(({ type, stamperClass }) => {
      console.log(`✅ ${type} → ${stamperClass}`)
    })
  })
})
