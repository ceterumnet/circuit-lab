**Primary Shortcuts (Direct Access):**

- **`/`** - Opens inline component selector with fuzzy search overlay
- **`R`** - Quick place Resistor (most common component)
- **`V`** - Quick place Voltage source
- **`G`** - Quick place Ground
- **`N`** - Quick place Node

**Component Selector (`/` key) Features:**

- Fuzzy search: Type "r" → shows Resistor, "res" → Resistor, "v" → Voltage source
- Persistent placement mode: After selection, enters placement mode like current palette behavior
- **Escape** to close selector and return to normal mode
- **Enter** to confirm first match, **Arrow keys** to navigate results
- **Tab** to cycle through available components
- Semi-transparent overlay positioned at cursor/center of canvas

**Enhanced Rotation Controls (during placement):**

- **`R`** - Rotate clockwise (current behavior)
- **`Shift+R`** - Rotate counter-clockwise (new enhancement)

**Complete Copy/Cut/Paste System:**

- **`Ctrl+C`** - Copy selected components + auto-wires + selected probes
- **`Ctrl+X`** - Cut selected components + auto-wires + selected probes
- **`Ctrl+V`** - Paste with visual preview and proper ID remapping
